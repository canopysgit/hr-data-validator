// 分析Excel文件中城市社保标准配置表的列名
const XLSX = require('xlsx');
const path = require('path');

function analyzeExcelColumns() {
  console.log('🔍 分析Excel文件中的城市社保标准配置表列名...');
  console.log();

  try {
    // 读取Excel文件
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    console.log('📊 Excel文件中的所有工作表:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    console.log();
    
    // 查找城市社保标准配置表
    const targetSheetName = '城市社保标准配置表';
    
    if (!workbook.SheetNames.includes(targetSheetName)) {
      console.log(`❌ 未找到工作表: ${targetSheetName}`);
      return;
    }
    
    console.log(`🔍 分析工作表: ${targetSheetName}`);
    const worksheet = workbook.Sheets[targetSheetName];
    
    // 转换为JSON格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      console.log('❌ 工作表为空');
      return;
    }
    
    // 获取表头（第一行）
    const headers = jsonData[0];
    console.log('📋 表头列名:');
    headers.forEach((header, index) => {
      console.log(`  ${index + 1}. "${header}"`);
    });
    
    console.log();
    console.log('🔍 检查目标字段是否存在:');
    const targetFields = ['社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
    
    targetFields.forEach(field => {
      const exists = headers.includes(field);
      console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
    });
    
    console.log();
    console.log('🔍 查找可能的字段名变体:');
    targetFields.forEach(field => {
      console.log(`\n  查找 "${field}" 的可能变体:`);
      const variations = headers.filter(header => {
        if (!header) return false;
        const headerStr = header.toString().toLowerCase();
        const fieldStr = field.toLowerCase();
        return headerStr.includes(fieldStr) || fieldStr.includes(headerStr);
      });
      
      if (variations.length > 0) {
        variations.forEach(variation => {
          console.log(`    - "${variation}"`);
        });
      } else {
        console.log(`    - 未找到相似字段`);
      }
    });
    
    // 显示前几行数据示例
    console.log();
    console.log('📋 前3行数据示例:');
    for (let i = 0; i < Math.min(4, jsonData.length); i++) {
      console.log(`\n--- 第${i + 1}行 ---`);
      const row = jsonData[i];
      headers.forEach((header, index) => {
        const value = row[index];
        console.log(`  ${header}: ${value}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 分析过程中出错:', error);
  }
}

analyzeExcelColumns();