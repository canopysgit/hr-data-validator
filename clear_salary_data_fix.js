const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearSalaryData() {
  console.log('🗑️  清空工资核算结果表数据...');
  
  try {
    // 先查询当前数据量
    const { count, error: countError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 查询数据量失败:', countError);
      return;
    }
    
    console.log(`📊 当前工资表记录数: ${count}`);
    
    if (count === 0) {
      console.log('✅ 工资表已经是空的，无需清空');
      return;
    }
    
    // 清空数据
    const { error } = await supabase
      .from('salary_calculation_results')
      .delete()
      .neq('id', 0); // 删除所有记录
    
    if (error) {
      console.error('❌ 清空数据失败:', error);
      return;
    }
    
    console.log('✅ 工资核算结果表数据已清空');
    
    // 验证清空结果
    const { count: newCount, error: verifyError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (verifyError) {
      console.error('❌ 验证清空结果失败:', verifyError);
      return;
    }
    
    console.log(`📊 清空后记录数: ${newCount}`);
    
    if (newCount === 0) {
      console.log('✅ 数据清空成功，现在可以重新导入工资数据了');
      console.log('');
      console.log('📝 下一步操作:');
      console.log('1. 打开应用: http://localhost:3002');
      console.log('2. 进入"数据上传"标签页');
      console.log('3. 重新上传Excel文件');
      console.log('4. 选择"工资核算结果信息"工作表');
      console.log('5. 点击"开始导入"');
      console.log('');
      console.log('⚠️  注意: 修复后的日期处理逻辑会保持原始文本格式，避免时区转换问题');
    } else {
      console.log('❌ 数据清空不完整，请检查');
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

// 运行清空操作
clearSalaryData();
