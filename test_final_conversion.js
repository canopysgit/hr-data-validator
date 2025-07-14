// 测试最终修复的日期转换逻辑

// 模拟修复后的Excel日期转换函数
function convertExcelDateFinal(value) {
  if (typeof value === 'number' && value > 1000) {
    // Excel日期序列号转换 (使用标准方法：1899-12-30基准)
    const excelEpoch = new Date(1899, 11, 30); // 1899年12月30日
    const jsDate = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0];
  } else if (typeof value === 'string' && value !== '') {
    // 处理特殊格式如 2023-701 (表示2023年7月1日)
    if (/^\d{4}-\d{3}$/.test(value)) {
      const parts = value.split('-');
      const year = parts[0];
      const monthDay = parts[1];
      if (monthDay.length === 3) {
        const month = monthDay.substring(0, 1);
        const day = monthDay.substring(1);
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (!isNaN(Number(value))) {
      // 如果是字符串数字，也按Excel序列号处理
      const numValue = Number(value);
      if (numValue > 1000) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + numValue * 24 * 60 * 60 * 1000);
        return jsDate.toISOString().split('T')[0];
      }
    }
  }
  return value;
}

// 测试关键的转换案例
console.log('最终日期转换测试:');
const testCases = [
  { input: 45108, expected: '2023-06-30', description: 'Excel序列号45108' },
  { input: 45109, expected: '2023-07-01', description: 'Excel序列号45109' },
  { input: '45108', expected: '2023-06-30', description: '字符串Excel序列号45108' },
  { input: '45109', expected: '2023-07-01', description: '字符串Excel序列号45109' },
  { input: '2023-701', expected: '2023-07-01', description: '特殊格式2023-701' },
  { input: '2024-630', expected: '2024-06-30', description: '特殊格式2024-630' }
];

testCases.forEach(test => {
  const result = convertExcelDateFinal(test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`${status} ${test.description}: ${test.input} -> ${result} (期望: ${test.expected})`);
});

// 根据测试结果，确定用户原始数据"2023-701"应该对应的Excel序列号
console.log('\n用户原始数据分析:');
const userOriginalDate = '2023-701';
const convertedDate = convertExcelDateFinal(userOriginalDate);
console.log(`用户原始数据 "${userOriginalDate}" 应该转换为: ${convertedDate}`);

// 计算2023-07-01对应的Excel序列号
const targetDate = new Date('2023-07-01');
const excelEpoch = new Date(1899, 11, 30);
const correctSerial = Math.floor((targetDate.getTime() - excelEpoch.getTime()) / (24 * 60 * 60 * 1000));
console.log(`2023-07-01对应的正确Excel序列号应该是: ${correctSerial}`);
console.log(`验证: ${correctSerial} -> ${convertExcelDateFinal(correctSerial)}`);

console.log('\n结论:');
console.log('1. 用户原始数据"2023-701"应该正确转换为"2023-07-01"');
console.log('2. 如果数据库中显示的是"2023-06-30"，说明原始Excel文件中的数据可能是序列号45108');
console.log('3. 需要重新导入数据以确保日期转换正确');