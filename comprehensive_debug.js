// 全面诊断合规检查功能问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据标准化函数（复制自ComplianceChecker.tsx）
const standardizeCity = (city) => {
  if (!city) return '';
  return city.replace(/市$|地区$|区$/g, '').trim();
};

const standardizeInsuranceType = (type) => {
  if (!type || type === null || type === undefined) {
    return '';
  }

  const typeMapping = {
    // 养老保险相关
    '养老': '养老保险',
    '养老险': '养老保险',
    '基本养老保险': '养老保险',
    '养老保险': '养老保险',

    // 医疗保险相关
    '医疗': '医疗保险',
    '医疗险': '医疗保险',
    '基本医疗保险': '医疗保险',
    '医疗保险': '医疗保险',

    // 失业保险相关
    '失业': '失业保险',
    '失业险': '失业保险',
    '失业保险': '失业保险',

    // 工伤保险相关
    '工伤': '工伤保险',
    '工伤险': '工伤保险',
    '工伤保险': '工伤保险',

    // 生育保险相关
    '生育': '生育保险',
    '生育险': '生育保险',
    '生育保险': '生育保险'
  };

  return typeMapping[type.trim()] || type.trim();
};

// 查找匹配标准的函数（复制自ComplianceChecker.tsx）
const findMatchingStandard = (empRecord, cityStandardData) => {
  const empCity = standardizeCity(empRecord.缴交地);
  const empType = standardizeInsuranceType(empRecord.险种类型);
  const empStartTime = empRecord.开始时间;
  const empEndTime = empRecord.结束时间;

  console.log(`\n🔍 查找匹配标准:`);
  console.log(`  员工城市: ${empRecord.缴交地} -> 标准化: ${empCity}`);
  console.log(`  员工险种: ${empRecord.险种类型} -> 标准化: ${empType}`);
  console.log(`  员工时间: ${empStartTime} - ${empEndTime}`);

  const matches = cityStandardData?.filter((standard) => {
    const stdCity = standardizeCity(standard.城市);
    const stdType = standardizeInsuranceType(standard.险种类型);
    const stdStartTime = standard.生效日期;
    const stdEndTime = standard.失效日期;

    console.log(`  检查标准: 城市=${standard.城市}(${stdCity}), 险种=${standard.险种类型}(${stdType}), 时间=${stdStartTime}-${stdEndTime}`);

    // 城市匹配
    const cityMatch = empCity === stdCity;
    console.log(`    城市匹配: ${cityMatch}`);

    // 险种匹配
    const typeMatch = empType === stdType;
    console.log(`    险种匹配: ${typeMatch}`);

    // 时间重叠检查
    let timeMatch = false;
    if (empStartTime && empEndTime && stdStartTime && stdEndTime) {
      const empStart = new Date(empStartTime);
      const empEnd = new Date(empEndTime);
      const stdStart = new Date(stdStartTime);
      const stdEnd = new Date(stdEndTime);

      timeMatch = empStart <= stdEnd && empEnd >= stdStart;
      console.log(`    时间匹配: ${timeMatch} (员工:${empStartTime}-${empEndTime}, 标准:${stdStartTime}-${stdEndTime})`);
    }

    const isMatch = cityMatch && typeMatch && timeMatch;
    console.log(`    总体匹配: ${isMatch}`);
    return isMatch;
  });

  console.log(`  找到 ${matches?.length || 0} 个匹配的标准`);
  return matches && matches.length > 0 ? matches[0] : null;
};

async function comprehensiveDebug() {
  console.log('🔍 开始全面诊断合规检查功能问题...');
  console.log();

  try {
    // 1. 检查数据总量
    console.log('📊 1. 检查数据总量');
    
    const { data: empSocialData, error: empSocialError } = await supabase
      .from('employee_social_insurance')
      .select('*');
    
    const { data: empBasicData, error: empBasicError } = await supabase
      .from('employee_basic_info')
      .select('*');
    
    const { data: cityStandardData, error: cityStandardError } = await supabase
      .from('city_social_insurance_standards')
      .select('*');

    if (empSocialError || empBasicError || cityStandardError) {
      console.error('❌ 数据查询失败:', { empSocialError, empBasicError, cityStandardError });
      return;
    }

    console.log(`  员工社保数据: ${empSocialData?.length || 0} 条`);
    console.log(`  员工基本信息: ${empBasicData?.length || 0} 条`);
    console.log(`  城市标准配置: ${cityStandardData?.length || 0} 条`);

    // 2. 检查员工工号关联
    console.log('\n🔗 2. 检查员工工号关联');
    const socialWithEmployeeId = empSocialData?.filter(record => record.员工工号) || [];
    const basicEmployeeIds = new Set(empBasicData?.map(emp => emp.员工工号).filter(Boolean) || []);
    const socialEmployeeIds = new Set(socialWithEmployeeId.map(record => record.员工工号));
    
    console.log(`  有员工工号的社保记录: ${socialWithEmployeeId.length} 条`);
    console.log(`  基本信息中的员工工号: ${basicEmployeeIds.size} 个`);
    console.log(`  社保记录中的员工工号: ${socialEmployeeIds.size} 个`);
    
    const commonEmployeeIds = [...socialEmployeeIds].filter(id => basicEmployeeIds.has(id));
    console.log(`  两表共同的员工工号: ${commonEmployeeIds.length} 个`);
    
    if (commonEmployeeIds.length > 0) {
      console.log(`  共同员工工号示例: ${commonEmployeeIds.slice(0, 5).join(', ')}`);
    }

    // 3. 检查具体的合规检查逻辑
    console.log('\n🔍 3. 测试合规检查逻辑');
    
    if (socialWithEmployeeId.length === 0) {
      console.log('❌ 没有有效的员工社保数据，无法进行合规检查');
      return;
    }

    // 选择一个有员工工号的社保记录进行测试
    const testRecord = socialWithEmployeeId[0];
    console.log('\n📋 测试记录:');
    console.log('  员工工号:', testRecord.员工工号);
    console.log('  姓名:', testRecord.姓, testRecord.名);
    console.log('  险种类型:', testRecord.险种类型);
    console.log('  缴交地:', testRecord.缴交地);
    console.log('  开始时间:', testRecord.开始时间);
    console.log('  结束时间:', testRecord.结束时间);
    console.log('  个人缴交比例:', testRecord.个人缴交比例);

    // 查找匹配的标准
    const matchingStandard = findMatchingStandard(testRecord, cityStandardData);
    
    if (matchingStandard) {
      console.log('\n✅ 找到匹配的标准:');
      console.log('  标准城市:', matchingStandard.城市);
      console.log('  标准险种:', matchingStandard.险种类型);
      console.log('  标准个人比例:', matchingStandard.个人缴费比例);
      console.log('  生效时间:', matchingStandard.生效日期, '-', matchingStandard.失效日期);
      
      // 检查比例是否一致
      const empRatio = testRecord.个人缴交比例;
      const stdRatio = matchingStandard.个人缴费比例;
      const ratioMatch = Math.abs(empRatio - stdRatio) < 0.001;
      
      console.log('\n📊 比例检查:');
      console.log(`  员工比例: ${empRatio}`);
      console.log(`  标准比例: ${stdRatio}`);
      console.log(`  比例匹配: ${ratioMatch}`);
      
      if (!ratioMatch) {
        console.log('🚨 发现问题：个人缴费比例不符合标准！');
      } else {
        console.log('✅ 个人缴费比例符合标准');
      }
    } else {
      console.log('❌ 未找到匹配的标准配置');
      
      console.log('\n🔍 分析原因:');
      console.log('可用的城市标准:');
      const cities = [...new Set(cityStandardData?.map(std => std.城市) || [])];
      console.log('  ', cities.join(', '));
      
      console.log('可用的险种类型:');
      const types = [...new Set(cityStandardData?.map(std => std.险种类型) || [])];
      console.log('  ', types.join(', '));
    }

    // 4. 检查员工社保记录完整性
    console.log('\n📋 4. 检查员工社保记录完整性');
    
    const employeesWithoutSocial = empBasicData?.filter(emp => {
      const empId = emp.员工工号;
      return empId && !socialEmployeeIds.has(empId);
    }) || [];
    
    console.log(`  没有社保记录的员工: ${employeesWithoutSocial.length} 个`);
    if (employeesWithoutSocial.length > 0) {
      console.log('  示例员工:');
      employeesWithoutSocial.slice(0, 3).forEach(emp => {
        console.log(`    ${emp.员工工号}: ${emp.姓}${emp.名}`);
      });
      console.log('🚨 发现问题：部分员工缺少社保记录！');
    } else {
      console.log('✅ 所有员工都有社保记录');
    }

    // 5. 检查险种完整性
    console.log('\n🏥 5. 检查险种完整性');
    const requiredInsuranceTypes = ['养老保险', '医疗保险', '失业保险', '工伤保险', '生育保险'];
    
    // 按员工分组检查险种完整性
    const employeeInsuranceMap = new Map();
    socialWithEmployeeId.forEach(record => {
      const empId = record.员工工号;
      const year = record.年度;
      const insuranceType = standardizeInsuranceType(record.险种类型);
      
      const key = `${empId}-${year}`;
      if (!employeeInsuranceMap.has(key)) {
        employeeInsuranceMap.set(key, new Set());
      }
      employeeInsuranceMap.get(key).add(insuranceType);
    });
    
    let incompleteCount = 0;
    employeeInsuranceMap.forEach((insuranceTypes, key) => {
      const missingTypes = requiredInsuranceTypes.filter(type => !insuranceTypes.has(type));
      if (missingTypes.length > 0) {
        incompleteCount++;
        if (incompleteCount <= 3) { // 只显示前3个例子
          console.log(`  ${key}: 缺少 ${missingTypes.join(', ')}`);
        }
      }
    });
    
    if (incompleteCount > 0) {
      console.log(`🚨 发现问题：${incompleteCount} 个员工年度记录险种不完整！`);
    } else {
      console.log('✅ 所有员工年度记录险种完整');
    }

    console.log('\n📝 诊断总结:');
    console.log('1. 数据量检查: 完成');
    console.log('2. 员工工号关联检查: 完成');
    console.log('3. 合规检查逻辑测试: 完成');
    console.log('4. 员工社保记录完整性检查: 完成');
    console.log('5. 险种完整性检查: 完成');
    
  } catch (error) {
    console.error('❌ 诊断过程中出错:', error);
  }
}

comprehensiveDebug();