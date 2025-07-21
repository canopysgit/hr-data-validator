const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBeijingStandards() {
  console.log('🏛️ 检查北京社保标准配置...\n');
  
  try {
    // 查询北京的社保标准
    const { data: standardData, error } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .eq('城市', '北京')
      .order('社保年度, 险种类型');
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`📊 找到 ${standardData?.length || 0} 条北京社保标准配置`);
    
    if (standardData && standardData.length > 0) {
      // 按年度分组
      const standardsByYear = {};
      standardData.forEach(record => {
        const year = record.社保年度;
        if (!standardsByYear[year]) {
          standardsByYear[year] = [];
        }
        standardsByYear[year].push(record);
      });
      
      console.log('\n📋 北京社保标准配置:');
      Object.keys(standardsByYear).sort().forEach(year => {
        console.log(`\n${year}年度:`);
        standardsByYear[year].forEach(record => {
          console.log(`  ${record.险种类型}:`);
          console.log(`    最低缴费基数: ¥${record.最低缴费基数?.toLocaleString()}`);
          console.log(`    最高缴费基数: ¥${record.最高缴费基数?.toLocaleString()}`);
          console.log(`    个人缴费比例: ${record.个人缴费比例}%`);
          console.log(`    公司缴费比例: ${record.公司缴费比例}%`);
        });
      });
      
      // 重点分析2024年度标准
      const standards2024 = standardsByYear['2024'] || [];
      if (standards2024.length > 0) {
        console.log('\n🎯 2024年度标准详细分析:');
        
        standards2024.forEach(record => {
          const minBase = record.最低缴费基数;
          const maxBase = record.最高缴费基数;
          const huangBase = 551718; // 黄笑霞的异常基数
          const correctBase = 45976; // 黄笑霞的正确月均收入
          
          console.log(`\n${record.险种类型}:`);
          console.log(`  标准范围: ¥${minBase?.toLocaleString()} ~ ¥${maxBase?.toLocaleString()}`);
          console.log(`  黄笑霞月均收入: ¥${correctBase.toLocaleString()}`);
          console.log(`  黄笑霞异常基数: ¥${huangBase.toLocaleString()}`);
          
          // 判断正确基数应该是多少
          let shouldBe = correctBase;
          let rule = '';
          
          if (correctBase > maxBase) {
            shouldBe = maxBase;
            rule = `超过最高限额，应按最高基数 ¥${maxBase.toLocaleString()}`;
          } else if (correctBase < minBase) {
            shouldBe = minBase;
            rule = `低于最低限额，应按最低基数 ¥${minBase.toLocaleString()}`;
          } else {
            rule = `在标准范围内，应按月均收入 ¥${correctBase.toLocaleString()}`;
          }
          
          console.log(`  ✅ 正确基数: ¥${shouldBe.toLocaleString()} (${rule})`);
          console.log(`  ❌ 实际基数: ¥${huangBase.toLocaleString()} (超出最高限额 ${Math.round(huangBase / maxBase)}倍)`);
          console.log(`  💰 多缴金额: ¥${((huangBase - shouldBe) * (record.个人缴费比例 || 0) / 100).toLocaleString()} (个人部分)`);
        });
      }
      
      // 总结问题
      console.log('\n🎯 问题总结:');
      console.log('✅ 黄笑霞2023年工资数据完整: 12个月，年度总收入¥551,717.91');
      console.log('✅ 正确的月均收入: ¥45,976');
      console.log('❌ 系统错误: 将年度总收入¥551,718当作月均收入');
      console.log('❌ 导致2024年度社保缴交基数严重超标');
      console.log('❌ 所有险种都按¥551,718缴交，远超北京市最高限额');
      
      console.log('\n🔧 修复建议:');
      console.log('1. 检查检查点5的计算逻辑，确保使用月均收入而不是年度总收入');
      console.log('2. 重新计算黄笑霞的2024年度社保缴交基数');
      console.log('3. 应用社保基数上下限规则');
      console.log('4. 更新社保数据表中的缴交基数');
      
    } else {
      console.log('❌ 未找到北京的社保标准配置');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkBeijingStandards();
