const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 表名映射
const TABLES = [
  'organizations',
  'org_position_employee', 
  'employee_basic_info',
  'employee_social_insurance',
  'employee_documents',
  'employee_dates',
  'city_social_insurance_standards',
  'salary_calculation_results'
];

async function testImportClearLogic() {
  console.log('🔍 测试导入前清空逻辑...');
  
  try {
    // 检查各表的当前数据量
    console.log('\n📊 检查各表当前数据量:');
    const tableCounts = {};
    
    for (const tableName of TABLES) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ 查询表 ${tableName} 失败:`, error.message);
          tableCounts[tableName] = 'ERROR';
        } else {
          tableCounts[tableName] = count || 0;
          console.log(`  ${tableName}: ${count || 0} 条记录`);
        }
      } catch (err) {
        console.error(`❌ 查询表 ${tableName} 异常:`, err.message);
        tableCounts[tableName] = 'EXCEPTION';
      }
    }
    
    // 统计总记录数
    const totalRecords = Object.values(tableCounts)
      .filter(count => typeof count === 'number')
      .reduce((sum, count) => sum + count, 0);
    
    console.log(`\n📈 总记录数: ${totalRecords}`);
    
    // 分析数据分布
    const nonEmptyTables = Object.entries(tableCounts)
      .filter(([table, count]) => typeof count === 'number' && count > 0)
      .sort(([,a], [,b]) => b - a);
    
    if (nonEmptyTables.length > 0) {
      console.log('\n📋 非空表排序 (按记录数):');
      nonEmptyTables.forEach(([table, count]) => {
        console.log(`  ${table}: ${count} 条`);
      });
    } else {
      console.log('\n✅ 所有表都是空的');
    }
    
    // 检查工资表的日期数据
    if (tableCounts['salary_calculation_results'] > 0) {
      console.log('\n🔍 检查工资表日期数据样本:');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('salary_calculation_results')
        .select('employee_id, start_date, end_date, salary_item_name')
        .limit(5);
      
      if (sampleError) {
        console.error('❌ 查询工资表样本失败:', sampleError.message);
      } else if (sampleData && sampleData.length > 0) {
        sampleData.forEach((record, index) => {
          console.log(`  样本 ${index + 1}: 员工${record.employee_id} ${record.start_date}~${record.end_date} (${record.salary_item_name})`);
        });
        
        // 检查是否还有异常日期
        const hasAbnormalDates = sampleData.some(record => 
          record.start_date === '2022-12-31' || record.end_date === '2023-01-30'
        );
        
        if (hasAbnormalDates) {
          console.log('⚠️  发现异常日期，建议重新导入工资数据');
        } else {
          console.log('✅ 工资表日期数据正常');
        }
      }
    }
    
    // 提供操作建议
    console.log('\n💡 操作建议:');
    
    if (totalRecords === 0) {
      console.log('  ✅ 所有表都是空的，可以直接导入新数据');
      console.log('  📝 下一步: 在应用中上传Excel文件并导入');
    } else {
      console.log('  📊 数据库中有现有数据');
      console.log('  🔄 新的导入逻辑会在导入前自动清空所有选中的表');
      console.log('  ⚠️  确保Excel文件包含完整的数据，因为现有数据会被完全替换');
      console.log('  📝 下一步: 在应用中重新导入Excel文件，系统会自动清空并重新导入');
    }
    
    console.log('\n🎯 修改后的导入流程:');
    console.log('  1. 📤 用户选择要导入的工作表');
    console.log('  2. 🗑️  系统并行清空所有选中表的数据');
    console.log('  3. 📥 系统按顺序导入新数据到各表');
    console.log('  4. ✅ 确保数据与Excel文件完全一致');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testImportClearLogic();
