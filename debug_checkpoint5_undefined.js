// 调试检查点5中的undefined问题
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

async function debugCheckpoint5Undefined() {
  console.log('🔍 调试检查点5中的undefined问题...\n');
  
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
    console.log('\n📊 查询工资数据...');
    const { data: salaryData, error: salaryError } = await supabase
      .from(TABLE_NAMES.SALARY_CALCULATION_RESULTS)
      .select('*')
      .eq('salary_item_name', '税前应发合计');
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    console.log(`✅ 找到 ${salaryData?.length || 0} 条工资记录`);
    
    // 3. 模拟检查点5的数据处理逻辑
    console.log('\n🔍 模拟检查点5的数据处理逻辑...');
    
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];
    const socialByEmployeeYearType = {};
    const employeeNames = {};
    
    console.log('\n📋 处理社保数据...');
    socialData?.forEach((record, index) => {
      const empId = record.员工工号;
      const startTime = record.开始时间;
      const insuranceType = standardizeInsuranceType(record.险种类型);
      const empName = record.姓名;
      const empSurname = record.姓;
      const empGivenName = record.名;
      
      console.log(`\n记录 ${index + 1}:`);
      console.log(`  原始数据: 员工工号=${empId}, 姓名=${empName}, 姓=${empSurname}, 名=${empGivenName}`);
      console.log(`  险种类型: ${record.险种类型} -> ${insuranceType}`);
      console.log(`  开始时间: ${startTime}`);
      console.log(`  社保年度字段: ${record.社保年度}`);
      
      // 只处理需要检查的险种
      if (!requiredInsuranceTypes.includes(insuranceType)) {
        console.log(`  ⚠️ 跳过险种: ${insuranceType} (不在检查范围内)`);
        return;
      }
      
      // 处理姓名
      const fullName = empName || `${empSurname || ''}${empGivenName || ''}`;
      employeeNames[empId] = fullName;
      console.log(`  处理后姓名: ${fullName}`);
      
      // 使用数据库中的年度字段，如果没有则计算社保年度
      const year = record.社保年度 ? `${record.社保年度}年度` : getSocialInsuranceYear(startTime);
      console.log(`  计算年度: ${year}`);
      
      // 检查关键字段是否为undefined
      if (empId === undefined) console.log(`  ❌ 员工工号为undefined`);
      if (fullName === undefined || fullName === '') console.log(`  ❌ 姓名为undefined或空`);
      if (year === undefined) console.log(`  ❌ 年度为undefined`);
      if (insuranceType === undefined) console.log(`  ❌ 险种类型为undefined`);
      
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
    
    // 4. 检查处理结果
    console.log('\n📈 处理结果统计:');
    console.log(`  员工姓名映射数量: ${Object.keys(employeeNames).length}`);
    console.log(`  社保数据分组数量: ${Object.keys(socialByEmployeeYearType).length}`);
    
    console.log('\n📋 员工姓名映射详情:');
    Object.keys(employeeNames).forEach(empId => {
      console.log(`  ${empId}: ${employeeNames[empId]}`);
    });
    
    console.log('\n📋 社保数据分组详情:');
    Object.keys(socialByEmployeeYearType).forEach(empId => {
      const empName = employeeNames[empId];
      console.log(`\n员工 ${empId} (${empName}):`);
      
      Object.keys(socialByEmployeeYearType[empId]).forEach(year => {
        console.log(`  年度 ${year}:`);
        
        Object.keys(socialByEmployeeYearType[empId][year]).forEach(insuranceType => {
          const records = socialByEmployeeYearType[empId][year][insuranceType];
          console.log(`    ${insuranceType}: ${records.length} 条记录`);
        });
      });
    });
    
    // 5. 检查工资数据处理
    console.log('\n📊 检查工资数据处理...');
    const salaryByEmployee = {};
    
    salaryData?.forEach((record, index) => {
      const empId = record.employee_id;
      const startDate = record.start_date;
      const amount = record.amount;
      
      if (index < 5) { // 只显示前5条记录的详情
        console.log(`\n工资记录 ${index + 1}:`);
        console.log(`  员工工号: ${empId}`);
        console.log(`  开始日期: ${startDate}`);
        console.log(`  金额: ${amount}`);
      }
      
      if (!empId || !startDate || amount === undefined) {
        console.log(`  ❌ 工资记录字段缺失: empId=${empId}, startDate=${startDate}, amount=${amount}`);
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
    
    console.log(`\n工资数据分组结果: ${Object.keys(salaryByEmployee).length} 个员工`);
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
}

debugCheckpoint5Undefined();
