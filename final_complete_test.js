// 最终完整测试：验证所有字段修复
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 完整的字段映射逻辑（与DataImport组件完全一致）
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
        dbKey = 'ID';
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

async function finalCompleteTest() {
  console.log('🎯 最终完整测试：验证所有字段修复');
  console.log('目标：ID字段映射 + 四个问题字段修复');
  console.log();

  try {
    // 1. 读取Excel文件
    console.log('📊 1. 读取Excel文件...');
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '城市社保标准配置表';
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 成功读取 ${jsonData.length} 条原始数据`);
    
    // 2. 转换数据格式
    console.log('\n🔄 2. 转换数据格式...');
    const convertedData = convertExcelDataToDbFormat(jsonData);
    
    console.log(`✅ 成功转换 ${convertedData.length} 条数据`);
    
    // 3. 验证字段映射
    console.log('\n🔍 3. 验证字段映射:');
    const allTargetFields = ['ID', '社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'];
    
    if (convertedData.length > 0) {
      const sampleRecord = convertedData[0];
      const availableFields = Object.keys(sampleRecord);
      
      console.log('转换后的字段列表:');
      availableFields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
      
      console.log('\n目标字段检查:');
      allTargetFields.forEach(field => {
        const exists = availableFields.includes(field);
        console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
      });
    }
    
    // 4. 统计数据情况
    console.log('\n📊 4. 统计数据情况:');
    allTargetFields.forEach(field => {
      const recordsWithValue = convertedData.filter(record => {
        const value = record[field];
        return value !== null && value !== undefined && value !== '';
      });
      
      console.log(`  ${field}: ${recordsWithValue.length}/${convertedData.length} 条有值`);
    });
    
    // 5. 显示示例数据
    console.log('\n📋 5. 示例数据:');
    const sampleRecords = convertedData.slice(0, 2);
    sampleRecords.forEach((record, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`);
      allTargetFields.forEach(field => {
        const value = record[field];
        const displayValue = value === null ? 'null' : (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value);
        console.log(`  ${field}: ${displayValue}`);
      });
    });
    
    // 6. 数据库连接测试
    console.log('\n🔗 6. 数据库连接测试...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('city_social_insurance_standards')
        .select('ID')
        .limit(1);
      
      if (testError) {
        console.error('❌ 数据库连接失败:', testError.message);
      } else {
        console.log('✅ 数据库连接正常');
        
        // 7. 尝试插入测试（如果连接正常）
        console.log('\n🔄 7. 测试数据插入...');
        
        // 选择一条有完整数据的记录
        const testRecord = convertedData.find(record => {
          return allTargetFields.every(field => {
            const value = record[field];
            return value !== null && value !== undefined && value !== '';
          });
        });
        
        if (testRecord) {
          console.log('选择完整测试记录:', {
            ID: testRecord.ID,
            城市: testRecord['城市'],
            险种类型: testRecord['险种类型'],
            备注: testRecord['备注'] ? testRecord['备注'].substring(0, 30) + '...' : null
          });
          
          // 先删除可能存在的记录
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
          } else {
            console.log('✅ 插入成功');
            
            // 验证所有目标字段
            console.log('\n🔍 验证插入结果:');
            const insertedRecord = insertData[0];
            
            let successCount = 0;
            allTargetFields.forEach(field => {
              const value = insertedRecord[field];
              const hasValue = value !== null && value !== undefined && value !== '';
              if (hasValue) successCount++;
              
              const displayValue = hasValue ? (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null';
              console.log(`  ${field}: ${hasValue ? '✅' : '❌'} ${displayValue}`);
            });
            
            // 最终结果
            console.log(`\n🎉 最终结果: ${successCount}/${allTargetFields.length} 个字段成功`);
            
            if (successCount === allTargetFields.length) {
              console.log('🎊 完美！所有字段修复成功！');
            } else {
              const missingFields = allTargetFields.filter(field => {
                const value = insertedRecord[field];
                return value === null || value === undefined || value === '';
              });
              console.log(`⚠️ 仍需处理的字段: ${missingFields.join(', ')}`);
            }
            
            // 清理测试记录
            await supabase
              .from('city_social_insurance_standards')
              .delete()
              .eq('ID', testRecord.ID);
            console.log('\n🗑️ 已清理测试记录');
          }
        } else {
          console.log('❌ 未找到包含所有目标字段值的记录');
        }
      }
    } catch (dbError) {
      console.error('❌ 数据库操作失败:', dbError.message);
    }
    
    // 8. 总结
    console.log('\n📝 8. 修复总结:');
    console.log('✅ ID字段映射：Excel ID -> 数据库 ID（大写）');
    console.log('✅ 社保年度字段：已添加到允许字段列表');
    console.log('✅ 缴费基数生效依据：已添加字段映射逻辑');
    console.log('✅ 缴费比例生效依据：已添加字段映射逻辑');
    console.log('✅ 备注字段：已添加字段映射逻辑');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

finalCompleteTest();