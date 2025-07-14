const XLSX = require('xlsx');
const path = require('path');

// 读取原始Excel文件
const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
console.log('正在搜索杨治源的所有数据记录...');

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    
    let totalYangRecords = 0;
    
    // 遍历所有工作表
    sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 查找杨治源的数据
        const yangData = jsonData.filter(row => {
            // 检查所有可能包含杨治源的字段
            return Object.values(row).some(value => {
                if (value && typeof value === 'string') {
                    return value.includes('杨治源') || 
                           (value.includes('杨') && value.includes('治源'));
                }
                return false;
            });
        });
        
        if (yangData.length > 0) {
            console.log(`\n=== 工作表: ${sheetName} ===`);
            console.log(`找到杨治源相关记录: ${yangData.length}条`);
            totalYangRecords += yangData.length;
            
            yangData.forEach((row, index) => {
                console.log(`\n记录 ${index + 1}:`);
                Object.keys(row).forEach(key => {
                    console.log(`  ${key}: ${row[key]}`);
                });
            });
        }
    });
    
    console.log(`\n\n=== 搜索总结 ===`);
    console.log(`总共找到杨治源相关记录: ${totalYangRecords}条`);
    
    if (totalYangRecords === 0) {
        console.log('\n警告：在原始Excel文件中未找到任何杨治源的记录！');
        console.log('这可能解释了为什么数据库中的数据与预期不符。');
    }
    
    // 特别检查员工社保信息工作表
    console.log('\n=== 员工社保信息工作表详细分析 ===');
    const socialSheet = workbook.Sheets['员工社保信息'];
    if (socialSheet) {
        const socialData = XLSX.utils.sheet_to_json(socialSheet);
        console.log(`员工社保信息总记录数: ${socialData.length}`);
        
        // 显示所有员工工号
        const employeeIds = [...new Set(socialData.map(row => row['员工工号']))].sort();
        console.log('所有员工工号:', employeeIds);
        
        // 检查是否有80000001（杨治源的工号）
        const yangEmployeeId = '80000001';
        const yangSocialData = socialData.filter(row => row['员工工号'] === yangEmployeeId);
        
        if (yangSocialData.length > 0) {
            console.log(`\n找到员工工号${yangEmployeeId}的社保记录:`);
            yangSocialData.forEach((row, index) => {
                console.log(`\n社保记录 ${index + 1}:`);
                Object.keys(row).forEach(key => {
                    console.log(`  ${key}: ${row[key]}`);
                });
            });
        } else {
            console.log(`\n员工工号${yangEmployeeId}在员工社保信息中没有记录！`);
        }
    }
    
} catch (error) {
    console.error('读取Excel文件时出错:', error.message);
}