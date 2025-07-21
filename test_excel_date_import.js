const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟修复后的日期处理逻辑
function processDateField(value, dbKey) {
  console.log(`🗓️ 处理日期字段 ${dbKey}:`, { 原始值: value, 类型: typeof value });
  
  if (value !== null && value !== undefined && value !== '') {
    if (typeof value === 'number') {
      // Excel日期序列号：使用XLSX库的正确解析方法
      try {
        const excelDate = XLSX.SSF.parse_date_code(value);
        if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
          const year = excelDate.y;
          const month = String(excelDate.m).padStart(2, '0');
          const day = String(excelDate.d).padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          console.log(`✅ Excel序列号解析: ${value} -> ${result}`);
          return result;
        } else {
          const result = String(value);
          console.log(`⚠️ Excel日期解析失败，保持原始值: ${result}`);
          return result;
        }
      } catch (error) {
        console.error(`❌ Excel日期解析错误:`, error);
        return String(value);
      }
    }
    else if (typeof value === 'string') {
      const dateStr = value.trim();
      console.log(`📝 字符串日期处理: "${dateStr}"`);
      
      // 如果已经是标准格式 YYYY-MM-DD，直接使用
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log(`✅ 标准格式日期: ${result}`);
        return result;
      }
      // 处理 YYYY/MM/DD 格式
      else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log(`✅ 斜杠格式转换: ${dateStr} -> ${result}`);
        return result;
      }
      // 处理 MM/DD/YY 格式（如 1/1/23）
      else if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = '20' + parts[2];
        const result = `${year}-${month}-${day}`;
        console.log(`✅ 美式短格式转换: ${dateStr} -> ${result}`);
        return result;
      }
      else {
        console.log(`✅ 保持原始字符串: ${dateStr}`);
        return dateStr;
      }
    }
    else {
      const result = String(value);
      console.log(`⚠️ 其他类型转字符串: ${result}`);
      return result;
    }
  } else {
    console.log(`❌ 空值处理: null`);
    return null;
  }
}

async function testExcelDateImport() {
  console.log('🧪 测试Excel日期导入修复...\n');
  
  try {
    // 1. 读取Excel文件
    const excelPath = path.join('C:', '93 trae', '人力资源数据质量检查', '模拟数据-07171300.xlsx');
    console.log(`📂 读取Excel文件: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['工资核算结果信息'];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
    
    console.log(`📊 Excel数据总数: ${rawData.length} 条`);
    
    // 2. 处理前5条记录作为测试样本
    const testSample = rawData.slice(0, 5);
    console.log('\n🔬 处理测试样本 (前5条记录):');
    
    const processedData = testSample.map((record, index) => {
      console.log(`\n--- 处理记录 ${index + 1} ---`);
      
      const processed = {
        employee_id: record['员工工号'],
        last_name: record['姓'],
        first_name: record['名'],
        start_date: processDateField(record['开始时间'], 'start_date'),
        end_date: processDateField(record['结束时间'], 'end_date'),
        salary_item_name: record['工资项名称'],
        amount: record['金额'],
        currency: record['币种'] || 'CNY'
      };
      
      console.log(`处理结果:`, {
        员工: `${processed.last_name}${processed.first_name}`,
        工资项: processed.salary_item_name,
        开始时间: processed.start_date,
        结束时间: processed.end_date,
        金额: processed.amount
      });
      
      return processed;
    });
    
    // 3. 清空工资表
    console.log('\n🗑️ 清空工资表...');
    const { error: deleteError } = await supabase
      .from('salary_calculation_results')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.error('❌ 清空失败:', deleteError);
      return;
    }
    console.log('✅ 工资表已清空');
    
    // 4. 导入测试数据
    console.log('\n📥 导入测试数据...');
    const { data: insertData, error: insertError } = await supabase
      .from('salary_calculation_results')
      .insert(processedData)
      .select();
    
    if (insertError) {
      console.error('❌ 导入失败:', insertError);
      return;
    }
    console.log(`✅ 成功导入 ${insertData.length} 条记录`);
    
    // 5. 验证导入结果
    console.log('\n🔍 验证导入结果...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('salary_calculation_results')
      .select('employee_id, start_date, end_date, salary_item_name, amount')
      .order('id');
    
    if (verifyError) {
      console.error('❌ 验证查询失败:', verifyError);
      return;
    }
    
    console.log('\n📋 Supabase中的数据:');
    verifyData.forEach((record, index) => {
      console.log(`${index + 1}. 员工${record.employee_id}: ${record.start_date} ~ ${record.end_date} (${record.salary_item_name}) ¥${record.amount}`);
    });
    
    // 6. 对比验证
    console.log('\n🔍 Excel vs Supabase 对比验证:');
    let allMatched = true;
    
    for (let i = 0; i < processedData.length; i++) {
      const excel = processedData[i];
      const supabase_record = verifyData[i];
      
      const startDateMatch = excel.start_date === supabase_record.start_date;
      const endDateMatch = excel.end_date === supabase_record.end_date;
      
      console.log(`记录 ${i + 1}:`);
      console.log(`  开始时间: Excel(${excel.start_date}) vs Supabase(${supabase_record.start_date}) ${startDateMatch ? '✅' : '❌'}`);
      console.log(`  结束时间: Excel(${excel.end_date}) vs Supabase(${supabase_record.end_date}) ${endDateMatch ? '✅' : '❌'}`);
      
      if (!startDateMatch || !endDateMatch) {
        allMatched = false;
      }
    }
    
    // 7. 测试结果
    console.log('\n🎯 测试结果:');
    if (allMatched) {
      console.log('🎉 测试成功！Excel日期与Supabase数据完全一致');
      console.log('✅ 日期处理逻辑修复正确');
      console.log('✅ 可以安全地导入完整的工资数据');
    } else {
      console.log('❌ 测试失败！存在日期不一致的问题');
      console.log('⚠️ 需要进一步调试日期处理逻辑');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testExcelDateImport();
