// 检查员工社保数据的实际结构和内容
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSocialDataStructure() {
  console.log('🔍 检查员工社保数据的实际结构和内容...');
  console.log();

  try {
    // 查询所有员工社保数据
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*');

    if (socialError) {
      console.error('❌ 查询员工社保数据失败:', socialError);
      return;
    }

    console.log(`📊 员工社保数据总数: ${socialData?.length || 0} 条`);
    
    if (socialData && socialData.length > 0) {
      console.log('\n🔍 字段结构分析:');
      const firstRecord = socialData[0];
      const fieldNames = Object.keys(firstRecord);
      console.log('字段列表:', fieldNames);
      
      console.log('\n📋 前5条记录详细内容:');
      socialData.slice(0, 5).forEach((record, index) => {
        console.log(`\n--- 记录 ${index + 1} ---`);
        Object.entries(record).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
      
      // 统计各字段的非空值数量
      console.log('\n📊 字段非空值统计:');
      fieldNames.forEach(field => {
        const nonNullCount = socialData.filter(record => 
          record[field] !== null && 
          record[field] !== undefined && 
          record[field] !== ''
        ).length;
        console.log(`  ${field}: ${nonNullCount}/${socialData.length} (${(nonNullCount/socialData.length*100).toFixed(1)}%)`);
      });
      
      // 检查是否有任何员工标识信息
      console.log('\n🔍 员工标识信息检查:');
      const employeeIdFields = ['员工工号', '姓', '名', 'id'];
      employeeIdFields.forEach(field => {
        if (fieldNames.includes(field)) {
          const values = socialData.map(record => record[field]).filter(Boolean);
          const uniqueValues = [...new Set(values)];
          console.log(`  ${field}: ${values.length} 个非空值, ${uniqueValues.length} 个唯一值`);
          if (uniqueValues.length > 0 && uniqueValues.length <= 10) {
            console.log(`    示例值: ${uniqueValues.slice(0, 5).join(', ')}`);
          }
        }
      });
      
      // 检查险种类型分布
      console.log('\n🏥 险种类型分布:');
      const insuranceTypes = socialData.map(record => record['险种类型']).filter(Boolean);
      const typeDistribution = {};
      insuranceTypes.forEach(type => {
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });
      Object.entries(typeDistribution).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} 条`);
      });
      
      // 检查缴交地分布
      console.log('\n🌍 缴交地分布:');
      const cities = socialData.map(record => record['缴交地']).filter(Boolean);
      const cityDistribution = {};
      cities.forEach(city => {
        cityDistribution[city] = (cityDistribution[city] || 0) + 1;
      });
      Object.entries(cityDistribution).forEach(([city, count]) => {
        console.log(`  ${city}: ${count} 条`);
      });
      
    } else {
      console.log('❌ 员工社保表无数据');
    }
    
    // 同时检查员工基本信息表的结构
    console.log('\n\n🔍 对比检查员工基本信息表结构...');
    const { data: basicData, error: basicError } = await supabase
      .from('employee_basic_info')
      .select('*')
      .limit(3);
      
    if (basicData && basicData.length > 0) {
      console.log('\n📋 员工基本信息表前3条记录:');
      basicData.forEach((record, index) => {
        console.log(`\n--- 员工 ${index + 1} ---`);
        console.log(`  员工工号: ${record.员工工号}`);
        console.log(`  姓名: ${record.姓} ${record.名}`);
        console.log(`  性别: ${record.性别}`);
      });
    }

  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

checkSocialDataStructure();