// 调试员工缴纳地一致性检查 - 分析数据匹配问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  EMPLOYEE_CONTRACTS: 'employee_contracts'
};

async function debugLocationConsistency() {
  console.log('🔍 调试员工缴纳地一致性检查...');
  console.log();

  try {
    // 1. 检查社保数据样本
    console.log('=== 1. 检查社保数据样本 ===');
    const { data: socialSample, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('员工工号, 姓, 名, 开始时间, 结束时间, 缴交地')
      .limit(5);

    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }

    console.log('📊 社保数据样本:');
    socialSample?.forEach((record, index) => {
      console.log(`  ${index + 1}. 员工工号: ${record.员工工号}, 姓名: ${record.姓}${record.名}, 缴交地: ${record.缴交地}`);
      console.log(`     时间段: ${record.开始时间} - ${record.结束时间}`);
    });
    console.log();

    // 2. 检查合同数据样本
    console.log('=== 2. 检查合同数据样本 ===');
    const { data: contractSample, error: contractError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('员工工号, 姓, 名, 开始日期, 结束日期, 劳动合同主体, 劳动合同主体所在城市')
      .limit(5);

    if (contractError) {
      console.error('❌ 查询合同数据失败:', contractError);
      return;
    }

    console.log('📊 合同数据样本:');
    contractSample?.forEach((record, index) => {
      console.log(`  ${index + 1}. 员工工号: ${record.员工工号}, 姓名: ${record.姓}${record.名}`);
      console.log(`     合同主体: ${record.劳动合同主体}, 城市: ${record.劳动合同主体所在城市}`);
      console.log(`     时间段: ${record.开始日期} - ${record.结束日期}`);
    });
    console.log();

    // 3. 检查合同城市字段的数据分布
    console.log('=== 3. 检查合同城市字段数据分布 ===');
    const { data: cityStats, error: cityError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('劳动合同主体所在城市')
      .not('劳动合同主体所在城市', 'is', null);

    if (cityError) {
      console.error('❌ 查询城市数据失败:', cityError);
    } else {
      console.log(`📊 非空城市记录数: ${cityStats?.length || 0}`);
      if (cityStats && cityStats.length > 0) {
        const cityCount = {};
        cityStats.forEach(record => {
          const city = record.劳动合同主体所在城市;
          cityCount[city] = (cityCount[city] || 0) + 1;
        });
        console.log('📊 城市分布:', cityCount);
      } else {
        console.log('⚠️  所有合同记录的城市字段都为空！');
      }
    }
    console.log();

    // 4. 测试具体员工的匹配逻辑
    console.log('=== 4. 测试具体员工的匹配逻辑 ===');
    if (socialSample && socialSample.length > 0) {
      const testEmployee = socialSample[0];
      console.log(`🔍 测试员工: ${testEmployee.员工工号} (${testEmployee.姓}${testEmployee.名})`);
      
      // 查找该员工的所有合同记录
      const { data: empContracts, error: empError } = await supabase
        .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
        .select('*')
        .eq('员工工号', testEmployee.员工工号);

      if (empError) {
        console.error('❌ 查询员工合同失败:', empError);
      } else {
        console.log(`📊 该员工的合同记录数: ${empContracts?.length || 0}`);
        empContracts?.forEach((contract, index) => {
          console.log(`  合同${index + 1}: ${contract.开始日期} - ${contract.结束日期}`);
          console.log(`    主体: ${contract.劳动合同主体}`);
          console.log(`    城市: ${contract.劳动合同主体所在城市 || '(空)'}`);
        });
      }
    }
    console.log();

    // 5. 分析问题和建议
    console.log('=== 5. 问题分析和建议 ===');
    console.log('🔍 发现的问题:');
    console.log('  1. 合同表中"劳动合同主体所在城市"字段可能全部为空');
    console.log('  2. 这导致无法进行城市一致性比对');
    console.log();
    console.log('💡 建议的解决方案:');
    console.log('  1. 检查Excel原始数据中是否包含城市信息');
    console.log('  2. 重新导入数据，确保城市字段正确映射');
    console.log('  3. 或者从"劳动合同主体"字段中提取城市信息');
    console.log('     例如: "ACC北京公司" -> "北京"');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 运行调试
debugLocationConsistency();