// 测试员工合同信息表字段映射修复
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟修复后的DataImport组件中的字段映射逻辑
function convertExcelDataToDbFormat(data, sheetName) {
  // 修复后的员工合同信息表允许字段
  const allowedFields = [
    '员工工号', '姓', '名', '开始日期', '结束日期', '签订日期',
    '合同类型', '劳动合同主体', '劳动合同主体所在城市', '合同期限类型', '是否竞业协议',
    '劳动合同状态', '签署类型', '签署年限'
  ];

  return data.map(row => {
    const convertedRow = {};

    Object.keys(row).forEach(key => {
      let dbKey = key;

      // 跳过空列和无效列
      if (key.startsWith('__EMPTY') ||
          key.startsWith('Unnamed:') ||
          key === '' ||
          key === null ||
          key === undefined) {
        return;
      }

      // 处理数据类型转换
      let value = row[key];

      // 处理日期字段
      if (dbKey === '开始日期' || dbKey === '结束日期' || dbKey === '签订日期') {
        if (typeof value === 'number' && value > 1000) {
          // Excel日期序列号转换
          const baseDate = new Date(1900, 0, 1);
          let dayOffset = value - 1;
          
          if (value >= 60) {
            dayOffset = dayOffset - 1;
          }
          
          const resultDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
          value = resultDate.toISOString().split('T')[0];
        } else if (typeof value === 'string' && value !== '') {
          value = value.trim();
        }
      }

      // 处理文本字段
      if (typeof value === 'string') {
        value = value.trim();
      }

      // 只保留允许的字段
      if (allowedFields.includes(dbKey)) {
        convertedRow[dbKey] = value;
      }
    });

    return convertedRow;
  });
}

async function testContractFieldFix() {
  console.log('🔍 测试员工合同信息表字段映射修复...');
  console.log();

  try {
    // 1. 检查原始Excel文件中的字段
    console.log('=== 1. 检查原始Excel文件中的字段 ===');
    const excelPath = path.join(__dirname, 'data', 'HR数据质量检查工具测试数据.xlsx');
    
    let workbook;
    try {
      workbook = XLSX.readFile(excelPath);
    } catch (error) {
      console.log('❌ 无法找到Excel文件，请确保文件路径正确');
      console.log('   预期路径:', excelPath);
      return;
    }

    const sheetName = '员工合同信息';
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log('❌ 未找到"员工合同信息"工作表');
      console.log('   可用工作表:', workbook.SheetNames);
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Excel文件中"员工合同信息"工作表包含 ${jsonData.length} 条记录`);
    
    if (jsonData.length > 0) {
      console.log('📋 Excel文件中的字段名:');
      Object.keys(jsonData[0]).forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}`);
      });
      
      // 检查是否包含"劳动合同主体所在城市"字段
      const hasLocationField = Object.keys(jsonData[0]).includes('劳动合同主体所在城市');
      console.log();
      console.log(`🎯 "劳动合同主体所在城市"字段存在: ${hasLocationField ? '✅ 是' : '❌ 否'}`);
      
      if (hasLocationField) {
        // 分析该字段的数据分布
        const locationData = jsonData.map(row => row['劳动合同主体所在城市']).filter(val => val != null && val !== '');
        const uniqueLocations = [...new Set(locationData)];
        
        console.log(`📈 "劳动合同主体所在城市"字段数据分布:`);
        console.log(`   - 非空记录数: ${locationData.length}/${jsonData.length}`);
        console.log(`   - 唯一值数量: ${uniqueLocations.length}`);
        console.log(`   - 唯一值列表: ${uniqueLocations.join(', ')}`);
      }
    }

    // 2. 测试修复后的字段映射逻辑
    console.log();
    console.log('=== 2. 测试修复后的字段映射逻辑 ===');
    const convertedData = convertExcelDataToDbFormat(jsonData, sheetName);
    
    console.log(`🔄 转换后的数据记录数: ${convertedData.length}`);
    
    if (convertedData.length > 0) {
      console.log('📋 转换后的字段名:');
      Object.keys(convertedData[0]).forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}`);
      });
      
      // 检查转换后是否保留了"劳动合同主体所在城市"字段
      const hasLocationFieldAfterConversion = Object.keys(convertedData[0]).includes('劳动合同主体所在城市');
      console.log();
      console.log(`🎯 转换后"劳动合同主体所在城市"字段保留: ${hasLocationFieldAfterConversion ? '✅ 是' : '❌ 否'}`);
      
      if (hasLocationFieldAfterConversion) {
        // 分析转换后该字段的数据
        const locationDataAfterConversion = convertedData.map(row => row['劳动合同主体所在城市']).filter(val => val != null && val !== '');
        const uniqueLocationsAfterConversion = [...new Set(locationDataAfterConversion)];
        
        console.log(`📈 转换后"劳动合同主体所在城市"字段数据:`);
        console.log(`   - 非空记录数: ${locationDataAfterConversion.length}/${convertedData.length}`);
        console.log(`   - 唯一值数量: ${uniqueLocationsAfterConversion.length}`);
        console.log(`   - 唯一值列表: ${uniqueLocationsAfterConversion.join(', ')}`);
        
        // 显示前几条示例数据
        console.log();
        console.log('📝 前3条转换后的示例数据:');
        convertedData.slice(0, 3).forEach((row, index) => {
          console.log(`   记录 ${index + 1}:`);
          console.log(`     员工工号: ${row['员工工号']}`);
          console.log(`     姓名: ${row['姓']} ${row['名']}`);
          console.log(`     劳动合同主体: ${row['劳动合同主体']}`);
          console.log(`     劳动合同主体所在城市: ${row['劳动合同主体所在城市']}`);
          console.log();
        });
      }
    }

    // 3. 检查当前数据库中的数据
    console.log('=== 3. 检查当前数据库中的合同数据 ===');
    const { data: currentContracts, error: fetchError } = await supabase
      .from('employee_contracts')
      .select('员工工号, 姓, 名, 劳动合同主体, 劳动合同主体所在城市')
      .limit(5);

    if (fetchError) {
      console.log('❌ 查询数据库失败:', fetchError.message);
    } else {
      console.log(`📊 数据库中当前有 ${currentContracts.length} 条合同记录（显示前5条）`);
      currentContracts.forEach((contract, index) => {
        console.log(`   记录 ${index + 1}:`);
        console.log(`     员工工号: ${contract['员工工号']}`);
        console.log(`     姓名: ${contract['姓']} ${contract['名']}`);
        console.log(`     劳动合同主体: ${contract['劳动合同主体']}`);
        console.log(`     劳动合同主体所在城市: ${contract['劳动合同主体所在城市']}`);
        console.log();
      });
    }

    console.log('✅ 字段映射修复测试完成！');
    console.log();
    console.log('📋 修复总结:');
    console.log('   1. ✅ 已在DataImport.tsx中添加"劳动合同主体所在城市"字段到ALLOWED_FIELDS');
    console.log('   2. 🔄 需要重新导入员工合同数据以应用修复');
    console.log('   3. 🎯 修复后该字段应该能正确保存到数据库中');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testContractFieldFix();