const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHuangXiaoxiaSalary() {
  console.log('🔍 检查黄笑霞的工资数据...\n');
  
  try {
    // 1. 检查Excel原始数据
    console.log('📂 检查Excel原始数据...');
    const excelPath = path.join('C:', '93 trae', '人力资源数据质量检查', '模拟数据-07171300.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['工资核算结果信息'];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
    
    // 查找黄笑霞的数据
    const huangData = rawData.filter(record => 
      record['姓'] === '黄' && record['名'] === '笑霞'
    );
    
    console.log(`📊 Excel中黄笑霞的记录数: ${huangData.length}`);
    
    if (huangData.length === 0) {
      console.log('❌ Excel中未找到黄笑霞的数据');
      return;
    }
    
    // 分析Excel中的月份数据
    const excelMonths = new Map();
    const excelTaxableTotal = [];
    
    huangData.forEach(record => {
      const startDate = record['开始时间'];
      const salaryItem = record['工资项名称'];
      const amount = record['金额'] || 0;
      
      if (typeof startDate === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(startDate);
        const monthKey = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}`;
        
        if (!excelMonths.has(monthKey)) {
          excelMonths.set(monthKey, []);
        }
        excelMonths.get(monthKey).push({
          工资项: salaryItem,
          金额: amount,
          开始时间: `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
        });
        
        // 收集税前应发合计
        if (salaryItem === '税前应发合计') {
          excelTaxableTotal.push({
            月份: monthKey,
            金额: amount,
            开始时间: `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
          });
        }
      }
    });
    
    console.log(`📅 Excel中黄笑霞覆盖的月份: ${excelMonths.size} 个月`);
    console.log('月份列表:', Array.from(excelMonths.keys()).sort());
    
    console.log('\n📋 Excel中黄笑霞的税前应发合计:');
    excelTaxableTotal.sort((a, b) => a.月份.localeCompare(b.月份));
    excelTaxableTotal.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.月份}: ¥${item.金额} (${item.开始时间})`);
    });
    
    // 2. 检查Supabase数据
    console.log('\n🗄️ 检查Supabase数据...');
    const { data: supabaseData, error } = await supabase
      .from('salary_calculation_results')
      .select('employee_id, last_name, first_name, start_date, end_date, salary_item_name, amount')
      .eq('last_name', '黄')
      .eq('first_name', '笑霞')
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('❌ 查询Supabase失败:', error);
      return;
    }
    
    console.log(`📊 Supabase中黄笑霞的记录数: ${supabaseData.length}`);
    
    if (supabaseData.length === 0) {
      console.log('❌ Supabase中未找到黄笑霞的数据');
      console.log('⚠️ 可能需要重新导入工资数据');
      return;
    }
    
    // 分析Supabase中的月份数据
    const supabaseMonths = new Map();
    const supabaseTaxableTotal = [];
    
    supabaseData.forEach(record => {
      const startDate = record.start_date;
      const salaryItem = record.salary_item_name;
      const amount = record.amount || 0;
      
      if (startDate) {
        const monthKey = startDate.substring(0, 7); // YYYY-MM
        
        if (!supabaseMonths.has(monthKey)) {
          supabaseMonths.set(monthKey, []);
        }
        supabaseMonths.get(monthKey).push({
          工资项: salaryItem,
          金额: amount,
          开始时间: startDate
        });
        
        // 收集税前应发合计
        if (salaryItem === '税前应发合计') {
          supabaseTaxableTotal.push({
            月份: monthKey,
            金额: amount,
            开始时间: startDate
          });
        }
      }
    });
    
    console.log(`📅 Supabase中黄笑霞覆盖的月份: ${supabaseMonths.size} 个月`);
    console.log('月份列表:', Array.from(supabaseMonths.keys()).sort());
    
    console.log('\n📋 Supabase中黄笑霞的税前应发合计:');
    console.log('┌─────────┬──────────────┬─────────────┐');
    console.log('│  月份   │     金额     │  开始时间   │');
    console.log('├─────────┼──────────────┼─────────────┤');
    
    supabaseTaxableTotal.sort((a, b) => a.月份.localeCompare(b.月份));
    supabaseTaxableTotal.forEach((item) => {
      const month = item.月份.padEnd(7);
      const amount = `¥${item.金额}`.padEnd(12);
      const date = item.开始时间.padEnd(11);
      console.log(`│ ${month} │ ${amount} │ ${date} │`);
    });
    console.log('└─────────┴──────────────┴─────────────┘');
    
    // 3. 对比分析
    console.log('\n🔍 对比分析:');
    
    const excelMonthSet = new Set(excelMonths.keys());
    const supabaseMonthSet = new Set(supabaseMonths.keys());
    
    // 找出缺失的月份
    const missingInSupabase = Array.from(excelMonthSet).filter(month => !supabaseMonthSet.has(month));
    const extraInSupabase = Array.from(supabaseMonthSet).filter(month => !excelMonthSet.has(month));
    
    console.log(`Excel月份数: ${excelMonthSet.size}`);
    console.log(`Supabase月份数: ${supabaseMonthSet.size}`);
    
    if (missingInSupabase.length > 0) {
      console.log(`❌ Supabase中缺失的月份: ${missingInSupabase.join(', ')}`);
    }
    
    if (extraInSupabase.length > 0) {
      console.log(`⚠️ Supabase中多出的月份: ${extraInSupabase.join(', ')}`);
    }
    
    // 4. 金额对比
    console.log('\n💰 税前应发合计金额对比:');
    const excelTotalMap = new Map(excelTaxableTotal.map(item => [item.月份, item.金额]));
    const supabaseTotalMap = new Map(supabaseTaxableTotal.map(item => [item.月份, item.金额]));
    
    const allMonths = new Set([...excelTotalMap.keys(), ...supabaseTotalMap.keys()]);
    
    console.log('┌─────────┬──────────────┬──────────────┬────────┐');
    console.log('│  月份   │  Excel金额   │ Supabase金额 │  状态  │');
    console.log('├─────────┼──────────────┼──────────────┼────────┤');
    
    Array.from(allMonths).sort().forEach(month => {
      const excelAmount = excelTotalMap.get(month) || 0;
      const supabaseAmount = supabaseTotalMap.get(month) || 0;
      const status = excelAmount === supabaseAmount ? '✅' : '❌';
      
      const monthStr = month.padEnd(7);
      const excelStr = `¥${excelAmount}`.padEnd(12);
      const supabaseStr = `¥${supabaseAmount}`.padEnd(12);
      const statusStr = status.padEnd(6);
      
      console.log(`│ ${monthStr} │ ${excelStr} │ ${supabaseStr} │ ${statusStr} │`);
    });
    console.log('└─────────┴──────────────┴──────────────┴────────┘');
    
    // 5. 结论和建议
    console.log('\n🎯 分析结论:');
    
    if (excelMonthSet.size === 12 && supabaseMonthSet.size === 12 && missingInSupabase.length === 0) {
      console.log('✅ 黄笑霞的工资数据完整，覆盖12个月');
      console.log('✅ Excel和Supabase数据一致');
    } else {
      console.log('❌ 发现数据不一致问题:');
      
      if (excelMonthSet.size !== 12) {
        console.log(`  - Excel数据不完整: 只有${excelMonthSet.size}个月，应该有12个月`);
      }
      
      if (supabaseMonthSet.size !== 12) {
        console.log(`  - Supabase数据不完整: 只有${supabaseMonthSet.size}个月，应该有12个月`);
      }
      
      if (missingInSupabase.length > 0) {
        console.log(`  - Supabase缺失月份: ${missingInSupabase.join(', ')}`);
        console.log('  - 建议: 重新导入工资数据');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkHuangXiaoxiaSalary();
