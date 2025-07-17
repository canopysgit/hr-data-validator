// 测试修复后的日期处理逻辑
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 修复后的日期处理函数（与DataImport.tsx中的逻辑一致）
function processDateField(value, fieldName) {
  console.log(`\n处理日期字段 ${fieldName}:`, value, typeof value);
  
  if (value !== null && value !== undefined && value !== '') {
    if (typeof value === 'number') {
      // 如果是Excel日期序列号，使用UTC时间转换避免时区问题
      if (value > 1000) {
        // 使用1899年12月30日作为基准，避免Excel的1900年闰年bug
        const excelEpoch = Date.UTC(1899, 11, 30); // 1899年12月30日 UTC
        const jsDate = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
        
        // 直接获取UTC日期组件，避免本地时区影响
        const year = jsDate.getUTCFullYear();
        const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getUTCDate()).padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log(`  Excel序列号 ${value} -> ${result}`);
        return result;
      } else {
        // 如果是小数字，可能是文本，转换为字符串
        const result = value.toString();
        console.log(`  小数字 ${value} -> ${result}`);
        return result;
      }
    }
    else if (typeof value === 'string') {
      // 处理各种字符串日期格式
      let dateStr = value.toString().trim();
      console.log(`  处理字符串: "${dateStr}"`);
      
      // 处理 2024/1/1 格式 - 这是最常见的Excel日期格式
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log(`  日期格式 ${dateStr} -> ${result}`);
        return result;
      }
      // 处理特殊日期值
      else if (dateStr === '9999-12-31' || dateStr.startsWith('9999-')) {
        console.log(`  特殊日期 ${dateStr} -> null`);
        return null;
      }
      // 验证标准日期格式并检查范围
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const dateObj = new Date(dateStr);
        const year = dateObj.getFullYear();
        if (year > 2100 || year < 1900) {
          console.log(`  超出范围的日期 ${dateStr} -> null`);
          return null;
        } else {
          console.log(`  标准格式 ${dateStr} -> ${dateStr}`);
          return dateStr;
        }
      }
      // 处理纯数字字符串（可能是Excel序列号）
      else if (/^\d+$/.test(dateStr)) {
        const numValue = Number(dateStr);
        if (numValue > 1000) {
          // 按Excel序列号处理，使用UTC避免时区问题
          const excelEpoch = Date.UTC(1899, 11, 30);
          const jsDate = new Date(excelEpoch + numValue * 24 * 60 * 60 * 1000);
          
          const year = jsDate.getUTCFullYear();
          const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(jsDate.getUTCDate()).padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          console.log(`  数字字符串序列号 ${dateStr} -> ${result}`);
          return result;
        } else {
          console.log(`  小数字字符串 ${dateStr} -> ${dateStr}`);
          return dateStr;
        }
      }
      // 其他格式保持原样
      else {
        console.log(`  其他格式 ${dateStr} -> ${dateStr}`);
        return dateStr;
      }
    }
  }
  
  console.log(`  空值或无效值 -> null`);
  return null;
}

async function testDateProcessing() {
  console.log('🔍 测试修复后的日期处理逻辑...\n');
  
  // 测试各种日期格式
  const testCases = [
    // Excel常见格式
    { value: '2024/1/1', expected: '2024-01-01', description: 'Excel常见格式 2024/1/1' },
    { value: '2024/12/31', expected: '2024-12-31', description: 'Excel常见格式 2024/12/31' },
    
    // Excel日期序列号
    { value: 45292, expected: '2024-01-01', description: 'Excel序列号 45292 (2024-01-01)' },
    { value: 45657, expected: '2024-12-31', description: 'Excel序列号 45657 (2024-12-31)' },
    
    // 字符串序列号
    { value: '45292', expected: '2024-01-01', description: '字符串序列号 "45292"' },
    
    // 标准格式
    { value: '2024-01-01', expected: '2024-01-01', description: '标准格式 2024-01-01' },
    
    // 特殊值
    { value: '9999-12-31', expected: null, description: '特殊值 9999-12-31' },
    { value: '', expected: null, description: '空字符串' },
    { value: null, expected: null, description: 'null值' },
  ];
  
  console.log('📋 测试用例结果:');
  console.log('='.repeat(80));
  
  for (const testCase of testCases) {
    const result = processDateField(testCase.value, 'test_field');
    const passed = result === testCase.expected;
    
    console.log(`\n${passed ? '✅' : '❌'} ${testCase.description}`);
    console.log(`   输入: ${JSON.stringify(testCase.value)}`);
    console.log(`   期望: ${JSON.stringify(testCase.expected)}`);
    console.log(`   实际: ${JSON.stringify(result)}`);
    
    if (!passed) {
      console.log(`   ❌ 测试失败!`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试完成');
}

// 运行测试
testDateProcessing().catch(console.error);
