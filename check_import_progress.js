const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImportProgress() {
  console.log('🔍 检查工资核算结果信息导入进度...');
  
  try {
    // 检查当前记录数
    const { count, error: countError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 查询记录数失败:', countError);
      return;
    }
    
    console.log(`📊 当前表中记录数: ${count}`);
    
    // 获取一些示例数据
    const { data: sampleData, error: sampleError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ 查询示例数据失败:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('\n📋 示例数据:');
      sampleData.forEach((record, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  员工工号: ${record.employee_id}`);
        console.log(`  姓名: ${record.last_name}${record.first_name}`);
        console.log(`  工资项: ${record.salary_item_name}`);
        console.log(`  金额: ${record.amount}`);
        console.log(`  日期: ${record.start_date} - ${record.end_date}`);
        console.log(`  币种: ${record.currency}`);
        console.log('');
      });
      
      // 统计数据
      const employeeIds = [...new Set(sampleData.map(r => r.employee_id))];
      const salaryItems = [...new Set(sampleData.map(r => r.salary_item_name))];
      
      console.log(`📈 统计信息 (基于前5条记录):`);
      console.log(`  员工数量: ${employeeIds.length}`);
      console.log(`  工资项目: ${salaryItems.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

checkImportProgress();
