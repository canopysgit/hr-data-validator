// 测试ID字段修复后的导入功能
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟修复后的字段映射逻辑
function convertExcelDataToDbFormat(data) {
  const allowedFields = [
    'ID', '城市', '年度', '险种类型', '最低缴费基数', '最高缴费基数', '个人缴费比例',
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
        // 将Excel中的ID列名映射到数据库的'ID'字段（大写）
        dbKey = 'ID';
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
      }

      // 处理空值
      if (value === '' || value === null || value === undefined) {
        value = null;
      }

      // 检查字段是否在允许列表中
      if (allowedFields.includes(dbKey)) {
        convertedRow[dbKey] = value;
      }
    });

    return convertedRow;
  });
}

async function testIdFieldFix() {
  console.log('🔧 测试ID字段修复后的导入功能');
  console.log();

  try {
    // 1. 读取Excel文件
    console.log('📊 读取Excel文件...');
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '城市社保标准配置表';
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 成功读取 ${jsonData.length} 条原始数据`);
    
    // 2. 转换数据格式
    console.log('\n🔄 转换数据格式...');
    const convertedData = convertExcelDataToDbFormat(jsonData);
    
    console.log(`✅ 成功转换 ${convertedData.length} 条数据`);
    
    // 3. 检查ID字段映射
    console.log('\n🔍 检查ID字段映射:');
    if (convertedData.length > 0) {
      const sampleRecord = convertedData[0];
      const hasIdField = Object.keys(sampleRecord).includes('ID');
      const hasLowercaseId = Object.keys(sampleRecord).includes('id');
      
      console.log(`  大写ID字段存在: ${hasIdField ? '✅ 是' : '❌ 否'}`);
      console.log(`  小写id字段存在: ${hasLowercaseId ? '⚠️ 是（应该不存在）' : '✅ 否'}`);
      
      if (hasIdField) {
        console.log(`  ID字段值: ${sampleRecord.ID}`);
      }
    }
    
    // 4. 检查所有目标字段
    console.log('\n🔍 检查所有目标字段:');
    const targetFields = ['ID', '社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
    
    if (convertedData.length > 0) {
      const availableFields = Object.keys(convertedData[0]);
      
      targetFields.forEach(field => {
        const exists = availableFields.includes(field);
        console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
      });
    }
    
    // 5. 测试数据库插入
    console.log('\n🔄 测试数据库插入...');
    
    // 选择一条有备注的记录进行测试
    const testRecord = convertedData.find(record => {
      const value = record['备注'];
      return value !== null && value !== undefined && value !== '';
    }) || convertedData[0];
    
    if (testRecord) {
      console.log('选择测试记录:', {
        ID: testRecord.ID,
        城市: testRecord['城市'],
        险种类型: testRecord['险种类型']
      });
      
      // 先删除可能存在的测试记录
      await supabase
        .from('city_social_insurance_standards')
        .delete()
        .eq('ID', testRecord.ID);
      
      // 插入测试记录
      const { data: insertData, error: insertError } = await supabase
        .from('city_social_insurance_standards')
        .insert([testRecord])
        .select();
      
      if (insertError) {
        console.error('❌ 插入失败:', insertError.message);
        console.log('测试记录字段:', Object.keys(testRecord));
      } else {
        console.log('✅ 插入成功');
        
        // 验证所有目标字段
        console.log('\n🔍 验证目标字段:');
        const insertedRecord = insertData[0];
        
        targetFields.forEach(field => {
          const value = insertedRecord[field];
          const hasValue = value !== null && value !== undefined && value !== '';
          const displayValue = hasValue ? (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null';
          console.log(`  ${field}: ${hasValue ? '✅' : '❌'} ${displayValue}`);
        });
        
        // 最终结果
        const successCount = targetFields.filter(field => {
          const value = insertedRecord[field];
          return value !== null && value !== undefined && value !== '';
        }).length;
        
        console.log(`\n🎉 结果: ${successCount}/${targetFields.length} 个字段成功导入`);
        
        if (successCount === targetFields.length) {
          console.log('✅ 所有字段修复成功！');
        } else {
          const missingFields = targetFields.filter(field => {
            const value = insertedRecord[field];
            return value === null || value === undefined || value === '';
          });
          console.log(`⚠️ 缺失字段: ${missingFields.join(', ')}`);
        }
        
        // 清理测试记录
        await supabase
          .from('city_social_insurance_standards')
          .delete()
          .eq('ID', testRecord.ID);
        console.log('\n🗑️ 已清理测试记录');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testIdFieldFix();