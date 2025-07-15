// 调试备注字段映射问题
const XLSX = require('xlsx');
const path = require('path');

async function debugRemarkField() {
  console.log('🔍 调试备注字段映射问题...');
  console.log();

  try {
    // 读取Excel文件
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '城市社保标准配置表';
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 总共读取 ${jsonData.length} 条数据`);
    console.log();
    
    // 1. 检查每条记录的所有字段
    console.log('🔍 1. 检查每条记录的字段情况:');
    const allFieldsSet = new Set();
    
    jsonData.forEach((record, index) => {
      const fields = Object.keys(record);
      fields.forEach(field => allFieldsSet.add(field));
      
      if (index < 5) { // 只显示前5条记录的详细信息
        console.log(`\n--- 记录 ${index + 1} ---`);
        console.log(`字段数量: ${fields.length}`);
        console.log('字段列表:');
        fields.forEach(field => {
          const value = record[field];
          const hasValue = value !== null && value !== undefined && value !== '';
          console.log(`  "${field}": ${hasValue ? '有值' : '无值'} (${typeof value})`);
        });
      }
    });
    
    // 2. 显示所有唯一字段
    console.log('\n📋 2. 所有唯一字段:');
    const allFields = Array.from(allFieldsSet).sort();
    allFields.forEach((field, index) => {
      console.log(`  ${index + 1}. "${field}" (长度: ${field.length})`);
    });
    
    // 3. 查找包含"备注"的字段
    console.log('\n🔍 3. 查找包含"备注"的字段:');
    const remarkFields = allFields.filter(field => 
      field.includes('备注') || 
      field.toLowerCase().includes('remark') || 
      field.toLowerCase().includes('note')
    );
    
    if (remarkFields.length > 0) {
      console.log('找到以下备注相关字段:');
      remarkFields.forEach(field => {
        console.log(`  "${field}"`);
        
        // 统计该字段的值分布
        const valueStats = { hasValue: 0, noValue: 0 };
        jsonData.forEach(record => {
          const value = record[field];
          if (value !== null && value !== undefined && value !== '') {
            valueStats.hasValue++;
          } else {
            valueStats.noValue++;
          }
        });
        
        console.log(`    有值: ${valueStats.hasValue} 条`);
        console.log(`    无值: ${valueStats.noValue} 条`);
      });
    } else {
      console.log('❌ 未找到包含"备注"的字段');
    }
    
    // 4. 模拟字段映射过程
    console.log('\n🔄 4. 模拟字段映射过程:');
    const sampleRecord = jsonData[1]; // 使用第2条记录（通常有备注）
    const mappedFields = {};
    
    Object.keys(sampleRecord).forEach(key => {
      let dbKey = key;
      
      // 跳过空列和无效列
      if (key.startsWith('__EMPTY') ||
          key.startsWith('Unnamed:') ||
          key === '' ||
          key === null ||
          key === undefined) {
        console.log(`跳过无效字段: "${key}"`);
        return;
      }
      
      // 处理特殊字段名映射
      if (key === 'ID' || key.toUpperCase() === 'ID') {
        dbKey = 'id';
        console.log(`字段名映射: "${key}" -> "${dbKey}"`);
      } else if (key === '险种' || key === '保险类型' || key === '类型') {
        dbKey = '险种类型';
        console.log(`字段名映射: "${key}" -> "${dbKey}"`);
      } else if (key.includes('缴费基数生效依据')) {
        dbKey = '缴费基数生效依据';
        console.log(`字段名映射: "${key}" -> "${dbKey}"`);
      } else if (key.includes('缴费比例生效依据')) {
        dbKey = '缴费比例生效依据';
        console.log(`字段名映射: "${key}" -> "${dbKey}"`);
      } else if (key.includes('备注') || key.toLowerCase().includes('remark') || key.toLowerCase().includes('note')) {
        dbKey = '备注';
        console.log(`字段名映射: "${key}" -> "${dbKey}"`);
      } else {
        console.log(`保持原字段名: "${key}"`);
      }
      
      mappedFields[dbKey] = sampleRecord[key];
    });
    
    console.log('\n📋 映射后的字段:');
    Object.keys(mappedFields).forEach(field => {
      console.log(`  "${field}"`);
    });
    
    // 5. 检查备注字段是否在映射后存在
    console.log('\n🔍 5. 检查备注字段是否在映射后存在:');
    const hasRemarkField = Object.keys(mappedFields).includes('备注');
    console.log(`备注字段存在: ${hasRemarkField ? '✅ 是' : '❌ 否'}`);
    
    if (hasRemarkField) {
      const remarkValue = mappedFields['备注'];
      console.log(`备注字段值: ${remarkValue}`);
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
}

debugRemarkField();