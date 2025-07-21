const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullYearDates() {
  console.log('📅 测试完整年度日期数据...\n');
  
  try {
    // 读取Excel文件
    const excelPath = path.join('C:', '93 trae', '人力资源数据质量检查', '模拟数据-07171300.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['工资核算结果信息'];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
    
    console.log(`📊 Excel总数据: ${rawData.length} 条`);
    
    // 分析所有唯一的日期值
    const uniqueDates = new Set();
    const dateMapping = new Map();
    
    rawData.forEach(record => {
      const startDate = record['开始时间'];
      const endDate = record['结束时间'];
      
      if (typeof startDate === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(startDate);
        const formatted = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        uniqueDates.add(formatted);
        dateMapping.set(startDate, formatted);
      }
      
      if (typeof endDate === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(endDate);
        const formatted = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
        uniqueDates.add(formatted);
        dateMapping.set(endDate, formatted);
      }
    });
    
    const sortedDates = Array.from(uniqueDates).sort();
    console.log(`📅 发现 ${sortedDates.length} 个唯一日期:`);
    sortedDates.forEach((date, index) => {
      console.log(`  ${index + 1}. ${date}`);
    });
    
    // 验证是否覆盖完整的12个月
    const months = new Set();
    sortedDates.forEach(date => {
      const month = date.substring(0, 7); // YYYY-MM
      months.add(month);
    });
    
    console.log(`\n📊 覆盖的月份 (${months.size} 个月):`);
    Array.from(months).sort().forEach((month, index) => {
      console.log(`  ${index + 1}. ${month}`);
    });
    
    if (months.size === 12) {
      console.log('✅ 完整覆盖12个月的数据');
    } else {
      console.log(`⚠️ 只覆盖了 ${months.size} 个月，可能缺少部分月份数据`);
    }
    
    // 检查日期范围的合理性
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    console.log(`\n📈 日期范围分析:`);
    console.log(`  最早日期: ${sortedDates[0]}`);
    console.log(`  最晚日期: ${sortedDates[sortedDates.length - 1]}`);
    console.log(`  跨度天数: ${daysDiff} 天`);
    console.log(`  跨度月数: ${Math.round(daysDiff / 30)} 个月`);
    
    // 验证日期序列号映射的准确性
    console.log(`\n🔍 验证Excel序列号映射:`);
    const testMappings = [
      { serial: 44927, expected: '2023-01-01' },
      { serial: 44957, expected: '2023-01-31' },
      { serial: 44958, expected: '2023-02-01' },
      { serial: 44985, expected: '2023-02-28' }
    ];
    
    let mappingCorrect = true;
    testMappings.forEach(test => {
      const actual = dateMapping.get(test.serial);
      const match = actual === test.expected;
      console.log(`  序列号 ${test.serial}: 期望 ${test.expected}, 实际 ${actual} ${match ? '✅' : '❌'}`);
      if (!match) mappingCorrect = false;
    });
    
    // 最终验证结果
    console.log(`\n🎯 完整年度日期测试结果:`);
    
    if (mappingCorrect && months.size >= 12) {
      console.log('🎉 测试完全成功！');
      console.log('✅ Excel日期序列号解析正确');
      console.log('✅ 覆盖完整的年度数据');
      console.log('✅ 日期格式转换准确');
      console.log('✅ 可以安全导入完整的工资数据');
      
      console.log('\n📝 下一步操作建议:');
      console.log('1. 在应用中重新导入完整的Excel文件');
      console.log('2. 选择"工资核算结果信息"工作表');
      console.log('3. 验证导入后的日期数据正确性');
      console.log('4. 运行检查点5验证社保基数一致性');
      
    } else {
      console.log('❌ 测试发现问题:');
      if (!mappingCorrect) {
        console.log('  - 日期序列号映射不正确');
      }
      if (months.size < 12) {
        console.log(`  - 月份覆盖不完整 (${months.size}/12)`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testFullYearDates();
