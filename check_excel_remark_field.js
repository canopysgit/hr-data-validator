// 检查Excel文件中备注字段的具体情况
const XLSX = require('xlsx');
const path = require('path');

async function checkExcelRemarkField() {
  console.log('🔍 检查Excel文件中备注字段的具体情况...');
  console.log();

  try {
    // 读取Excel文件
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '城市社保标准配置表';
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`❌ 未找到工作表: ${sheetName}`);
      return;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 总共读取 ${jsonData.length} 条数据`);
    console.log();
    
    // 检查所有字段名
    console.log('📋 所有字段名:');
    if (jsonData.length > 0) {
      const allFields = Object.keys(jsonData[0]);
      allFields.forEach((field, index) => {
        console.log(`  ${index + 1}. "${field}" (长度: ${field.length})`);
      });
    }
    console.log();
    
    // 查找包含"备注"的字段
    console.log('🔍 查找包含"备注"的字段:');
    const remarkFields = [];
    if (jsonData.length > 0) {
      const allFields = Object.keys(jsonData[0]);
      allFields.forEach(field => {
        if (field.includes('备注') || field.toLowerCase().includes('remark') || field.toLowerCase().includes('note')) {
          remarkFields.push(field);
          console.log(`  找到字段: "${field}"`);
        }
      });
    }
    
    if (remarkFields.length === 0) {
      console.log('  ❌ 未找到包含"备注"的字段');
    }
    console.log();
    
    // 检查前10条数据中备注相关字段的值
    console.log('📋 前10条数据中备注相关字段的值:');
    jsonData.slice(0, 10).forEach((record, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`);
      
      // 检查所有可能的备注字段
      const allFields = Object.keys(record);
      allFields.forEach(field => {
        if (field.includes('备注') || field.toLowerCase().includes('remark') || field.toLowerCase().includes('note')) {
          const value = record[field];
          console.log(`  ${field}: ${value === undefined ? 'undefined' : value === null ? 'null' : value === '' ? '空字符串' : value}`);
        }
      });
      
      // 如果没有找到备注字段，显示所有字段
      if (remarkFields.length === 0) {
        console.log('  所有字段:');
        Object.entries(record).forEach(([key, value]) => {
          console.log(`    ${key}: ${value === undefined ? 'undefined' : value === null ? 'null' : value === '' ? '空字符串' : value}`);
        });
      }
    });
    
    // 统计备注字段的值分布
    if (remarkFields.length > 0) {
      console.log('\n📊 备注字段值分布统计:');
      remarkFields.forEach(field => {
        console.log(`\n字段: "${field}"`);
        const valueCount = {};
        jsonData.forEach(record => {
          const value = record[field];
          const key = value === undefined ? 'undefined' : value === null ? 'null' : value === '' ? '空字符串' : '有值';
          valueCount[key] = (valueCount[key] || 0) + 1;
        });
        
        Object.entries(valueCount).forEach(([key, count]) => {
          console.log(`  ${key}: ${count} 条`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

checkExcelRemarkField();