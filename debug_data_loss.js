const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDataLoss() {
  console.log('🔍 调试检查点5数据丢失问题...\n');
  
  try {
    // 1. 查询所有工资数据
    console.log('💰 查询所有工资数据...');
    const { data: allSalaryData } = await supabase
      .from('salary_calculation_results')
      .select('*');
    
    console.log(`总工资记录数: ${allSalaryData?.length || 0}`);
    
    // 2. 模拟检查点5的数据处理过程，逐步跟踪
    console.log('\n🔍 模拟检查点5的数据处理过程...');
    
    const salaryByEmployee = {};
    let huangRecordsProcessed = 0;
    let huangTaxableRecordsProcessed = 0;
    
    console.log('\n📊 逐条处理工资记录...');
    
    allSalaryData?.forEach((record, index) => {
      const empId = record.employee_id;
      const startDate = record.start_date;
      const salaryItem = record.salary_item_name;
      
      // 跟踪黄笑霞的记录
      if (empId === '80000008') {
        huangRecordsProcessed++;
        
        if (salaryItem === '税前应发合计') {
          huangTaxableRecordsProcessed++;
          console.log(`黄笑霞税前应发合计记录 ${huangTaxableRecordsProcessed}: ${startDate} ¥${record.amount}`);
        }
      }
      
      if (!startDate) {
        if (empId === '80000008') {
          console.log(`⚠️ 黄笑霞记录 ${index + 1} 缺少开始时间，跳过`);
        }
        return;
      }
      
      // 根据start_date计算年度
      const year = new Date(startDate).getFullYear().toString();
      
      if (!salaryByEmployee[empId]) {
        salaryByEmployee[empId] = {};
      }
      if (!salaryByEmployee[empId][year]) {
        salaryByEmployee[empId][year] = [];
      }
      salaryByEmployee[empId][year].push(record);
    });
    
    console.log(`\n📊 黄笑霞记录处理统计:`);
    console.log(`  总记录数: ${huangRecordsProcessed}`);
    console.log(`  税前应发合计: ${huangTaxableRecordsProcessed}`);
    
    // 3. 检查处理后的数据结构
    console.log('\n🔍 检查处理后的数据结构...');
    
    if (salaryByEmployee['80000008']) {
      console.log('✅ 黄笑霞在数据结构中');
      
      Object.keys(salaryByEmployee['80000008']).forEach(year => {
        const yearRecords = salaryByEmployee['80000008'][year];
        const taxableRecords = yearRecords.filter(record => record.salary_item_name === '税前应发合计');
        
        console.log(`\n${year}年:`);
        console.log(`  总记录: ${yearRecords.length}`);
        console.log(`  税前应发合计: ${taxableRecords.length}`);
        
        if (taxableRecords.length > 0 && taxableRecords.length <= 15) {
          console.log(`  详细记录:`);
          taxableRecords.forEach((record, index) => {
            console.log(`    ${index + 1}. ${record.start_date}: ¥${record.amount}`);
          });
        }
      });
    } else {
      console.log('❌ 黄笑霞不在数据结构中');
    }
    
    // 4. 对比直接查询和处理后的结果
    console.log('\n🔍 对比直接查询和处理后的结果...');
    
    // 直接查询黄笑霞的税前应发合计
    const { data: directQuery } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', '80000008')
      .eq('salary_item_name', '税前应发合计')
      .order('start_date');
    
    console.log(`直接查询结果: ${directQuery?.length || 0} 条`);
    
    // 从处理后的数据结构中获取
    const processedRecords = salaryByEmployee['80000008']?.['2023']?.filter(
      record => record.salary_item_name === '税前应发合计'
    ) || [];
    
    console.log(`处理后结果: ${processedRecords.length} 条`);
    
    if (directQuery && directQuery.length !== processedRecords.length) {
      console.log('❌ 数据丢失！');
      
      // 找出丢失的记录
      const directDates = new Set(directQuery.map(record => record.start_date));
      const processedDates = new Set(processedRecords.map(record => record.start_date));
      
      const missingDates = Array.from(directDates).filter(date => !processedDates.has(date));
      const extraDates = Array.from(processedDates).filter(date => !directDates.has(date));
      
      if (missingDates.length > 0) {
        console.log(`丢失的日期: ${missingDates.join(', ')}`);
        
        // 检查丢失记录的详细信息
        console.log('\n🔍 检查丢失记录的详细信息:');
        missingDates.forEach(date => {
          const missingRecord = directQuery.find(record => record.start_date === date);
          if (missingRecord) {
            console.log(`  ${date}: ¥${missingRecord.amount} (ID: ${missingRecord.id})`);
            
            // 检查这条记录是否在原始数据中
            const originalRecord = allSalaryData?.find(record => record.id === missingRecord.id);
            if (originalRecord) {
              console.log(`    原始记录存在: start_date=${originalRecord.start_date}, employee_id=${originalRecord.employee_id}`);
              
              // 检查日期解析
              if (originalRecord.start_date) {
                const year = new Date(originalRecord.start_date).getFullYear().toString();
                console.log(`    解析年度: ${year}`);
              } else {
                console.log(`    ❌ 原始记录缺少start_date`);
              }
            } else {
              console.log(`    ❌ 原始记录不存在`);
            }
          }
        });
      }
      
      if (extraDates.length > 0) {
        console.log(`多出的日期: ${extraDates.join(', ')}`);
      }
    } else {
      console.log('✅ 数据一致');
    }
    
    // 5. 检查是否有重复处理的问题
    console.log('\n🔍 检查是否有重复处理的问题...');
    
    // 检查allSalaryData中黄笑霞的记录是否有重复
    const huangRecords = allSalaryData?.filter(record => record.employee_id === '80000008') || [];
    const huangTaxableRecords = huangRecords.filter(record => record.salary_item_name === '税前应发合计');
    
    console.log(`原始数据中黄笑霞总记录: ${huangRecords.length}`);
    console.log(`原始数据中黄笑霞税前应发合计: ${huangTaxableRecords.length}`);
    
    // 检查ID是否有重复
    const recordIds = huangTaxableRecords.map(record => record.id);
    const uniqueIds = new Set(recordIds);
    
    if (recordIds.length !== uniqueIds.size) {
      console.log('❌ 发现重复ID');
      console.log(`总ID数: ${recordIds.length}, 唯一ID数: ${uniqueIds.size}`);
    } else {
      console.log('✅ 没有重复ID');
    }
    
    // 检查日期是否有重复
    const dates = huangTaxableRecords.map(record => record.start_date);
    const uniqueDates = new Set(dates);
    
    if (dates.length !== uniqueDates.size) {
      console.log('❌ 发现重复日期');
      console.log(`总日期数: ${dates.length}, 唯一日期数: ${uniqueDates.size}`);
    } else {
      console.log('✅ 没有重复日期');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugDataLoss();
