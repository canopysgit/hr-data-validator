// 检查员工合同信息表和社保信息表的地址字段
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_CONTRACTS: 'employee_contracts',
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance'
};

async function checkContractLocation() {
  console.log('🔍 检查员工合同信息和社保信息的地址字段...');
  console.log();

  try {
    // 1. 检查employee_contracts表结构
    console.log('=== 1. 检查employee_contracts表 ===');
    const { data: contractData, error: contractError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('*')
      .limit(5);

    if (contractError) {
      console.error('❌ 查询employee_contracts表失败:', contractError);
    } else {
      console.log(`📊 employee_contracts表记录数: ${contractData?.length || 0}`);
      if (contractData && contractData.length > 0) {
        console.log('📋 字段结构:');
        Object.keys(contractData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof contractData[0][key]} (${contractData[0][key]})`);
        });
        console.log('\n📄 示例数据:');
        contractData.forEach((item, index) => {
          console.log(`\n第${index + 1}条记录:`);
          console.log(JSON.stringify(item, null, 2));
        });
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 检查employee_social_insurance表的缴交地字段
    console.log('=== 2. 检查employee_social_insurance表的缴交地字段 ===');
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('员工工号, 姓, 名, 开始时间, 结束时间, 缴交地')
      .limit(10);

    if (socialError) {
      console.error('❌ 查询employee_social_insurance表失败:', socialError);
    } else {
      console.log(`📊 employee_social_insurance表记录数: ${socialData?.length || 0}`);
      if (socialData && socialData.length > 0) {
        console.log('📋 缴交地数据分布:');
        const locationMap = {};
        socialData.forEach(item => {
          const location = item.缴交地;
          if (location) {
            locationMap[location] = (locationMap[location] || 0) + 1;
          }
        });
        
        Object.entries(locationMap).forEach(([location, count]) => {
          console.log(`  - ${location}: ${count} 条记录`);
        });
        
        console.log('\n📄 示例数据:');
        socialData.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. 员工${item.员工工号} (${item.姓}${item.名}) - 缴交地: ${item.缴交地} - 时间: ${item.开始时间} 至 ${item.结束时间}`);
        });
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 检查数据总量
    console.log('=== 3. 检查数据总量 ===');
    
    const { count: contractCount } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('*', { count: 'exact', head: true });
    
    const { count: socialCount } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*', { count: 'exact', head: true });

    console.log(`📊 数据统计:`);
    console.log(`  - employee_contracts表: ${contractCount} 条记录`);
    console.log(`  - employee_social_insurance表: ${socialCount} 条记录`);

    // 4. 检查是否存在"公司所在地"字段
    console.log('\n=== 4. 检查合同表中的地址相关字段 ===');
    if (contractData && contractData.length > 0) {
      const addressFields = Object.keys(contractData[0]).filter(key => 
        key.includes('地') || key.includes('址') || key.includes('城市') || key.includes('省') || key.includes('区')
      );
      
      if (addressFields.length > 0) {
        console.log('📋 发现的地址相关字段:');
        addressFields.forEach(field => {
          console.log(`  - ${field}`);
        });
        
        // 显示这些字段的示例数据
        console.log('\n📄 地址字段示例数据:');
        contractData.slice(0, 3).forEach((item, index) => {
          console.log(`\n第${index + 1}条记录的地址字段:`);
          addressFields.forEach(field => {
            console.log(`  - ${field}: ${item[field]}`);
          });
        });
      } else {
        console.log('⚠️ 未发现明显的地址相关字段');
        console.log('📋 所有字段列表:');
        Object.keys(contractData[0]).forEach(field => {
          console.log(`  - ${field}`);
        });
      }
    }

    console.log('\n✅ 地址字段检查完成!');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

checkContractLocation();