const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('../模拟数据-0714.xlsx');
  console.log('所有工作表:', workbook.SheetNames);
  
  if(workbook.SheetNames.includes('员工合同信息')) {
    const worksheet = workbook.Sheets['员工合同信息'];
    const data = XLSX.utils.sheet_to_json(worksheet, {header: 1});
    console.log('\n员工合同信息表头:', data[0]);
    console.log('\n前3行数据:');
    data.slice(0, 3).forEach((row, i) => {
      console.log(`第${i+1}行:`, row);
    });
    
    // 获取所有数据以了解字段类型
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('\n数据示例 (前2条记录):');
    console.log(JSON.stringify(jsonData.slice(0, 2), null, 2));
    
  } else {
    console.log('未找到员工合同信息工作表');
    console.log('可能的工作表名称包含"合同"的:');
    workbook.SheetNames.forEach(name => {
      if(name.includes('合同')) {
        console.log('- ' + name);
      }
    });
  }
} catch(error) {
  console.error('读取Excel文件时出错:', error.message);
}