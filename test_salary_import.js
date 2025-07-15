const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟DataImport组件中的字段映射逻辑
function convertSalaryDataToDbFormat(data) {
  return data.map(row => {
    const convertedRow = {};
    
    Object.keys(row).forEach(key => {
      let dbKey = key;
      let value = row[key];
      
      // 工资核算结果信息表的字段映射
      if (key === '员工工号') {
        dbKey = 'employee_id';
      } else if (key === '姓') {
        dbKey = 'last_name';
      } else if (key === '名') {
        dbKey = 'first_name';
      } else if (key === '开始时间') {
        dbKey = 'start_date';
      } else if (key === '结束时间') {
        dbKey = 'end_date';
      } else if (key === '工资项名称') {
        dbKey = 'salary_item_name';
      } else if (key === '金额') {
        dbKey = 'amount';
      } else if (key === '币种') {
        dbKey = 'currency';
      }
      
      // 处理日期字段 - Excel序列号转换
      if (dbKey === 'start_date' || dbKey === 'end_date') {
        if (typeof value === 'number' && value > 1000) {
          // Excel日期序列号转换
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
      
      convertedRow[dbKey] = value;
    });
    
    return convertedRow;
  });
}

async function testSalaryImport() {
  console.log('🧪 测试工资核算结果信息导入功能...');
  
  try {
    // 1. 读取Excel文件
    console.log('📊 1. 读取Excel文件...');
    const excelPath = path.join(__dirname, '..', '模拟数据-0714.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    const sheetName = '工资核算结果信息';
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 成功读取 ${jsonData.length} 条原始数据`);
    
    // 2. 转换数据格式
    console.log('\n🔄 2. 转换数据格式...');
    const convertedData = convertSalaryDataToDbFormat(jsonData);
    
    console.log(`✅ 成功转换 ${convertedData.length} 条数据`);
    
    // 3. 显示转换示例
    console.log('\n📋 3. 转换示例:');
    if (convertedData.length > 0) {
      console.log('原始数据示例:');
      console.log(JSON.stringify(jsonData[0], null, 2));
      console.log('\n转换后数据示例:');
      console.log(JSON.stringify(convertedData[0], null, 2));
    }
    
    // 4. 检查数据库表当前状态
    console.log('\n📊 4. 检查数据库表当前状态...');
    const { count: currentCount, error: countError } = await supabase
      .from('salary_calculation_results')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 查询记录数失败:', countError);
      return;
    }
    
    console.log(`当前表中记录数: ${currentCount}`);
    
    // 5. 测试插入少量数据
    console.log('\n🧪 5. 测试插入少量数据...');
    const testData = convertedData.slice(0, 3); // 只测试前3条
    
    console.log('测试数据:');
    testData.forEach((record, index) => {
      console.log(`记录 ${index + 1}:`, JSON.stringify(record, null, 2));
    });
    
    const { data: insertData, error: insertError } = await supabase
      .from('salary_calculation_results')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.error('❌ 插入失败:', insertError);
    } else {
      console.log(`✅ 成功插入 ${insertData.length} 条记录`);
      
      // 清理测试数据
      const insertedIds = insertData.map(record => record.id);
      const { error: deleteError } = await supabase
        .from('salary_calculation_results')
        .delete()
        .in('id', insertedIds);
      
      if (deleteError) {
        console.warn('⚠️ 清理测试数据失败:', deleteError);
      } else {
        console.log('🗑️ 已清理测试数据');
      }
    }
    
    // 6. 分析数据特征
    console.log('\n📈 6. 数据特征分析:');
    const employeeIds = [...new Set(convertedData.map(r => r.employee_id))];
    const salaryItems = [...new Set(convertedData.map(r => r.salary_item_name))];
    const currencies = [...new Set(convertedData.map(r => r.currency))];
    
    console.log(`员工数量: ${employeeIds.length}`);
    console.log(`工资项目类型: ${salaryItems.length}`);
    console.log(`币种: ${currencies.join(', ')}`);
    console.log('工资项目列表:', salaryItems.slice(0, 10).join(', ') + (salaryItems.length > 10 ? '...' : ''));
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testSalaryImport();
