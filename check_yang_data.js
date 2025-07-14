const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eyxzdprlbkvrbwwntaik.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0'
);

async function checkYangData() {
  console.log('查询杨治源(80000001)的所有社保记录...');
  
  const { data, error } = await supabase
    .from('employee_social_insurance')
    .select('*')
    .eq('员工工号', '80000001');
    
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log(`找到 ${data.length} 条记录:`);
  
  data.forEach((record, index) => {
    console.log(`\n记录 ${index + 1}:`);
    console.log(`  险种类型: ${record.险种类型}`);
    console.log(`  开始时间: ${record.开始时间}`);
    console.log(`  结束时间: ${record.结束时间}`);
    console.log(`  年度: ${record.年度}`);
    console.log(`  原始数据: ${JSON.stringify(record, null, 2)}`);
  });
  
  // 检查2023年度的养老保险
  const yangLao2023 = data.filter(record => 
    record.年度 === 2023 && 
    (record.险种类型 === '养老保险' || record.险种类型 === '养老' || record.险种类型 === '养老险')
  );
  
  console.log(`\n2023年度养老保险记录: ${yangLao2023.length} 条`);
  yangLao2023.forEach(record => {
    console.log(`  - ${record.险种类型}: ${record.开始时间} 到 ${record.结束时间}`);
  });
}

checkYangData().catch(console.error);