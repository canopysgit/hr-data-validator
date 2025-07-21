const { createClient } = require('@supabase/supabase-js');

// Supabase 配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearSalaryData() {
  try {
    console.log('🔍 开始清空员工工资计算表数据...');
    
    // 首先查询当前数据量
    const { count: currentCount, error: countError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 查询数据量失败:', countError);
      return;
    }
    
    console.log(`📊 当前表中有 ${currentCount} 条记录`);
    
    if (currentCount === 0) {
      console.log('✅ 表中没有数据，无需清空');
      return;
    }
    
    // 确认操作
    console.log('⚠️  即将删除所有工资计算数据，请确认...');
    
    // 执行删除操作
    const { error: deleteError } = await supabase
      .from('salary_calculation_results')
      .delete()
      .neq('id', 0); // 删除所有记录（id不等于0，实际上删除所有）
    
    if (deleteError) {
      console.error('❌ 删除数据失败:', deleteError);
      return;
    }
    
    // 验证删除结果
    const { count: afterCount, error: afterCountError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (afterCountError) {
      console.error('❌ 验证删除结果失败:', afterCountError);
      return;
    }
    
    console.log(`✅ 删除完成！删除了 ${currentCount} 条记录，当前表中剩余 ${afterCount} 条记录`);
    
    if (afterCount === 0) {
      console.log('🎉 员工工资计算表已完全清空，可以重新导入数据了！');
    } else {
      console.log('⚠️  表中仍有数据，可能删除不完整');
    }
    
  } catch (error) {
    console.error('❌ 操作过程中发生错误:', error);
  }
}

// 执行清空操作
clearSalaryData();