// 分析年度匹配问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeYearMatchingProblem() {
  console.log('🔍 分析年度匹配问题...\n');
  
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
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  社保年度: ${record.社保年度}`);
        console.log(`  开始时间: ${record.开始时间}`);
        console.log(`  结束时间: ${record.结束时间}`);
        console.log(`  缴交基数: ${record.缴交基数}`);
        console.log(`  缴交地: ${record.缴交地}`);
      });
    }
    
    // 2. 查询张持荣的工资数据
    console.log('\n📊 查询张持荣的工资数据...');
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', '80000003')
      .eq('salary_item_name', '税前应发合计')
      .order('start_date');
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    console.log(`✅ 找到 ${salaryData?.length || 0} 条张持荣的工资记录`);
    
    if (salaryData && salaryData.length > 0) {
      console.log('\n📋 张持荣工资数据详情:');
      
      // 按年度分组工资数据
      const salaryByYear = {};
      salaryData.forEach(record => {
        const year = new Date(record.start_date).getFullYear().toString();
        if (!salaryByYear[year]) {
          salaryByYear[year] = [];
        }
        salaryByYear[year].push({
          date: record.start_date,
          amount: record.amount
        });
      });
      
      Object.keys(salaryByYear).sort().forEach(year => {
        const records = salaryByYear[year];
        const total = records.reduce((sum, record) => sum + record.amount, 0);
        const average = Math.round(total / records.length);
        
        console.log(`\n${year}年工资数据:`);
        console.log(`  月份数: ${records.length}`);
        console.log(`  总金额: ${total.toLocaleString()}`);
        console.log(`  月均工资: ${average.toLocaleString()}`);
        
        records.forEach(record => {
          console.log(`    ${record.date}: ${record.amount.toLocaleString()}`);
        });
      });
    }
    
    // 3. 分析当前错误的匹配逻辑
    console.log('\n❌ 当前错误的匹配逻辑分析:');
    console.log('  2024年度社保基数 (2024年7月-2025年6月) vs 2024年工资数据');
    console.log('  问题: 2024年工资数据可能不完整，且不应该用于计算2024年度社保基数');
    
    // 4. 正确的匹配逻辑
    console.log('\n✅ 正确的匹配逻辑应该是:');
    console.log('  2024年度社保基数 (2024年7月-2025年6月) vs 2023年工资数据');
    console.log('  2023年度社保基数 (2023年7月-2024年6月) vs 2022年工资数据');
    
    // 5. 具体验证张持荣的情况
    console.log('\n🎯 验证张持荣的具体情况:');
    
    // 找到2024年度的养老保险记录
    const yangLao2024 = socialData?.find(record => 
      record.社保年度 === '2024' && record.险种类型 === '养老'
    );
    
    if (yangLao2024) {
      console.log('\n📋 张持荣2024年度养老保险:');
      console.log(`  社保年度: ${yangLao2024.社保年度}`);
      console.log(`  开始时间: ${yangLao2024.开始时间}`);
      console.log(`  结束时间: ${yangLao2024.结束时间}`);
      console.log(`  缴交基数: ${yangLao2024.缴交基数}`);
      
      // 计算2023年的月平均工资
      const salary2023 = salaryData?.filter(record => 
        new Date(record.start_date).getFullYear() === 2023
      ) || [];
      
      if (salary2023.length > 0) {
        const total2023 = salary2023.reduce((sum, record) => sum + record.amount, 0);
        const average2023 = Math.round(total2023 / salary2023.length);
        
        console.log('\n📊 2023年工资数据 (应该用于计算2024年度社保基数):');
        console.log(`  月份数: ${salary2023.length}`);
        console.log(`  总金额: ${total2023.toLocaleString()}`);
        console.log(`  月均工资: ${average2023.toLocaleString()}`);
        
        console.log('\n🔍 比较分析:');
        console.log(`  2024年度社保缴费基数: ${yangLao2024.缴交基数}`);
        console.log(`  2023年月均工资: ${average2023}`);
        console.log(`  差异: ${yangLao2024.缴交基数 - average2023}`);
        
        // 查询北京养老保险2024年度标准
        const { data: standard, error: standardError } = await supabase
          .from('city_social_insurance_standards')
          .select('*')
          .ilike('城市', '%北京%')
          .ilike('险种类型', '%养老%')
          .eq('社保年度', '2024');
        
        if (standard && standard.length > 0) {
          const config = standard[0];
          const minBase = parseInt(config.最低缴费基数.replace(/[^\d]/g, '')) || 0;
          const maxBase = parseInt(config.最高缴费基数.replace(/[^\d]/g, '')) || 0;
          
          console.log('\n📋 北京市2024年度养老保险标准:');
          console.log(`  最低缴费基数: ${minBase.toLocaleString()}`);
          console.log(`  最高缴费基数: ${maxBase.toLocaleString()}`);
          
          // 计算应该的缴费基数
          let expectedBase = average2023;
          let rule = '';
          
          if (average2023 > maxBase) {
            expectedBase = maxBase;
            rule = `月均工资${average2023.toLocaleString()}超过最高标准，应按最高基数${maxBase.toLocaleString()}`;
          } else if (average2023 < minBase) {
            expectedBase = minBase;
            rule = `月均工资${average2023.toLocaleString()}低于最低标准，应按最低基数${minBase.toLocaleString()}`;
          } else {
            rule = `月均工资${average2023.toLocaleString()}在标准范围内，应按实际工资`;
          }
          
          console.log('\n🎯 正确的计算结果:');
          console.log(`  基于2023年月均工资的应缴基数: ${expectedBase.toLocaleString()}`);
          console.log(`  规则说明: ${rule}`);
          console.log(`  实际缴费基数: ${yangLao2024.缴交基数}`);
          console.log(`  是否正确: ${yangLao2024.缴交基数 == expectedBase ? '✅ 正确' : '❌ 错误'}`);
          
          if (yangLao2024.缴交基数 != expectedBase) {
            console.log(`  ❌ 问题: 实际缴费基数${yangLao2024.缴交基数}与应缴基数${expectedBase}不符`);
            console.log(`  差异金额: ${Math.abs(yangLao2024.缴交基数 - expectedBase).toLocaleString()}`);
          }
        }
      } else {
        console.log('\n❌ 未找到2023年工资数据');
      }
    } else {
      console.log('\n❌ 未找到张持荣2024年度养老保险记录');
    }
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  }
}

analyzeYearMatchingProblem();
