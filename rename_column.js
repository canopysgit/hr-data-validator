// 重命名员工社保表的字段名：从'类型'改为'险种类型'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function renameColumn() {
  console.log('🔄 开始重命名员工社保表字段：类型 -> 险种类型');
  console.log();

  try {
    // 首先检查当前表结构
    console.log('📋 检查当前表结构...');
    const { data: currentData, error: currentError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .limit(1);

    if (currentError) {
      console.error('❌ 查询当前表结构失败:', currentError);
      return;
    }

    if (currentData && currentData.length > 0) {
      const currentFields = Object.keys(currentData[0]);
      console.log('当前字段列表:', currentFields);
      
      if (currentFields.includes('类型')) {
        console.log('✅ 找到字段: 类型');
      } else {
        console.log('❌ 未找到字段: 类型');
      }
      
      if (currentFields.includes('险种类型')) {
        console.log('⚠️  字段已存在: 险种类型');
        return;
      }
    }

    // 使用SQL命令重命名字段
    console.log('\n🔄 执行字段重命名...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE employee_social_insurance RENAME COLUMN "类型" TO "险种类型";'
    });

    if (error) {
      console.error('❌ 重命名字段失败:', error);
      
      // 如果RPC方法不存在，尝试直接使用SQL
      console.log('\n🔄 尝试使用原生SQL...');
      const { data: sqlData, error: sqlError } = await supabase
        .from('employee_social_insurance')
        .select('*')
        .limit(0); // 只获取结构，不获取数据
        
      console.log('⚠️  注意：Supabase客户端无法直接执行DDL语句');
      console.log('请在Supabase控制台的SQL编辑器中手动执行以下SQL:');
      console.log('ALTER TABLE employee_social_insurance RENAME COLUMN "类型" TO "险种类型";');
    } else {
      console.log('✅ 字段重命名成功!');
      
      // 验证重命名结果
      const { data: verifyData, error: verifyError } = await supabase
        .from('employee_social_insurance')
        .select('*')
        .limit(1);
        
      if (verifyData && verifyData.length > 0) {
        const newFields = Object.keys(verifyData[0]);
        console.log('\n📋 重命名后的字段列表:', newFields);
        
        if (newFields.includes('险种类型')) {
          console.log('✅ 确认字段重命名成功: 险种类型');
        }
      }
    }

  } catch (error) {
    console.error('❌ 重命名过程中出错:', error);
  }
}

renameColumn();