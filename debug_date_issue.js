// 调试修正后的日期转换问题

// Excel日期序列号转日期 (正确处理Excel的1900年闰年bug)
function excelSerialToDate(serial) {
  // Excel序列号1对应1900年1月1日
  // Excel错误地认为1900年是闰年，序列号60对应虚假的1900年2月29日
  // 序列号61对应1900年3月1日
  
  if (serial < 1) return null;
  
  // 1900年1月1日作为序列号1的基准
  const jan1_1900 = new Date(1900, 0, 1); // 1900年1月1日
  
  // 对于序列号61及以后，需要减1天来修正Excel的闰年bug
  // 序列号60是虚假的1900年2月29日，应该跳过
  let adjustedSerial = serial;
  if (serial >= 61) {
    adjustedSerial = serial - 1;
  }
  
  const jsDate = new Date(jan1_1900.getTime() + (adjustedSerial - 1) * 24 * 60 * 60 * 1000);
  
  return jsDate.toISOString().split('T')[0];
}

// 日期转Excel序列号 (正确处理Excel的1900年闰年bug)
function dateToExcelSerial(dateStr) {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const jan1_1900 = new Date(1900, 0, 1);
  
  const diffTime = date.getTime() - jan1_1900.getTime();
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  let serial = diffDays + 1;
  
  // 如果日期在1900年3月1日之后，需要加1来修正Excel的闰年bug
  const march1_1900 = new Date(1900, 2, 1);
  if (date >= march1_1900) {
    serial += 1;
  }
  
  return serial;
}

console.log('=== 修正后的日期转换测试 ===');
console.log();

// 测试关键日期
const testDates = ['2022-06-30', '2022-07-01', '2023-06-30', '2023-07-01'];
testDates.forEach(date => {
  const serial = dateToExcelSerial(date);
  const converted = excelSerialToDate(serial);
  const status = converted === date ? '✓' : '✗';
  console.log(`${status} ${date}:`);
  console.log(`  Excel序列号: ${serial}`);
  console.log(`  转换回日期: ${converted}`);
  console.log();
});

// 测试一些已知的Excel序列号
console.log('=== 测试已知序列号 ===');
const knownSerials = [
  { serial: 1, expected: '1900-01-01' },
  { serial: 2, expected: '1900-01-02' },
  { serial: 44742, expected: '2022-06-30' },
  { serial: 44743, expected: '2022-07-01' },
  { serial: 45108, expected: '2023-06-30' },
  { serial: 45109, expected: '2023-07-01' }
];

knownSerials.forEach(test => {
  const converted = excelSerialToDate(test.serial);
  const status = converted === test.expected ? '✓' : '✗';
  console.log(`${status} 序列号 ${test.serial} -> ${converted} (期望: ${test.expected})`);
});

console.log();
console.log('=== 黄笑霞案例分析 ===');
console.log('如果Excel中显示2022-07-01，对应的序列号应该是:', dateToExcelSerial('2022-07-01'));
console.log('修正后的转换结果:', excelSerialToDate(dateToExcelSerial('2022-07-01')));
console.log();
console.log('如果导入后显示2022-06-30，说明Excel文件中的序列号是:', dateToExcelSerial('2022-06-30'));
console.log('这个序列号转换的结果:', excelSerialToDate(dateToExcelSerial('2022-06-30')));