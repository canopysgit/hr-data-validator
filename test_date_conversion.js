// 深度调试Excel日期序列号转换

// 测试Excel序列号的实际对应关系
console.log('Excel序列号实际对应关系测试:');

// 已知的Excel序列号对应关系（来自Excel实际测试）
const knownMappings = [
  { serial: 1, date: '1900-01-01' },
  { serial: 2, date: '1900-01-02' },
  { serial: 59, date: '1900-02-28' },
  { serial: 60, date: '1900-03-01' }, // Excel错误地认为1900年是闰年
  { serial: 61, date: '1900-03-02' },
  { serial: 45108, date: '2023-06-30' }, // 实际测试结果
  { serial: 45109, date: '2023-07-01' }  // 推测
];

// 测试不同的转换方法
function testConversionMethod(serial, methodName, convertFunc) {
  const result = convertFunc(serial);
  console.log(`${methodName}: ${serial} -> ${result}`);
  return result;
}

// 方法1: 标准方法（1899-12-30基准）
function method1(serial) {
  const excelEpoch = new Date(1899, 11, 30);
  const jsDate = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
  return jsDate.toISOString().split('T')[0];
}

// 方法2: 考虑闰年bug（序列号>=60时减1）
function method2(serial) {
  const excelEpoch = new Date(1899, 11, 30);
  let jsDate;
  if (serial >= 60) {
    jsDate = new Date(excelEpoch.getTime() + (serial - 1) * 24 * 60 * 60 * 1000);
  } else {
    jsDate = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
  }
  return jsDate.toISOString().split('T')[0];
}

// 方法3: 1900-01-01基准，序列号减2
function method3(serial) {
  const excelEpoch = new Date(1900, 0, 1);
  const jsDate = new Date(excelEpoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000);
  return jsDate.toISOString().split('T')[0];
}

// 方法4: 1899-12-31基准，序列号减1
function method4(serial) {
  const excelEpoch = new Date(1899, 11, 31);
  const jsDate = new Date(excelEpoch.getTime() + (serial - 1) * 24 * 60 * 60 * 1000);
  return jsDate.toISOString().split('T')[0];
}

knownMappings.forEach(mapping => {
  console.log(`\n测试序列号 ${mapping.serial} (期望: ${mapping.date}):`);
  const results = [
    testConversionMethod(mapping.serial, '方法1(1899-12-30)', method1),
    testConversionMethod(mapping.serial, '方法2(闰年修正)', method2),
    testConversionMethod(mapping.serial, '方法3(1900-01-01)', method3),
    testConversionMethod(mapping.serial, '方法4(1899-12-31)', method4)
  ];
  
  const correctMethod = results.findIndex(result => result === mapping.date);
  if (correctMethod >= 0) {
    console.log(`✓ 方法${correctMethod + 1}正确`);
  } else {
    console.log('✗ 所有方法都不正确');
  }
});

// 反向计算：从日期计算序列号
console.log('\n反向计算测试:');
function calculateSerial(dateStr, methodName, calculateFunc) {
  const serial = calculateFunc(dateStr);
  console.log(`${methodName}: ${dateStr} -> 序列号 ${serial}`);
  return serial;
}

function reverseMethod1(dateStr) {
  const targetDate = new Date(dateStr);
  const excelEpoch = new Date(1899, 11, 30);
  return Math.floor((targetDate.getTime() - excelEpoch.getTime()) / (24 * 60 * 60 * 1000));
}

function reverseMethod4(dateStr) {
  const targetDate = new Date(dateStr);
  const excelEpoch = new Date(1899, 11, 31);
  return Math.floor((targetDate.getTime() - excelEpoch.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

const testDates = ['2023-06-30', '2023-07-01'];
testDates.forEach(date => {
  console.log(`\n计算 ${date} 的序列号:`);
  calculateSerial(date, '方法1(1899-12-30)', reverseMethod1);
  calculateSerial(date, '方法4(1899-12-31)', reverseMethod4);
});

// 测试特殊格式
console.log('\n特殊格式测试:');
function convertSpecialFormat(value) {
  if (/^\d{4}-\d{3}$/.test(value)) {
    const parts = value.split('-');
    const year = parts[0];
    const monthDay = parts[1];
    if (monthDay.length === 3) {
      const month = monthDay.substring(0, 1);
      const day = monthDay.substring(1);
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return value;
}

const specialFormats = ['2023-701', '2024-630'];
specialFormats.forEach(format => {
  console.log(`${format} -> ${convertSpecialFormat(format)}`);
});