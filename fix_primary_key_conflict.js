// 修复城市社保标准配置表主键冲突问题的解决方案
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

async function fixPrimaryKeyConflict() {
  console.log('🔧 修复城市社保标准配置表主键冲突问题');
  console.log('=' .repeat(50));
  console.log();

  try {
    // 1. 读取Excel数据
    console.log('📊 1. 读取Excel文件...');
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
    
    console.log(`✅ 读取到 ${convertedData.length} 条记录`);
    console.log();

    // 2. 提供多种解决方案
    console.log('💡 2. 可用的解决方案:');
    console.log('   A. 使用 UPSERT (推荐) - 更新现有记录，插入新记录');
    console.log('   B. 清空表后重新导入 - 完全替换所有数据');
    console.log('   C. 只插入新记录 - 跳过已存在的ID');
    console.log();

    // 方案A: 使用UPSERT
    console.log('🔄 执行方案A: 使用UPSERT操作...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 分批处理，每批10条记录
    const batchSize = 10;
    for (let i = 0; i < convertedData.length; i += batchSize) {
      const batch = convertedData.slice(i, i + batchSize);
      
      console.log(`   处理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(convertedData.length/batchSize)} (${batch.length} 条记录)`);
      
      try {
        // 使用upsert操作，如果ID存在则更新，不存在则插入
        const { data, error } = await supabase
          .from('city_social_insurance_standards')
          .upsert(batch, { 
            onConflict: 'ID',  // 指定冲突字段
            ignoreDuplicates: false  // 不忽略重复，而是更新
          })
          .select();

        if (error) {
          console.error(`   ❌ 批次 ${Math.floor(i/batchSize) + 1} 失败:`, error.message);
          errorCount += batch.length;
          errors.push({
            batch: Math.floor(i/batchSize) + 1,
            error: error.message,
            records: batch.length
          });
        } else {
          console.log(`   ✅ 批次 ${Math.floor(i/batchSize) + 1} 成功处理 ${data?.length || batch.length} 条记录`);
          successCount += data?.length || batch.length;
        }
      } catch (batchError) {
        console.error(`   ❌ 批次 ${Math.floor(i/batchSize) + 1} 异常:`, batchError.message);
        errorCount += batch.length;
        errors.push({
          batch: Math.floor(i/batchSize) + 1,
          error: batchError.message,
          records: batch.length
        });
      }

      // 添加小延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log();
    console.log('📊 3. UPSERT操作结果:');
    console.log(`   ✅ 成功处理: ${successCount} 条记录`);
    console.log(`   ❌ 失败记录: ${errorCount} 条记录`);
    
    if (errors.length > 0) {
      console.log('\n   错误详情:');
      errors.forEach(err => {
        console.log(`     批次 ${err.batch}: ${err.error} (${err.records} 条记录)`);
      });
    }

    // 4. 验证最终结果
    console.log();
    console.log('🔍 4. 验证最终结果...');
    const { data: finalData, error: finalError } = await supabase
      .from('city_social_insurance_standards')
      .select('ID, 城市, 险种类型, 社保年度, 缴费基数生效依据, 缴费比例生效依据, 备注')
      .order('ID');

    if (finalError) {
      console.error('❌ 验证查询失败:', finalError.message);
    } else {
      console.log(`✅ 数据库中最终记录数: ${finalData?.length || 0}`);
      
      if (finalData && finalData.length > 0) {
        // 检查关键字段
        const hasRemark = finalData.filter(r => r.备注 !== null && r.备注 !== undefined).length;
        const hasBasisFields = finalData.filter(r => 
          (r.缴费基数生效依据 !== null && r.缴费基数生效依据 !== undefined) ||
          (r.缴费比例生效依据 !== null && r.缴费比例生效依据 !== undefined)
        ).length;
        
        console.log(`   📋 有备注字段的记录: ${hasRemark} 条`);
        console.log(`   📋 有生效依据字段的记录: ${hasBasisFields} 条`);
        
        // 显示前3条记录作为示例
        console.log('\n   📋 前3条记录示例:');
        finalData.slice(0, 3).forEach((record, index) => {
          console.log(`     记录 ${index + 1}: ID=${record.ID}, 城市=${record.城市}, 险种=${record.险种类型}, 年度=${record.社保年度}`);
        });
      }
    }

    console.log();
    console.log('✅ 主键冲突问题修复完成！');
    console.log('💡 建议: 在DataImport组件中使用upsert操作来避免未来的主键冲突');

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行修复
if (require.main === module) {
  fixPrimaryKeyConflict();
}

module.exports = { fixPrimaryKeyConflict };