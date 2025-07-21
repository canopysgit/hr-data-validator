// 查看城市社保标准配置表字段结构
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFields() {
  try {
    const { data, error } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    if (data && data[0]) {
      console.log('字段列表:');
      Object.keys(data[0]).forEach((key, i) => {
        console.log(`${i+1}. ${key}`);
      });
      
      console.log('\n示例数据:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('执行失败:', err);
  }
}

checkFields();