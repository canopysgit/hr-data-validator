// 测试日期处理逻辑
function testDateProcessing() {
  console.log('🧪 测试日期处理逻辑...\n');

  // 模拟Excel中可能出现的各种日期格式
  const testCases = [
    // 文本格式
    { input: '2023-01-01', type: 'string', expected: '2023-01-01', description: '标准文本格式' },
    { input: '2023-1-1', type: 'string', expected: '2023-01-01', description: '单数字月日' },
    { input: '2023/01/01', type: 'string', expected: '2023-01-01', description: '斜杠格式' },
    { input: '2023/1/1', type: 'string', expected: '2023-01-01', description: '斜杠单数字' },
    
    // 数字格式（Excel序列号）
    { input: 44927, type: 'number', expected: '44927', description: 'Excel序列号（禁用转换）' },
    { input: 44958, type: 'number', expected: '44958', description: 'Excel序列号（禁用转换）' },
    { input: 123, type: 'number', expected: '123', description: '小数字' },
    
    // 边界情况
    { input: '', type: 'string', expected: null, description: '空字符串' },
    { input: null, type: 'object', expected: null, description: 'null值' },
    { input: undefined, type: 'undefined', expected: null, description: 'undefined值' },
  ];

  // 模拟修复后的日期处理逻辑
  function processDateField(value, dbKey) {
    console.log(`🗓️ 处理日期字段 ${dbKey}:`, { 原始值: value, 类型: typeof value });
    
    // 🚫 完全禁用Excel日期序列号转换，只按文本处理
    if (value !== null && value !== undefined && value !== '') {
      // 统一转换为字符串，保持原始文本格式
      const dateStr = String(value).trim();
      console.log(`📝 日期文本处理: "${dateStr}"`);
      
      // 只处理明确的文本日期格式，不处理数字
      if (typeof value === 'string') {
        // 如果已经是标准格式 YYYY-MM-DD，直接使用
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split('-');
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          console.log(`✅ 标准格式日期: ${result}`);
          return result;
        }
        // 处理 YYYY/MM/DD 格式
        else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split('/');
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          console.log(`✅ 斜杠格式转换: ${dateStr} -> ${result}`);
          return result;
        }
        // 其他字符串格式保持原样
        else {
          console.log(`✅ 保持原始字符串: ${dateStr}`);
          return dateStr;
        }
      } else {
        // 🚫 对于数字类型，直接转为字符串，不进行任何日期转换
        console.log(`⚠️ 数字转文本（禁用日期转换）: ${dateStr}`);
        return dateStr;
      }
    } else {
      console.log(`❌ 空值处理: null`);
      return null;
    }
  }

  // 运行测试
  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`\n--- 测试 ${index + 1}: ${testCase.description} ---`);
    console.log(`输入: ${JSON.stringify(testCase.input)} (${testCase.type})`);
    
    const result = processDateField(testCase.input, 'start_date');
    const passed = result === testCase.expected;
    
    console.log(`期望: ${JSON.stringify(testCase.expected)}`);
    console.log(`实际: ${JSON.stringify(result)}`);
    console.log(`结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
    
    if (passed) {
      passedTests++;
    }
  });

  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！日期处理逻辑正确');
    console.log('\n🔥 关键改进:');
    console.log('  ✅ 完全禁用Excel日期序列号自动转换');
    console.log('  ✅ 数字类型直接转为文本，不进行日期计算');
    console.log('  ✅ 只处理明确的文本日期格式');
    console.log('  ✅ 保持原始数据的完整性');
  } else {
    console.log('❌ 部分测试失败，需要进一步修复');
  }
}

// 运行测试
testDateProcessing();
