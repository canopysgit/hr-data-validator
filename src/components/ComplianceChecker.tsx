"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, TABLE_NAMES } from "@/lib/supabase";
import {
  CheckCircle,
  AlertTriangle,
  Users,
  Shield,
  Search,
  RefreshCw
} from "lucide-react";

interface CheckResult {
  type: string;
  title: string;
  level: 'high' | 'medium' | 'low';
  count: number;
  details: Array<{
    员工工号: string;
    姓名: string;
    问题描述: string;
    缴交地?: string;
    险种类型?: string;
    实际比例?: number;
    标准比例?: number;
    时间段?: string;
  }>;
}

export default function ComplianceChecker() {
  const [checking, setChecking] = useState(false);
  const [checking1, setChecking1] = useState(false);
  const [checking2, setChecking2] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<CheckResult | null>(null);

  // 数据标准化函数
  const standardizeCity = (city: string): string => {
    if (!city) return '';
    // 去除常见后缀
    return city.replace(/市$|地区$|区$/g, '').trim();
  };

  const standardizeInsuranceType = (type: string): string => {
    if (!type) return '';

    const typeMapping: Record<string, string> = {
      // 养老保险相关
      '养老': '养老保险',
      '养老险': '养老保险',
      '基本养老保险': '养老保险',
      '养老保险': '养老保险',

      // 医疗保险相关
      '医疗': '医疗保险',
      '医疗险': '医疗保险',
      '基本医疗保险': '医疗保险',
      '医疗保险': '医疗保险',

      // 失业保险相关
      '失业': '失业保险',
      '失业险': '失业保险',
      '失业保险': '失业保险',

      // 公积金相关
      '公积金': '公积金',
      '住房公积金': '公积金'
    };

    return typeMapping[type] || type;
  };

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    // 统一转换为 YYYY-MM-DD 格式
    const cleanDate = dateStr.replace(/[年月]/g, '-').replace(/日/g, '').replace(/\//g, '-');
    try {
      const date = new Date(cleanDate);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const isTimeMatch = (empStart: string, empEnd: string, stdStart: string, stdEnd: string): boolean => {
    try {
      const empStartDate = new Date(normalizeDate(empStart));
      const empEndDate = new Date(normalizeDate(empEnd));
      const stdStartDate = new Date(normalizeDate(stdStart));
      const stdEndDate = new Date(normalizeDate(stdEnd));

      // 优先级1：时间重叠匹配
      if (empStartDate <= stdEndDate && empEndDate >= stdStartDate) {
        return true;
      }

      // 优先级2：年度匹配
      if (empStartDate.getFullYear() === stdStartDate.getFullYear()) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const findMatchingStandard = (empRecord: Record<string, unknown>, cityStandardData: Record<string, unknown>[]): Record<string, unknown> | null => {
    const empCity = standardizeCity(empRecord.缴交地 as string);
    const empType = standardizeInsuranceType(empRecord.类型 as string);
    const empStartTime = empRecord.开始时间 as string;
    const empEndTime = empRecord.结束时间 as string;

    // 查找匹配的标准配置
    const matches = cityStandardData?.filter((standard: Record<string, unknown>) => {
      const stdCity = standardizeCity(standard.城市 as string);
      const stdType = standardizeInsuranceType(standard.险种类型 as string);
      const stdStartTime = standard.生效日期 as string;
      const stdEndTime = standard.失效日期 as string;

      const cityMatch = empCity === stdCity;
      const typeMatch = empType === stdType;
      const timeMatch = isTimeMatch(empStartTime, empEndTime, stdStartTime, stdEndTime);

      return cityMatch && typeMatch && timeMatch;
    }) || [];

    // 如果有多个匹配，取时间重叠最多的（优先精确匹配）
    if (matches.length > 1) {
      return matches[0]; // 简化处理，取第一个
    }

    return matches.length > 0 ? matches[0] : null;
  };

  // 检查1：员工社保完整性检查
  const checkEmployeeSocialInsurance = async (): Promise<CheckResult> => {
    console.log('开始检查员工社保完整性...');

    // 查询所有员工
    const { data: employees, error: empError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('*');

    if (empError) {
      console.error('查询员工数据失败:', empError);
      throw empError;
    }

    // 查询所有有社保记录的员工
    const { data: socialInsuranceEmployees, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*');

    if (socialError) {
      console.error('查询社保数据失败:', socialError);
      throw socialError;
    }

    // 获取有社保记录的员工工号集合
    const employeesWithSocial = new Set(
      socialInsuranceEmployees?.map((item: Record<string, unknown>) => item.员工工号) || []
    );

    console.log('员工总数:', employees?.length);
    console.log('有社保记录的员工:', employeesWithSocial.size);

    // 找出没有社保记录的员工
    const employeesWithoutSocial = employees?.filter((emp: Record<string, unknown>) =>
      !employeesWithSocial.has(emp.员工工号)
    ) || [];

    console.log('没有社保记录的员工:', employeesWithoutSocial.length);

    return {
      type: 'social_insurance_completeness',
      title: '员工社保记录完整性检查',
      level: employeesWithoutSocial.length > 0 ? 'high' : 'low',
      count: employeesWithoutSocial.length,
      details: employeesWithoutSocial.map((emp: Record<string, unknown>) => ({
        员工工号: emp.员工工号 as string,
        姓名: `${emp.姓}${emp.名}`,
        问题描述: '该员工没有任何社保缴纳记录'
      }))
    };
  };

  // 检查2：员工社保缴纳比例一致性检查（包含险种完整性和比例准确性）
  const checkContributionRatioCompliance = async (): Promise<CheckResult> => {
    console.log('🔍 开始检查员工社保缴纳比例一致性（含险种完整性）...');

    // 查询所有员工基本信息
    const { data: employeeBasicData, error: empBasicError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('*');

    if (empBasicError) {
      console.error('❌ 查询员工基本信息失败:', empBasicError);
      throw empBasicError;
    }

    // 查询所有员工社保数据
    const { data: employeeSocialData, error: empSocialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*');

    if (empSocialError) {
      console.error('❌ 查询员工社保数据失败:', empSocialError);
      throw empSocialError;
    }

    // 查询城市社保标准配置数据
    const { data: cityStandardData, error: cityStandardError } = await supabase
      .from(TABLE_NAMES.CITY_STANDARDS)
      .select('*');

    if (cityStandardError) {
      console.error('❌ 查询城市社保标准数据失败:', cityStandardError);
      throw cityStandardError;
    }

    console.log('📊 数据查询结果:');
    console.log('  - 员工基本信息条数:', employeeBasicData?.length);
    console.log('  - 员工社保数据条数:', employeeSocialData?.length);
    console.log('  - 城市标准数据条数:', cityStandardData?.length);

    // 详细查看数据内容
    if (employeeBasicData && employeeBasicData.length > 0) {
      console.log('👥 员工基本信息示例:');
      console.log('  - 第一条:', employeeBasicData[0]);
      console.log('  - 员工工号列表:', employeeBasicData.map(emp => emp.员工工号));
    }

    if (employeeSocialData && employeeSocialData.length > 0) {
      console.log('🏥 员工社保数据示例:');
      console.log('  - 第一条:', employeeSocialData[0]);
      console.log('  - 社保记录分布:', employeeSocialData.reduce((acc: Record<string, number>, item: Record<string, unknown>) => {
        const empId = item.员工工号 as string;
        acc[empId] = (acc[empId] || 0) + 1;
        return acc;
      }, {}));
    }

    if (cityStandardData && cityStandardData.length > 0) {
      console.log('🏛️ 城市标准配置示例:');
      console.log('  - 第一条:', cityStandardData[0]);
      console.log('  - 标准配置分布:', cityStandardData.map((std: Record<string, unknown>) =>
        `${std.城市}-${std.险种类型}-${std.个人缴费比例}`
      ));
    }

    const issues: Array<{
      员工工号: string;
      姓名: string;
      问题描述: string;
      缴交地?: string;
      险种类型?: string;
      实际比例?: number;
      标准比例?: number;
      时间段?: string;
    }> = [];

    // 需要检查的个人缴费险种（4项基本险种）
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];

    // 按员工工号分组社保数据
    const employeeSocialMap = new Map<string, Record<string, unknown>[]>();
    employeeSocialData?.forEach((record: Record<string, unknown>) => {
      const empId = record.员工工号 as string;
      if (!employeeSocialMap.has(empId)) {
        employeeSocialMap.set(empId, []);
      }
      employeeSocialMap.get(empId)!.push(record);
    });

    // 遍历每个员工
    employeeBasicData?.forEach((employee: Record<string, unknown>) => {
      const empId = employee.员工工号 as string;
      const empName = `${employee.姓}${employee.名}`;
      const empSocialRecords = employeeSocialMap.get(empId) || [];

      // 1. 检查险种完整性
      const empInsuranceTypes = new Set(
        empSocialRecords.map(record => standardizeInsuranceType(record.类型 as string))
      );

      requiredInsuranceTypes.forEach(requiredType => {
        if (!empInsuranceTypes.has(requiredType)) {
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `该员工缺少${requiredType}缴纳记录`
          });
        }
      });

      // 2. 检查现有记录的比例准确性
      empSocialRecords.forEach((empRecord: Record<string, unknown>) => {
        const empStartTime = empRecord.开始时间 as string;
        const empEndTime = empRecord.结束时间 as string;
        const empCity = empRecord.缴交地 as string;
        const empType = empRecord.类型 as string;
        const empPersonalRatio = empRecord.个人缴交比例 as number;

        // 跳过非个人缴费险种
        const standardizedType = standardizeInsuranceType(empType);
        if (!requiredInsuranceTypes.includes(standardizedType)) {
          return;
        }

        // 使用模糊匹配查找标准配置
        const matchingStandard = findMatchingStandard(empRecord, cityStandardData || []);

        if (matchingStandard) {
          const stdPersonalRatio = matchingStandard.个人缴费比例 as number;

          // 比较个人缴费比例（处理数字精度问题）
          const empRatio = Number(empPersonalRatio);
          const stdRatio = Number(stdPersonalRatio);

          if (Math.abs(empRatio - stdRatio) > 0.0001) { // 允许微小的精度误差
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `${standardizedType}个人缴费比例不符合标准`,
              缴交地: empCity,
              险种类型: standardizedType,
              实际比例: empRatio,
              标准比例: stdRatio,
              时间段: `${empStartTime} 至 ${empEndTime}`
            });
          }
        } else {
          // 找不到匹配的标准配置
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `未找到${empCity}${standardizedType}的标准配置`,
            缴交地: empCity,
            险种类型: standardizedType,
            实际比例: empPersonalRatio,
            标准比例: 0,
            时间段: `${empStartTime} 至 ${empEndTime}`
          });
        }
      });
    });

    console.log('社保缴纳问题总数:', issues.length);

    return {
      type: 'contribution_ratio_compliance',
      title: '员工社保缴纳比例一致性检查',
      level: issues.length > 0 ? 'high' : 'low',
      count: issues.length,
      details: issues
    };
  };

  // 执行检查1：员工社保记录完整性检查
  const executeCheck1 = async () => {
    setChecking1(true);
    setSelectedResult(null);

    try {
      console.log('开始执行员工社保记录完整性检查...');
      const result = await checkEmployeeSocialInsurance();

      // 更新或添加到结果中
      const newResults = results.filter(r => r.type !== 'social_insurance_completeness');
      newResults.push(result);
      setResults(newResults);
      setSelectedResult(result);

      console.log('员工社保记录完整性检查完成:', result);
    } catch (error) {
      console.error('员工社保记录完整性检查失败:', error);
    } finally {
      setChecking1(false);
    }
  };

  // 执行检查2：员工社保缴纳比例一致性检查
  const executeCheck2 = async () => {
    setChecking2(true);
    setSelectedResult(null);

    try {
      console.log('开始执行员工社保缴纳比例一致性检查...');
      const result = await checkContributionRatioCompliance();

      // 更新或添加到结果中
      const newResults = results.filter(r => r.type !== 'contribution_ratio_compliance');
      newResults.push(result);
      setResults(newResults);
      setSelectedResult(result);

      console.log('员工社保缴纳比例一致性检查完成:', result);
    } catch (error) {
      console.error('员工社保缴纳比例一致性检查失败:', error);
    } finally {
      setChecking2(false);
    }
  };

  // 执行所有检查
  const executeAllChecks = async () => {
    setChecking(true);
    setResults([]);
    setSelectedResult(null);

    try {
      console.log('开始执行合规检查...');

      // 执行检查1：员工社保完整性
      const socialInsuranceResult = await checkEmployeeSocialInsurance();

      // 执行检查2：缴费比例合规性
      const contributionRatioResult = await checkContributionRatioCompliance();

      const allResults = [socialInsuranceResult, contributionRatioResult];

      setResults(allResults);
      console.log('检查完成，结果:', allResults);

    } catch (error) {
      console.error('检查过程中发生错误:', error);
    } finally {
      setChecking(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      {/* 检查控制区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            五险一金合规检查引擎
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 第一个检查：员工社保记录完整性检查 */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                员工社保记录完整性检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  检查所有员工是否都有社保缴纳记录，识别遗漏的员工
                </div>
                <Button
                  onClick={() => executeCheck1()}
                  disabled={checking1}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {checking1 ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      检查中...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      执行检查
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 第二个检查：员工社保缴纳比例一致性检查 */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                员工社保缴纳比例一致性检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  检查员工是否具备4项基本险种记录，并对比实际缴费比例与城市标准配置
                </div>
                <Button
                  onClick={() => executeCheck2()}
                  disabled={checking2}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {checking2 ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      检查中...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      执行检查
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 执行所有检查按钮 */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                或者点击下方按钮执行所有可用的合规性检查
              </div>
              <Button
                onClick={executeAllChecks}
                disabled={checking}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {checking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    检查中...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    执行所有检查
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 检查结果概览 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              检查结果概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedResult(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getLevelColor(result.level)}>
                        {getLevelText(result.level)}
                      </Badge>
                      <span className="text-lg font-bold text-red-600">
                        {result.count}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{result.title}</h3>
                    <p className="text-xs text-gray-500">
                      {result.count > 0 ? `发现 ${result.count} 个问题` : '未发现问题'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细结果展示 */}
      {selectedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              {selectedResult.title} - 详细结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResult.count === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ 太好了！该项检查未发现任何问题。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ 发现 <strong>{selectedResult.count}</strong> 个问题，请及时处理。
                  </AlertDescription>
                </Alert>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>员工工号</TableHead>
                        <TableHead>员工姓名</TableHead>
                        <TableHead>问题描述</TableHead>
                        {selectedResult.type === 'contribution_ratio_compliance' && (
                          <>
                            <TableHead>缴交地</TableHead>
                            <TableHead>险种类型</TableHead>
                            <TableHead>实际比例</TableHead>
                            <TableHead>标准比例</TableHead>
                            <TableHead>时间段</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedResult.details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{detail.员工工号}</TableCell>
                          <TableCell>{detail.姓名}</TableCell>
                          <TableCell className="text-red-600">{detail.问题描述}</TableCell>
                          {selectedResult.type === 'contribution_ratio_compliance' && (
                            <>
                              <TableCell>{detail.缴交地 || '-'}</TableCell>
                              <TableCell>{detail.险种类型 || '-'}</TableCell>
                              <TableCell className="font-mono">
                                {detail.实际比例 !== undefined && detail.实际比例 !== null
                                  ? (detail.实际比例 * 100).toFixed(2) + '%'
                                  : '-'}
                              </TableCell>
                              <TableCell className="font-mono">
                                {detail.标准比例 !== undefined && detail.标准比例 !== null
                                  ? (detail.标准比例 * 100).toFixed(2) + '%'
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-sm">{detail.时间段 || '-'}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      {results.length === 0 && !checking && (
        <Card>
          <CardHeader>
            <CardTitle>检查说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>已实现 - 员工社保记录完整性检查</strong>：检查所有员工是否都有社保缴纳记录</p>
              <p>• <strong>已实现 - 员工社保缴纳比例一致性检查</strong>：检查险种完整性（4项基本险种）+ 比例准确性（支持模糊匹配）</p>
              <p>• <strong>开发中 - 员工与组织匹配性检查</strong>：验证员工与组织架构匹配关系</p>
              <p>• <strong>开发中 - 缴费基数合规性检查</strong>：检查缴费基数是否在标准范围内</p>
              <p>• <strong>开发中 - 缴费记录时效性检查</strong>：验证缴费记录的时效性</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
