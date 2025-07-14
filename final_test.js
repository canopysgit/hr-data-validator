// 最终的Excel日期转换测试

// 修复后的Excel日期转换函数（与DataImport.tsx中的逻辑一致）
function convertExcelDate(value) {
  if (typeof value === 'number' && value >= 1) {
    // Excel日期序列号转换 (正确处理Excel的1900年闰年bug)
    // Excel的日期系统：1900年1月1日是序列号1
    // 但Excel错误地认为1900年是闰年，所以1900年3月1日之后的日期都偏移了1天
    // Excel序列号1对应1900年1月1日
     // 使用1899年12月30日作为基准，序列号1就是基准日期+1天
     const baseDate = new Date(1899, 11, 30); // 1899年12月30日
     let dayOffset = value;
     
     // 如果Excel序列号大于等于60（对应1900年2月29日），需要减1天
     // 因为1900年实际上不是闰年，但Excel认为是
     if (value >= 60) {
       dayOffset = dayOffset - 1;
     }
    
    const jsDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0]; // YYYY-MM-DD格式
  }
  return value;
}

console.log('=== 最终Excel日期转换测试 ===');
console.log();

// 测试黄笑霞案例相关的序列号
console.log('=== 黄笑霞案例测试 ===');
console.log('序列号 44742 ->', convertExcelDate(44742), '(应该是 2022-06-29)');
console.log('序列号 44743 ->', convertExcelDate(44743), '(应该是 2022-06-30)');
console.log('序列号 44744 ->', convertExcelDate(44744), '(应该是 2022-07-01)');
console.log();

// 测试关键的基础序列号
console.log('=== 基础序列号测试 ===');
console.log('序列号 1 ->', convertExcelDate(1), '(应该是 1900-01-01)');
console.log('序列号 2 ->', convertExcelDate(2), '(应该是 1900-01-02)');
console.log('序列号 59 ->', convertExcelDate(59), '(应该是 1900-02-28)');
console.log('序列号 60 ->', convertExcelDate(60), '(应该是 1900-02-28, 跳过虚假的2月29日)');
console.log('序列号 61 ->', convertExcelDate(61), '(应该是 1900-03-01)');
console.log();

// 测试2023年的序列号
console.log('=== 2023年序列号测试 ===');
console.log('序列号 45107 ->', convertExcelDate(45107), '(应该是 2023-06-29)');
console.log('序列号 45108 ->', convertExcelDate(45108), '(应该是 2023-06-30)');
console.log('序列号 45109 ->', convertExcelDate(45109), '(应该是 2023-07-01)');
console.log();

console.log('=== 结论 ===');
console.log('如果Excel文件中黄笑霞的开始时间是序列号44744，');
console.log('那么导入后应该正确显示为:', convertExcelDate(44744));
console.log('如果之前显示为2022-06-30，说明Excel文件中的序列号是44743');
console.log('现在修复后，44743应该正确显示为:', convertExcelDate(44743));