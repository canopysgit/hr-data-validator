const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('../模拟数据-0714.xlsx');
  const worksheet = workbook.Sheets['员工合同信息'];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('检查员工合同信息表的日期字段值:');
  console.log('总记录数:', data.length);
  
  data.slice(0, 5).forEach((row, i) => {
    console.log(`\n第${i+1}行:`);
    console.log('  开始日期:', row['开始日期'], '(类型:', typeof row['开始日期'], ')');
    console.log('  结束日期:', row['结束日期'], '(类型:', typeof row['结束日期'], ')');
    console.log('  签订日期:', row['签订日期'], '(类型:', typeof row['签订日期'], ')');
    
    // 检查是否有异常的数值
    if (typeof row['开始日期'] === 'number') {
      console.log('  开始日期数值:', row['开始日期'], row['开始日期'] > 50000 ? '(可能超出范围)' : '(正常范围)');
    }
    if (typeof row['结束日期'] === 'number') {
      console.log('  结束日期数值:', row['结束日期'], row['结束日期'] > 50000 ? '(可能超出范围)' : '(正常范围)');
    }
    if (typeof row['签订日期'] === 'number') {
      console.log('  签订日期数值:', row['签订日期'], row['签订日期'] > 50000 ? '(可能超出范围)' : '(正常范围)');
    }
  });
  
  // 检查所有记录中是否有超大的日期值
  console.log('\n检查所有记录中的异常日期值:');
  let hasLargeValues = false;
  data.forEach((row, i) => {
    ['开始日期', '结束日期', '签订日期'].forEach(field => {
      if (typeof row[field] === 'number' && row[field] > 50000) {
        console.log(`第${i+1}行 ${field}: ${row[field]} (超出正常范围)`);
        hasLargeValues = true;
      }
    });
  });
  
  if (!hasLargeValues) {
    console.log('未发现超出正常范围的日期值');
  }
  
} catch(error) {
  console.error('处理Excel文件时出错:', error.message);
}