const XLSX = require('xlsx');
const path = require('path');

async function analyzeSalarySheet() {
  try {
    console.log('📊 分析工资核算结果信息工作表...');
    
    // 读取Excel文件
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '工资核算结果信息';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error('❌ 未找到工作表:', sheetName);
      return;
    }
    
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 总记录数: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\n📋 字段列表:');
      const fields = Object.keys(data[0]);
      fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field}`);
      });
      
      console.log('\n📄 前3条数据示例:');
      data.slice(0, 3).forEach((row, i) => {
        console.log(`\n=== 记录 ${i + 1} ===`);
        Object.keys(row).forEach(key => {
          console.log(`${key}: ${row[key]}`);
        });
      });
      
      // 分析数据类型和特征
      console.log('\n🔍 数据特征分析:');
      const fieldAnalysis = {};
      
      fields.forEach(field => {
        const values = data.map(row => row[field]).filter(v => v !== null && v !== undefined && v !== '');
        fieldAnalysis[field] = {
          totalCount: data.length,
          nonEmptyCount: values.length,
          uniqueCount: new Set(values).size,
          sampleValues: [...new Set(values)].slice(0, 5)
        };
      });
      
      Object.keys(fieldAnalysis).forEach(field => {
        const analysis = fieldAnalysis[field];
        console.log(`\n${field}:`);
        console.log(`  - 总记录数: ${analysis.totalCount}`);
        console.log(`  - 非空记录数: ${analysis.nonEmptyCount}`);
        console.log(`  - 唯一值数量: ${analysis.uniqueCount}`);
        console.log(`  - 示例值: ${analysis.sampleValues.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

analyzeSalarySheet();
