// 简单的Excel日期转换测试

// 标准的Excel日期转换函数
function excelDateToJS(excelDate) {
  // Excel的日期系统：1900年1月1日是序列号1
  // 但Excel错误地认为1900年是闰年，所以1900年3月1日之后的日期都偏移了1天
  
  if (excelDate < 1) return null;
  
  // 1900年1月1日的JavaScript Date对象
  const baseDate = new Date(1900, 0, 1);
  
  // 计算天数偏移
  let dayOffset = excelDate - 1;
  
  // 如果Excel序列号大于等于60（对应1900年2月29日），需要减1天
  // 因为1900年实际上不是闰年，但Excel认为是
  if (excelDate >= 60) {
    dayOffset = dayOffset - 1;
  }
  
  // 计算最终日期
  const resultDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  
  return resultDate.toISOString().split('T')[0];
}

// 测试基本转换
console.log('=== 基本Excel日期转换测试 ===');
console.log('序列号 1 ->', excelDateToJS(1), '(期望: 1900-01-01)');
console.log('序列号 2 ->', excelDateToJS(2), '(期望: 1900-01-02)');
console.log('序列号 59 ->', excelDateToJS(59), '(期望: 1900-02-28)');
console.log('序列号 60 ->', excelDateToJS(60), '(期望: 1900-02-29, 但这天不存在)');
console.log('序列号 61 ->', excelDateToJS(61), '(期望: 1900-03-01)');
console.log();

// 测试2022年的日期
console.log('=== 2022年日期测试 ===');
for (let i = 44742; i <= 44744; i++) {
  console.log(`序列号 ${i} ->`, excelDateToJS(i));
}
console.log();

// 测试2023年的日期
console.log('=== 2023年日期测试 ===');
for (let i = 45107; i <= 45109; i++) {
  console.log(`序列号 ${i} ->`, excelDateToJS(i));
}