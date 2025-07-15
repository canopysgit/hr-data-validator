// 检查所有员工的合同和社保数据匹配情况
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  EMPLOYEE_CONTRACTS: 'employee_contracts'
};

async function checkAllEmployees() {
  console.log('🔍 检查所有员工的合同和社保数据匹配情况...');
  console.log();

  try {
    // 获取所有社保数据中的唯一员工工号
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('员工工号, 姓, 名')
      .order('员工工号');

    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }

    // 获取所有合同数据中的唯一员工工号
    const { data: contractData, error: contractError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('员工工号, 姓, 名')
      .order('员工工号');

    if (contractError) {
      console.error('❌ 查询合同数据失败:', contractError);
      return;
    }

    // 统计唯一员工工号
    const socialEmpIds = new Set();
    const socialEmpNames = {};
    socialData?.forEach(record => {
      const empId = String(record.员工工号);
      socialEmpIds.add(empId);
      socialEmpNames[empId] = `${record.姓}${record.名}`;
    });

    const contractEmpIds = new Set();
    const contractEmpNames = {};
    contractData?.forEach(record => {
      const empId = String(record.员工工号);
      contractEmpIds.add(empId);
      contractEmpNames[empId] = `${record.姓}${record.名}`;
    });

    console.log(`📊 数据统计:`);
    console.log(`  - 社保数据中的唯一员工: ${socialEmpIds.size} 个`);
    console.log(`  - 合同数据中的唯一员工: ${contractEmpIds.size} 个`);

    // 找出交集和差集
    const intersection = new Set([...socialEmpIds].filter(id => contractEmpIds.has(id)));
    const socialOnly = new Set([...socialEmpIds].filter(id => !contractEmpIds.has(id)));
    const contractOnly = new Set([...contractEmpIds].filter(id => !socialEmpIds.has(id)));

    console.log(`  - 两个数据集的交集: ${intersection.size} 个`);
    console.log(`  - 仅在社保数据中: ${socialOnly.size} 个`);
    console.log(`  - 仅在合同数据中: ${contractOnly.size} 个`);
    console.log();

    // 显示详细信息
    if (intersection.size > 0) {
      console.log('=== 有合同和社保记录的员工 ===');
      [...intersection].slice(0, 10).forEach(empId => {
        console.log(`  ${empId}: ${socialEmpNames[empId]}`);
      });
      if (intersection.size > 10) {
        console.log(`  ... 还有 ${intersection.size - 10} 个员工`);
      }
      console.log();
    }

    if (socialOnly.size > 0) {
      console.log('=== 仅有社保记录的员工 ===');
      [...socialOnly].slice(0, 10).forEach(empId => {
        console.log(`  ${empId}: ${socialEmpNames[empId]}`);
      });
      if (socialOnly.size > 10) {
        console.log(`  ... 还有 ${socialOnly.size - 10} 个员工`);
      }
      console.log();
    }

    if (contractOnly.size > 0) {
      console.log('=== 仅有合同记录的员工 ===');
      [...contractOnly].slice(0, 10).forEach(empId => {
        console.log(`  ${empId}: ${contractEmpNames[empId]}`);
      });
      if (contractOnly.size > 10) {
        console.log(`  ... 还有 ${contractOnly.size - 10} 个员工`);
      }
      console.log();
    }

    // 特别检查员工80000008
    console.log('=== 特别检查员工80000008 ===');
    const targetEmpId = '80000008';
    
    if (socialEmpIds.has(targetEmpId)) {
      console.log(`✅ 员工${targetEmpId}在社保数据中存在: ${socialEmpNames[targetEmpId]}`);
    } else {
      console.log(`❌ 员工${targetEmpId}在社保数据中不存在`);
    }
    
    if (contractEmpIds.has(targetEmpId)) {
      console.log(`✅ 员工${targetEmpId}在合同数据中存在: ${contractEmpNames[targetEmpId]}`);
    } else {
      console.log(`❌ 员工${targetEmpId}在合同数据中不存在`);
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

// 运行检查
checkAllEmployees();