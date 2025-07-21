const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 复制检查点5的辅助函数
function standardizeInsuranceType(type) {
  if (!type) return '';
  const typeStr = type.toString().trim();
  
  if (typeStr.includes('养老') || typeStr.includes('基本养老')) {
    return '养老保险';
  } else if (typeStr.includes('医疗') || typeStr.includes('基本医疗')) {
    return '医疗保险';
  } else if (typeStr.includes('失业')) {
    return '失业保险';
  } else if (typeStr.includes('公积金') || typeStr.includes('住房公积金')) {
    return '公积金';
  } else if (typeStr.includes('工伤')) {
    return '工伤保险';
  } else if (typeStr.includes('生育')) {
    return '生育保险';
  }
  
  return typeStr;
}

function getSocialInsuranceYear(startTime) {
  if (!startTime) return '';
  
  const date = new Date(startTime);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  if (month >= 7) {
    return `${year}年度`;
  } else {
    return `${year - 1}年度`;
  }
}

async function debugCheckpoint5Complete() {
  console.log('🔍 完整调试检查点5逻辑...\n');
  
  try {
    // 1. 查询黄笑霞的所有相关数据
    console.log('📊 查询黄笑霞的所有数据...');
    
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('姓', '黄')
      .eq('名', '笑霞');
    
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('last_name', '黄')
      .eq('first_name', '笑霞')
      .eq('salary_item_name', '税前应发合计');
    
    if (socialError || salaryError) {
      console.error('❌ 查询失败:', { socialError, salaryError });
      return;
    }
    
    console.log(`📊 社保记录: ${socialData?.length || 0} 条`);
    console.log(`💰 工资记录: ${salaryData?.length || 0} 条`);
    
    // 2. 模拟检查点5的数据处理逻辑
    console.log('\n🔍 模拟检查点5的数据处理...');
    
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];
    const socialByEmployeeYearType = {};
    const employeeNames = {};
    
    // 处理社保数据
    socialData?.forEach((record) => {
      const empId = record.员工工号;
      const startTime = record.开始时间;
      const insuranceType = standardizeInsuranceType(record.险种类型);
      const empSurname = record.姓;
      const empGivenName = record.名;
      
      console.log(`\n处理社保记录:`);
      console.log(`  员工工号: ${empId}`);
      console.log(`  原始险种: ${record.险种类型}`);
      console.log(`  标准化险种: ${insuranceType}`);
      console.log(`  原始社保年度: ${record.社保年度} (${typeof record.社保年度})`);
      console.log(`  开始时间: ${startTime}`);
      
      // 只处理需要检查的险种
      if (!requiredInsuranceTypes.includes(insuranceType)) {
        console.log(`  ⚠️ 跳过险种: ${insuranceType}`);
        return;
      }
      
      // 处理姓名
      const fullName = `${empSurname || ''}${empGivenName || ''}`;
      employeeNames[empId] = fullName;
      
      // 使用数据库中的年度字段，如果没有则计算社保年度
      const year = record.社保年度 ? `${record.社保年度}年度` : getSocialInsuranceYear(startTime);
      console.log(`  处理后年度: ${year}`);
      
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
    
    // 处理工资数据
    const salaryByEmployee = {};
    
    salaryData?.forEach((record) => {
      const empId = record.employee_id;
      const startDate = record.start_date;
      
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
    
    console.log('\n📋 数据处理结果:');
    console.log('社保数据结构:', Object.keys(socialByEmployeeYearType));
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      console.log(`  员工 ${empId}:`, Object.keys(socialByEmployeeYearType[empId]));
    });
    
    console.log('工资数据结构:', Object.keys(salaryByEmployee));
    Object.keys(salaryByEmployee).forEach(empId => {
      console.log(`  员工 ${empId}:`, Object.keys(salaryByEmployee[empId]));
    });
    
    // 3. 模拟检查点5的检查逻辑
    console.log('\n🔍 模拟检查点5的检查逻辑...');
    
    const issues = [];
    
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      const empName = employeeNames[empId] || '未知姓名';
      
      console.log(`\n👤 检查员工: ${empName} (${empId})`);
      
      Object.keys(socialByEmployeeYearType[empId]).forEach(year => {
        console.log(`\n  📅 检查年度: ${year}`);
        
        // 修复年度匹配逻辑：社保年度应该基于上一自然年度的工资数据
        const socialYear = year; // 社保年度，如"2024年度"
        const salaryYear = (parseInt(year.replace('年度', '')) - 1).toString(); // 工资年度，如"2023"
        
        console.log(`    社保年度: ${socialYear}`);
        console.log(`    对应工资年度: ${salaryYear}`);
        
        const salaryRecords = salaryByEmployee[empId]?.[salaryYear] || [];
        console.log(`    工资记录数: ${salaryRecords.length}`);
        
        // 筛选税前应发合计的工资记录
        const taxableIncomeRecords = salaryRecords.filter((record) =>
          record.salary_item_name === '税前应发合计'
        );
        
        console.log(`    税前应发合计记录数: ${taxableIncomeRecords.length}`);
        
        if (taxableIncomeRecords.length === 0) {
          console.log(`    ❌ 该员工工号缴费记录缺失`);
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `该员工工号缴费记录缺失`,
            检查年度: socialYear,
            计算的月均收入: undefined,
            社保缴交基数: undefined,
            时间段信息: `${socialYear} (基于${salaryYear}年工资数据)`
          });
          return;
        }
        
        // 检查是否有完整12个月的工资数据
        if (taxableIncomeRecords.length < 12) {
          console.log(`    ❌ ${salaryYear}年工资数据不足12个月 (${taxableIncomeRecords.length}个月)`);
          issues.push({
            员工工号: empId,
            姓名: empName,
            问题描述: `该员工${salaryYear}年工资数据不足12个月，无法准确计算${socialYear}社保基数`,
            检查年度: socialYear,
            计算的月均收入: undefined,
            社保缴交基数: undefined,
            时间段信息: `${socialYear} (基于${salaryYear}年${taxableIncomeRecords.length}个月工资数据)`
          });
          return;
        }
        
        console.log(`    ✅ ${salaryYear}年工资数据完整 (${taxableIncomeRecords.length}个月)`);
        
        // 计算年度总收入和月均收入
        const totalIncome = taxableIncomeRecords.reduce((sum, record) =>
          sum + (record.amount || 0), 0
        );
        const monthlyAverage = Math.round(totalIncome / 12);
        
        console.log(`    💰 年度总收入: ¥${totalIncome.toLocaleString()}`);
        console.log(`    📊 月均收入: ¥${monthlyAverage.toLocaleString()}`);
      });
    });
    
    // 4. 显示问题结果
    console.log('\n🎯 检查结果:');
    if (issues.length === 0) {
      console.log('✅ 未发现问题');
    } else {
      console.log(`❌ 发现 ${issues.length} 个问题:`);
      issues.forEach((issue, index) => {
        console.log(`\n问题 ${index + 1}:`);
        console.log(`  员工: ${issue.姓名} (${issue.员工工号})`);
        console.log(`  问题: ${issue.问题描述}`);
        console.log(`  年度: ${issue.检查年度}`);
        console.log(`  时间段: ${issue.时间段信息}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugCheckpoint5Complete();
