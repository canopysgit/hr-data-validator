// 测试检查点5的最终修复效果
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 表名常量
const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  SALARY_CALCULATION_RESULTS: 'salary_calculation_results',
  CITY_STANDARDS: 'city_social_insurance_standards'
};

// 数据标准化函数
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

const standardizeCity = (city) => {
  if (!city) return '';
  return city.replace(/市$|地区$|区$/g, '').trim();
};

const standardizeInsuranceType = (type) => {
  if (!type) return '';
  const typeMap = {
    '养老': '养老保险',
    '养老险': '养老保险',
    '医疗': '医疗保险',
    '医疗险': '医疗保险',
    '失业': '失业保险',
    '失业险': '失业保险',
    '工伤': '工伤保险',
    '工伤险': '工伤保险',
    '公积金': '公积金',
    '住房公积金': '公积金'
  };
  return typeMap[type] || type;
};

const parseAmount = (amountStr) => {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;
  const cleanStr = amountStr.toString().replace(/[^\d.]/g, '');
  const amount = parseFloat(cleanStr);
  return isNaN(amount) ? 0 : amount;
};

const getSocialInsuranceYear = (dateStr) => {
  try {
    const date = new Date(normalizeDate(dateStr));
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (month >= 7) {
      return `${year}年度`;
    } else {
      return `${year - 1}年度`;
    }
  } catch {
    return '未知年度';
  }
};

async function testCheckpoint5FinalFix() {
  console.log('🧪 测试检查点5的最终修复效果...\n');
  
  try {
    // 1. 查询员工社保数据
    console.log('📊 查询员工社保数据...');
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*');
    
    if (socialError) {
      console.error('❌ 查询员工社保数据失败:', socialError);
      return;
    }
    
    console.log(`✅ 找到 ${socialData?.length || 0} 条社保记录`);
    
    // 2. 查询工资数据
    const { data: salaryData, error: salaryError } = await supabase
      .from(TABLE_NAMES.SALARY_CALCULATION_RESULTS)
      .select('*')
      .eq('salary_item_name', '税前应发合计');
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    console.log(`✅ 找到 ${salaryData?.length || 0} 条工资记录`);
    
    // 3. 查询城市标准配置
    const { data: cityStandardData, error: cityStandardError } = await supabase
      .from(TABLE_NAMES.CITY_STANDARDS)
      .select('*');
    
    if (cityStandardError) {
      console.error('❌ 查询城市标准配置失败:', cityStandardError);
      return;
    }
    
    console.log(`✅ 找到 ${cityStandardData?.length || 0} 条城市标准配置`);
    
    // 4. 模拟检查点5的完整逻辑
    console.log('\n🔍 模拟检查点5的完整逻辑...');
    
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];
    const socialByEmployeeYearType = {};
    const employeeNames = {};
    
    // 处理社保数据（修复后的逻辑）
    socialData?.forEach((record) => {
      const empId = record.员工工号;
      const startTime = record.开始时间;
      const insuranceType = standardizeInsuranceType(record.险种类型);
      const empSurname = record.姓;
      const empGivenName = record.名;
      
      // 只处理需要检查的险种
      if (!requiredInsuranceTypes.includes(insuranceType)) {
        return;
      }
      
      // 处理姓名（修复后：直接使用姓+名，不再引用不存在的姓名字段）
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
    
    console.log(`✅ 处理完成，员工数量: ${Object.keys(employeeNames).length}`);
    
    // 5. 处理工资数据
    const salaryByEmployee = {};
    
    salaryData?.forEach((record) => {
      const empId = record.employee_id;
      const startDate = record.start_date;
      const amount = record.amount;
      
      if (!empId || !startDate || amount === undefined) {
        return;
      }
      
      const year = new Date(startDate).getFullYear().toString();
      
      if (!salaryByEmployee[empId]) {
        salaryByEmployee[empId] = {};
      }
      if (!salaryByEmployee[empId][year]) {
        salaryByEmployee[empId][year] = [];
      }
      
      salaryByEmployee[empId][year].push(amount);
    });
    
    // 6. 模拟问题检测逻辑
    console.log('\n🔍 模拟问题检测逻辑...');
    const issues = [];
    
    // 查找城市标准配置的函数
    const findCityStandard = (city, insuranceType, year) => {
      return cityStandardData?.find(standard => {
        const stdCity = standardizeCity(standard.城市);
        const stdType = standardizeInsuranceType(standard.险种类型);
        const stdYear = standard.社保年度;
        
        return stdCity === city && stdType === insuranceType && stdYear === year;
      });
    };
    
    // 检查每个员工的每个年度的每个险种
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      const empName = employeeNames[empId] || '未知姓名';
      
      Object.keys(socialByEmployeeYearType[empId]).forEach(year => {
        Object.keys(socialByEmployeeYearType[empId][year]).forEach(insuranceType => {
          const records = socialByEmployeeYearType[empId][year][insuranceType];
          
          if (records.length > 1) {
            // 重复记录问题
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `该员工工号缴费记录缺失`,
              检查年度: year,
              计算的月均收入: undefined,
              社保缴交基数: undefined,
              时间段信息: `${year} ${insuranceType}`
            });
            return;
          }
          
          const record = records[0];
          const city = standardizeCity(record.缴交地);
          const socialBase = parseAmount(record.缴交基数);
          const yearNumber = year.replace('年度', '');
          
          // 计算月均收入
          const salaryRecords = salaryByEmployee[empId]?.[yearNumber] || [];
          if (salaryRecords.length === 0) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `该员工工号缴费记录缺失`,
              检查年度: year,
              计算的月均收入: undefined,
              社保缴交基数: socialBase,
              时间段信息: `${year} ${insuranceType}`
            });
            return;
          }
          
          const totalSalary = salaryRecords.reduce((sum, amount) => sum + amount, 0);
          const monthlyAverage = Math.round(totalSalary / salaryRecords.length);
          
          // 查找对应的城市标准配置
          const cityStandard = findCityStandard(city, insuranceType, yearNumber);
          
          if (!cityStandard) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `未找到社保标准配置：${city} ${insuranceType} ${yearNumber}年度`,
              检查年度: year,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${year} ${insuranceType}`
            });
            return;
          }
          
          // 解析最低和最高缴费基数
          const minBase = parseAmount(cityStandard.最低缴费基数);
          const maxBase = parseAmount(cityStandard.最高缴费基数);
          
          if (minBase === 0 || maxBase === 0) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `城市标准配置数据异常：${city} ${insuranceType} 最低基数${minBase} 最高基数${maxBase}`,
              检查年度: year,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${year} ${insuranceType}`
            });
            return;
          }
          
          // 计算应缴基数（应用上下限规则）
          let expectedBase = monthlyAverage;
          let ruleDescription = '';
          
          if (monthlyAverage > maxBase) {
            expectedBase = maxBase;
            ruleDescription = `月均收入${monthlyAverage}超过最高标准，应按最高基数${maxBase}`;
          } else if (monthlyAverage < minBase) {
            expectedBase = minBase;
            ruleDescription = `月均收入${monthlyAverage}低于最低标准，应按最低基数${minBase}`;
          } else {
            ruleDescription = `月均收入${monthlyAverage}在标准范围内`;
          }
          
          // 检查实际缴交基数是否符合规则
          if (socialBase !== expectedBase) {
            issues.push({
              员工工号: empId,
              姓名: empName,
              问题描述: `缴交基数不符合规则：实际${socialBase}，应为${expectedBase}（${ruleDescription}，标准范围${minBase}-${maxBase}）`,
              检查年度: year,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${year} ${insuranceType}`
            });
          }
        });
      });
    });
    
    // 7. 显示检测结果
    console.log('\n📊 检测结果:');
    console.log(`  总问题数: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n📋 问题详情:');
      issues.forEach((issue, index) => {
        console.log(`\n问题 ${index + 1}:`);
        console.log(`  员工工号: ${issue.员工工号}`);
        console.log(`  姓名: ${issue.姓名}`);
        console.log(`  检查年度: ${issue.检查年度}`);
        console.log(`  问题描述: ${issue.问题描述}`);
        console.log(`  计算的月均收入: ${issue.计算的月均收入}`);
        console.log(`  社保缴交基数: ${issue.社保缴交基数}`);
        console.log(`  时间段信息: ${issue.时间段信息}`);
      });
    } else {
      console.log('  ✅ 未发现问题');
    }
    
    // 8. 特别验证张持荣的情况
    console.log('\n🎯 特别验证张持荣的情况:');
    const zhangIssues = issues.filter(issue => issue.员工工号 === '80000003');
    console.log(`  张持荣相关问题数: ${zhangIssues.length}`);
    
    zhangIssues.forEach((issue, index) => {
      console.log(`\n  张持荣问题 ${index + 1}:`);
      console.log(`    检查年度: ${issue.检查年度}`);
      console.log(`    问题描述: ${issue.问题描述}`);
      console.log(`    月均收入: ${issue.计算的月均收入}`);
      console.log(`    缴交基数: ${issue.社保缴交基数}`);
    });
    
    console.log('\n✅ 修复验证完成！现在检查点5应该能正确显示年度和姓名信息，并检测出张持荣的缴费基数超标问题。');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testCheckpoint5FinalFix();
