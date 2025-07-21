const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 复制检查点5的关键函数
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

async function debugWrongConclusion() {
  console.log('🔍 调试错误结论：为什么报告"黄笑霞2023年工资数据不足"...\n');
  
  try {
    // 1. 完全按照检查点5的逻辑重现问题
    console.log('📊 按检查点5逻辑查询数据...');
    
    // 查询社保数据
    const { data: socialData } = await supabase
      .from('employee_social_insurance')
      .select('*');
    
    // 查询工资数据
    const { data: salaryData } = await supabase
      .from('salary_calculation_results')
      .select('*');
    
    console.log(`📊 总社保记录: ${socialData?.length || 0}`);
    console.log(`💰 总工资记录: ${salaryData?.length || 0}`);
    
    // 2. 按检查点5的逻辑处理数据
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
    
    // 3. 专门分析黄笑霞的情况
    console.log('\n🎯 专门分析黄笑霞的数据处理过程...');
    
    const huangEmpId = '80000008';
    const huangName = employeeNames[huangEmpId];
    
    console.log(`黄笑霞员工工号: ${huangEmpId}`);
    console.log(`黄笑霞姓名: ${huangName}`);
    
    // 检查黄笑霞是否在社保数据结构中
    if (!socialByEmployeeYearType[huangEmpId]) {
      console.log('❌ 黄笑霞不在社保数据结构中！');
      
      // 查找原因
      const huangSocialRecords = socialData?.filter(record => 
        record.员工工号 === huangEmpId || 
        (record.姓 === '黄' && record.名 === '笑霞')
      );
      
      console.log(`\n🔍 黄笑霞的原始社保记录: ${huangSocialRecords?.length || 0} 条`);
      
      if (huangSocialRecords && huangSocialRecords.length > 0) {
        console.log('\n📋 黄笑霞社保记录详情:');
        huangSocialRecords.forEach((record, index) => {
          const insuranceType = standardizeInsuranceType(record.险种类型);
          const isRequired = requiredInsuranceTypes.includes(insuranceType);
          
          console.log(`\n记录 ${index + 1}:`);
          console.log(`  员工工号: ${record.员工工号}`);
          console.log(`  姓名: ${record.姓}${record.名}`);
          console.log(`  原始险种: ${record.险种类型}`);
          console.log(`  标准化险种: ${insuranceType}`);
          console.log(`  是否必需险种: ${isRequired ? '✅' : '❌'}`);
          console.log(`  社保年度: ${record.社保年度}`);
          console.log(`  开始时间: ${record.开始时间}`);
          
          if (!isRequired) {
            console.log(`  ⚠️ 跳过原因: ${insuranceType} 不在必需险种列表中`);
            console.log(`  📝 必需险种: ${requiredInsuranceTypes.join(', ')}`);
          }
        });
      }
      
      return;
    }
    
    console.log(`✅ 黄笑霞在社保数据结构中`);
    console.log(`黄笑霞的社保年度: ${Object.keys(socialByEmployeeYearType[huangEmpId])}`);
    
    // 检查黄笑霞是否在工资数据结构中
    if (!salaryByEmployee[huangEmpId]) {
      console.log('❌ 黄笑霞不在工资数据结构中！');
      
      // 查找原因
      const huangSalaryRecords = salaryData?.filter(record => 
        record.employee_id === huangEmpId ||
        (record.last_name === '黄' && record.first_name === '笑霞')
      );
      
      console.log(`\n🔍 黄笑霞的原始工资记录: ${huangSalaryRecords?.length || 0} 条`);
      
      if (huangSalaryRecords && huangSalaryRecords.length > 0) {
        console.log('\n📋 黄笑霞工资记录详情 (前5条):');
        huangSalaryRecords.slice(0, 5).forEach((record, index) => {
          console.log(`\n记录 ${index + 1}:`);
          console.log(`  employee_id: ${record.employee_id}`);
          console.log(`  姓名: ${record.last_name}${record.first_name}`);
          console.log(`  工资项: ${record.salary_item_name}`);
          console.log(`  开始时间: ${record.start_date}`);
          console.log(`  金额: ${record.amount}`);
        });
        
        // 检查employee_id字段的问题
        const uniqueEmpIds = new Set(huangSalaryRecords.map(record => record.employee_id));
        console.log(`\n🔍 黄笑霞工资记录中的employee_id值: ${Array.from(uniqueEmpIds).join(', ')}`);
        
        if (!uniqueEmpIds.has(huangEmpId)) {
          console.log(`❌ 关键问题：工资表中黄笑霞的employee_id不是 ${huangEmpId}！`);
          console.log(`这就是为什么检查点5找不到她的工资数据的原因！`);
        }
      }
      
      return;
    }
    
    console.log(`✅ 黄笑霞在工资数据结构中`);
    console.log(`黄笑霞的工资年度: ${Object.keys(salaryByEmployee[huangEmpId])}`);
    
    // 4. 模拟检查点5对黄笑霞的具体检查过程
    console.log('\n🔍 模拟检查点5对黄笑霞的检查过程...');
    
    Object.keys(socialByEmployeeYearType[huangEmpId]).forEach(year => {
      const socialYear = year; // 社保年度，如"2024年度"
      const salaryYear = (parseInt(year.replace('年度', '')) - 1).toString(); // 工资年度，如"2023"
      
      console.log(`\n📅 检查 ${socialYear}:`);
      console.log(`  需要 ${salaryYear} 年工资数据`);
      
      const salaryRecords = salaryByEmployee[huangEmpId]?.[salaryYear] || [];
      console.log(`  找到 ${salaryRecords.length} 条 ${salaryYear} 年工资记录`);
      
      // 筛选税前应发合计的工资记录
      const taxableIncomeRecords = salaryRecords.filter((record) =>
        record.salary_item_name === '税前应发合计'
      );
      
      console.log(`  其中税前应发合计: ${taxableIncomeRecords.length} 条`);
      
      if (taxableIncomeRecords.length === 0) {
        console.log(`  ❌ 结论: 缺少${salaryYear}年工资数据，无法计算${socialYear}社保基数`);
      } else if (taxableIncomeRecords.length < 12) {
        console.log(`  ❌ 结论: ${salaryYear}年工资数据不足12个月(${taxableIncomeRecords.length}个月)，无法准确计算${socialYear}社保基数`);
        console.log(`  🎯 这就是错误结论的来源！`);
        
        // 详细分析为什么只找到这么少的记录
        console.log(`\n  🔍 详细分析 ${salaryYear} 年工资记录:`);
        if (taxableIncomeRecords.length > 0) {
          taxableIncomeRecords.forEach((record, index) => {
            console.log(`    ${index + 1}. ${record.start_date}: ¥${record.amount}`);
          });
        }
        
        // 检查是否有其他年份的数据被错误分类
        console.log(`\n  🔍 检查是否有数据被错误分类:`);
        Object.keys(salaryByEmployee[huangEmpId]).forEach(checkYear => {
          const yearRecords = salaryByEmployee[huangEmpId][checkYear];
          const yearTaxable = yearRecords.filter(record => record.salary_item_name === '税前应发合计');
          console.log(`    ${checkYear}年: ${yearTaxable.length} 条税前应发合计`);
        });
        
      } else {
        console.log(`  ✅ 结论: ${salaryYear}年工资数据完整 (${taxableIncomeRecords.length}个月)`);
      }
    });
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugWrongConclusion();
