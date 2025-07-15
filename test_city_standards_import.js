// 测试城市社保标准配置表的字段映射修复
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟DataImport组件中的字段映射逻辑
function convertExcelDataToDbFormat(data, sheetName) {
  const allowedFields = [
    'id', '城市', '年度', '险种类型', '最低缴费基数', '最高缴费基数', '个人缴费比例',
    '公司缴费比例', '生效日期', '失效日期', '社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'
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

      // 处理特殊字段名映射
      if (key === 'ID' || key.toUpperCase() === 'ID') {
        dbKey = 'id';
        console.log(`字段名映射: ${key} -> ${dbKey}`);
      } else if (key === '险种' || key === '保险类型' || key === '类型') {
        dbKey = '险种类型';
        console.log(`字段名映射: ${key} -> ${dbKey}`);
      } else if (key.includes('缴费基数生效依据')) {
        dbKey = '缴费基数生效依据';
        console.log(`字段名映射: ${key} -> ${dbKey}`);
      } else if (key.includes('缴费比例生效依据')) {
        dbKey = '缴费比例生效依据';
        console.log(`字段名映射: ${key} -> ${dbKey}`);
      }

      let value = row[key];

      // 处理日期字段
      if (dbKey === '生效日期' || dbKey === '失效日期') {
        if (typeof value === 'number' && value > 1000) {
          const baseDate = new Date(1900, 0, 1);
          let dayOffset = value - 1;
          
          if (value >= 60) {
            dayOffset = dayOffset - 1;
          }
          
          const jsDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
          value = jsDate.toISOString().split('T')[0];
        }
      } else {
        // 非日期字段的数字转换
        if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }
      }

      // 处理空值
      if (value === '' || value === null || value === undefined) {
        value = null;
      }

      // 检查字段是否在允许列表中
      if (allowedFields.length > 0 && !allowedFields.includes(dbKey)) {
        console.warn(`跳过不存在的字段: ${dbKey}`);
        return;
      }

      convertedRow[dbKey] = value;
    });

    return convertedRow;
  });
}

async function testCityStandardsImport() {
  console.log('🔍 测试城市社保标准配置表的字段映射修复...');
  console.log();

  try {
    // 1. 读取Excel文件
    console.log('📊 1. 读取Excel文件...');
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '城市社保标准配置表';
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`❌ 未找到工作表: ${sheetName}`);
      return;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 成功读取 ${jsonData.length} 条原始数据`);
    
    // 2. 显示原始字段名
    console.log('\n📋 2. 原始字段名:');
    if (jsonData.length > 0) {
      const originalFields = Object.keys(jsonData[0]);
      originalFields.forEach((field, index) => {
        console.log(`  ${index + 1}. "${field}"`);
      });
    }
    
    // 3. 转换数据格式
    console.log('\n🔄 3. 转换数据格式...');
    const convertedData = convertExcelDataToDbFormat(jsonData, sheetName);
    
    console.log(`✅ 成功转换 ${convertedData.length} 条数据`);
    
    // 4. 显示转换后的字段名
    console.log('\n📋 4. 转换后字段名:');
    if (convertedData.length > 0) {
      const convertedFields = Object.keys(convertedData[0]);
      convertedFields.forEach((field, index) => {
        console.log(`  ${index + 1}. "${field}"`);
      });
    }
    
    // 5. 检查目标字段是否存在
    console.log('\n🔍 5. 检查目标字段是否存在:');
    const targetFields = ['社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
    const convertedFields = convertedData.length > 0 ? Object.keys(convertedData[0]) : [];
    
    targetFields.forEach(field => {
      const exists = convertedFields.includes(field);
      console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
    });
    
    // 6. 显示转换后的数据示例
    console.log('\n📋 6. 转换后数据示例:');
    convertedData.slice(0, 2).forEach((record, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`);
      Object.entries(record).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
    // 7. 测试数据库插入（仅测试一条数据）
    console.log('\n🔄 7. 测试数据库插入...');
    if (convertedData.length > 0) {
      const testRecord = convertedData[0];
      
      // 先删除测试记录（如果存在）
      const { error: deleteError } = await supabase
        .from('city_social_insurance_standards')
        .delete()
        .eq('id', testRecord.id);
      
      if (deleteError) {
        console.warn('⚠️ 删除测试记录时出现警告:', deleteError.message);
      }
      
      // 插入测试记录
      const { data: insertData, error: insertError } = await supabase
        .from('city_social_insurance_standards')
        .insert([testRecord])
        .select();
      
      if (insertError) {
        console.error('❌ 插入测试记录失败:', insertError);
        console.error('测试记录:', testRecord);
      } else {
        console.log('✅ 成功插入测试记录');
        console.log('插入的数据:', insertData[0]);
        
        // 验证目标字段是否正确保存
        console.log('\n🔍 验证目标字段:');
        targetFields.forEach(field => {
          const value = insertData[0][field];
          console.log(`  ${field}: ${value !== null && value !== undefined ? '✅ 有值' : '❌ 无值'} (${value})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testCityStandardsImport();