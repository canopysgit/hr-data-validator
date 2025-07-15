// 测试修复后的UPSERT功能
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟修复后的DataImport组件逻辑
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

async function testUpsertFix() {
  console.log('🧪 测试修复后的UPSERT功能');
  console.log('=' .repeat(50));
  console.log();

  try {
    // 1. 检查当前数据库状态
    console.log('📊 1. 检查当前数据库状态...');
    const { data: beforeData, error: beforeError } = await supabase
      .from('city_social_insurance_standards')
      .select('ID, 城市, 险种类型, 社保年度, 备注')
      .order('ID');

    if (beforeError) {
      console.error('❌ 查询失败:', beforeError.message);
      return;
    }

    console.log(`✅ 当前数据库记录数: ${beforeData?.length || 0}`);
    if (beforeData && beforeData.length > 0) {
      const hasRemark = beforeData.filter(r => r.备注 !== null && r.备注 !== undefined).length;
      console.log(`   📋 有备注字段的记录: ${hasRemark} 条`);
    }
    console.log();

    // 2. 读取Excel数据
    console.log('📊 2. 读取Excel数据...');
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = '城市社保标准配置表';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error('❌ 未找到工作表:', sheetName);
      return;
    }

    const rawData = XLSX.utils.sheet_to_json(worksheet);
    const convertedData = convertExcelDataToDbFormat(rawData);
    
    console.log(`✅ Excel记录数: ${convertedData.length}`);
    console.log();

    // 3. 模拟修复后的导入逻辑
    console.log('🔄 3. 执行UPSERT操作 (模拟修复后的DataImport逻辑)...');
    const tableName = 'city_social_insurance_standards';
    
    // 使用UPSERT操作避免主键冲突
    console.log(`使用UPSERT操作处理表 ${tableName}，避免主键冲突`);
    
    const batchSize = 20;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let j = 0; j < convertedData.length; j += batchSize) {
      const batch = convertedData.slice(j, j + batchSize);

      console.log(`处理批次 ${Math.floor(j/batchSize) + 1}:`, {
        表名: tableName,
        批次大小: batch.length,
        操作类型: 'UPSERT',
        批次数据示例: {
          ID: batch[0]?.ID,
          城市: batch[0]?.城市,
          险种类型: batch[0]?.险种类型,
          备注: batch[0]?.备注
        }
      });

      try {
        // 使用UPSERT操作，如果ID存在则更新，不存在则插入
        const { error, data: insertData } = await supabase
          .from(tableName)
          .upsert(batch, { 
            onConflict: 'ID',  // 指定冲突字段
            ignoreDuplicates: false  // 不忽略重复，而是更新
          })
          .select();

        if (error) {
          console.error(`   ❌ 批次 ${Math.floor(j/batchSize) + 1} 失败:`, error.message);
          errorCount += batch.length;
          errors.push({
            batch: Math.floor(j/batchSize) + 1,
            error: error.message,
            records: batch.length
          });
        } else {
          console.log(`   ✅ 批次 ${Math.floor(j/batchSize) + 1} 成功处理 ${insertData?.length || batch.length} 条记录`);
          successCount += insertData?.length || batch.length;
        }
      } catch (batchError) {
        console.error(`   ❌ 批次 ${Math.floor(j/batchSize) + 1} 异常:`, batchError.message);
        errorCount += batch.length;
        errors.push({
          batch: Math.floor(j/batchSize) + 1,
          error: batchError.message,
          records: batch.length
        });
      }

      // 添加小延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log();
    console.log('📊 4. UPSERT操作结果:');
    console.log(`   ✅ 成功处理: ${successCount} 条记录`);
    console.log(`   ❌ 失败记录: ${errorCount} 条记录`);
    
    if (errors.length > 0) {
      console.log('\n   错误详情:');
      errors.forEach(err => {
        console.log(`     批次 ${err.batch}: ${err.error} (${err.records} 条记录)`);
      });
    }

    // 5. 验证最终结果
    console.log();
    console.log('🔍 5. 验证最终结果...');
    const { data: afterData, error: afterError } = await supabase
      .from('city_social_insurance_standards')
      .select('ID, 城市, 险种类型, 社保年度, 缴费基数生效依据, 缴费比例生效依据, 备注')
      .order('ID');

    if (afterError) {
      console.error('❌ 验证查询失败:', afterError.message);
    } else {
      console.log(`✅ 最终数据库记录数: ${afterData?.length || 0}`);
      
      if (afterData && afterData.length > 0) {
        // 检查关键字段
        const hasRemark = afterData.filter(r => r.备注 !== null && r.备注 !== undefined).length;
        const hasBasisFields = afterData.filter(r => 
          (r.缴费基数生效依据 !== null && r.缴费基数生效依据 !== undefined) ||
          (r.缴费比例生效依据 !== null && r.缴费比例生效依据 !== undefined)
        ).length;
        
        console.log(`   📋 有备注字段的记录: ${hasRemark} 条`);
        console.log(`   📋 有生效依据字段的记录: ${hasBasisFields} 条`);
        
        // 检查是否有新增记录
        const beforeCount = beforeData?.length || 0;
        const afterCount = afterData?.length || 0;
        
        if (afterCount > beforeCount) {
          console.log(`   📈 新增记录: ${afterCount - beforeCount} 条`);
        } else if (afterCount === beforeCount) {
          console.log(`   🔄 记录数量不变，执行了更新操作`);
        }
        
        // 显示前3条记录作为示例
        console.log('\n   📋 前3条记录示例:');
        afterData.slice(0, 3).forEach((record, index) => {
          console.log(`     记录 ${index + 1}: ID=${record.ID}, 城市=${record.城市}, 险种=${record.险种类型}, 年度=${record.社保年度}`);
          if (record.备注) {
            console.log(`       备注: ${record.备注}`);
          }
        });
      }
    }

    console.log();
    console.log('✅ UPSERT功能测试完成！');
    console.log('💡 结论: 修复后的DataImport组件应该能够正确处理主键冲突问题');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  testUpsertFix();
}

module.exports = { testUpsertFix };