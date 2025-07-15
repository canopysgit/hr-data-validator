// 调试合同表数据问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugContractData() {
  console.log('🔍 调试合同表数据问题...');
  console.log();

  try {
    // 1. 检查合同表中劳动合同主体所在城市字段的数据分布
    console.log('=== 1. 检查劳动合同主体所在城市字段 ===');
    const { data: contractData, error: contractError } = await supabase
      .from('employee_contracts')
      .select('员工工号, 姓, 名, 开始日期, 结束日期, 劳动合同主体, 劳动合同主体所在城市')
      .limit(20);

    if (contractError) {
      console.error('❌ 查询合同数据失败:', contractError);
      return;
    }

    console.log(`📊 合同数据样本: ${contractData?.length || 0} 条记录`);
    
    // 统计劳动合同主体所在城市字段的值分布
    const cityDistribution = {};
    const nullCount = contractData?.filter(item => !item.劳动合同主体所在城市).length || 0;
    
    contractData?.forEach(item => {
      const city = item.劳动合同主体所在城市;
      if (city) {
        cityDistribution[city] = (cityDistribution[city] || 0) + 1;
      }
    });
    
    console.log('📋 劳动合同主体所在城市分布:');
    console.log(`  - null/空值: ${nullCount} 条记录`);
    Object.entries(cityDistribution).forEach(([city, count]) => {
      console.log(`  - ${city}: ${count} 条记录`);
    });
    
    // 显示详细数据
    console.log('\n📄 详细数据样本:');
    contractData?.slice(0, 10).forEach((item, index) => {
      console.log(`\n第${index + 1}条记录:`);
      console.log(`  - 员工工号: ${item.员工工号}`);
      console.log(`  - 姓名: ${item.姓}${item.名}`);
      console.log(`  - 合同期间: ${item.开始日期} 至 ${item.结束日期}`);
      console.log(`  - 劳动合同主体: ${item.劳动合同主体}`);
      console.log(`  - 劳动合同主体所在城市: ${item.劳动合同主体所在城市}`);
    });

    // 2. 检查是否有其他可能的地址字段
    console.log('\n=== 2. 检查合同表的所有字段 ===');
    if (contractData && contractData.length > 0) {
      const allFields = Object.keys(contractData[0]);
      console.log('📋 合同表所有字段:');
      allFields.forEach(field => {
        console.log(`  - ${field}`);
      });
      
      // 检查是否有包含地址信息的字段
      const addressRelatedFields = allFields.filter(field => 
        field.includes('地') || field.includes('址') || field.includes('城市') || 
        field.includes('省') || field.includes('区') || field.includes('市')
      );
      
      console.log('\n📋 地址相关字段:');
      addressRelatedFields.forEach(field => {
        console.log(`  - ${field}`);
      });
    }

    // 3. 检查劳动合同主体字段，看是否包含地址信息
    console.log('\n=== 3. 分析劳动合同主体字段 ===');
    const contractBodyDistribution = {};
    contractData?.forEach(item => {
      const body = item.劳动合同主体;
      if (body) {
        contractBodyDistribution[body] = (contractBodyDistribution[body] || 0) + 1;
      }
    });
    
    console.log('📋 劳动合同主体分布:');
    Object.entries(contractBodyDistribution).forEach(([body, count]) => {
      console.log(`  - ${body}: ${count} 条记录`);
    });

    // 4. 查询更多数据来确认问题
    console.log('\n=== 4. 查询更多合同数据 ===');
    const { data: moreContractData, error: moreError } = await supabase
      .from('employee_contracts')
      .select('*')
      .not('劳动合同主体所在城市', 'is', null)
      .limit(10);

    if (moreError) {
      console.error('❌ 查询更多合同数据失败:', moreError);
    } else {
      console.log(`📊 有城市信息的合同记录: ${moreContractData?.length || 0} 条`);
      if (moreContractData && moreContractData.length > 0) {
        console.log('📄 有城市信息的记录样本:');
        moreContractData.slice(0, 3).forEach((item, index) => {
          console.log(`\n第${index + 1}条记录:`);
          console.log(`  - 员工工号: ${item.员工工号}`);
          console.log(`  - 姓名: ${item.姓}${item.名}`);
          console.log(`  - 劳动合同主体: ${item.劳动合同主体}`);
          console.log(`  - 劳动合同主体所在城市: ${item.劳动合同主体所在城市}`);
        });
      }
    }

    // 5. 检查特定员工的合同记录
    console.log('\n=== 5. 检查特定员工的合同记录 ===');
    const { data: empContractData, error: empError } = await supabase
      .from('employee_contracts')
      .select('*')
      .eq('员工工号', 80000008);

    if (empError) {
      console.error('❌ 查询员工合同数据失败:', empError);
    } else {
      console.log(`📊 员工80000008的合同记录: ${empContractData?.length || 0} 条`);
      empContractData?.forEach((item, index) => {
        console.log(`\n第${index + 1}条合同记录:`);
        console.log(`  - 合同期间: ${item.开始日期} 至 ${item.结束日期}`);
        console.log(`  - 劳动合同主体: ${item.劳动合同主体}`);
        console.log(`  - 劳动合同主体所在城市: ${item.劳动合同主体所在城市}`);
        console.log(`  - 合同状态: ${item.劳动合同状态}`);
      });
    }

    console.log('\n✅ 合同数据调试完成!');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

debugContractData();