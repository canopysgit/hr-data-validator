const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';
const supabase = createClient(supabaseUrl, supabaseKey);

// 表名配置
const TABLE_NAMES = {
  SOCIAL_INSURANCE: 'employee_social_insurance',
  EMPLOYEE_BASIC_INFO: 'employee_basic_info'
};

// 社保年度计算函数
function getSocialInsuranceYear(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // 社保年度定义：当年7月1日到次年6月30日为一个社保年度
  // 例如：2022年度 = 2022年7月1日到2023年6月30日
  if (month >= 7) {
    return `${year}年度`;
  } else {
    return `${year - 1}年度`;
  }
}

// 验证杨志源等员工的社保数据
async function verifyEmployeeData() {
  try {
    console.log('🔍 开始验证员工社保数据...');
    
    // 目标员工
    const targetEmployees = ['80000001', '80000014', '80000003', '80000031'];
    const targetNames = {
      '80000001': '杨治源',
      '80000014': '何少盈', 
      '80000003': '张弛荣',
      '80000031': '陈宗良'
    };
    
    // 先查看表结构
    console.log('🔍 查看社保表结构...');
    const { data: sampleData, error: sampleError } = await supabase
      .from(TABLE_NAMES.SOCIAL_INSURANCE)
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('❌ 查询样本数据失败:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 表字段:', Object.keys(sampleData[0]));
      console.log('📄 样本数据:', sampleData[0]);
    }
    
    // 查询这些员工的社保数据
    const { data: socialData, error } = await supabase
      .from(TABLE_NAMES.SOCIAL_INSURANCE)
      .select('*')
      .in('员工工号', targetEmployees);
      
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`📊 查询到 ${socialData.length} 条社保记录`);
    
    // 打印所有查询到的记录
    console.log('\n📄 所有社保记录详情:');
    socialData.forEach((record, index) => {
      console.log(`${index + 1}. 员工工号: ${record.员工工号}, 险种: ${record.险种类型}, 开始日期: ${record.开始时间}, 结束日期: ${record.结束时间}, 年度: ${record.年度}`);
    });
    
    // 按员工和年度分组统计
    const employeeYearlyData = {};
    const requiredTypes = ['医疗保险', '失业保险', '工伤保险', '公积金'];
    
    socialData.forEach(record => {
      const empId = record.员工工号;
      const year = getSocialInsuranceYear(record.开始时间);
      const insuranceType = record.险种类型?.trim();
      
      if (!employeeYearlyData[empId]) {
        employeeYearlyData[empId] = {};
      }
      if (!employeeYearlyData[empId][year]) {
        employeeYearlyData[empId][year] = new Set();
      }
      
      // 标准化险种名称
      let standardType = insuranceType;
      if (insuranceType?.includes('医疗') || insuranceType?.includes('医保')) {
        standardType = '医疗保险';
      } else if (insuranceType?.includes('失业')) {
        standardType = '失业保险';
      } else if (insuranceType?.includes('工伤')) {
        standardType = '工伤保险';
      } else if (insuranceType?.includes('公积金')) {
        standardType = '公积金';
      }
      
      if (requiredTypes.includes(standardType)) {
        employeeYearlyData[empId][year].add(standardType);
      }
    });
    
    // 检查每个目标员工的完整性
    console.log('\n📋 员工社保完整性检查结果:');
    const targetYears = ['2022年度', '2023年度', '2024年度'];
    
    targetEmployees.forEach(empId => {
      const empName = targetNames[empId];
      console.log(`\n👤 ${empName} (${empId}):`);
      
      targetYears.forEach(year => {
        const existingTypes = employeeYearlyData[empId]?.[year] ? Array.from(employeeYearlyData[empId][year]) : [];
        const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type));
        
        console.log(`  ${year}: 有${existingTypes.length}项 [${existingTypes.join(', ')}], 缺${missingTypes.length}项 [${missingTypes.join(', ')}]`);
      });
    });
    
    // 特别验证杨治源的情况
    console.log('\n🎯 杨治源详细验证:');
    const yangData = employeeYearlyData['80000001'];
    if (yangData) {
      targetYears.forEach(year => {
        const existing = yangData[year] ? Array.from(yangData[year]) : [];
        const missing = requiredTypes.filter(type => !existing.includes(type));
        console.log(`  ${year}: 缺失${missing.length}项 - ${missing.join(', ')}`);
      });
    } else {
      console.log('  未找到杨治源的社保数据');
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

// 执行验证
verifyEmployeeData();