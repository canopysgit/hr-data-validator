const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDataMismatch() {
  console.log('🔍 调试数据不匹配问题...\n');
  
  try {
    // 1. 直接查询黄笑霞的工资数据
    console.log('💰 直接查询黄笑霞的工资数据...');
    
    // 方法1：按employee_id查询
    const { data: salaryByEmpId } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', '80000008')
      .eq('salary_item_name', '税前应发合计')
      .order('start_date');
    
    console.log(`按employee_id查询: ${salaryByEmpId?.length || 0} 条记录`);
    
    // 方法2：按姓名查询
    const { data: salaryByName } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('last_name', '黄')
      .eq('first_name', '笑霞')
      .eq('salary_item_name', '税前应发合计')
      .order('start_date');
    
    console.log(`按姓名查询: ${salaryByName?.length || 0} 条记录`);
    
    // 2. 对比两种查询结果
    if (salaryByEmpId && salaryByName) {
      console.log('\n📊 对比两种查询结果:');
      
      if (salaryByEmpId.length !== salaryByName.length) {
        console.log(`❌ 数量不一致: employee_id查询${salaryByEmpId.length}条, 姓名查询${salaryByName.length}条`);
        
        // 检查employee_id字段的问题
        if (salaryByName.length > 0) {
          const empIds = new Set(salaryByName.map(record => record.employee_id));
          console.log(`姓名查询结果中的employee_id值: ${Array.from(empIds).join(', ')}`);
          
          if (!empIds.has('80000008')) {
            console.log(`❌ 关键问题：工资表中黄笑霞的employee_id不是80000008！`);
          }
        }
      } else {
        console.log(`✅ 数量一致: 都是${salaryByEmpId.length}条记录`);
      }
      
      // 显示详细记录
      if (salaryByName.length > 0) {
        console.log('\n📋 黄笑霞的税前应发合计记录 (按姓名查询):');
        salaryByName.forEach((record, index) => {
          console.log(`${index + 1}. ${record.start_date} ~ ${record.end_date}: ¥${record.amount} (employee_id: ${record.employee_id})`);
        });
        
        // 按年度分组
        const byYear = {};
        salaryByName.forEach(record => {
          const year = new Date(record.start_date).getFullYear();
          if (!byYear[year]) {
            byYear[year] = [];
          }
          byYear[year].push(record);
        });
        
        console.log('\n📊 按年度分组:');
        Object.keys(byYear).forEach(year => {
          console.log(`  ${year}年: ${byYear[year].length} 条记录`);
        });
      }
    }
    
    // 3. 查询所有黄笑霞的工资记录（不限工资项）
    console.log('\n💼 查询黄笑霞的所有工资记录...');
    
    const { data: allSalary } = await supabase
      .from('salary_calculation_results')
      .select('employee_id, last_name, first_name, start_date, salary_item_name, amount')
      .eq('last_name', '黄')
      .eq('first_name', '笑霞')
      .order('start_date, salary_item_name');
    
    console.log(`总工资记录: ${allSalary?.length || 0} 条`);
    
    if (allSalary && allSalary.length > 0) {
      // 检查employee_id的一致性
      const empIds = new Set(allSalary.map(record => record.employee_id));
      console.log(`employee_id值: ${Array.from(empIds).join(', ')}`);
      
      // 按年度和工资项分组
      const byYearItem = {};
      allSalary.forEach(record => {
        const year = new Date(record.start_date).getFullYear();
        const item = record.salary_item_name;
        
        if (!byYearItem[year]) {
          byYearItem[year] = {};
        }
        if (!byYearItem[year][item]) {
          byYearItem[year][item] = [];
        }
        byYearItem[year][item].push(record);
      });
      
      console.log('\n📊 按年度和工资项分组:');
      Object.keys(byYearItem).sort().forEach(year => {
        console.log(`\n${year}年:`);
        Object.keys(byYearItem[year]).forEach(item => {
          const count = byYearItem[year][item].length;
          console.log(`  ${item}: ${count} 条`);
          
          if (item === '税前应发合计') {
            console.log(`    详细记录:`);
            byYearItem[year][item].forEach((record, index) => {
              console.log(`      ${index + 1}. ${record.start_date}: ¥${record.amount} (ID: ${record.employee_id})`);
            });
          }
        });
      });
    }
    
    // 4. 检查检查点5使用的查询逻辑
    console.log('\n🔍 检查检查点5的查询逻辑...');
    
    // 模拟检查点5的查询
    const { data: checkpoint5Data } = await supabase
      .from('salary_calculation_results')
      .select('*');
    
    console.log(`检查点5查询到的总记录数: ${checkpoint5Data?.length || 0}`);
    
    // 按检查点5的逻辑处理数据
    const salaryByEmployee = {};
    
    checkpoint5Data?.forEach((record) => {
      const empId = record.employee_id;
      const startDate = record.start_date;
      
      if (!startDate) return;
      
      // 根据start_date计算年度
      const year = new Date(startDate).getFullYear().toString();
      
      if (!salaryByEmployee[empId]) {
        salaryByEmployee[empId] = {};
      }
      if (!salaryByEmployee[empId][year]) {
        salaryByEmployee[empId][year] = [];
      }
      salaryByEmployee[empId][year].push(record);
    });
    
    // 检查黄笑霞在这个数据结构中的情况
    console.log('\n🎯 黄笑霞在检查点5数据结构中的情况:');

    // 尝试不同的employee_id
    const possibleIds = ['80000008']; // 已知的黄笑霞employee_id
    
    possibleIds.forEach(empId => {
      if (salaryByEmployee[empId]) {
        console.log(`\nemployee_id ${empId}:`);
        Object.keys(salaryByEmployee[empId]).forEach(year => {
          const records = salaryByEmployee[empId][year];
          const taxableRecords = records.filter(record => record.salary_item_name === '税前应发合计');
          console.log(`  ${year}年: ${records.length} 条总记录, ${taxableRecords.length} 条税前应发合计`);
          
          if (taxableRecords.length > 0 && taxableRecords.length < 15) {
            console.log(`    税前应发合计详情:`);
            taxableRecords.forEach((record, index) => {
              console.log(`      ${index + 1}. ${record.start_date}: ¥${record.amount}`);
            });
          }
        });
      } else {
        console.log(`employee_id ${empId}: 不在数据结构中`);
      }
    });
    
    // 5. 总结问题
    console.log('\n🎯 问题总结:');
    
    if (salaryByName && salaryByName.length === 12) {
      console.log('✅ 按姓名查询：黄笑霞有完整的12个月税前应发合计数据');
    } else {
      console.log(`❌ 按姓名查询：黄笑霞只有${salaryByName?.length || 0}个月税前应发合计数据`);
    }
    
    // 检查employee_id一致性（从前面的查询结果）
    console.log('✅ employee_id一致: 80000008');
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugDataMismatch();
