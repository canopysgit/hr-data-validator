// 调试检查点5的年度字段问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugYearField() {
  console.log('🔍 调试检查点5的年度字段问题...\n');
  
  try {
    // 查询张持荣的社保数据
    console.log('📊 查询张持荣的社保数据...');
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', '80000003');
    
    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }
    
    console.log(`✅ 找到 ${socialData?.length || 0} 条张持荣的社保记录`);
    
    if (socialData && socialData.length > 0) {
      console.log('\n📋 张持荣社保数据详情:');
      socialData.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  员工工号: ${record.员工工号}`);
        console.log(`  姓名: ${record.姓} ${record.名}`);
        console.log(`  年度: ${JSON.stringify(record.年度)} (类型: ${typeof record.年度})`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  缴交地: ${record.缴交地}`);
        console.log(`  缴交基数: ${record.缴交基数}`);
        console.log(`  开始时间: ${record.开始时间}`);
        console.log(`  结束时间: ${record.结束时间}`);
      });
      
      // 检查年度字段的问题
      console.log('\n🔍 年度字段分析:');
      const yearValues = socialData.map(record => record.年度);
      const uniqueYears = [...new Set(yearValues)];
      console.log(`  所有年度值: ${JSON.stringify(yearValues)}`);
      console.log(`  唯一年度值: ${JSON.stringify(uniqueYears)}`);
      
      // 检查是否有null或undefined
      const nullYears = socialData.filter(record => 
        record.年度 === null || record.年度 === undefined || record.年度 === ''
      );
      console.log(`  空年度记录数: ${nullYears.length}`);
      
      if (nullYears.length > 0) {
        console.log('  空年度记录详情:');
        nullYears.forEach((record, index) => {
          console.log(`    ${index + 1}. 险种: ${record.险种类型}, 开始时间: ${record.开始时间}`);
        });
      }
    }
    
    // 查询张持荣的工资数据
    console.log('\n📊 查询张持荣的工资数据...');
    const { data: salaryData, error: salaryError } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', '80000003')
      .eq('salary_item_name', '税前应发合计');
    
    if (salaryError) {
      console.error('❌ 查询工资数据失败:', salaryError);
      return;
    }
    
    console.log(`✅ 找到 ${salaryData?.length || 0} 条张持荣的工资记录`);
    
    if (salaryData && salaryData.length > 0) {
      // 按年度分组工资数据
      const salaryByYear = {};
      salaryData.forEach(record => {
        const year = new Date(record.start_date).getFullYear().toString();
        if (!salaryByYear[year]) {
          salaryByYear[year] = [];
        }
        salaryByYear[year].push(record.amount);
      });
      
      console.log('\n📋 张持荣工资数据按年度分组:');
      Object.keys(salaryByYear).forEach(year => {
        const amounts = salaryByYear[year];
        const total = amounts.reduce((sum, amount) => sum + amount, 0);
        const average = Math.round(total / amounts.length);
        console.log(`  ${year}年: ${amounts.length}个月, 总计${total}, 月均${average}`);
      });
    }
    
    // 查询北京养老保险的标准配置
    console.log('\n📊 查询北京养老保险标准配置...');
    const { data: standardData, error: standardError } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .ilike('城市', '%北京%')
      .ilike('险种类型', '%养老%');
    
    if (standardError) {
      console.error('❌ 查询标准配置失败:', standardError);
      return;
    }
    
    console.log(`✅ 找到 ${standardData?.length || 0} 条北京养老保险标准配置`);
    
    if (standardData && standardData.length > 0) {
      console.log('\n📋 北京养老保险标准配置:');
      standardData.forEach((record, index) => {
        console.log(`\n配置 ${index + 1}:`);
        console.log(`  城市: ${record.城市}`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  社保年度: ${record.社保年度}`);
        console.log(`  最低缴费基数: ${record.最低缴费基数}`);
        console.log(`  最高缴费基数: ${record.最高缴费基数}`);
      });
      
      // 检查2024年的标准
      const standard2024 = standardData.find(record => record.社保年度 === '2024');
      if (standard2024) {
        const maxBase = parseInt(standard2024.最高缴费基数.replace(/[^\d]/g, '')) || 0;
        console.log(`\n🎯 2024年北京养老保险最高缴费基数: ${maxBase}`);
        console.log(`  张持荣实际缴费基数: 37579`);
        console.log(`  是否超标: ${37579 > maxBase ? '是' : '否'} (${37579} > ${maxBase})`);
      } else {
        console.log('\n❌ 未找到2024年北京养老保险标准配置');
      }
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
}

debugYearField();
