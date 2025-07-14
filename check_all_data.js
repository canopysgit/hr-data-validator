const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://ztjjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ampxanFqcWpxanFqcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTU0NzQ5NCwiZXhwIjoyMDUxMTIzNDk0fQ.VYVKhJGJGJGJGJGJGJGJGJGJGJGJGJGJGJGJGJGJGJG';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllData() {
  try {
    console.log('检查数据库中的所有数据...');
    
    // 查询所有社保记录
    const { data: allRecords, error } = await supabase
      .from('social_insurance_records')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('查询错误:', error);
      return;
    }
    
    console.log(`\n数据库中总共有 ${allRecords?.length || 0} 条记录`);
    
    if (allRecords && allRecords.length > 0) {
      console.log('\n前10条记录:');
      allRecords.forEach((record, index) => {
        console.log(`${index + 1}. 工号: ${record.employee_id}, 姓名: ${record.name}, 险种: ${record.insurance_type}, 开始时间: ${record.start_time}, 结束时间: ${record.end_time}, 年度: ${record.year}`);
      });
      
      // 检查是否有杨治源的数据
      const yangRecords = allRecords.filter(record => record.employee_id === '80000001' || record.name === '杨治源');
      console.log(`\n杨治源相关记录: ${yangRecords.length} 条`);
      yangRecords.forEach(record => {
        console.log(`- 险种: ${record.insurance_type}, 开始时间: ${record.start_time}, 结束时间: ${record.end_time}, 年度: ${record.year}`);
      });
    } else {
      console.log('数据库中没有任何记录，可能需要重新导入数据');
    }
    
  } catch (error) {
    console.error('检查数据时出错:', error);
  }
}

checkAllData();