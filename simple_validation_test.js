// 简化的验证测试
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 简化的字段映射逻辑
function convertExcelDataToDbFormat(data) {
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
      } else if (key === '险种' || key === '保险类型' || key === '类型') {
        dbKey = '险种类型';
      } else if (key.includes('缴费基数生效依据')) {
        dbKey = '缴费基数生效依据';
      } else if (key.includes('缴费比例生效依据')) {
        dbKey = '缴费比例生效依据';
      } else if (key.includes('备注') || key.toLowerCase().includes('remark') || key.toLowerCase().includes('note')) {
        dbKey = '备注';
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

async function simpleValidationTest() {
  console.log('✅ 简化验证测试：检查四个目标字段的修复情况');
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
    
    // 3. 检查目标字段
    console.log('\n🔍 检查目标字段:');
    const targetFields = ['社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
    
    if (convertedData.length > 0) {
      const sampleRecord = convertedData[0];
      const availableFields = Object.keys(sampleRecord);
      
      console.log('可用字段:', availableFields.join(', '));
      console.log();
      
      targetFields.forEach(field => {
        const exists = availableFields.includes(field);
        console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
      });
    }
    
    // 4. 统计数据情况
    console.log('\n📊 统计数据情况:');
    targetFields.forEach(field => {
      const recordsWithValue = convertedData.filter(record => {
        const value = record[field];
        return value !== null && value !== undefined && value !== '';
      });
      
      console.log(`  ${field}: ${recordsWithValue.length}/${convertedData.length} 条有值`);
    });
    
    // 5. 测试数据库插入
    console.log('\n🔄 测试数据库插入...');
    
    // 找一条有备注的记录
    const recordWithRemark = convertedData.find(record => {
      const value = record['备注'];
      return value !== null && value !== undefined && value !== '';
    });
    
    if (recordWithRemark) {
      console.log('选择测试记录:', {
        id: recordWithRemark.id,
        城市: recordWithRemark['城市'],
        险种类型: recordWithRemark['险种类型'],
        备注: recordWithRemark['备注'] ? recordWithRemark['备注'].substring(0, 50) + '...' : null
      });
      
      // 先删除测试记录
      await supabase
        .from('city_social_insurance_standards')
        .delete()
        .eq('id', recordWithRemark.id);
      
      // 插入测试记录
      const { data: insertData, error: insertError } = await supabase
        .from('city_social_insurance_standards')
        .insert([recordWithRemark])
        .select();
      
      if (insertError) {
        console.error('❌ 插入失败:', insertError.message);
      } else {
        console.log('✅ 插入成功');
        
        // 验证目标字段
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
          console.log('✅ 所有目标字段修复成功！');
        } else {
          console.log('⚠️ 部分字段仍需检查');
        }
      }
    } else {
      console.log('❌ 未找到包含备注的记录');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

simpleValidationTest();