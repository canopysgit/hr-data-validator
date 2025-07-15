const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSalaryTableSchema() {
  console.log('🔍 检查数据库中所有表的结构...');
  
  try {
    // 1. 获取所有表名
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('❌ 无法获取表列表，尝试直接查询已知表...');
      
      // 尝试查询已知的表
      const knownTables = [
        'organizations',
        'employee_basic_info', 
        'employee_social_insurance',
        'employee_contracts',
        'city_social_insurance_standards',
        'salary_calculation_results',
        'employee_salary_results',
        'payroll_results'
      ];
      
      for (const tableName of knownTables) {
        try {
          console.log(`\n🔍 检查表: ${tableName}`);
          
          // 尝试获取表结构信息
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0); // 只获取结构，不获取数据
          
          if (error) {
            if (error.message.includes('does not exist')) {
              console.log(`❌ 表 ${tableName} 不存在`);
            } else {
              console.log(`❌ 查询表 ${tableName} 失败:`, error.message);
            }
          } else {
            console.log(`✅ 表 ${tableName} 存在`);
            
            // 尝试插入一个空记录来获取字段信息
            try {
              const { data: insertData, error: insertError } = await supabase
                .from(tableName)
                .insert([{}])
                .select();
              
              if (insertError) {
                console.log(`字段信息 (从错误消息推断): ${insertError.message}`);
              }
            } catch (e) {
              // 忽略插入错误
            }
          }
        } catch (e) {
          console.log(`❌ 检查表 ${tableName} 时出错:`, e.message);
        }
      }
    }
    
    // 2. 特别检查工资相关的表
    console.log('\n🎯 重点检查工资相关表...');
    
    // 尝试不同的字段组合来测试表结构
    const testFields = [
      { 员工工号: 'TEST001' },
      { employee_id: 'TEST001' },
      { emp_id: 'TEST001' },
      { id: 1, employee_id: 'TEST001' }
    ];
    
    for (const testField of testFields) {
      try {
        console.log(`\n测试字段组合:`, Object.keys(testField));
        
        const { data, error } = await supabase
          .from('salary_calculation_results')
          .insert([testField])
          .select();
        
        if (!error && data) {
          console.log('✅ 成功插入，表字段结构:', Object.keys(data[0]));
          
          // 清理测试数据
          const idField = data[0].id || data[0].ID;
          if (idField) {
            await supabase
              .from('salary_calculation_results')
              .delete()
              .eq('id', idField);
          }
          break;
        } else {
          console.log('❌ 插入失败:', error?.message);
        }
      } catch (e) {
        console.log('❌ 测试失败:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

inspectSalaryTableSchema();
