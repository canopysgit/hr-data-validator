// 诊断城市社保标准配置表主键冲突问题
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟DataImport组件中的字段映射逻辑
function convertExcelDataToDbFormat(data) {
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

      // 处理特殊字段名
      if (key === 'ID') {
        dbKey = 'ID';
      } else if (key.toUpperCase() === 'ID') {
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

      // 处理空值
      if (value === '' || value === null || value === undefined) {
        value = null;
      }

      convertedRow[dbKey] = value;
    });

    return convertedRow;
  });
}

async function diagnosePrimaryKeyConflict() {
  console.log('🔍 诊断城市社保标准配置表主键冲突问题');
  console.log('=' .repeat(50));
  console.log();

  try {
    // 1. 检查数据库中现有数据的ID分布
    console.log('📊 1. 检查数据库中现有数据...');
    const { data: existingData, error: queryError } = await supabase
      .from('city_social_insurance_standards')
      .select('ID, 城市, 险种类型, 生效日期')
      .order('ID');

    if (queryError) {
      console.error('❌ 查询数据库失败:', queryError.message);
      return;
    }

    console.log(`✅ 数据库中现有记录数: ${existingData?.length || 0}`);
    
    if (existingData && existingData.length > 0) {
      // 检查ID重复情况
      const idCounts = {};
      existingData.forEach(record => {
        const id = record.ID;
        idCounts[id] = (idCounts[id] || 0) + 1;
      });

      const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);
      
      if (duplicateIds.length > 0) {
        console.log('⚠️  数据库中发现重复ID:');
        duplicateIds.forEach(([id, count]) => {
          console.log(`   ID ${id}: ${count} 条记录`);
        });
      } else {
        console.log('✅ 数据库中没有重复ID');
      }

      // 显示ID范围
      const ids = existingData.map(r => r.ID).filter(id => id !== null);
      if (ids.length > 0) {
        console.log(`📈 ID范围: ${Math.min(...ids)} - ${Math.max(...ids)}`);
        console.log(`📊 前5个ID: ${ids.slice(0, 5).join(', ')}`);
        console.log(`📊 后5个ID: ${ids.slice(-5).join(', ')}`);
      }
    }
    console.log();

    // 2. 检查Excel文件中的ID分布
    console.log('📊 2. 检查Excel文件中的数据...');
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    
    try {
      const workbook = XLSX.readFile(excelPath);
      const sheetName = '城市社保标准配置表';
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        console.error('❌ 未找到工作表:', sheetName);
        return;
      }

      const rawData = XLSX.utils.sheet_to_json(worksheet);
      console.log(`✅ Excel中原始记录数: ${rawData.length}`);

      // 转换数据格式
      const convertedData = convertExcelDataToDbFormat(rawData);
      console.log(`✅ 转换后记录数: ${convertedData.length}`);

      // 检查Excel中的ID分布
      const excelIds = convertedData.map(r => r.ID).filter(id => id !== null && id !== undefined);
      console.log(`✅ 有效ID数量: ${excelIds.length}`);

      if (excelIds.length > 0) {
        // 检查Excel中的ID重复情况
        const excelIdCounts = {};
        excelIds.forEach(id => {
          excelIdCounts[id] = (excelIdCounts[id] || 0) + 1;
        });

        const excelDuplicateIds = Object.entries(excelIdCounts).filter(([id, count]) => count > 1);
        
        if (excelDuplicateIds.length > 0) {
          console.log('⚠️  Excel中发现重复ID:');
          excelDuplicateIds.forEach(([id, count]) => {
            console.log(`   ID ${id}: ${count} 条记录`);
          });
        } else {
          console.log('✅ Excel中没有重复ID');
        }

        // 显示Excel ID范围
        console.log(`📈 Excel ID范围: ${Math.min(...excelIds)} - ${Math.max(...excelIds)}`);
        console.log(`📊 Excel前5个ID: ${excelIds.slice(0, 5).join(', ')}`);
        console.log(`📊 Excel后5个ID: ${excelIds.slice(-5).join(', ')}`);

        // 3. 检查ID冲突情况
        console.log();
        console.log('📊 3. 检查ID冲突情况...');
        
        if (existingData && existingData.length > 0) {
          const existingIds = new Set(existingData.map(r => r.ID));
          const conflictingIds = excelIds.filter(id => existingIds.has(id));
          
          if (conflictingIds.length > 0) {
            console.log(`⚠️  发现 ${conflictingIds.length} 个冲突ID:`);
            console.log(`   冲突ID: ${conflictingIds.slice(0, 10).join(', ')}${conflictingIds.length > 10 ? '...' : ''}`);
            
            // 显示冲突记录的详细信息
            console.log();
            console.log('📋 冲突记录详情 (前5个):');
            conflictingIds.slice(0, 5).forEach(id => {
              const dbRecord = existingData.find(r => r.ID === id);
              const excelRecord = convertedData.find(r => r.ID === id);
              
              console.log(`\n   ID ${id}:`);
              console.log(`     数据库: ${dbRecord?.城市} - ${dbRecord?.险种类型} - ${dbRecord?.生效日期}`);
              console.log(`     Excel:  ${excelRecord?.城市} - ${excelRecord?.险种类型} - ${excelRecord?.生效日期}`);
            });
          } else {
            console.log('✅ 没有发现ID冲突');
          }
        }

        // 4. 显示示例数据
        console.log();
        console.log('📋 4. Excel转换后的示例数据 (前3条):');
        convertedData.slice(0, 3).forEach((record, index) => {
          console.log(`\n   记录 ${index + 1}:`);
          console.log(`     ID: ${record.ID}`);
          console.log(`     城市: ${record.城市}`);
          console.log(`     险种类型: ${record.险种类型}`);
          console.log(`     生效日期: ${record.生效日期}`);
          console.log(`     社保年度: ${record.社保年度}`);
        });
      }

    } catch (excelError) {
      console.error('❌ 读取Excel文件失败:', excelError.message);
    }

    // 5. 提供解决方案建议
    console.log();
    console.log('💡 5. 解决方案建议:');
    console.log('   1. 如果数据库中已有数据，考虑使用 UPSERT 操作而不是 INSERT');
    console.log('   2. 在导入前清空表数据，或者使用 ON CONFLICT 处理');
    console.log('   3. 检查Excel中的ID是否应该是唯一的自增ID');
    console.log('   4. 考虑使用复合主键而不是单一ID字段');

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行诊断
if (require.main === module) {
  diagnosePrimaryKeyConflict();
}

module.exports = { diagnosePrimaryKeyConflict };