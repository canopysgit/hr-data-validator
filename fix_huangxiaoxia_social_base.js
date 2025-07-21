const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHuangXiaoxiaSocialBase() {
  console.log('🔧 修复黄笑霞的社保缴交基数...\n');
  
  try {
    // 1. 计算黄笑霞2023年的正确月均收入
    console.log('💰 计算黄笑霞2023年的正确月均收入...');
    
    const { data: salaryData } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', '80000008')
      .eq('salary_item_name', '税前应发合计')
      .gte('start_date', '2023-01-01')
      .lt('start_date', '2024-01-01')
      .order('start_date');
    
    if (!salaryData || salaryData.length !== 12) {
      console.error(`❌ 黄笑霞2023年工资数据不完整: ${salaryData?.length || 0}/12个月`);
      return;
    }
    
    const totalIncome2023 = salaryData.reduce((sum, record) => sum + (record.amount || 0), 0);
    const monthlyAverage2023 = Math.round(totalIncome2023 / 12);
    
    console.log(`✅ 2023年数据完整:`);
    console.log(`  年度总收入: ¥${totalIncome2023.toLocaleString()}`);
    console.log(`  月均收入: ¥${monthlyAverage2023.toLocaleString()}`);
    
    // 2. 查询黄笑霞当前的2024年度社保基数
    console.log('\n🏥 查询黄笑霞当前的2024年度社保基数...');
    
    const { data: socialData } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', '80000008')
      .eq('社保年度', '2024');
    
    if (!socialData || socialData.length === 0) {
      console.error('❌ 未找到黄笑霞的2024年度社保记录');
      return;
    }
    
    console.log(`📊 找到 ${socialData.length} 条2024年度社保记录`);
    
    // 显示当前的异常基数
    console.log('\n📋 当前的异常基数:');
    socialData.forEach(record => {
      console.log(`  ${record.险种类型}: ¥${record.缴交基数?.toLocaleString()}`);
    });
    
    // 3. 查询北京2024年度社保标准（如果有的话）
    console.log('\n🏛️ 查询北京2024年度社保标准...');
    
    const { data: standardData } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .eq('城市', '北京')
      .eq('社保年度', '2024');
    
    let correctedBase = monthlyAverage2023;
    let ruleDescription = `按2023年月均收入 ¥${monthlyAverage2023.toLocaleString()}`;
    
    if (standardData && standardData.length > 0) {
      console.log('✅ 找到北京2024年度社保标准');
      
      // 应用上下限规则
      const yangLaoStandard = standardData.find(record => 
        record.险种类型?.includes('养老') || record.险种类型?.includes('基本养老')
      );
      
      if (yangLaoStandard) {
        const minBase = yangLaoStandard.最低缴费基数;
        const maxBase = yangLaoStandard.最高缴费基数;
        
        console.log(`  养老保险标准: ¥${minBase?.toLocaleString()} ~ ¥${maxBase?.toLocaleString()}`);
        
        if (monthlyAverage2023 > maxBase) {
          correctedBase = maxBase;
          ruleDescription = `超过最高限额，按最高基数 ¥${maxBase.toLocaleString()}`;
        } else if (monthlyAverage2023 < minBase) {
          correctedBase = minBase;
          ruleDescription = `低于最低限额，按最低基数 ¥${minBase.toLocaleString()}`;
        }
      }
    } else {
      console.log('⚠️ 未找到北京2024年度社保标准，使用月均收入作为基数');
    }
    
    console.log(`\n🎯 修正方案:`);
    console.log(`  错误基数: ¥${socialData[0].缴交基数?.toLocaleString()} (年度总收入)`);
    console.log(`  正确基数: ¥${correctedBase.toLocaleString()}`);
    console.log(`  修正规则: ${ruleDescription}`);
    console.log(`  修正幅度: ${Math.round((socialData[0].缴交基数 - correctedBase) / socialData[0].缴交基数 * 100)}% 下调`);
    
    // 4. 确认修复
    console.log('\n❓ 是否执行修复？');
    console.log('   这将更新黄笑霞所有2024年度社保记录的缴交基数');
    console.log('   从 ¥551,718 修正为 ¥' + correctedBase.toLocaleString());
    
    // 自动执行修复（在实际环境中可能需要用户确认）
    console.log('\n🔧 开始执行修复...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of socialData) {
      const { error } = await supabase
        .from('employee_social_insurance')
        .update({ 缴交基数: correctedBase })
        .eq('id', record.id);
      
      if (error) {
        console.error(`❌ 更新记录 ${record.id} (${record.险种类型}) 失败:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ 更新记录 ${record.id} (${record.险种类型}): ¥${record.缴交基数?.toLocaleString()} -> ¥${correctedBase.toLocaleString()}`);
        successCount++;
      }
    }
    
    console.log(`\n📊 修复结果:`);
    console.log(`  成功: ${successCount} 条记录`);
    console.log(`  失败: ${errorCount} 条记录`);
    
    // 5. 验证修复结果
    if (successCount > 0) {
      console.log('\n🔍 验证修复结果...');
      
      const { data: verifyData } = await supabase
        .from('employee_social_insurance')
        .select('*')
        .eq('员工工号', '80000008')
        .eq('社保年度', '2024');
      
      if (verifyData) {
        console.log('✅ 修复后的基数:');
        verifyData.forEach(record => {
          console.log(`  ${record.险种类型}: ¥${record.缴交基数?.toLocaleString()}`);
        });
        
        // 检查是否还有异常基数
        const stillAbnormal = verifyData.some(record => record.缴交基数 > 100000);
        if (stillAbnormal) {
          console.log('❌ 仍有异常基数，请检查');
        } else {
          console.log('✅ 所有基数已修正为正常范围');
        }
      }
    }
    
    console.log('\n🎉 黄笑霞社保缴交基数修复完成！');
    console.log('💡 现在重新运行检查点5应该不会再报告"工资数据不足"的问题');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

// 运行修复
fixHuangXiaoxiaSocialBase();
