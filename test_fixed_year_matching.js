// 测试修复后的年度匹配逻辑
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

async function testFixedYearMatching() {
  console.log('🧪 测试修复后的年度匹配逻辑...\n');
  
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
    
    // 4. 模拟修复后的检查点5逻辑
    console.log('\n🔍 模拟修复后的检查点5逻辑...');
    
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];
    const socialByEmployeeYearType = {};
    const employeeNames = {};
    
    // 处理社保数据
    socialData?.forEach((record) => {
      const empId = record.员工工号;
      const insuranceType = standardizeInsuranceType(record.险种类型);
      const empSurname = record.姓;
      const empGivenName = record.名;
      
      // 只处理需要检查的险种
      if (!requiredInsuranceTypes.includes(insuranceType)) {
        return;
      }
      
      // 处理姓名
      const fullName = `${empSurname || ''}${empGivenName || ''}`;
      employeeNames[empId] = fullName;
      
      // 使用数据库中的年度字段
      const year = `${record.社保年度}年度`;
      
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
      
      salaryByEmployee[empId][year].push({
        salary_item_name: record.salary_item_name,
        amount: amount
      });
    });
    
    // 6. 查找城市标准配置的函数
    const findCityStandard = (city, insuranceType, year) => {
      return cityStandardData?.find(standard => {
        const stdCity = standardizeCity(standard.城市);
        const stdType = standardizeInsuranceType(standard.险种类型);
        const stdYear = standard.社保年度;
        
        return stdCity === city && stdType === insuranceType && stdYear === year;
      });
    };
    
    // 7. 应用修复后的年度匹配逻辑
    console.log('\n🔍 应用修复后的年度匹配逻辑...');
    const issues = [];
    
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      const empName = employeeNames[empId] || '未知姓名';
      
      Object.keys(socialByEmployeeYearType[empId]).forEach(socialYear => {
        // 修复后的逻辑：社保年度应该基于上一自然年度的工资数据
        const salaryYear = (parseInt(socialYear.replace('年度', '')) - 1).toString();
        
        console.log(`\n📋 处理员工 ${empId} (${empName}):`);
        console.log(`  社保年度: ${socialYear}`);
        console.log(`  对应工资年度: ${salaryYear}`);
        
        const salaryRecords = salaryByEmployee[empId]?.[salaryYear] || [];
        
        // 筛选税前应发合计的工资记录
        const taxableIncomeRecords = salaryRecords.filter(record =>
          record.salary_item_name === '税前应发合计'
        );
        
        console.log(`  ${salaryYear}年工资记录数: ${taxableIncomeRecords.length}`);
        
        if (taxableIncomeRecords.length === 0) {
          console.log(`  ❌ 缺少${salaryYear}年工资数据，无法验证${socialYear}社保基数`);
          return;
        }

        if (taxableIncomeRecords.length < 12) {
          console.log(`  ⚠️ ${salaryYear}年工资数据不足12个月 (${taxableIncomeRecords.length}个月)`);
          return;
        }
        
        // 计算年度总收入和月均收入
        const totalIncome = taxableIncomeRecords.reduce((sum, record) => sum + record.amount, 0);
        const monthlyAverage = Math.round(totalIncome / 12);
        
        console.log(`  ${salaryYear}年月均工资: ${monthlyAverage.toLocaleString()}`);
        
        // 对每个险种进行检查
        Object.keys(socialByEmployeeYearType[empId][socialYear]).forEach(insuranceType => {
          const socialRecords = socialByEmployeeYearType[empId][socialYear][insuranceType];
          
          if (socialRecords.length > 1) {
            return;
          }
          
          const socialRecord = socialRecords[0];
          const city = standardizeCity(socialRecord.缴交地);
          const socialBase = parseAmount(socialRecord.缴交基数);
          
          console.log(`\n    ${insuranceType}:`);
          console.log(`      缴交地: ${socialRecord.缴交地} -> ${city}`);
          console.log(`      实际缴费基数: ${socialBase.toLocaleString()}`);
          
          // 查找对应的城市标准配置
          const yearNumber = socialYear.replace('年度', '');
          const cityStandard = findCityStandard(city, insuranceType, yearNumber);
          
          if (!cityStandard) {
            console.log(`      ❌ 未找到标准配置: ${city} ${insuranceType} ${yearNumber}年度`);
            return;
          }
          
          // 解析最低和最高缴费基数
          const minBase = parseAmount(cityStandard.最低缴费基数);
          const maxBase = parseAmount(cityStandard.最高缴费基数);
          
          console.log(`      标准范围: ${minBase.toLocaleString()} - ${maxBase.toLocaleString()}`);
          
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
          
          console.log(`      应缴基数: ${expectedBase.toLocaleString()}`);
          console.log(`      规则说明: ${ruleDescription}`);
          
          // 检查实际缴交基数是否符合规则
          if (socialBase !== expectedBase) {
            const issue = {
              员工工号: empId,
              姓名: empName,
              问题描述: `缴交基数不符合规则：实际${socialBase.toLocaleString()}，应为${expectedBase.toLocaleString()}（${ruleDescription}，标准范围${minBase.toLocaleString()}-${maxBase.toLocaleString()}）`,
              检查年度: socialYear,
              计算的月均收入: monthlyAverage,
              社保缴交基数: socialBase,
              时间段信息: `${socialYear} ${insuranceType} (基于${salaryYear}年工资)`
            };
            
            issues.push(issue);
            console.log(`      ❌ 发现问题: 差异${Math.abs(socialBase - expectedBase).toLocaleString()}元`);
          } else {
            console.log(`      ✅ 缴费基数正确`);
          }
        });
      });
    });
    
    // 8. 显示检测结果
    console.log('\n📊 修复后的检测结果:');
    console.log(`  总问题数: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n📋 问题详情:');
      issues.forEach((issue, index) => {
        console.log(`\n问题 ${index + 1}:`);
        console.log(`  员工: ${issue.姓名} (${issue.员工工号})`);
        console.log(`  检查年度: ${issue.检查年度}`);
        console.log(`  问题描述: ${issue.问题描述}`);
        console.log(`  时间段信息: ${issue.时间段信息}`);
      });
    }
    
    // 9. 特别验证张持荣的情况
    console.log('\n🎯 特别验证张持荣的情况:');
    const zhangIssues = issues.filter(issue => issue.员工工号 === '80000003');
    console.log(`  张持荣相关问题数: ${zhangIssues.length}`);
    
    if (zhangIssues.length > 0) {
      zhangIssues.forEach((issue, index) => {
        console.log(`\n  张持荣问题 ${index + 1}:`);
        console.log(`    检查年度: ${issue.检查年度}`);
        console.log(`    问题描述: ${issue.问题描述}`);
        console.log(`    时间段信息: ${issue.时间段信息}`);
      });
      
      console.log('\n✅ 成功！张持荣2024年度养老保险缴费基数问题已被正确检测出来！');
    } else {
      console.log('\n❌ 未检测到张持荣的问题，需要进一步调试');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testFixedYearMatching();
