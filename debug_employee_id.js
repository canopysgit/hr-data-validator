// 调试员工工号匹配问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  EMPLOYEE_CONTRACTS: 'employee_contracts'
};

async function debugEmployeeIdMatching() {
  console.log('🔍 调试员工工号匹配问题...');
  console.log();

  try {
    // 获取社保数据样本
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('员工工号, 姓, 名')
      .limit(5);

    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }

    // 获取合同数据样本
    const { data: contractData, error: contractError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('员工工号, 姓, 名')
      .limit(5);

    if (contractError) {
      console.error('❌ 查询合同数据失败:', contractError);
      return;
    }

    console.log('=== 社保数据中的员工工号 ===');
    socialData?.forEach((record, index) => {
      console.log(`${index + 1}. 员工工号: "${record.员工工号}" (类型: ${typeof record.员工工号}), 姓名: ${record.姓}${record.名}`);
    });

    console.log('\n=== 合同数据中的员工工号 ===');
    contractData?.forEach((record, index) => {
      console.log(`${index + 1}. 员工工号: "${record.员工工号}" (类型: ${typeof record.员工工号}), 姓名: ${record.姓}${record.名}`);
    });

    // 测试特定员工的匹配
    if (socialData && socialData.length > 0) {
      const testEmpId = socialData[0].员工工号;
      console.log(`\n=== 测试员工工号 "${testEmpId}" 的匹配 ===`);
      
      // 严格匹配
      const strictMatches = contractData?.filter(contract => contract.员工工号 === testEmpId) || [];
      console.log(`严格匹配 (===): ${strictMatches.length} 条记录`);
      
      // 字符串转换后匹配
      const stringMatches = contractData?.filter(contract => String(contract.员工工号) === String(testEmpId)) || [];
      console.log(`字符串匹配: ${stringMatches.length} 条记录`);
      
      // 显示匹配的记录
      if (stringMatches.length > 0) {
        console.log('匹配的合同记录:');
        stringMatches.forEach((contract, index) => {
          console.log(`  ${index + 1}. 员工工号: "${contract.员工工号}", 姓名: ${contract.姓}${contract.名}`);
        });
      }
    }

    // 检查所有唯一的员工工号
    console.log('\n=== 唯一员工工号统计 ===');
    const socialEmpIds = new Set(socialData?.map(r => String(r.员工工号)) || []);
    const contractEmpIds = new Set(contractData?.map(r => String(r.员工工号)) || []);
    
    console.log(`社保数据中的唯一员工工号: ${socialEmpIds.size} 个`);
    console.log(`合同数据中的唯一员工工号: ${contractEmpIds.size} 个`);
    
    // 找出交集
    const intersection = new Set([...socialEmpIds].filter(id => contractEmpIds.has(id)));
    console.log(`两个数据集的交集: ${intersection.size} 个`);
    
    if (intersection.size > 0) {
      console.log('交集中的员工工号:', [...intersection].slice(0, 5));
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

// 运行调试
debugEmployeeIdMatching();