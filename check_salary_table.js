const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalaryTable() {
  console.log('🔍 检查工资核算结果表...');
  
  try {
    // 1. 检查表是否存在并获取结构
    const { data: tableData, error: tableError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ 查询salary_calculation_results表失败:', tableError);
      
      // 尝试其他可能的表名
      console.log('\n🔍 尝试查找其他可能的工资相关表...');
      const possibleTableNames = [
        'employee_salary_results',
        'salary_results',
        'payroll_results',
        'employee_payroll'
      ];
      
      for (const tableName of possibleTableNames) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error && data) {
            console.log(`✅ 找到表: ${tableName}`);
            console.log('字段结构:', Object.keys(data[0] || {}));
          }
        } catch (e) {
          // 忽略错误，继续尝试下一个表名
        }
      }
      return;
    }
    
    console.log('✅ salary_calculation_results表存在');
    
    if (tableData && tableData.length > 0) {
      console.log('\n📋 数据库表字段结构:');
      const dbFields = Object.keys(tableData[0]);
      dbFields.forEach((field, index) => {
        console.log(`${index + 1}. ${field}`);
      });
      
      console.log('\n📄 示例数据:');
      console.log(JSON.stringify(tableData[0], null, 2));
    } else {
      console.log('📊 表为空，获取表结构...');
      
      // 尝试插入一条测试数据来了解表结构
      const testRecord = {
        员工工号: 'TEST001',
        姓: '测试',
        名: '用户'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('salary_calculation_results')
        .insert([testRecord])
        .select();
      
      if (insertError) {
        console.log('❌ 插入测试数据失败:', insertError.message);
        console.log('这可能表明表结构与预期不符');
      } else {
        console.log('✅ 成功插入测试数据');
        console.log('表字段结构:', Object.keys(insertData[0]));
        
        // 清理测试数据
        await supabase
          .from('salary_calculation_results')
          .delete()
          .eq('员工工号', 'TEST001');
        console.log('🗑️ 已清理测试数据');
      }
    }
    
    // 2. 检查当前记录数
    const { count, error: countError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 查询记录数失败:', countError);
    } else {
      console.log(`\n📊 当前表中记录数: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

checkSalaryTable();
