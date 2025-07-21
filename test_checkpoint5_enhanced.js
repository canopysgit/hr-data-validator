// 测试精细化的检查点5逻辑
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据标准化函数（与ComplianceChecker中一致）
const standardizeCity = (city) => {
  if (!city) return '';
  return city.replace(/市$|地区$|区$/g, '').trim();
};

const standardizeInsuranceType = (type) => {
  if (!type || type === null || type === undefined) {
    return '';
  }

  const typeMapping = {
    '养老': '养老保险',
    '养老险': '养老保险',
    '基本养老保险': '养老保险',
    '养老保险': '养老保险',
    '医疗': '医疗保险',
    '医疗险': '医疗保险',
    '基本医疗保险': '医疗保险',
    '医疗保险': '医疗保险',
    '失业': '失业保险',
    '失业险': '失业保险',
    '失业保险': '失业保险',
    '工伤': '工伤保险',
    '工伤险': '工伤保险',
    '工伤保险': '工伤保险',
    '公积金': '公积金',
    '住房公积金': '公积金'
  };

  return typeMapping[type] || type;
};

// 数据格式转换函数
const parseAmount = (amountStr) => {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;
  return parseInt(String(amountStr).replace(/[^\d]/g, '')) || 0;
};

async function testEnhancedCheckpoint5() {
  console.log('🔍 测试精细化的检查点5逻辑...\n');
  
  try {
    // 查询测试数据
    console.log('📊 查询测试数据...');
    
    // 查询社保数据样本
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .limit(5);
    
    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }
    
    // 查询工资数据样本
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('salary_item_name', '税前应发合计')
      .limit(10);
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    // 查询城市标准数据样本
    const { data: cityStandardData, error: cityStandardError } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .limit(5);
    
    if (cityStandardError) {
      console.error('❌ 查询城市标准数据失败:', cityStandardError);
      return;
    }
    
    console.log(`✅ 数据查询完成:`);
    console.log(`  - 社保数据: ${socialData?.length || 0} 条`);
    console.log(`  - 工资数据: ${salaryData?.length || 0} 条`);
    console.log(`  - 城市标准数据: ${cityStandardData?.length || 0} 条`);
    
    // 测试数据格式转换
    console.log('\n🧪 测试数据格式转换:');
    const testAmounts = ['4569元', '22845元', '5000', 5000, '', null];
    testAmounts.forEach(amount => {
      const parsed = parseAmount(amount);
      console.log(`  ${JSON.stringify(amount)} -> ${parsed}`);
    });
    
    // 测试标准化函数
    console.log('\n🧪 测试标准化函数:');
    const testCities = ['北京', '北京市', '上海', '上海市'];
    testCities.forEach(city => {
      const standardized = standardizeCity(city);
      console.log(`  城市: ${city} -> ${standardized}`);
    });
    
    const testTypes = ['养老', '养老保险', '医疗', '医疗保险', '公积金'];
    testTypes.forEach(type => {
      const standardized = standardizeInsuranceType(type);
      console.log(`  险种: ${type} -> ${standardized}`);
    });
    
    // 测试城市标准查找逻辑
    if (cityStandardData && cityStandardData.length > 0) {
      console.log('\n🧪 测试城市标准查找:');
      const sample = cityStandardData[0];
      console.log('  标准配置样本:', {
        城市: sample.城市,
        险种类型: sample.险种类型,
        社保年度: sample.社保年度,
        最低缴费基数: sample.最低缴费基数,
        最高缴费基数: sample.最高缴费基数
      });
      
      const minBase = parseAmount(sample.最低缴费基数);
      const maxBase = parseAmount(sample.最高缴费基数);
      console.log(`  解析后: 最低${minBase} 最高${maxBase}`);
      
      // 测试上下限规则
      const testIncomes = [3000, 15000, 30000];
      testIncomes.forEach(income => {
        let expectedBase = income;
        let rule = '';
        
        if (income > maxBase) {
          expectedBase = maxBase;
          rule = '超过最高限额';
        } else if (income < minBase) {
          expectedBase = minBase;
          rule = '低于最低限额';
        } else {
          rule = '在标准范围内';
        }
        
        console.log(`  月均收入${income} -> 应缴基数${expectedBase} (${rule})`);
      });
    }
    
    // 显示实际数据样本
    if (socialData && socialData.length > 0) {
      console.log('\n📋 社保数据样本:');
      socialData.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. 员工${record.员工工号} ${record.险种类型} ${record.年度}年度 基数${record.缴交基数}`);
      });
    }
    
    if (salaryData && salaryData.length > 0) {
      console.log('\n📋 工资数据样本:');
      const groupedSalary = {};
      salaryData.forEach(record => {
        const empId = record.employee_id;
        const year = new Date(record.start_date).getFullYear();
        const key = `${empId}-${year}`;
        
        if (!groupedSalary[key]) {
          groupedSalary[key] = [];
        }
        groupedSalary[key].push(record.amount);
      });
      
      Object.keys(groupedSalary).slice(0, 3).forEach(key => {
        const amounts = groupedSalary[key];
        const total = amounts.reduce((sum, amount) => sum + amount, 0);
        const average = Math.round(total / amounts.length);
        console.log(`  ${key}: ${amounts.length}个月 总计${total} 月均${average}`);
      });
    }
    
    console.log('\n✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testEnhancedCheckpoint5();
