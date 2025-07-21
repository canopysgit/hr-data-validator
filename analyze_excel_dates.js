const XLSX = require('xlsx');
const path = require('path');

function analyzeExcelDates() {
  console.log('🔍 分析Excel文件中的日期格式...\n');
  
  try {
    // 读取Excel文件
    const excelPath = path.join('C:', '93 trae', '人力资源数据质量检查', '模拟数据-07171300.xlsx');
    console.log(`📂 读取文件: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    console.log(`📋 工作表列表: ${workbook.SheetNames.join(', ')}`);
    
    // 查找工资核算结果信息工作表
    const targetSheet = '工资核算结果信息';
    if (!workbook.SheetNames.includes(targetSheet)) {
      console.error(`❌ 未找到工作表: ${targetSheet}`);
      return;
    }
    
    console.log(`\n📊 分析工作表: ${targetSheet}`);
    const worksheet = workbook.Sheets[targetSheet];
    
    // 转换为JSON，保留原始格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false,  // 不使用原始值，获取格式化后的值
      dateNF: 'yyyy-mm-dd'  // 指定日期格式
    });
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true   // 获取原始值
    });
    
    console.log(`📈 总记录数: ${jsonData.length}`);
    
    if (jsonData.length === 0) {
      console.log('❌ 工作表为空');
      return;
    }
    
    // 分析前5条记录的日期字段
    console.log('\n🗓️ 日期字段分析 (前5条记录):');
    
    for (let i = 0; i < Math.min(5, jsonData.length); i++) {
      const formattedRecord = jsonData[i];
      const rawRecord = rawData[i];
      
      console.log(`\n--- 记录 ${i + 1} ---`);
      console.log(`员工工号: ${formattedRecord['员工工号'] || rawRecord['员工工号']}`);
      console.log(`工资项: ${formattedRecord['工资项名称'] || rawRecord['工资项名称']}`);
      
      // 分析开始时间
      const startTimeFormatted = formattedRecord['开始时间'];
      const startTimeRaw = rawRecord['开始时间'];
      console.log(`开始时间 (格式化): ${JSON.stringify(startTimeFormatted)} (${typeof startTimeFormatted})`);
      console.log(`开始时间 (原始值): ${JSON.stringify(startTimeRaw)} (${typeof startTimeRaw})`);
      
      // 分析结束时间
      const endTimeFormatted = formattedRecord['结束时间'];
      const endTimeRaw = rawRecord['结束时间'];
      console.log(`结束时间 (格式化): ${JSON.stringify(endTimeFormatted)} (${typeof endTimeFormatted})`);
      console.log(`结束时间 (原始值): ${JSON.stringify(endTimeRaw)} (${typeof endTimeRaw})`);
      
      // 如果是数字，尝试转换为日期
      if (typeof startTimeRaw === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(startTimeRaw);
        console.log(`开始时间 Excel日期解析: ${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`);
      }
      
      if (typeof endTimeRaw === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(endTimeRaw);
        console.log(`结束时间 Excel日期解析: ${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`);
      }
    }
    
    // 统计日期字段的数据类型分布
    console.log('\n📊 日期字段类型统计:');
    
    const startTimeTypes = {};
    const endTimeTypes = {};
    
    rawData.forEach(record => {
      const startType = typeof record['开始时间'];
      const endType = typeof record['结束时间'];
      
      startTimeTypes[startType] = (startTimeTypes[startType] || 0) + 1;
      endTimeTypes[endType] = (endTimeTypes[endType] || 0) + 1;
    });
    
    console.log('开始时间类型分布:', startTimeTypes);
    console.log('结束时间类型分布:', endTimeTypes);
    
    // 检查是否有唯一的日期值
    const uniqueStartDates = new Set();
    const uniqueEndDates = new Set();
    
    rawData.forEach(record => {
      if (record['开始时间'] !== null && record['开始时间'] !== undefined) {
        uniqueStartDates.add(record['开始时间']);
      }
      if (record['结束时间'] !== null && record['结束时间'] !== undefined) {
        uniqueEndDates.add(record['结束时间']);
      }
    });
    
    console.log(`\n📅 唯一开始日期数量: ${uniqueStartDates.size}`);
    console.log(`唯一开始日期值: ${Array.from(uniqueStartDates).slice(0, 10).join(', ')}${uniqueStartDates.size > 10 ? '...' : ''}`);
    
    console.log(`📅 唯一结束日期数量: ${uniqueEndDates.size}`);
    console.log(`唯一结束日期值: ${Array.from(uniqueEndDates).slice(0, 10).join(', ')}${uniqueEndDates.size > 10 ? '...' : ''}`);
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

// 运行分析
analyzeExcelDates();
