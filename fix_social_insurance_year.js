// 修复员工社保表中的社保年度字段
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据标准化函数
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  
  // 如果已经是标准格式，直接返回
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

// 获取社保年度函数（7.1-6.30）
const getSocialInsuranceYear = (dateStr) => {
  try {
    const date = new Date(normalizeDate(dateStr));
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() 返回 0-11
    
    // 社保年度定义：X年度 = X年7月1日 到 X+1年6月30日
    // 例如：2022年度 = 2022年7月1日 到 2023年6月30日
    if (month >= 7) {
      // 7月1日及以后，属于当年度
      return `${year}`;
    } else {
      // 1月1日到6月30日，属于上一年度
      return `${year - 1}`;
    }
  } catch {
    return null;
  }
};

async function fixSocialInsuranceYear() {
  console.log('🔧 开始修复员工社保表中的社保年度字段...\n');
  
  try {
    // 1. 查询所有社保记录
    console.log('📊 查询所有社保记录...');
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*');
    
    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }
    
    console.log(`✅ 找到 ${socialData?.length || 0} 条社保记录`);
    
    if (!socialData || socialData.length === 0) {
      console.log('⚠️ 没有找到需要修复的数据');
      return;
    }
    
    // 2. 分析当前数据状态
    console.log('\n🔍 分析当前数据状态...');
    const nullYearRecords = socialData.filter(record => 
      record.社保年度 === null || record.社保年度 === undefined || record.社保年度 === ''
    );
    const validYearRecords = socialData.filter(record => 
      record.社保年度 !== null && record.社保年度 !== undefined && record.社保年度 !== ''
    );
    
    console.log(`  空年度记录: ${nullYearRecords.length} 条`);
    console.log(`  有效年度记录: ${validYearRecords.length} 条`);
    
    if (nullYearRecords.length === 0) {
      console.log('✅ 所有记录的社保年度字段都已填充，无需修复');
      return;
    }
    
    // 3. 修复空年度记录
    console.log('\n🔧 开始修复空年度记录...');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < nullYearRecords.length; i++) {
      const record = nullYearRecords[i];
      const startTime = record.开始时间;
      
      if (!startTime) {
        console.log(`⚠️ 记录 ${record.id} 缺少开始时间，跳过`);
        errorCount++;
        errors.push(`记录 ${record.id}: 缺少开始时间`);
        continue;
      }
      
      const socialYear = getSocialInsuranceYear(startTime);
      
      if (!socialYear) {
        console.log(`⚠️ 记录 ${record.id} 无法计算社保年度，开始时间: ${startTime}`);
        errorCount++;
        errors.push(`记录 ${record.id}: 无法计算社保年度`);
        continue;
      }
      
      // 更新记录
      const { error: updateError } = await supabase
        .from('employee_social_insurance')
        .update({ 社保年度: socialYear })
        .eq('id', record.id);
      
      if (updateError) {
        console.log(`❌ 更新记录 ${record.id} 失败:`, updateError.message);
        errorCount++;
        errors.push(`记录 ${record.id}: ${updateError.message}`);
      } else {
        successCount++;
        console.log(`✅ 记录 ${record.id}: ${record.员工工号} ${record.姓}${record.名} ${record.险种类型} ${startTime} -> ${socialYear}年度`);
      }
      
      // 每处理10条记录显示一次进度
      if ((i + 1) % 10 === 0) {
        console.log(`📈 进度: ${i + 1}/${nullYearRecords.length} (${Math.round((i + 1) / nullYearRecords.length * 100)}%)`);
      }
    }
    
    // 4. 显示修复结果
    console.log('\n📊 修复结果统计:');
    console.log(`  ✅ 成功修复: ${successCount} 条`);
    console.log(`  ❌ 修复失败: ${errorCount} 条`);
    console.log(`  📈 成功率: ${Math.round(successCount / nullYearRecords.length * 100)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ 错误详情:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 5. 验证修复结果
    console.log('\n🔍 验证修复结果...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('employee_social_insurance')
      .select('id, 员工工号, 姓, 名, 开始时间, 险种类型, 社保年度');
    
    if (verifyError) {
      console.error('❌ 验证查询失败:', verifyError);
      return;
    }
    
    const stillNullRecords = verifyData?.filter(record => 
      record.社保年度 === null || record.社保年度 === undefined || record.社保年度 === ''
    ) || [];
    
    console.log(`  剩余空年度记录: ${stillNullRecords.length} 条`);
    
    if (stillNullRecords.length > 0) {
      console.log('  剩余空年度记录详情:');
      stillNullRecords.forEach((record, index) => {
        console.log(`    ${index + 1}. ID: ${record.id}, 员工: ${record.员工工号} ${record.姓}${record.名}, 险种: ${record.险种类型}, 开始时间: ${record.开始时间}`);
      });
    } else {
      console.log('  ✅ 所有记录的社保年度字段都已正确填充！');
    }
    
    // 6. 显示年度分布统计
    console.log('\n📈 社保年度分布统计:');
    const yearDistribution = {};
    verifyData?.forEach(record => {
      const year = record.社保年度 || '空值';
      yearDistribution[year] = (yearDistribution[year] || 0) + 1;
    });
    
    Object.keys(yearDistribution).sort().forEach(year => {
      console.log(`  ${year}年度: ${yearDistribution[year]} 条记录`);
    });
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixSocialInsuranceYear();
