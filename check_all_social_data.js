// 检查所有员工社保数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  CITY_STANDARDS: 'city_social_insurance_standards',
  EMPLOYEE_BASIC_INFO: 'employee_basic_info'
};

async function checkAllSocialData() {
  console.log('🔍 检查所有员工社保数据...');
  console.log();

  try {
    // 1. 检查员工社保表总数据量
    console.log('=== 1. 员工社保表数据统计 ===');
    const { count: socialCount, error: socialCountError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('*', { count: 'exact', head: true });

    if (socialCountError) {
      console.error('❌ 查询员工社保数据总数失败:', socialCountError);
    } else {
      console.log('📊 员工社保表总记录数:', socialCount);
    }

    // 2. 如果有数据，查看前10条记录
    if (socialCount && socialCount > 0) {
      console.log();
      console.log('=== 2. 员工社保数据样本 ===');
      const { data: socialSample, error: socialSampleError } = await supabase
        .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
        .select('*')
        .limit(10);

      if (socialSampleError) {
        console.error('❌ 查询员工社保数据样本失败:', socialSampleError);
      } else {
        console.log('📝 前10条员工社保记录:');
        socialSample?.forEach((record, index) => {
          const empId = record['员工工号'] || '未知';
          const insuranceType = record['险种类型'] || record['类型'] || '未知';
          const city = record['缴交地'] || '未知';
          const startTime = record['开始时间'] || '未知';
          const endTime = record['结束时间'] || '未知';
          const personalRatio = record['个人缴交比例'] || 0;
          
          console.log(`  ${index + 1}. 员工${empId} | ${insuranceType} | ${city} | ${startTime}~${endTime} | 个人比例:${personalRatio}`);
        });
      }
    }

    // 3. 检查员工基本信息表总数据量
    console.log();
    console.log('=== 3. 员工基本信息表数据统计 ===');
    const { count: basicCount, error: basicCountError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('*', { count: 'exact', head: true });

    if (basicCountError) {
      console.error('❌ 查询员工基本信息总数失败:', basicCountError);
    } else {
      console.log('📊 员工基本信息表总记录数:', basicCount);
    }

    // 4. 检查城市标准配置表总数据量
    console.log();
    console.log('=== 4. 城市标准配置表数据统计 ===');
    const { count: cityCount, error: cityCountError } = await supabase
      .from(TABLE_NAMES.CITY_STANDARDS)
      .select('*', { count: 'exact', head: true });

    if (cityCountError) {
      console.error('❌ 查询城市标准配置总数失败:', cityCountError);
    } else {
      console.log('📊 城市标准配置表总记录数:', cityCount);
    }

    // 5. 检查是否有任何员工有社保记录
    console.log();
    console.log('=== 5. 检查有社保记录的员工 ===');
    if (socialCount && socialCount > 0) {
      const { data: uniqueEmployees, error: uniqueError } = await supabase
        .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
        .select('员工工号')
        .not('员工工号', 'is', null);

      if (uniqueError) {
        console.error('❌ 查询有社保记录的员工失败:', uniqueError);
      } else {
        const uniqueEmpIds = [...new Set(uniqueEmployees?.map(emp => emp['员工工号']) || [])];
        console.log('👥 有社保记录的员工数量:', uniqueEmpIds.length);
        console.log('👤 员工工号列表:', uniqueEmpIds.slice(0, 20).join(', '), uniqueEmpIds.length > 20 ? '...' : '');
      }
    }

    // 6. 分析问题
    console.log();
    console.log('=== 6. 问题分析 ===');
    if (!socialCount || socialCount === 0) {
      console.log('❌ 问题确认: 员工社保表中没有任何数据！');
      console.log('🔧 可能的解决方案:');
      console.log('1. 检查数据导入是否成功');
      console.log('2. 检查Excel文件中的"员工社保信息"工作表是否存在');
      console.log('3. 检查字段映射是否正确');
      console.log('4. 重新导入员工社保数据');
    } else {
      console.log('✅ 员工社保表有数据，但目标员工可能没有记录');
      console.log('🔧 建议:');
      console.log('1. 检查目标员工工号是否正确');
      console.log('2. 检查数据导入时的员工工号字段映射');
      console.log('3. 查看实际有社保记录的员工列表');
    }

    // 7. 检查所有表的数据情况
    console.log();
    console.log('=== 7. 数据完整性总结 ===');
    console.log(`📊 员工基本信息: ${basicCount || 0} 条记录`);
    console.log(`📊 员工社保信息: ${socialCount || 0} 条记录`);
    console.log(`📊 城市标准配置: ${cityCount || 0} 条记录`);
    
    if (basicCount && basicCount > 0 && (!socialCount || socialCount === 0)) {
      console.log();
      console.log('⚠️  警告: 有员工基本信息但没有社保信息，这是数据不完整的主要原因！');
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

// 执行检查
checkAllSocialData().then(() => {
  console.log('✅ 检查完成');
}).catch(error => {
  console.error('❌ 检查失败:', error);
});