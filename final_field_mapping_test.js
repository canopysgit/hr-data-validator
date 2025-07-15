// 最终测试：验证所有四个字段的修复情况
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 完整的字段映射逻辑（与DataImport组件保持一致）
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
      } else if (key.includes('备注') || key.toLowerCase().includes('remark') || key.toLowerCase().includes('note')) {
        dbKey = '备注';
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

async function finalFieldMappingTest() {
  console.log('🎯 最终测试：验证所有四个字段的修复情况');
  console.log('目标字段：社保年度、缴费基数生效依据、缴费比例生效依据、备注');
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
    
    // 2. 转换数据格式
    console.log('\n🔄 2. 转换数据格式...');
    const convertedData = convertExcelDataToDbFormat(jsonData, sheetName);
    
    console.log(`✅ 成功转换 ${convertedData.length} 条数据`);
    
    // 3. 检查目标字段是否存在
    console.log('\n🔍 3. 检查目标字段是否存在:');
    const targetFields = ['社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
    const convertedFields = convertedData.length > 0 ? Object.keys(convertedData[0]) : [];
    
    let allFieldsExist = true;
    targetFields.forEach(field => {
      const exists = convertedFields.includes(field);
      console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
      if (!exists) allFieldsExist = false;
    });
    
    if (!allFieldsExist) {
      console.log('\n❌ 部分字段不存在，请检查字段映射逻辑');
      return;
    }
    
    // 4. 统计目标字段的数据情况
    console.log('\n📊 4. 统计目标字段的数据情况:');
    targetFields.forEach(field => {
      const hasValueCount = convertedData.filter(record => {
        const value = record[field];
        return value !== null && value !== undefined && value !== '';
      }).length;
      
      const nullCount = convertedData.length - hasValueCount;
      console.log(`  ${field}:`);
      console.log(`    有值: ${hasValueCount} 条`);
      console.log(`    无值: ${nullCount} 条`);
    });
    
    // 5. 显示有备注字段值的记录
    console.log('\n📋 5. 显示有备注字段值的记录:');
    const recordsWithRemark = convertedData.filter(record => {
      const value = record['备注'];
      return value !== null && value !== undefined && value !== '';
    });
    
    console.log(`找到 ${recordsWithRemark.length} 条有备注的记录:`);
    recordsWithRemark.slice(0, 5).forEach((record, index) => {
      console.log(`\n--- 记录 ${index + 1} (ID: ${record.id}) ---`);
      console.log(`  城市: ${record['城市']}`);
      console.log(`  险种类型: ${record['险种类型']}`);
      console.log(`  备注: ${record['备注']}`);
    });
    
    // 6. 测试数据库插入（选择一条有备注的记录）
    console.log('\n🔄 6. 测试数据库插入（选择一条有备注的记录）...');
    if (recordsWithRemark.length > 0) {
      const testRecord = recordsWithRemark[0];
      
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
        
        // 验证目标字段是否正确保存
        console.log('\n🔍 验证目标字段:');
        targetFields.forEach(field => {
          const value = insertData[0][field];
          const hasValue = value !== null && value !== undefined && value !== '';
          console.log(`  ${field}: ${hasValue ? '✅ 有值' : '❌ 无值'} (${value})`);
        });
        
        // 最终结果
        console.log('\n🎉 最终结果:');
        const successCount = targetFields.filter(field => {
          const value = insertData[0][field];
          return value !== null && value !== undefined && value !== '';
        }).length;
        
        console.log(`成功导入 ${successCount}/${targetFields.length} 个目标字段`);
        
        if (successCount === targetFields.length) {
          console.log('✅ 所有目标字段都已成功修复！');
        } else {
          console.log('⚠️ 部分字段仍需要进一步检查');
        }
      }
    } else {
      console.log('❌ 没有找到包含备注的记录，无法进行完整测试');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

finalFieldMappingTest();