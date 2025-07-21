const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCheckpoint5HuangXiaoxia() {
  console.log('🔍 调试检查点5 - 黄笑霞的问题...\n');
  
  try {
    // 1. 查找黄笑霞的员工工号
    console.log('👤 查找黄笑霞的员工工号...');
    const { data: basicInfo, error: basicError } = await supabase
      .from('employee_basic_info')
      .select('员工工号, 姓, 名')
      .eq('姓', '黄')
      .eq('名', '笑霞');
    
    if (basicError) {
      console.error('❌ 查询员工基本信息失败:', basicError);
      return;
    }
    
    if (!basicInfo || basicInfo.length === 0) {
      console.log('❌ 未找到黄笑霞的员工基本信息');
      return;
    }
    
    const empId = basicInfo[0].员工工号;
    console.log(`✅ 找到黄笑霞的员工工号: ${empId}`);
    
    // 2. 查询黄笑霞的社保数据
    console.log('\n🏥 查询黄笑霞的社保数据...');
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', empId);
    
    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }
    
    console.log(`📊 找到 ${socialData?.length || 0} 条社保记录`);
    
    if (socialData && socialData.length > 0) {
      console.log('\n📋 黄笑霞的社保记录:');
      socialData.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  社保年度: ${record.社保年度}`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  缴交地: ${record.缴交地}`);
        console.log(`  缴交基数: ${record.缴交基数}`);
        console.log(`  开始时间: ${record.开始时间}`);
        console.log(`  结束时间: ${record.结束时间}`);
      });
      
      // 按年度和险种分组
      const socialByYearType = {};
      socialData.forEach(record => {
        const year = record.社保年度;
        const type = record.险种类型;
        
        if (!socialByYearType[year]) {
          socialByYearType[year] = {};
        }
        if (!socialByYearType[year][type]) {
          socialByYearType[year][type] = [];
        }
        socialByYearType[year][type].push(record);
      });
      
      console.log('\n📊 按年度和险种分组:');
      Object.keys(socialByYearType).forEach(year => {
        console.log(`\n${year}:`);
        Object.keys(socialByYearType[year]).forEach(type => {
          const records = socialByYearType[year][type];
          console.log(`  ${type}: ${records.length} 条记录`);
        });
      });
    }
    
    // 3. 查询黄笑霞的工资数据
    console.log('\n💰 查询黄笑霞的工资数据...');
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('last_name', '黄')
      .eq('first_name', '笑霞')
      .eq('salary_item_name', '税前应发合计')
      .order('start_date');
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    console.log(`📊 找到 ${salaryData?.length || 0} 条税前应发合计记录`);
    
    if (salaryData && salaryData.length > 0) {
      // 按年度分组工资数据
      const salaryByYear = {};
      salaryData.forEach(record => {
        const year = new Date(record.start_date).getFullYear().toString();
        if (!salaryByYear[year]) {
          salaryByYear[year] = [];
        }
        salaryByYear[year].push(record);
      });
      
      console.log('\n📋 黄笑霞的工资数据按年度分组:');
      Object.keys(salaryByYear).forEach(year => {
        const records = salaryByYear[year];
        const total = records.reduce((sum, record) => sum + (record.amount || 0), 0);
        const average = Math.round(total / records.length);
        console.log(`\n${year}年:`);
        console.log(`  记录数: ${records.length} 个月`);
        console.log(`  总收入: ¥${total.toLocaleString()}`);
        console.log(`  月均收入: ¥${average.toLocaleString()}`);
        
        // 显示每月详情
        records.forEach((record, index) => {
          console.log(`    ${index + 1}. ${record.start_date} ~ ${record.end_date}: ¥${record.amount}`);
        });
      });
      
      // 4. 模拟检查点5的逻辑
      console.log('\n🔍 模拟检查点5的逻辑...');
      
      if (socialData && socialData.length > 0) {
        // 检查2024年度社保基数（基于2023年工资数据）
        const socialYear = '2024年度';
        const salaryYear = '2023'; // 2024年度社保基数基于2023年工资
        
        console.log(`\n检查 ${socialYear} 社保基数（基于 ${salaryYear} 年工资数据）:`);
        
        const salaryRecords = salaryByYear[salaryYear] || [];
        console.log(`${salaryYear}年工资记录数: ${salaryRecords.length}`);
        
        if (salaryRecords.length === 0) {
          console.log(`❌ 未找到 ${salaryYear} 年的工资数据`);
        } else if (salaryRecords.length < 12) {
          console.log(`❌ ${salaryYear} 年工资数据不足12个月 (只有${salaryRecords.length}个月)`);
          console.log(`⚠️ 这就是检查点5报告"工资数据不足12个月"的原因！`);
        } else {
          console.log(`✅ ${salaryYear} 年工资数据完整 (${salaryRecords.length}个月)`);
          
          const totalIncome = salaryRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
          const monthlyAverage = Math.round(totalIncome / 12);
          console.log(`月均收入: ¥${monthlyAverage.toLocaleString()}`);
        }
        
        // 检查是否有2024年度的社保记录
        const social2024 = socialData.filter(record => record.社保年度 === '2024年度');
        console.log(`\n2024年度社保记录数: ${social2024.length}`);
        
        if (social2024.length > 0) {
          social2024.forEach(record => {
            console.log(`  ${record.险种类型}: 缴交基数 ¥${record.缴交基数}`);
          });
        }
      }
    }
    
    // 5. 检查员工工号一致性
    console.log('\n🔍 检查员工工号一致性...');
    
    const salaryEmpId = salaryData?.[0]?.employee_id;
    const socialEmpId = socialData?.[0]?.员工工号;
    
    console.log(`基本信息中的员工工号: ${empId}`);
    console.log(`工资表中的员工工号: ${salaryEmpId}`);
    console.log(`社保表中的员工工号: ${socialEmpId}`);
    
    if (empId !== salaryEmpId || empId !== socialEmpId) {
      console.log('❌ 员工工号不一致！这可能是问题的根源');
      console.log('⚠️ 检查点5可能无法正确关联黄笑霞的工资和社保数据');
    } else {
      console.log('✅ 员工工号一致');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugCheckpoint5HuangXiaoxia();
