// 调试合规检查逻辑问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  CITY_STANDARDS: 'city_social_insurance_standards',
  EMPLOYEE_BASIC_INFO: 'employee_basic_info'
};

async function debugComplianceCheck() {
  console.log('🔍 开始调试合规检查逻辑问题...');
  console.log();

  try {
    // 1. 检查员工社保表的字段结构
    console.log('=== 1. 检查员工社保表字段结构 ===');
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*')
      .limit(3);

    if (socialError) {
      console.error('❌ 查询员工社保数据失败:', socialError);
      return;
    }

    console.log('📊 员工社保表数据条数:', socialData?.length);
    if (socialData && socialData.length > 0) {
      console.log('📋 字段名列表:', Object.keys(socialData[0]));
      console.log('📝 第一条数据示例:');
      console.log(JSON.stringify(socialData[0], null, 2));
    }
    console.log();

    // 2. 检查城市标准配置表的字段结构
    console.log('=== 2. 检查城市标准配置表字段结构 ===');
    const { data: cityData, error: cityError } = await supabase
      .from(TABLE_NAMES.CITY_STANDARDS)
      .select('*')
      .limit(3);

    if (cityError) {
      console.error('❌ 查询城市标准数据失败:', cityError);
      return;
    }

    console.log('📊 城市标准表数据条数:', cityData?.length);
    if (cityData && cityData.length > 0) {
      console.log('📋 字段名列表:', Object.keys(cityData[0]));
      console.log('📝 第一条数据示例:');
      console.log(JSON.stringify(cityData[0], null, 2));
    }
    console.log();

    // 3. 检查特定员工的社保数据
    console.log('=== 3. 检查特定员工的社保数据 ===');
    const targetEmployees = ['80000001', '80000014', '80000003', '80000053'];
    
    for (const empId of targetEmployees) {
      const { data: empSocialData, error: empSocialError } = await supabase
        .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
        .select('*')
        .eq('员工工号', empId);

      if (empSocialError) {
        console.error(`❌ 查询员工${empId}社保数据失败:`, empSocialError);
        continue;
      }

      console.log(`👤 员工${empId}的社保记录:`);
      if (empSocialData && empSocialData.length > 0) {
        console.log(`  - 记录条数: ${empSocialData.length}`);
        empSocialData.forEach((record, index) => {
          // 检查字段名是 '类型' 还是 '险种类型'
          const insuranceType = record['险种类型'] || record['类型'] || '未知';
          const city = record['缴交地'] || '未知';
          const startTime = record['开始时间'] || '未知';
          const endTime = record['结束时间'] || '未知';
          const personalRatio = record['个人缴交比例'] || 0;
          
          console.log(`  - 记录${index + 1}: ${insuranceType} | ${city} | ${startTime}~${endTime} | 个人比例:${personalRatio}`);
        });
      } else {
        console.log('  - 无社保记录');
      }
      console.log();
    }

    // 4. 检查北京地区的标准配置
    console.log('=== 4. 检查北京地区的标准配置 ===');
    if (cityData && cityData.length > 0) {
      const beijingStandards = cityData.filter(std => {
        const city = std['城市'] || std['缴交地'] || '';
        return city.includes('北京');
      });
      
      console.log(`🏛️ 北京地区标准配置条数: ${beijingStandards.length}`);
      beijingStandards.forEach((std, index) => {
        const insuranceType = std['险种类型'] || std['类型'] || '未知';
        const city = std['城市'] || std['缴交地'] || '未知';
        const startDate = std['生效日期'] || std['开始时间'] || '未知';
        const endDate = std['失效日期'] || std['结束时间'] || '未知';
        const personalRatio = std['个人缴费比例'] || std['个人缴交比例'] || 0;
        
        console.log(`  - 标准${index + 1}: ${insuranceType} | ${city} | ${startDate}~${endDate} | 个人比例:${personalRatio}`);
      });
    }
    console.log();

    // 5. 检查员工基本信息表
    console.log('=== 5. 检查员工基本信息表 ===');
    const { data: basicData, error: basicError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('*')
      .limit(5);

    if (basicError) {
      console.error('❌ 查询员工基本信息失败:', basicError);
      return;
    }

    console.log('📊 员工基本信息表数据条数:', basicData?.length);
    if (basicData && basicData.length > 0) {
      console.log('📋 字段名列表:', Object.keys(basicData[0]));
      console.log('📝 前几个员工信息:');
      basicData.forEach((emp, index) => {
        const empId = emp['员工工号'] || '未知';
        const surname = emp['姓'] || '';
        const givenName = emp['名'] || '';
        const fullName = `${surname}${givenName}`;
        console.log(`  - 员工${index + 1}: ${empId} | ${fullName}`);
      });
    }
    console.log();

    // 6. 分析问题原因
    console.log('=== 6. 问题分析 ===');
    console.log('🔍 可能的问题原因:');
    console.log('1. 字段名不匹配 - 检查是否使用了错误的字段名');
    console.log('2. 数据类型问题 - 检查数字字段是否被当作字符串处理');
    console.log('3. 时间匹配逻辑问题 - 检查时间范围匹配算法');
    console.log('4. 数据标准化问题 - 检查城市名称和险种类型的标准化');
    console.log('5. 数据为空或格式错误 - 检查实际数据内容');

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 执行调试
debugComplianceCheck().then(() => {
  console.log('✅ 调试完成');
}).catch(error => {
  console.error('❌ 调试失败:', error);
});