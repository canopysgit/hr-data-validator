// 测试修复后的检查点5逻辑
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

async function testCheckpoint5Fixed() {
  console.log('🧪 测试修复后的检查点5逻辑...\n');
  
  try {
    // 1. 查询张持荣的社保数据
    console.log('📊 查询张持荣的社保数据...');
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', '80000003');
    
    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }
    
    console.log(`✅ 找到 ${socialData?.length || 0} 条张持荣的社保记录`);
    
    if (socialData && socialData.length > 0) {
      console.log('\n📋 张持荣社保数据详情:');
      socialData.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  员工工号: ${record.员工工号}`);
        console.log(`  姓名: ${record.姓} ${record.名}`);
        console.log(`  社保年度: ${record.社保年度} (修复后)`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  缴交地: ${record.缴交地}`);
        console.log(`  缴交基数: ${record.缴交基数}`);
        console.log(`  开始时间: ${record.开始时间}`);
        console.log(`  结束时间: ${record.结束时间}`);
      });
    }
    
    // 2. 查询张持荣的工资数据
    console.log('\n📊 查询张持荣的工资数据...');
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', '80000003')
      .eq('salary_item_name', '税前应发合计');
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    console.log(`✅ 找到 ${salaryData?.length || 0} 条张持荣的工资记录`);
    
    if (salaryData && salaryData.length > 0) {
      // 按年度分组工资数据
      const salaryByYear = {};
      salaryData.forEach(record => {
        const year = new Date(record.start_date).getFullYear().toString();
        if (!salaryByYear[year]) {
          salaryByYear[year] = [];
        }
        salaryByYear[year].push(record.amount);
      });
      
      console.log('\n📋 张持荣工资数据按年度分组:');
      Object.keys(salaryByYear).forEach(year => {
        const amounts = salaryByYear[year];
        const total = amounts.reduce((sum, amount) => sum + amount, 0);
        const average = Math.round(total / amounts.length);
        console.log(`  ${year}年: ${amounts.length}个月, 总计${total}, 月均${average}`);
      });
    }
    
    // 3. 查询北京养老保险的标准配置
    console.log('\n📊 查询北京养老保险标准配置...');
    const { data: standardData, error: standardError } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .ilike('城市', '%北京%')
      .ilike('险种类型', '%养老%');
    
    if (standardError) {
      console.error('❌ 查询标准配置失败:', standardError);
      return;
    }
    
    console.log(`✅ 找到 ${standardData?.length || 0} 条北京养老保险标准配置`);
    
    if (standardData && standardData.length > 0) {
      console.log('\n📋 北京养老保险标准配置:');
      standardData.forEach((record, index) => {
        console.log(`\n配置 ${index + 1}:`);
        console.log(`  城市: ${record.城市}`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  社保年度: ${record.社保年度}`);
        console.log(`  最低缴费基数: ${record.最低缴费基数}`);
        console.log(`  最高缴费基数: ${record.最高缴费基数}`);
      });
      
      // 4. 模拟检查点5的逻辑
      console.log('\n🔍 模拟检查点5的逻辑...');
      
      const yangLaoRecord = socialData?.find(record => 
        standardizeInsuranceType(record.险种类型) === '养老保险'
      );
      
      if (yangLaoRecord) {
        const city = standardizeCity(yangLaoRecord.缴交地);
        const insuranceType = standardizeInsuranceType(yangLaoRecord.险种类型);
        const socialYear = yangLaoRecord.社保年度 || getSocialInsuranceYear(yangLaoRecord.开始时间);
        const socialBase = parseAmount(yangLaoRecord.缴交基数);
        
        console.log(`\n🎯 检查张持荣的养老保险:`);
        console.log(`  缴交地: ${yangLaoRecord.缴交地} -> 标准化: ${city}`);
        console.log(`  险种类型: ${yangLaoRecord.险种类型} -> 标准化: ${insuranceType}`);
        console.log(`  社保年度: ${socialYear}`);
        console.log(`  缴交基数: ${socialBase}`);
        
        // 查找对应的城市标准配置
        const cityStandard = standardData.find(standard => {
          const stdCity = standardizeCity(standard.城市);
          const stdType = standardizeInsuranceType(standard.险种类型);
          const stdYear = standard.社保年度;
          
          return stdCity === city && stdType === insuranceType && stdYear === socialYear.replace('年度', '');
        });
        
        if (cityStandard) {
          console.log(`\n✅ 找到匹配的城市标准配置:`);
          console.log(`  城市: ${cityStandard.城市}`);
          console.log(`  险种: ${cityStandard.险种类型}`);
          console.log(`  年度: ${cityStandard.社保年度}`);
          console.log(`  最低基数: ${cityStandard.最低缴费基数}`);
          console.log(`  最高基数: ${cityStandard.最高缴费基数}`);
          
          const minBase = parseAmount(cityStandard.最低缴费基数);
          const maxBase = parseAmount(cityStandard.最高缴费基数);
          
          console.log(`\n🔍 基数合规性检查:`);
          console.log(`  实际缴费基数: ${socialBase}`);
          console.log(`  标准范围: ${minBase} - ${maxBase}`);
          
          if (socialBase > maxBase) {
            console.log(`  ❌ 超过最高限额! ${socialBase} > ${maxBase} (超出 ${socialBase - maxBase})`);
            console.log(`  🎯 这就是应该被检测出的问题！`);
          } else if (socialBase < minBase) {
            console.log(`  ❌ 低于最低限额! ${socialBase} < ${minBase}`);
          } else {
            console.log(`  ✅ 在标准范围内`);
          }
        } else {
          console.log(`\n❌ 未找到匹配的城市标准配置`);
          console.log(`  查找条件: 城市=${city}, 险种=${insuranceType}, 年度=${socialYear.replace('年度', '')}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testCheckpoint5Fixed();
