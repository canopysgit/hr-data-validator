// 检查城市标准配置表的字段结构
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCityStandardsFields() {
  console.log('🔍 检查城市标准配置表字段结构...');
  console.log();

  try {
    // 查询城市标准配置表的数据
    const { data: cityStandardData, error: cityStandardError } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .limit(5);

    if (cityStandardError) {
      console.error('❌ 查询城市标准配置表失败:', cityStandardError);
      return;
    }

    console.log('📊 城市标准配置表数据总数:', cityStandardData?.length || 0);
    
    if (cityStandardData && cityStandardData.length > 0) {
      console.log('\n🔍 字段名列表:');
      const fieldNames = Object.keys(cityStandardData[0]);
      fieldNames.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
      
      console.log('\n📋 前3条数据示例:');
      cityStandardData.slice(0, 3).forEach((record, index) => {
        console.log(`\n--- 记录 ${index + 1} ---`);
        Object.entries(record).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
      
      // 检查是否有险种类型或类型字段
      console.log('\n🔍 险种相关字段检查:');
      if (fieldNames.includes('险种类型')) {
        console.log('  ✅ 找到字段: 险种类型');
        const types = cityStandardData.map(record => record['险种类型']).filter(Boolean);
        console.log('  险种类型值:', [...new Set(types)]);
      }
      if (fieldNames.includes('类型')) {
        console.log('  ✅ 找到字段: 类型');
        const types = cityStandardData.map(record => record['类型']).filter(Boolean);
        console.log('  类型值:', [...new Set(types)]);
      }
      if (!fieldNames.includes('险种类型') && !fieldNames.includes('类型')) {
        console.log('  ❌ 未找到险种类型或类型字段');
      }
    } else {
      console.log('❌ 城市标准配置表无数据');
    }

  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

checkCityStandardsFields();