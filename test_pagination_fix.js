const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaginationFix() {
  console.log('🧪 测试分页查询修复效果...\n');
  
  try {
    // 1. 测试原来的查询方式（有限制）
    console.log('📊 测试原来的查询方式...');
    const { data: limitedData } = await supabase
      .from('salary_calculation_results')
      .select('*');
    
    console.log(`原查询方式结果: ${limitedData?.length || 0} 条记录`);
    
    // 2. 测试新的分页查询方式
    console.log('\n📊 测试新的分页查询方式...');
    let allSalaryData = [];
    let from = 0;
    const pageSize = 1000;
    let pageCount = 0;
    
    while (true) {
      pageCount++;
      console.log(`📄 查询第 ${pageCount} 页 (${from + 1} - ${from + pageSize})...`);
      
      const { data: pageData, error } = await supabase
        .from('salary_calculation_results')
        .select('*')
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error('❌ 查询失败:', error);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        console.log('📄 没有更多数据');
        break;
      }
      
      allSalaryData = allSalaryData.concat(pageData);
      console.log(`📄 第 ${pageCount} 页: ${pageData.length} 条记录，累计: ${allSalaryData.length} 条`);
      
      if (pageData.length < pageSize) {
        console.log('📄 已到最后一页');
        break;
      }
      
      from += pageSize;
    }
    
    console.log(`\n✅ 分页查询完成，总计: ${allSalaryData.length} 条记录`);
    
    // 3. 验证黄笑霞的数据
    console.log('\n🎯 验证黄笑霞的数据...');
    
    const huangRecords = allSalaryData.filter(record => record.employee_id === '80000008');
    const huangTaxableRecords = huangRecords.filter(record => record.salary_item_name === '税前应发合计');
    
    console.log(`黄笑霞总记录: ${huangRecords.length}`);
    console.log(`黄笑霞税前应发合计: ${huangTaxableRecords.length}`);
    
    if (huangTaxableRecords.length === 12) {
      console.log('✅ 黄笑霞的税前应发合计数据完整！');
      
      // 按年度分组
      const byYear = {};
      huangTaxableRecords.forEach(record => {
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
      
      // 显示2023年的详细记录
      if (byYear['2023']) {
        console.log('\n📋 2023年详细记录:');
        byYear['2023'].forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.start_date}: ¥${record.amount}`);
        });
        
        const total2023 = byYear['2023'].reduce((sum, record) => sum + (record.amount || 0), 0);
        const average2023 = Math.round(total2023 / 12);
        console.log(`\n💰 2023年统计:`);
        console.log(`  年度总收入: ¥${total2023.toLocaleString()}`);
        console.log(`  月均收入: ¥${average2023.toLocaleString()}`);
      }
    } else {
      console.log(`❌ 黄笑霞的税前应发合计数据不完整: ${huangTaxableRecords.length}/12`);
    }
    
    // 4. 模拟修复后的检查点5逻辑
    console.log('\n🔍 模拟修复后的检查点5逻辑...');
    
    // 按检查点5的逻辑处理数据
    const salaryByEmployee = {};
    
    allSalaryData.forEach((record) => {
      const empId = record.employee_id;
      const startDate = record.start_date;
      
      if (!startDate) return;
      
      const year = new Date(startDate).getFullYear().toString();
      
      if (!salaryByEmployee[empId]) {
        salaryByEmployee[empId] = {};
      }
      if (!salaryByEmployee[empId][year]) {
        salaryByEmployee[empId][year] = [];
      }
      salaryByEmployee[empId][year].push(record);
    });
    
    // 检查黄笑霞的2024年度社保基数计算
    const huangEmpId = '80000008';
    const socialYear = '2024年度';
    const salaryYear = '2023';
    
    const salaryRecords = salaryByEmployee[huangEmpId]?.[salaryYear] || [];
    const taxableIncomeRecords = salaryRecords.filter(record => 
      record.salary_item_name === '税前应发合计'
    );
    
    console.log(`\n📅 检查 ${socialYear} (基于 ${salaryYear} 年工资):`);
    console.log(`  ${salaryYear}年工资记录: ${salaryRecords.length} 条`);
    console.log(`  税前应发合计: ${taxableIncomeRecords.length} 条`);
    
    if (taxableIncomeRecords.length === 12) {
      const totalIncome = taxableIncomeRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
      const monthlyAverage = Math.round(totalIncome / 12);
      
      console.log(`  ✅ 数据完整，可以计算社保基数`);
      console.log(`  💰 年度总收入: ¥${totalIncome.toLocaleString()}`);
      console.log(`  📊 月均收入: ¥${monthlyAverage.toLocaleString()}`);
      console.log(`  🎯 修复成功！不再报告"工资数据不足"错误`);
    } else {
      console.log(`  ❌ 数据不完整: ${taxableIncomeRecords.length}/12 个月`);
    }
    
    // 5. 总结
    console.log('\n🎉 修复效果总结:');
    console.log(`✅ 原查询限制: ${limitedData?.length || 0} 条记录`);
    console.log(`✅ 分页查询结果: ${allSalaryData.length} 条记录`);
    console.log(`✅ 数据增加: ${allSalaryData.length - (limitedData?.length || 0)} 条记录`);
    console.log(`✅ 黄笑霞2023年税前应发合计: ${huangTaxableRecords.length}/12 个月`);
    
    if (huangTaxableRecords.length === 12) {
      console.log('🎯 问题已解决：黄笑霞的工资数据现在完整，检查点5不会再报告错误！');
    } else {
      console.log('❌ 问题仍存在：需要进一步调查');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testPaginationFix();
