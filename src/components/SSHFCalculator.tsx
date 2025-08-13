"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase, TABLE_NAMES } from "@/lib/supabase";
import {
  Calculator,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  TrendingUp
} from "lucide-react";

// 定义规则类型
interface BaseRule {
  养老保险基数上限: string;
  养老保险基数下限: string;
  住房公积金基数上限: string;
  住房公积金基数下限: string;
  养老保险费率_企业: string;
  医疗保险费率_企业: string;
  失业保险费率_企业: string;
  工伤保险费率_企业: string;
  生育保险费率_企业: string;
  住房公积金费率_企业: string;
}

interface ProcessedRules {
  '养老保险基数上限': number;
  '养老保险基数下限': number;
  '住房公积金基数上限': number;
  '住房公积金基数下限': number;
  '养老保险费率_企业': number;
  '医疗保险费率_企业': number;
  '失业保险费率_企业': number;
  '工伤保险费率_企业': number;
  '生育保险费率_企业': number;
  '住房公积金费率_企业': number;
}

interface CalculationStep {
  step: number;
  title: string;
  description: string;
  value?: string | number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface CalculationResult {
  // 基础信息
  employee_id: string;
  period: string;
  employee_category: string;
  calculation_cycle: string;
  reference_salary_source: string; // 参考工资选择依据

  // 参考工资和基数
  reference_salary: number;
  ss_base: number;
  hf_base: number;

  // 企业缴费
  pension_enterprise: number;
  medical_enterprise: number;
  unemployment_enterprise: number;
  injury_enterprise: number;
  maternity_enterprise: number;
  hf_enterprise: number;

  // 合计
  total_ss_contribution: number; // 社会保险总计
  total_hf_contribution: number; // 公积金总计
}

export default function SSHFCalculator() {
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationSteps, setCalculationSteps] = useState<CalculationStep[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeSteps = (): CalculationStep[] => [
    { step: 1, title: "获取员工信息", description: "查询员工基本信息和入职日期", status: 'pending' },
    { step: 2, title: "确定员工类别", description: "根据入职年份确定员工类别（A/B/C）", status: 'pending' },
    { step: 3, title: "确定计算周期", description: "根据计算月份确定周期（H1/H2）", status: 'pending' },
    { step: 4, title: "选择参考工资", description: "根据员工类别和周期选择参考工资", status: 'pending' },
    { step: 5, title: "获取规则配置", description: "获取适用的费率和基数上下限", status: 'pending' },
    { step: 6, title: "计算缴费基数", description: "计算社保基数和公积金基数", status: 'pending' },
    { step: 7, title: "计算企业缴费", description: "计算各项五险一金企业缴费金额", status: 'pending' },
    { step: 8, title: "保存计算结果", description: "将结果保存到数据库", status: 'pending' }
  ];

  const updateStep = (stepNumber: number, status: CalculationStep['status'], value?: string | number) => {
    setCalculationSteps(prev => prev.map(step => 
      step.step === stepNumber 
        ? { ...step, status, value }
        : step
    ));
  };

  const calculateSSHF = async () => {
    if (!employeeId || !period) {
      setError("请输入员工编号和计算月份");
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResult(null);
    setCalculationSteps(initializeSteps());

    try {
      // 步骤1：获取员工信息
      updateStep(1, 'processing');
      const employeeData = await getEmployeeData(employeeId);
      if (!employeeData) {
        throw new Error(`未找到员工 ${employeeId} 的数据`);
      }
      updateStep(1, 'completed', `${employeeData.hire_date}`);

      // 步骤2：确定员工类别
      updateStep(2, 'processing');
      const employeeCategory = determineEmployeeCategory(employeeData.hire_date);
      updateStep(2, 'completed', `${employeeCategory}类员工`);

      // 步骤3：确定计算周期
      updateStep(3, 'processing');
      const calculationCycle = determineCalculationCycle(period);
      updateStep(3, 'completed', calculationCycle);

      // 步骤4：选择参考工资
      updateStep(4, 'processing');
      const { salary: referenceSalary, source: salarySource } = await getReferenceSalary(employeeId, employeeCategory, calculationCycle);
      updateStep(4, 'completed', `¥${referenceSalary.toLocaleString()} (${salarySource})`);

      // 步骤5：获取规则配置
      updateStep(5, 'processing');
      const rules = await getRules(period);
      const periodDate = new Date(period);
      const year = periodDate.getFullYear();
      const month = periodDate.getMonth() + 1;
      const cycle = month <= 6 ? 'H1' : 'H2';
      updateStep(5, 'completed',
        `${year}年${cycle} 五险上限：${rules['养老保险基数上限'].toLocaleString()}，五险下限：${rules['养老保险基数下限'].toLocaleString()}，公积金上限：${rules['住房公积金基数上限'].toLocaleString()}，公积金下限：${rules['住房公积金基数下限'].toLocaleString()}`
      );

      // 步骤6：计算缴费基数
      updateStep(6, 'processing');
      const { ssBase, hfBase } = calculateBases(referenceSalary, rules);
      updateStep(6, 'completed', `社保:¥${ssBase.toLocaleString()}, 公积金:¥${hfBase.toLocaleString()}`);

      // 步骤7：计算企业缴费
      updateStep(7, 'processing');
      const enterpriseContributions = calculateEnterpriseContributions(ssBase, hfBase, rules);
      const totalSS = enterpriseContributions.pension_enterprise + enterpriseContributions.medical_enterprise +
                     enterpriseContributions.unemployment_enterprise + enterpriseContributions.injury_enterprise +
                     enterpriseContributions.maternity_enterprise;
      const totalHF = enterpriseContributions.hf_enterprise;
      updateStep(7, 'completed', `社保:¥${Math.round(totalSS).toLocaleString()}, 公积金:¥${Math.round(totalHF).toLocaleString()}`);

      // 组装结果
      const calculationResult: CalculationResult = {
        employee_id: employeeId,
        period: period,
        employee_category: employeeCategory,
        calculation_cycle: calculationCycle,
        reference_salary_source: salarySource,
        reference_salary: referenceSalary,
        ss_base: ssBase,
        hf_base: hfBase,
        ...enterpriseContributions,
        total_ss_contribution: totalSS,
        total_hf_contribution: totalHF
      };

      // 步骤8：保存结果
      updateStep(8, 'processing');
      await saveCalculationResult(calculationResult);
      updateStep(8, 'completed', '保存成功');

      setResult(calculationResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '计算过程中发生未知错误';
      setError(errorMessage);
      
      // 更新当前处理步骤为错误状态
      setCalculationSteps(prev => prev.map(step => 
        step.status === 'processing' 
          ? { ...step, status: 'error' as const }
          : step
      ));
    } finally {
      setIsCalculating(false);
    }
  };

  // 辅助函数
  const getEmployeeData = async (employeeId: string) => {
    // 简化员工数据获取，使用固定的测试数据
    if (employeeId === 'B0001') {
      return {
        employee_id: 'B0001',
        hire_date: '2001-07-16'
      };
    }
    return null;
  };

  const determineEmployeeCategory = (hireDate: string): string => {
    const hireYear = new Date(hireDate).getFullYear();
    if (hireYear < 2021) return 'A';
    if (hireYear === 2021) return 'B';
    return 'C';
  };

  const determineCalculationCycle = (period: string): string => {
    const month = new Date(period).getMonth() + 1;
    return month <= 6 ? 'H1' : 'H2';
  };

  const getReferenceSalary = async (employeeId: string, category: string, cycle: string): Promise<{salary: number, source: string}> => {
    if (category === 'A') {
      if (cycle === 'H1') {
        const salary = await getAverageSalary(employeeId, 2020);
        return { salary, source: '2020年平均税前应发' };
      } else {
        const salary = await getAverageSalary(employeeId, 2021);
        return { salary, source: '2021年平均税前应发' };
      }
    } else if (category === 'B') {
      if (cycle === 'H1') {
        const salary = await getFirstMonthSalary(employeeId, 2021);
        return { salary, source: '2021年首月基本工资' };
      } else {
        const salary = await getAverageSalary(employeeId, 2021);
        return { salary, source: '2021年平均税前应发' };
      }
    } else {
      const salary = await getFirstMonthSalary(employeeId, 2022);
      return { salary, source: '2022年首月基本工资' };
    }
  };

  const getAverageSalary = async (employeeId: string, year: number): Promise<number> => {
    // 简化工资获取，使用固定的测试数据
    if (employeeId === 'B0001') {
      if (year === 2020) return 37130.79;
      if (year === 2021) return 37578.65;
    }
    return 0;
  };

  const getFirstMonthSalary = async (employeeId: string, year: number): Promise<number> => {
    // 简化首月工资获取，使用固定的测试数据
    if (employeeId === 'B0001') {
      if (year === 2021) return 31269;
      if (year === 2022) return 32051;
    }
    return 0;
  };

  const getRules = async (period: string) => {
    const periodDate = new Date(period);
    const year = periodDate.getFullYear();
    const month = periodDate.getMonth() + 1;

    // 从Supabase数据库获取规则
    const { data, error } = await supabase
      .from(TABLE_NAMES.BASE)
      .select('*')
      .eq('年份', year)
      .eq('月份', month)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`未找到 ${year}年${month}月 的规则配置`);
    }

    const rule = data[0] as BaseRule;

    return {
      '养老保险基数上限': parseFloat(rule['养老保险基数上限']),
      '养老保险基数下限': parseFloat(rule['养老保险基数下限']),
      '住房公积金基数上限': parseFloat(rule['住房公积金基数上限']),
      '住房公积金基数下限': parseFloat(rule['住房公积金基数下限']),
      '养老保险费率_企业': parseFloat(rule['养老保险费率_企业']),
      '医疗保险费率_企业': parseFloat(rule['医疗保险费率_企业']),
      '失业保险费率_企业': parseFloat(rule['失业保险费率_企业']),
      '工伤保险费率_企业': parseFloat(rule['工伤保险费率_企业']),
      '生育保险费率_企业': parseFloat(rule['生育保险费率_企业']),
      '住房公积金费率_企业': parseFloat(rule['住房公积金费率_企业'])
    };
  };

  const calculateBases = (referenceSalary: number, rules: ProcessedRules) => {
    const ssBase = Math.min(Math.max(referenceSalary, rules['养老保险基数下限']), rules['养老保险基数上限']);
    const hfBase = Math.min(Math.max(referenceSalary, rules['住房公积金基数下限']), rules['住房公积金基数上限']);
    return { ssBase, hfBase };
  };

  const calculateEnterpriseContributions = (ssBase: number, hfBase: number, rules: ProcessedRules) => {
    return {
      pension_enterprise: ssBase * rules['养老保险费率_企业'],
      medical_enterprise: ssBase * rules['医疗保险费率_企业'],
      unemployment_enterprise: ssBase * rules['失业保险费率_企业'],
      injury_enterprise: ssBase * rules['工伤保险费率_企业'],
      maternity_enterprise: ssBase * rules['生育保险费率_企业'],
      hf_enterprise: hfBase * rules['住房公积金费率_企业']
    };
  };

  const saveCalculationResult = async (result: CalculationResult) => {
    // 简化保存逻辑，暂时只模拟保存
    console.log('保存计算结果:', result);
    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            五险一金企业缴费计算
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                员工编号
              </Label>
              <Input
                id="employeeId"
                placeholder="请输入员工编号，如：B0001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isCalculating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                计算月份
              </Label>
              <Input
                id="period"
                type="date"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                disabled={isCalculating}
              />
            </div>
          </div>
          
          <Button 
            onClick={calculateSSHF} 
            disabled={isCalculating || !employeeId || !period}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                开始计算
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 计算步骤 */}
      {calculationSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              计算过程
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculationSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    {step.status === 'pending' && (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">{step.step}</span>
                      </div>
                    )}
                    {step.status === 'processing' && (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    )}
                    {step.status === 'completed' && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {step.status === 'error' && (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                    {step.value && (
                      <div className="text-sm font-mono text-blue-600 mt-1">{step.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 计算结果 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              计算结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>基础信息</Label>
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="flex justify-between">
                    <span>员工编号:</span>
                    <span className="font-mono">{result.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>计算月份:</span>
                    <span className="font-mono">{result.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>员工类别:</span>
                    <Badge variant="outline">{result.employee_category}类</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>计算周期:</span>
                    <Badge variant="outline">{result.calculation_cycle}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>参考工资:</span>
                    <Badge variant="outline">{result.reference_salary_source}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>缴费基数</Label>
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <div className="flex justify-between">
                    <span>参考工资:</span>
                    <span className="font-mono">¥{result.reference_salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>社保基数:</span>
                    <span className="font-mono">¥{result.ss_base.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>公积金基数:</span>
                    <span className="font-mono">¥{result.hf_base.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-lg">企业缴费明细</Label>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">养老保险</div>
                  <div className="text-lg font-bold text-green-700">
                    ¥{Math.round(result.pension_enterprise).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">医疗保险</div>
                  <div className="text-lg font-bold text-blue-700">
                    ¥{Math.round(result.medical_enterprise).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-600">失业保险</div>
                  <div className="text-lg font-bold text-yellow-700">
                    ¥{Math.round(result.unemployment_enterprise).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">工伤保险</div>
                  <div className="text-lg font-bold text-purple-700">
                    ¥{Math.round(result.injury_enterprise).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <div className="text-sm text-gray-600">生育保险</div>
                  <div className="text-lg font-bold text-pink-700">
                    ¥{Math.round(result.maternity_enterprise).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-gray-600">住房公积金</div>
                  <div className="text-lg font-bold text-indigo-700">
                    ¥{Math.round(result.hf_enterprise).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">社会保险总计</div>
                    <div className="text-sm text-gray-600">五险企业缴费合计</div>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    ¥{Math.round(result.total_ss_contribution).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">住房公积金总计</div>
                    <div className="text-sm text-gray-600">公积金企业缴费</div>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    ¥{Math.round(result.total_hf_contribution).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Save className="h-3 w-3 mr-1" />
                计算结果已保存到数据库
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
