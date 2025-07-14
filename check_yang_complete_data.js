// 检查杨治源的完整数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYangCompleteData() {
  console.log('🔍 检查杨治源的完整数据...');
  console.log();

  try {
    // 1. 查询杨治源的所有社保数据
    console.log('📊 1. 杨治源的社保数据:');
    const { data: yangSocialData, error: yangSocialError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', '80000001');

    if (yangSocialError) {
      console.error('❌ 查询杨治源社保数据失败:', yangSocialError);
    } else {
      console.log(`总条数: ${yangSocialData?.length}`);
      yangSocialData?.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  员工工号: ${record.员工工号}`);
        console.log(`  姓名: ${record.姓名}`);
        console.log(`  姓: ${record.姓}`);
        console.log(`  名: ${record.名}`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  开始时间: ${record.开始时间}`);
        console.log(`  结束时间: ${record.结束时间}`);
        console.log(`  缴交地: ${record.缴交地}`);
        console.log(`  个人缴费比例: ${record.个人缴费比例}`);
        console.log(`  单位缴费比例: ${record.单位缴费比例}`);
      });
    }

    // 2. 查询杨治源的基本信息
    console.log('\n📊 2. 杨治源的基本信息:');
    const { data: yangBasicData, error: yangBasicError } = await supabase
      .from('employee_basic_info')
      .select('*')
      .eq('员工工号', '80000001');

    if (yangBasicError) {
      console.error('❌ 查询杨治源基本信息失败:', yangBasicError);
    } else {
      console.log(`总条数: ${yangBasicData?.length}`);
      yangBasicData?.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  员工工号: ${record.员工工号}`);
        console.log(`  姓名: ${record.姓名}`);
        console.log(`  性别: ${record.性别}`);
        console.log(`  出生日期: ${record.出生日期}`);
        console.log(`  入职日期: ${record.入职日期}`);
        console.log(`  部门: ${record.部门}`);
        console.log(`  职位: ${record.职位}`);
      });
    }

    // 3. 检查是否有其他可能的杨治源记录（通过姓名查找）
    console.log('\n📊 3. 通过姓名查找杨治源的所有记录:');
    const { data: yangByNameData, error: yangByNameError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .or('姓名.eq.杨治源,姓.eq.杨.and.名.eq.治源');

    if (yangByNameError) {
      console.error('❌ 通过姓名查询杨治源数据失败:', yangByNameError);
    } else {
      console.log(`通过姓名找到的记录数: ${yangByNameData?.length}`);
      yangByNameData?.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  员工工号: ${record.员工工号}`);
        console.log(`  姓名: ${record.姓名}`);
        console.log(`  姓: ${record.姓}`);
        console.log(`  名: ${record.名}`);
        console.log(`  险种类型: ${record.险种类型}`);
        console.log(`  开始时间: ${record.开始时间}`);
        console.log(`  结束时间: ${record.结束时间}`);
      });
    }

    // 4. 检查所有包含"杨"和"治源"的记录
    console.log('\n📊 4. 检查所有可能相关的记录:');
    const { data: allYangData, error: allYangError } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .or('姓名.ilike.%杨%,姓.ilike.%杨%,名.ilike.%治%');

    if (allYangError) {
      console.error('❌ 查询相关记录失败:', allYangError);
    } else {
      console.log(`找到的相关记录数: ${allYangData?.length}`);
      allYangData?.forEach((record, index) => {
        if (record.姓名?.includes('杨') || record.姓?.includes('杨') || record.名?.includes('治')) {
          console.log(`\n相关记录 ${index + 1}:`);
          console.log(`  员工工号: ${record.员工工号}`);
          console.log(`  姓名: ${record.姓名}`);
          console.log(`  姓: ${record.姓}`);
          console.log(`  名: ${record.名}`);
          console.log(`  险种类型: ${record.险种类型}`);
          console.log(`  开始时间: ${record.开始时间}`);
        }
      });
    }

    // 5. 分析日期和年度计算
    console.log('\n📊 5. 分析日期和年度计算:');
    if (yangSocialData && yangSocialData.length > 0) {
      const record = yangSocialData[0];
      const startTime = record.开始时间;
      console.log(`开始时间: ${startTime}`);
      
      // 解析日期
      const date = new Date(startTime);
      console.log(`解析后的日期: ${date}`);
      console.log(`年份: ${date.getFullYear()}`);
      console.log(`月份: ${date.getMonth() + 1}`);
      
      // 计算社保年度
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      let socialYear;
      if (month >= 7) {
        socialYear = `${year}年度`;
      } else {
        socialYear = `${year - 1}年度`;
      }
      console.log(`社保年度: ${socialYear}`);
      
      // 用户期望的情况分析
      console.log('\n🎯 用户期望分析:');
      console.log('- 用户说：杨治源2023年缴纳了养老保险');
      console.log('- 实际数据：2022-07-01开始缴纳养老保险');
      console.log('- 按社保年度计算：2022-07-01属于2022年度');
      console.log('- 可能的原因：');
      console.log('  1. 数据中缺少2023年的记录');
      console.log('  2. 用户记忆有误');
      console.log('  3. 年度计算方式不同');
    }

  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

checkYangCompleteData();