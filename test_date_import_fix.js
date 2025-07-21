const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateImport() {
  console.log('🔍 测试日期导入修复...');
  
  try {
    // 查询工资核算结果表中的日期数据
    const { data: salaryData, error } = await supabase
      .from('salary_calculation_results')
      .select('employee_id, start_date, end_date, salary_item_name, amount')
      .limit(10);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log('📊 工资核算结果表日期数据样本:');
    console.log('总记录数:', salaryData.length);
    
    // 分析日期格式
    const dateAnalysis = {
      正常日期: 0,
      异常日期: 0,
      空日期: 0,
      日期范围: new Set()
    };
    
    salaryData.forEach((record, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log(`  员工工号: ${record.employee_id}`);
      console.log(`  开始时间: ${record.start_date}`);
      console.log(`  结束时间: ${record.end_date}`);
      console.log(`  工资项: ${record.salary_item_name}`);
      console.log(`  金额: ${record.amount}`);
      
      // 分析开始时间
      if (record.start_date) {
        if (record.start_date === '2022-12-31') {
          dateAnalysis.异常日期++;
          console.log('  ⚠️  开始时间异常: 2022-12-31');
        } else {
          dateAnalysis.正常日期++;
          dateAnalysis.日期范围.add(record.start_date.substring(0, 7)); // 年-月
        }
      } else {
        dateAnalysis.空日期++;
      }
      
      // 分析结束时间
      if (record.end_date) {
        if (record.end_date === '2023-01-30') {
          dateAnalysis.异常日期++;
          console.log('  ⚠️  结束时间异常: 2023-01-30');
        } else {
          dateAnalysis.正常日期++;
          dateAnalysis.日期范围.add(record.end_date.substring(0, 7)); // 年-月
        }
      } else {
        dateAnalysis.空日期++;
      }
    });
    
    console.log('\n📈 日期分析结果:');
    console.log(`  正常日期: ${dateAnalysis.正常日期}`);
    console.log(`  异常日期: ${dateAnalysis.异常日期}`);
    console.log(`  空日期: ${dateAnalysis.空日期}`);
    console.log(`  日期范围: ${Array.from(dateAnalysis.日期范围).sort().join(', ')}`);
    
    // 检查是否还有问题
    if (dateAnalysis.异常日期 > 0) {
      console.log('\n❌ 发现日期导入问题，需要重新导入数据');
      
      // 查询更多异常数据
      const { data: problemData, error: problemError } = await supabase
        .from('salary_calculation_results')
        .select('employee_id, start_date, end_date, salary_item_name')
        .or('start_date.eq.2022-12-31,end_date.eq.2023-01-30')
        .limit(20);
      
      if (!problemError && problemData.length > 0) {
        console.log(`\n🔍 发现 ${problemData.length} 条异常日期记录:`);
        problemData.forEach((record, index) => {
          console.log(`  ${index + 1}. 员工${record.employee_id}: ${record.start_date} ~ ${record.end_date} (${record.salary_item_name})`);
        });
      }
    } else {
      console.log('\n✅ 日期导入正常，没有发现异常');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDateImport();
