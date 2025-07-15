// 检查数据库表结构
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDbSchema() {
  console.log('🔍 检查数据库表结构...');
  console.log();

  try {
    // 1. 查询表中的现有数据以了解字段结构
    console.log('📊 查询现有数据结构...');
    const { data, error } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ 表结构字段:');
      const fields = Object.keys(data[0]);
      fields.forEach((field, index) => {
        console.log(`  ${index + 1}. "${field}"`);
      });
      
      console.log('\n📋 示例数据:');
      const record = data[0];
      Object.entries(record).forEach(([key, value]) => {
        const displayValue = value === null ? 'null' : (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value);
        console.log(`  ${key}: ${displayValue}`);
      });
    } else {
      console.log('❌ 表中没有数据');
    }
    
    // 2. 测试插入一条简单记录
    console.log('\n🔄 测试插入简单记录...');
    const testRecord = {
      '城市': '测试城市',
      '社保年度': '2024',
      '险种类型': '测试险种',
      '最低缴费基数': 1000,
      '最高缴费基数': 5000,
      '个人缴费比例': 0.08,
      '公司缴费比例': 0.16,
      '生效日期': '2024-01-01',
      '失效日期': '2024-12-31',
      '缴费基数生效依据': '测试依据',
      '缴费比例生效依据': '测试依据',
      '备注': '测试备注'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('city_social_insurance_standards')
      .insert([testRecord])
      .select();
    
    if (insertError) {
      console.error('❌ 插入失败:', insertError.message);
      console.log('测试记录:', testRecord);
    } else {
      console.log('✅ 插入成功');
      console.log('插入的记录:', insertData[0]);
      
      // 验证目标字段
      const targetFields = ['社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
      console.log('\n🔍 验证目标字段:');
      targetFields.forEach(field => {
        const value = insertData[0][field];
        const hasValue = value !== null && value !== undefined && value !== '';
        console.log(`  ${field}: ${hasValue ? '✅ 有值' : '❌ 无值'} (${value})`);
      });
      
      // 清理测试记录
      const recordId = insertData[0].id || insertData[0].ID;
      if (recordId) {
        await supabase
          .from('city_social_insurance_standards')
          .delete()
          .eq('id', recordId);
        console.log('\n🗑️ 已清理测试记录');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
  }
}

checkDbSchema();