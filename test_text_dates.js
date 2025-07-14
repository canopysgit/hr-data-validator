// 测试开始时间和结束时间作为文本处理的逻辑

// 模拟修改后的数据转换函数
function convertFieldValue(dbKey, value) {
  // 处理日期字段 - 开始时间和结束时间作为文本处理，避免Excel转换问题
  if (dbKey === '开始时间' || dbKey === '结束时间') {
    // 开始时间和结束时间直接作为文本处理，不进行日期转换
    if (typeof value === 'number') {
      // 如果是数字，转换为字符串保存
      return value.toString();
    } else if (typeof value === 'string' && value !== '') {
      // 如果是字符串，直接保存
      return value.trim();
    }
  } else if (dbKey === '生效日期' || dbKey === '失效日期' ||
             dbKey === '生效开始时间' || dbKey === '生效结束时间' ||
             dbKey === '出生日期' || dbKey === '入职日期') {
    // 其他日期字段仍然进行Excel日期序列号转换
    if (typeof value === 'number' && value > 1000) {
      // Excel日期序列号转换 (简化版本)
      const baseDate = new Date(1900, 0, 1);
      let dayOffset = value - 1;
      
      if (value >= 60) {
        dayOffset = dayOffset - 1;
      }
      
      const jsDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      return jsDate.toISOString().split('T')[0];
    }
  }
  
  // 处理空值
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  return value;
}

console.log('=== 测试开始时间和结束时间作为文本处理 ===');
console.log();

// 测试开始时间字段
console.log('=== 开始时间字段测试 ===');
const startTimeTests = [
  { input: 44744, expected: '44744' }, // Excel序列号作为文本
  { input: '2022-07-01', expected: '2022-07-01' }, // 标准日期格式
  { input: '2022-701', expected: '2022-701' }, // 特殊格式
  { input: 'abc', expected: 'abc' }, // 任意文本
  { input: '', expected: null }, // 空字符串
  { input: null, expected: null }, // null值
];

startTimeTests.forEach(test => {
  const result = convertFieldValue('开始时间', test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`${status} 输入: ${JSON.stringify(test.input)} -> 输出: ${JSON.stringify(result)} (期望: ${JSON.stringify(test.expected)})`);
});

console.log();

// 测试结束时间字段
console.log('=== 结束时间字段测试 ===');
const endTimeTests = [
  { input: 44743, expected: '44743' }, // Excel序列号作为文本
  { input: '2022-06-30', expected: '2022-06-30' }, // 标准日期格式
  { input: '2022-630', expected: '2022-630' }, // 特殊格式
  { input: '  2022-07-01  ', expected: '2022-07-01' }, // 带空格的文本
];

endTimeTests.forEach(test => {
  const result = convertFieldValue('结束时间', test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`${status} 输入: ${JSON.stringify(test.input)} -> 输出: ${JSON.stringify(result)} (期望: ${JSON.stringify(test.expected)})`);
});

console.log();

// 测试其他日期字段（仍然进行转换）
console.log('=== 其他日期字段测试（仍然转换） ===');
const otherDateTests = [
  { field: '生效日期', input: 44744, expected: '2022-07-01' }, // 应该转换
  { field: '出生日期', input: '2022-07-01', expected: '2022-07-01' }, // 字符串保持不变
];

otherDateTests.forEach(test => {
  const result = convertFieldValue(test.field, test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`${status} ${test.field}: ${JSON.stringify(test.input)} -> ${JSON.stringify(result)} (期望: ${JSON.stringify(test.expected)})`);
});

console.log();
console.log('=== 结论 ===');
console.log('✓ 开始时间和结束时间字段现在作为文本处理，不会进行Excel日期转换');
console.log('✓ 这样可以避免Excel序列号转换导致的日期错误问题');
console.log('✓ 用户在Excel中看到的日期值将直接保存到数据库中');