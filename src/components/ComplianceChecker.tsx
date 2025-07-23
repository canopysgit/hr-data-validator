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
  RefreshCw,
  DollarSign
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
    年度?: string;
    缺失项目?: string[];
    合同城市?: string;
    计算的月均收入?: number;
    社保缴交基数?: number;
    检查年度?: string;
    时间段信息?: string;
  }>;
  message?: string;
}

export default function ComplianceChecker() {
  const [checking, setChecking] = useState(false);
  const [checking1, setChecking1] = useState(false);
  const [checking2, setChecking2] = useState(false);
  const [checking3, setChecking3] = useState(false);
  const [checking4, setChecking4] = useState(false);
  const [checking5, setChecking5] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<CheckResult | null>(null);

  // 数据标准化函数
  const standardizeCity = (city: string): string => {
    if (!city) return '';
    // 去除常见后缀
    return city.replace(/市$|地区$|区$/g, '').trim();
  };

  const standardizeInsuranceType = (type: string): string => {
    if (!type || type === null || type === undefined) {
      return '';
    }

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

      // 工伤保险相关
      '工伤': '工伤保险',
      '工伤险': '工伤保险',
      '工伤保险': '工伤保险',

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

      // 优先级1：时间重叠匹配（包含边界情况）
      // 员工时间段与标准时间段有任何重叠即可匹配
      if (empStartDate <= stdEndDate && empEndDate >= stdStartDate) {
        return true;
      }

      // 优先级2：扩展的模糊匹配 - 允许30天的时间差
      const timeDiffDays = 30;
      const timeDiffMs = timeDiffDays * 24 * 60 * 60 * 1000;
      
      // 检查员工开始时间是否在标准时间段的扩展范围内
      if (empStartDate >= new Date(stdStartDate.getTime() - timeDiffMs) && 
          empStartDate <= new Date(stdEndDate.getTime() + timeDiffMs)) {
        return true;
      }
      
      // 检查员工结束时间是否在标准时间段的扩展范围内
      if (empEndDate >= new Date(stdStartDate.getTime() - timeDiffMs) && 
          empEndDate <= new Date(stdEndDate.getTime() + timeDiffMs)) {
        return true;
      }

      // 优先级3：扩展年度匹配 - 允许前后1年的差异
      const empYear = empStartDate.getFullYear();
      const stdYear = stdStartDate.getFullYear();
      if (Math.abs(empYear - stdYear) <= 1) {
        return true;
      }

      // 优先级4：针对未来年份的特殊处理 - 使用最近的有效年份
      if (empYear > stdYear) {
        return true; // 允许使用最近年份的标准
      }

      return false;
    } catch {
      return false;
    }
  };

  const findMatchingStandard = (empRecord: Record<string, unknown>, cityStandardData: Record<string, unknown>[]): Record<string, unknown> | null => {
    const empCity = standardizeCity(empRecord.缴交地 as string);
    const empType = standardizeInsuranceType(empRecord.险种类型 as string);
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

      // 添加调试日志，特别关注时间匹配问题
      if (cityMatch && typeMatch) {
        console.log(`🕐 时间匹配检查: 员工[${empStartTime} ~ ${empEndTime}] vs 标准[${stdStartTime} ~ ${stdEndTime}] => ${timeMatch}`);
      }

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

  // 检查2：员工社保缴纳比例一致性检查
  const checkContributionRatioCompliance = async (): Promise<CheckResult> => {
    console.log('🔍 开始检查员工社保缴纳比例一致性...');

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
      throw new Error(`查询城市社保标准数据失败: ${cityStandardError.message || JSON.stringify(cityStandardError)}`);
    }

    if (!cityStandardData || cityStandardData.length === 0) {
      console.warn('⚠️ 未找到城市社保标准配置数据');
      return {
        type: 'social_insurance_base_consistency',
        title: '社保缴交基数与月均收入一致性检查',
        level: 'low',
        count: 0,
        details: [],
        message: '未找到城市社保标准配置数据，无法进行检查'
      };
    }

    console.log('📊 数据查询结果:');
    console.log('  - 员工社保数据条数:', employeeSocialData?.length);
    console.log('  - 城市标准数据条数:', cityStandardData?.length);
    
    // 🔍 调试：检查北京养老保险的标准配置
    const beijingPension = cityStandardData?.filter((std: Record<string, unknown>) => 
      standardizeCity(std.城市 as string) === '北京' && 
      standardizeInsuranceType(std.险种类型 as string) === '养老保险'
    );
    console.log('🏛️ 北京养老保险标准配置:', beijingPension);
    
    // 🔍 调试：检查时间范围
    console.log('📅 员工时间段:', '2025-06-30 至 2026-06-30');
    console.log('📅 标准时间段示例:', cityStandardData?.slice(0, 3).map((std: Record<string, unknown>) => 
      `${std.城市}-${std.险种类型}: ${std.生效日期} ~ ${std.失效日期}`
    ));

    if (employeeSocialData && employeeSocialData.length > 0) {
      console.log('🏥 员工社保数据示例:');
      console.log('  - 第一条:', employeeSocialData[0]);
    }

    if (cityStandardData && cityStandardData.length > 0) {
      console.log('🏛️ 城市标准配置示例:');
      console.log('  - 第一条:', cityStandardData[0]);
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



    // 直接遍历每条社保记录进行比例检查
    employeeSocialData?.forEach((empRecord: Record<string, unknown>) => {
      const empId = empRecord.员工工号 as string;
      const empName = empRecord.姓名 as string; // 直接使用社保记录中的姓名
      const empStartTime = empRecord.开始时间 as string;
      const empEndTime = empRecord.结束时间 as string;
      const empCity = empRecord.缴交地 as string;
      const empType = empRecord.险种类型 as string;
      const empPersonalRatio = empRecord.个人缴交比例 as number;

      // 处理姓名可能分开存储的情况
      const empSurname = empRecord.姓 as string;
      const empGivenName = empRecord.名 as string;
      const fullName = empName || `${empSurname || ''}${empGivenName || ''}`;

      // 跳过非个人缴费险种
      const standardizedType = standardizeInsuranceType(empType);
      
      if (!requiredInsuranceTypes.includes(standardizedType)) {
        return; // 跳过非个人缴费险种
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
            姓名: fullName,
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
          姓名: fullName,
          问题描述: `未找到${empCity}${standardizedType}的标准配置`,
          缴交地: empCity,
          险种类型: standardizedType,
          实际比例: empPersonalRatio,
          标准比例: 0,
          时间段: `${empStartTime} 至 ${empEndTime}`
        });
      }
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

  // 检查3：员工社保记录项目完整性检查
  const checkSocialInsuranceCompleteness = async (): Promise<CheckResult> => {
    console.log('🔍 开始检查员工社保记录项目完整性...');

    // 查询所有员工社保数据
    const { data: employeeSocialData, error: empSocialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*');

    if (empSocialError) {
      console.error('❌ 查询员工社保数据失败:', empSocialError);
      throw empSocialError;
    }

    console.log('📊 员工社保数据条数:', employeeSocialData?.length);

    // 需要检查的四个基本险种（个人缴纳）
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];

    // 按员工工号和年度分组
    const employeeYearlyData: Record<string, Record<string, Set<string>>> = {};
    const employeeNames: Record<string, string> = {};

    // 获取社保年度函数（7.1-6.30）
    const getSocialInsuranceYear = (dateStr: string): string => {
      try {
        const date = new Date(normalizeDate(dateStr));
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() 返回 0-11
        const day = date.getDate();
        
        // 社保年度定义：X年度 = X年7月1日 到 X+1年6月30日
        // 例如：2022年度 = 2022年7月1日 到 2023年6月30日
        if (month >= 7) {
          // 7月1日及以后，属于当年度
          return `${year}年度`;
        } else {
          // 1月1日到6月30日，属于上一年度
          return `${year - 1}年度`;
        }
      } catch {
        return '未知年度';
      }
    };

    // 处理员工社保数据
    employeeSocialData?.forEach((record: Record<string, unknown>) => {
      const empId = record.员工工号 as string;
      const empName = record.姓名 as string;
      const empSurname = record.姓 as string;
      const empGivenName = record.名 as string;
      const startTime = record.开始时间 as string;
      const insuranceType = standardizeInsuranceType(record.险种类型 as string);

      // 处理姓名
      const fullName = empName || `${empSurname || ''}${empGivenName || ''}`;
      employeeNames[empId] = fullName;

      // 使用数据库中的年度字段，如果没有则计算社保年度
      const year = record.社保年度 ? `${record.社保年度}年度` : getSocialInsuranceYear(startTime);

      // 初始化数据结构
      if (!employeeYearlyData[empId]) {
        employeeYearlyData[empId] = {};
      }
      if (!employeeYearlyData[empId][year]) {
        employeeYearlyData[empId][year] = new Set();
      }

      // 只记录四个基本险种
      if (requiredInsuranceTypes.includes(insuranceType)) {
        employeeYearlyData[empId][year].add(insuranceType);
      }
    });

    console.log('📋 员工年度数据统计:', Object.keys(employeeYearlyData).length, '个员工');

    // 检查每个员工每个年度的险种完整性
    const issues: Array<{
      员工工号: string;
      姓名: string;
      问题描述: string;
      年度?: string;
      缺失项目?: string[];
    }> = [];

    // 定义需要检查的年度范围（2022-2024）
    const targetYears = ['2022年度', '2023年度', '2024年度'];

    // 只检查在社保表中出现的员工
    Object.keys(employeeNames).forEach(empId => {
      const empName = employeeNames[empId] || '未知姓名';
      
      targetYears.forEach(year => {
        const existingTypes = employeeYearlyData[empId]?.[year] ? Array.from(employeeYearlyData[empId][year]) : [];
        const missingTypes = requiredInsuranceTypes.filter(type => !existingTypes.includes(type));
        
        if (missingTypes.length > 0) {
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `${year}缺少${missingTypes.length}个险种项目：${missingTypes.join('、')}`,
            年度: year,
            缺失项目: missingTypes
          });
        }
      });
    });

    // 添加调试信息
    console.log('🔍 项目完整性检查调试信息:');
    console.log(`  - 检查的员工总数: ${Object.keys(employeeNames).length}`);
    console.log(`  - 检查的年度: ${targetYears.join(', ')}`);
    console.log(`  - 有社保记录的员工: ${Object.keys(employeeYearlyData).length}`);
    
    // 特别检查几个目标员工
    const targetEmployees = ['80000001', '80000014', '80000003', '80000053'];
    targetEmployees.forEach(empId => {
      if (employeeNames[empId]) {
        console.log(`📋 ${empId} ${employeeNames[empId]}:`);
        targetYears.forEach(year => {
          const types = employeeYearlyData[empId]?.[year] ? Array.from(employeeYearlyData[empId][year]) : [];
          console.log(`  - ${year}: ${types.length > 0 ? types.join(', ') : '无记录'}`);
        });
      }
    });

    console.log('🔍 项目完整性检查结果:');
    console.log(`  - 总问题数: ${issues.length}`);
    console.log(`  - 问题详情:`, issues.slice(0, 5));

    return {
      type: 'social_insurance_item_completeness',
      title: '员工社保记录项目完整性检查',
      level: issues.length > 0 ? 'medium' : 'low',
      count: issues.length,
      details: issues
    };
  };

  // 检查4：员工缴纳地一致性检查
  const checkPaymentLocationConsistency = async () => {
    console.log('🔍 开始员工缴纳地一致性检查...');

    // 获取员工社保数据
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*');

    if (socialError) {
      console.error('查询员工社保数据失败:', socialError);
      throw socialError;
    }

    // 获取员工合同数据
    const { data: contractData, error: contractError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('*');

    if (contractError) {
      console.error('查询员工合同数据失败:', contractError);
      throw contractError;
    }

    console.log(`📊 社保数据: ${socialData?.length || 0} 条记录`);
    console.log(`📊 合同数据: ${contractData?.length || 0} 条记录`);

    // 城市名称标准化函数
    const normalizeCityName = (cityName: string): string => {
      if (!cityName) return '';
      return cityName.replace(/市$|地区$|区$/g, '').trim().toLowerCase();
    };

    // 日期标准化函数
    const normalizeDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      try {
        // 处理各种日期格式
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    // 检查时间段是否重叠
    const isTimeOverlap = (period1: {start: Date | null, end: Date | null}, period2: {start: Date | null, end: Date | null}): boolean => {
      if (!period1.start || !period2.start) return false;
      
      const p1End = period1.end || new Date('2099-12-31');
      const p2End = period2.end || new Date('2099-12-31');
      
      return period1.start <= p2End && period2.start <= p1End;
    };



    const issues: Array<{
      员工工号: string;
      姓名: string;
      问题描述: string;
      缴交地?: string;
      合同城市?: string;
      时间段?: string;
    }> = [];

    // 处理每条社保记录
    socialData?.forEach((socialRecord: Record<string, unknown>) => {
      const empId = socialRecord.员工工号 as string;
      const empName = `${socialRecord.姓 || ''}${socialRecord.名 || ''}`;
      const paymentLocation = socialRecord.缴交地 as string;
      
      // 首先尝试精确时间段匹配
      const socialStart = normalizeDate(socialRecord.开始时间 as string);
      const socialEnd = normalizeDate(socialRecord.结束时间 as string);
      
      const exactMatches = (contractData || []).filter((contract: Record<string, unknown>) => {
         if (String((contract as Record<string, unknown>).员工工号) !== String(empId)) return false;
        
        const contractStart = normalizeDate(contract.开始日期 as string);
        const contractEnd = normalizeDate(contract.结束日期 as string);
        
        return isTimeOverlap(
          { start: socialStart, end: socialEnd },
          { start: contractStart, end: contractEnd }
        );
      });
      
      let matchingContracts = exactMatches;
      let isExactMatch = true;
      
      // 如果没有精确匹配，使用备选匹配策略
      if (exactMatches.length === 0) {
        const employeeContracts = (contractData || []).filter((contract: Record<string, unknown>) => String(contract.员工工号) === String(empId));
        
        if (employeeContracts.length === 0) {
          // 完全没有找到该员工的合同记录
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: '未找到该员工的任何劳动合同记录',
            缴交地: paymentLocation,
            时间段: `${socialRecord.开始时间} - ${socialRecord.结束时间}`
          });
          return;
        }
        
        // 选择最新的合同记录作为备选
        const sortedContracts = employeeContracts.sort((a, b) => {
          const dateA = normalizeDate(a.开始日期);
          const dateB = normalizeDate(b.开始日期);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        
        matchingContracts = [sortedContracts[0]];
        isExactMatch = false;
      }
      
      // 检查每个匹配的合同
      matchingContracts.forEach(contract => {
        const contractCity = contract.劳动合同主体所在城市;
        
        if (!contractCity) {
          // 合同城市字段为空
          const problemDesc = isExactMatch 
            ? '劳动合同主体所在城市字段为空'
            : '时间段不匹配，使用最新合同检查，但劳动合同主体所在城市字段为空';
          
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: problemDesc,
            缴交地: paymentLocation,
            合同城市: contractCity,
            时间段: `${socialRecord.开始时间} - ${socialRecord.结束时间}`
          });
          return;
        }
        
        // 城市名称模糊匹配
        const normalizedPaymentLocation = normalizeCityName(paymentLocation);
        const normalizedContractCity = normalizeCityName(contractCity);
        
        if (normalizedPaymentLocation !== normalizedContractCity) {
          // 城市不一致
          const problemDesc = isExactMatch 
            ? `缴交地与合同城市不一致：${paymentLocation} ≠ ${contractCity}`
            : `时间段不匹配，使用最新合同检查，缴交地与合同城市不一致：${paymentLocation} ≠ ${contractCity}`;
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: problemDesc,
            缴交地: paymentLocation,
            合同城市: contractCity,
            时间段: `${socialRecord.开始时间} - ${socialRecord.结束时间}`
          });
        }
      });
    });

    console.log('🔍 缴纳地一致性检查结果:');
    console.log(`  - 总问题数: ${issues.length}`);
    console.log(`  - 问题详情:`, issues.slice(0, 5));

    return {
      type: 'payment_location_consistency',
      title: '员工缴纳地一致性检查',
      level: (issues.length > 0 ? 'high' : 'low') as 'high' | 'medium' | 'low',
      count: issues.length,
      details: issues
    };
  }

  // 检查5：社保缴交基数与月均收入一致性检查（精细化版本）
  const checkSocialInsuranceBaseConsistency = async (): Promise<CheckResult> => {
    console.log('🔍 开始社保缴交基数与月均收入一致性检查（精细化版本）...');

    // 获取社保年度函数（7.1-6.30）
    const getSocialInsuranceYear = (dateStr: string): string => {
      try {
        const date = new Date(normalizeDate(dateStr));
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() 返回 0-11

        // 社保年度定义：X年度 = X年7月1日 到 X+1年6月30日
        // 例如：2022年度 = 2022年7月1日 到 2023年6月30日
        if (month >= 7) {
          // 7月1日及以后，属于当年度
          return `${year}年度`;
        } else {
          // 1月1日到6月30日，属于上一年度
          return `${year - 1}年度`;
        }
      } catch {
        return '未知年度';
      }
    };

    // 查询员工社保数据
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*');

    if (socialError) {
      console.error('❌ 查询员工社保数据失败:', socialError);
      throw new Error(`查询员工社保数据失败: ${socialError.message || JSON.stringify(socialError)}`);
    }

    if (!socialData || socialData.length === 0) {
      console.warn('⚠️ 未找到员工社保数据');
      return {
        type: 'social_insurance_base_consistency',
        title: '社保缴交基数与月均收入一致性检查',
        level: 'low',
        count: 0,
        details: [],
        message: '未找到员工社保数据，无法进行检查'
      };
    }

    // 查询工资核算结果数据（分页查询以获取所有数据）
    console.log('📊 查询工资核算结果数据...');
    let allSalaryData: Record<string, unknown>[] = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data: pageData, error: salaryError } = await supabase
        .from(TABLE_NAMES.SALARY_CALCULATION_RESULTS)
        .select('*')
        .range(from, from + pageSize - 1);

      if (salaryError) {
        console.error('❌ 查询工资核算结果数据失败:', salaryError);
        throw new Error(`查询工资核算结果数据失败: ${salaryError.message || JSON.stringify(salaryError)}`);
      }

      if (!pageData || pageData.length === 0) {
        break;
      }

      allSalaryData = allSalaryData.concat(pageData);
      console.log(`📄 已加载 ${allSalaryData.length} 条工资记录...`);

      if (pageData.length < pageSize) {
        break; // 最后一页
      }

      from += pageSize;
    }

    const salaryData = allSalaryData;
    console.log(`✅ 总共加载了 ${salaryData.length} 条工资记录`);

    if (!salaryData || salaryData.length === 0) {
      console.warn('⚠️ 未找到工资核算结果数据');
      return {
        type: 'social_insurance_base_consistency',
        title: '社保缴交基数与月均收入一致性检查',
        level: 'low',
        count: 0,
        details: [],
        message: '未找到工资核算结果数据，无法进行检查'
      };
    }

    // 查询城市社保标准配置数据
    const { data: cityStandardData, error: cityStandardError } = await supabase
      .from(TABLE_NAMES.CITY_STANDARDS)
      .select('*');

    if (cityStandardError) {
      console.error('❌ 查询城市社保标准数据失败:', cityStandardError);
      throw cityStandardError;
    }

    console.log(`📊 社保数据: ${socialData?.length || 0} 条记录`);
    console.log(`📊 工资数据: ${salaryData?.length || 0} 条记录`);
    console.log(`📊 城市标准数据: ${cityStandardData?.length || 0} 条记录`);

    // 数据格式转换函数：将"4569元"转换为数字4569
    const parseAmount = (amountStr: string | number): number => {
      if (typeof amountStr === 'number') return amountStr;
      if (!amountStr) return 0;
      return parseInt(String(amountStr).replace(/[^\d]/g, '')) || 0;
    };

    // 查找匹配的城市标准配置
    const findCityStandard = (city: string, insuranceType: string, year: string) => {
      const standardizedCity = standardizeCity(city);
      const standardizedType = standardizeInsuranceType(insuranceType);

      return cityStandardData?.find((standard: Record<string, unknown>) => {
        const stdCity = standardizeCity(standard.城市 as string);
        const stdType = standardizeInsuranceType(standard.险种类型 as string);
        const stdYear = standard.社保年度 as string;

        return stdCity === standardizedCity &&
               stdType === standardizedType &&
               stdYear === year;
      });
    };

    // 需要检查的险种（个人缴纳的4项基本险种）
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];

    const issues: Array<{
      员工工号: string;
      姓名: string;
      问题描述: string;
      检查年度?: string;
      计算的月均收入?: number;
      社保缴交基数?: number;
      时间段信息?: string;
    }> = [];

    // 按员工工号、年度、险种分组处理社保数据
    const socialByEmployeeYearType: Record<string, Record<string, Record<string, Record<string, unknown>[]>>> = {};
    const employeeNames: Record<string, string> = {};

    socialData?.forEach((record: Record<string, unknown>) => {
      const empId = record.员工工号 as string;
      const startTime = record.开始时间 as string;
      const insuranceType = standardizeInsuranceType(record.险种类型 as string);
      const empSurname = record.姓 as string;
      const empGivenName = record.名 as string;

      // 只处理需要检查的险种
      if (!requiredInsuranceTypes.includes(insuranceType)) {
        return;
      }

      // 处理姓名
      const fullName = `${empSurname || ''}${empGivenName || ''}`;
      employeeNames[empId] = fullName;

      // 使用数据库中的年度字段，如果没有则计算社保年度
      const year = record.社保年度 ? `${record.社保年度}年度` : getSocialInsuranceYear(startTime);

      // 初始化数据结构
      if (!socialByEmployeeYearType[empId]) {
        socialByEmployeeYearType[empId] = {};
      }
      if (!socialByEmployeeYearType[empId][year]) {
        socialByEmployeeYearType[empId][year] = {};
      }
      if (!socialByEmployeeYearType[empId][year][insuranceType]) {
        socialByEmployeeYearType[empId][year][insuranceType] = [];
      }

      socialByEmployeeYearType[empId][year][insuranceType].push(record);
    });

    // 检查重复记录（同一员工同一年度同一险种有多条记录）
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      const empName = employeeNames[empId] || '未知姓名';

      Object.keys(socialByEmployeeYearType[empId]).forEach(year => {
        Object.keys(socialByEmployeeYearType[empId][year]).forEach(insuranceType => {
          const records = socialByEmployeeYearType[empId][year][insuranceType];

          if (records.length > 1) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `员工存在重复的社保记录：${year}年度${insuranceType}有${records.length}条记录`,
              检查年度: year,
              时间段信息: `${year}年度 ${insuranceType}`
            });
          }
        });
      });
    });

    // 按员工工号分组处理工资数据
    const salaryByEmployee: Record<string, Record<string, Record<string, unknown>[]>> = {};

    salaryData?.forEach((record: Record<string, unknown>) => {
      const empId = record.employee_id as string;
      const startDate = record.start_date as string;

      if (!startDate) return;

      // 根据start_date计算年度
      const year = new Date(startDate).getFullYear().toString();

      if (!salaryByEmployee[empId]) {
        salaryByEmployee[empId] = {};
      }
      if (!salaryByEmployee[empId][year]) {
        salaryByEmployee[empId][year] = [];
      }
      salaryByEmployee[empId][year].push(record);
    });

    console.log(`👥 有社保记录的员工: ${Object.keys(socialByEmployeeYearType).length} 人`);
    console.log(`💰 有工资记录的员工: ${Object.keys(salaryByEmployee).length} 人`);

    // 对每个员工的每个年度的每个险种进行精细化检查
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      const empName = employeeNames[empId] || '未知姓名';

      Object.keys(socialByEmployeeYearType[empId]).forEach(year => {
        // 修复年度匹配逻辑：社保年度应该基于上一自然年度的工资数据
        // 例如：2024年度社保基数应该基于2023年工资数据
        const socialYear = year; // 社保年度，如"2024年度"
        const salaryYear = (parseInt(year.replace('年度', '')) - 1).toString(); // 工资年度，如"2023"

        const salaryRecords = salaryByEmployee[empId]?.[salaryYear] || [];

        // 筛选税前应发合计的工资记录
        const taxableIncomeRecords = salaryRecords.filter((record: Record<string, unknown>) =>
          record.salary_item_name === '税前应发合计'
        );

        if (taxableIncomeRecords.length === 0) {
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `缺少${salaryYear}年工资数据，无法计算${socialYear}社保基数`,
            检查年度: socialYear,
            计算的月均收入: undefined,
            社保缴交基数: undefined,
            时间段信息: `${socialYear} (需要${salaryYear}年工资数据)`
          });
          return;
        }

        // 检查是否有完整12个月的工资数据
        if (taxableIncomeRecords.length < 12) {
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `${salaryYear}年工资数据不足12个月(${taxableIncomeRecords.length}个月)，无法准确计算${socialYear}社保基数`,
            检查年度: socialYear,
            计算的月均收入: undefined,
            社保缴交基数: undefined,
            时间段信息: `${socialYear} (基于${salaryYear}年${taxableIncomeRecords.length}个月工资数据)`
          });
          return;
        }

        // 计算年度总收入和月均收入
        const totalIncome = taxableIncomeRecords.reduce((sum: number, record: Record<string, unknown>) =>
          sum + (record.amount as number || 0), 0
        );
        const monthlyAverage = Math.round(totalIncome / 12); // 四舍五入取整数

        // 对每个险种进行检查
        Object.keys(socialByEmployeeYearType[empId][socialYear]).forEach(insuranceType => {
          const socialRecords = socialByEmployeeYearType[empId][socialYear][insuranceType];

          // 跳过重复记录（已经在前面报错了）
          if (socialRecords.length > 1) {
            return;
          }

          const socialRecord = socialRecords[0];
          const city = standardizeCity(socialRecord.缴交地 as string);
          const socialBase = parseAmount(socialRecord.缴交基数 as string | number);

          if (socialBase === 0) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `无法找到该员工的社保缴交基数：${insuranceType}`,
              检查年度: socialYear,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${socialYear} ${insuranceType} (基于${salaryYear}年工资)`
            });
            return;
          }

          // 查找对应的城市标准配置（使用社保年度的数字部分）
          const yearNumber = socialYear.replace('年度', '');
          const cityStandard = findCityStandard(city, insuranceType, yearNumber);

          if (!cityStandard) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `未找到社保标准配置：${city} ${insuranceType} ${yearNumber}年度`,
              检查年度: socialYear,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${socialYear} ${insuranceType} (基于${salaryYear}年工资)`
            });
            return;
          }

          // 解析最低和最高缴费基数
          const minBase = parseAmount(cityStandard.最低缴费基数 as string);
          const maxBase = parseAmount(cityStandard.最高缴费基数 as string);

          if (minBase === 0 || maxBase === 0) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `城市标准配置数据异常：${city} ${insuranceType} 最低基数${minBase} 最高基数${maxBase}`,
              检查年度: socialYear,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${socialYear} ${insuranceType} (基于${salaryYear}年工资)`
            });
            return;
          }

          // 计算应缴基数（应用上下限规则）
          let expectedBase = monthlyAverage;
          let ruleDescription = '';

          if (monthlyAverage > maxBase) {
            expectedBase = maxBase;
            ruleDescription = `${salaryYear}年月均收入${monthlyAverage.toLocaleString()}超过最高标准，应按最高基数${maxBase.toLocaleString()}`;
          } else if (monthlyAverage < minBase) {
            expectedBase = minBase;
            ruleDescription = `${salaryYear}年月均收入${monthlyAverage.toLocaleString()}低于最低标准，应按最低基数${minBase.toLocaleString()}`;
          } else {
            ruleDescription = `${salaryYear}年月均收入${monthlyAverage.toLocaleString()}在标准范围内`;
          }

          // 检查实际缴交基数是否符合规则
          if (socialBase !== expectedBase) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `缴交基数不符合规则：实际${socialBase.toLocaleString()}，应为${expectedBase.toLocaleString()}（${ruleDescription}，标准范围${minBase.toLocaleString()}-${maxBase.toLocaleString()}）`,
              检查年度: socialYear,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${socialYear} ${insuranceType} (基于${salaryYear}年工资)`
            });
          }
        });
      });
    });

    console.log('🔍 社保缴交基数与月均收入一致性检查结果:');
    console.log(`  - 总问题数: ${issues.length}`);
    console.log(`  - 问题详情:`, issues.slice(0, 5));

    return {
      type: 'social_insurance_base_consistency',
      title: '社保缴交基数与月均收入一致性检查',
      level: (issues.length > 0 ? 'high' : 'low') as 'high' | 'medium' | 'low',
      count: issues.length,
      details: issues
    };
  }

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

  // 执行检查3：员工社保记录项目完整性检查
  const executeCheck3 = async () => {
    setChecking3(true);
    setResults([]);
    setSelectedResult(null);

    try {
      const result = await checkSocialInsuranceCompleteness();
      setResults([result]);
      console.log('员工社保记录项目完整性检查完成:', result);
    } catch (error) {
      console.error('员工社保记录项目完整性检查失败:', error);
    } finally {
      setChecking3(false);
    }
  };

  // 执行检查4：员工缴纳地一致性检查
  const executeCheck4 = async () => {
    setChecking4(true);
    setResults([]);
    setSelectedResult(null);

    try {
      const result = await checkPaymentLocationConsistency();
      setResults([result]);
      setSelectedResult(result);
      console.log('员工缴纳地一致性检查完成:', result);
    } catch (error) {
      console.error('员工缴纳地一致性检查失败:', error);
    } finally {
      setChecking4(false);
    }
  }

  // 执行检查5：社保缴交基数与月均收入一致性检查
  const executeCheck5 = async () => {
    setChecking5(true);
    setResults([]);
    setSelectedResult(null);

    try {
      console.log('🔍 开始执行社保缴交基数与月均收入一致性检查...');
      const result = await checkSocialInsuranceBaseConsistency();
      setResults([result]);
      setSelectedResult(result);
      console.log('✅ 社保缴交基数与月均收入一致性检查完成:', result);
    } catch (error) {
      console.error('❌ 社保缴交基数与月均收入一致性检查失败:', error);
      
      // 创建错误结果对象
      const errorResult: CheckResult = {
        type: 'social_insurance_base_consistency',
        title: '社保缴交基数与月均收入一致性检查',
        level: 'high',
        count: 0,
        details: [],
        message: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
      
      setResults([errorResult]);
      setSelectedResult(errorResult);
    } finally {
      setChecking5(false);
    }
  }

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

      // 执行检查3：社保记录项目完整性
      const socialInsuranceCompletenessResult = await checkSocialInsuranceCompleteness();

      // 执行检查4：员工缴纳地一致性
      const paymentLocationConsistencyResult = await checkPaymentLocationConsistency();

      // 执行检查5：社保缴交基数与月均收入一致性
      const socialInsuranceBaseConsistencyResult = await checkSocialInsuranceBaseConsistency();

      const allResults = [socialInsuranceResult, contributionRatioResult, socialInsuranceCompletenessResult, paymentLocationConsistencyResult, socialInsuranceBaseConsistencyResult];

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
                  检查员工实际缴费比例与城市标准配置是否一致
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

          {/* 第三个检查：员工社保记录项目完整性检查 */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                员工社保记录项目完整性检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  检查每个员工每个年度是否具备完整的4项基本险种记录
                </div>
                <Button
                  onClick={() => executeCheck3()}
                  disabled={checking3}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {checking3 ? (
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

          {/* 第四个检查：员工缴纳地一致性检查 */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                员工缴纳地一致性检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  检查员工社保缴交地与劳动合同主体所在城市是否一致
                </div>
                <Button
                  onClick={() => executeCheck4()}
                  disabled={checking4}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {checking4 ? (
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

          {/* 第五个检查：社保缴交基数与月均收入一致性检查 */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                社保缴交基数与月均收入一致性检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  验证员工社保缴交基数是否与其月均收入保持一致
                </div>
                <Button
                  onClick={() => executeCheck5()}
                  disabled={checking5}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {checking5 ? (
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
                        {selectedResult.type === 'social_insurance_item_completeness' && (
                          <>
                            <TableHead>年度</TableHead>
                            <TableHead>缺失项目</TableHead>
                          </>
                        )}
                        {selectedResult.type === 'payment_location_consistency' && (
                          <>
                            <TableHead>缴交地</TableHead>
                            <TableHead>合同城市</TableHead>
                            <TableHead>时间段</TableHead>
                          </>
                        )}
                        {selectedResult.type === 'social_insurance_base_consistency' && (
                          <>
                            <TableHead>检查年度</TableHead>
                            <TableHead>计算的月均收入</TableHead>
                            <TableHead>社保缴交基数</TableHead>
                            <TableHead>时间段信息</TableHead>
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
                          {selectedResult.type === 'social_insurance_item_completeness' && (
                            <>
                              <TableCell>{detail.年度 || '-'}</TableCell>
                              <TableCell className="text-red-600">
                                {detail.缺失项目 ? detail.缺失项目.join('、') : '-'}
                              </TableCell>
                            </>
                          )}
                          {selectedResult.type === 'payment_location_consistency' && (
                            <>
                              <TableCell>{detail.缴交地 || '-'}</TableCell>
                              <TableCell>{detail.合同城市 || '-'}</TableCell>
                              <TableCell className="text-sm">{detail.时间段 || '-'}
                              </TableCell>
                            </>
                          )}
                          {selectedResult.type === 'social_insurance_base_consistency' && (
                            <>
                              <TableCell>{detail.检查年度 || '-'}</TableCell>
                              <TableCell className="font-mono">
                                {detail.计算的月均收入 !== undefined && detail.计算的月均收入 !== null
                                  ? detail.计算的月均收入.toLocaleString() + '元'
                                  : '-'}
                              </TableCell>
                              <TableCell className="font-mono">
                                {detail.社保缴交基数 !== undefined && detail.社保缴交基数 !== null
                                  ? detail.社保缴交基数.toLocaleString() + '元'
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-sm">{detail.时间段信息 || '-'}</TableCell>
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
              <p>• <strong>已实现 - 员工社保记录项目完整性检查</strong>：按社保年度检查每个员工是否具备完整的4项基本险种记录</p>
              <p>• <strong>已实现 - 员工缴纳地一致性检查</strong>：检查员工社保缴交地与劳动合同主体所在城市是否一致</p>
              <p>• <strong>已实现 - 社保缴交基数与月均收入一致性检查</strong>：验证员工社保缴交基数是否与其月均收入保持一致</p>
              <p>• <strong>开发中 - 员工与组织匹配性检查</strong>：验证员工与组织架构匹配关系</p>
              <p>• <strong>开发中 - 缴费记录时效性检查</strong>：验证缴费记录的时效性</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
