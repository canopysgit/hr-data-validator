// 验证杨治源数据修复后的合规检查逻辑
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据标准化函数
const standardizeInsuranceType = (type) => {
  if (!type || type === null || type === undefined) {
    return '';
  }

  const typeMapping = {
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

    // 生育保险相关
    '生育': '生育保险',
    '生育险': '生育保险',
    '生育保险': '生育保险',

    // 公积金相关
    '公积金': '公积金',
    '住房公积金': '公积金',
    '住房': '公积金'
  };

  return typeMapping[type] || type;
};

// 日期标准化函数
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  
  // 如果已经是标准格式，直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // 处理各种日期格式
  let normalized = dateStr.toString().trim();
  
  // 处理中文日期格式：2022年7月1日 -> 2022-07-01
  normalized = normalized.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, (match, year, month, day) => {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  });
  
  // 处理斜杠格式：2022/7/1 -> 2022-07-01
  normalized = normalized.replace(/(\d{4})\/(\d{1,2})\/(\d{1,2})/g, (match, year, month, day) => {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  });
  
  return normalized;
};

// 获取社保年度函数（7.1-6.30）
const getSocialInsuranceYear = (dateStr) => {
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

async function verifyYangZhiyuanFix() {
  console.log('🔍 验证杨治源数据修复后的合规检查逻辑...');
  console.log();

  try {
    // 查询杨治源的社保数据
    const { data: yangData, error: yangError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', '80000001');

    if (yangError) {
      console.error('❌ 查询杨治源数据失败:', yangError);
      return;
    }

    console.log('📊 杨治源社保数据总条数:', yangData?.length);
    console.log();

    // 修正后的四个基本险种（个人缴纳）
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '公积金'];
    console.log('✅ 修正后的应缴险种:', requiredInsuranceTypes.join('、'));
    console.log();

    // 按年度分组杨治源的社保数据
    const yearlyData = {};
    
    yangData?.forEach((record) => {
      const startTime = record.开始时间;
      const insuranceType = standardizeInsuranceType(record.险种类型);
      const year = getSocialInsuranceYear(startTime);
      
      console.log(`📋 记录: ${startTime} -> ${year}, 险种: ${record.险种类型} -> ${insuranceType}`);
      
      if (!yearlyData[year]) {
        yearlyData[year] = new Set();
      }
      
      // 只记录四个基本险种
      if (requiredInsuranceTypes.includes(insuranceType)) {
        yearlyData[year].add(insuranceType);
      }
    });

    console.log();
    console.log('📈 杨治源按年度分组的险种数据:');
    
    // 检查2022-2024年度
    const targetYears = ['2022年度', '2023年度', '2024年度'];
    
    targetYears.forEach(year => {
      const existingTypes = yearlyData[year] ? Array.from(yearlyData[year]) : [];
      const missingTypes = requiredInsuranceTypes.filter(type => !existingTypes.includes(type));
      
      console.log(`\n🔍 ${year}:`);
      console.log(`  ✅ 已缴纳: ${existingTypes.length > 0 ? existingTypes.join('、') : '无'}`);
      console.log(`  ❌ 缺失: ${missingTypes.length > 0 ? missingTypes.join('、') : '无'}`);
      console.log(`  📊 缺失数量: ${missingTypes.length}`);
      
      // 特别验证用户提到的情况
      if (year === '2023年度') {
        if (existingTypes.includes('养老保险') && missingTypes.length === 3) {
          console.log('  ✅ 符合预期：2023年只缴纳养老保险，缺3项');
        } else {
          console.log('  ❌ 不符合预期：应该只缴纳养老保险，缺3项');
        }
      } else if (year === '2022年度' || year === '2024年度') {
        if (existingTypes.length === 0 && missingTypes.length === 4) {
          console.log(`  ✅ 符合预期：${year}无缴纳记录，缺4项`);
        } else {
          console.log(`  ❌ 不符合预期：${year}应该无缴纳记录，缺4项`);
        }
      }
    });

    console.log();
    console.log('🎯 验证结论:');
    console.log('- 修正前：检查5个险种（包含工伤保险）');
    console.log('- 修正后：检查4个险种（养老、医疗、失业、公积金）');
    console.log('- 杨治源2023年：只缴纳养老保险，应缺3项（医疗、失业、公积金）');
    console.log('- 杨治源2022/2024年：无缴纳记录，应缺4项');

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

verifyYangZhiyuanFix();