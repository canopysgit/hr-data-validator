const XLSX = require('xlsx');
const path = require('path');

// 读取原始Excel文件
const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
console.log('正在读取Excel文件:', excelPath);

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    console.log('工作表名称:', sheetNames);
    
    // 遍历所有工作表
    sheetNames.forEach(sheetName => {
        console.log(`\n=== 工作表: ${sheetName} ===`);
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`总记录数: ${jsonData.length}`);
        
        if (jsonData.length > 0) {
            console.log('列名:', Object.keys(jsonData[0]));
            
            // 查找杨治源的数据
            const yangData = jsonData.filter(row => {
                // 检查所有可能的姓名字段
                const nameFields = ['姓名', '员工姓名', 'name', '员工名称'];
                return nameFields.some(field => 
                    row[field] && row[field].toString().includes('杨治源')
                );
            });
            
            if (yangData.length > 0) {
                console.log(`\n找到杨治源的数据 (${yangData.length}条):`);
                yangData.forEach((row, index) => {
                    console.log(`\n记录 ${index + 1}:`);
                    Object.keys(row).forEach(key => {
                        console.log(`  ${key}: ${row[key]}`);
                    });
                });
            } else {
                console.log('\n在此工作表中未找到杨治源的数据');
            }
            
            // 显示前3条记录作为参考
            console.log('\n前3条记录示例:');
            jsonData.slice(0, 3).forEach((row, index) => {
                console.log(`\n记录 ${index + 1}:`);
                Object.keys(row).forEach(key => {
                    console.log(`  ${key}: ${row[key]}`);
                });
            });
        }
    });
    
} catch (error) {
    console.error('读取Excel文件时出错:', error.message);
    console.error('错误详情:', error);
}