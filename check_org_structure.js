// 检查组织架构相关表的结构和数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  ORGANIZATIONS: 'organizations',
  ORG_POSITION_EMPLOYEE: 'org_position_employee',
  EMPLOYEE_BASIC_INFO: 'employee_basic_info',
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance'
};

async function checkOrgStructure() {
  console.log('🔍 检查组织架构相关表的结构和数据...');
  console.log();

  try {
    // 1. 检查organizations表
    console.log('=== 1. 检查organizations表 ===');
    const { data: orgData, error: orgError } = await supabase
      .from(TABLE_NAMES.ORGANIZATIONS)
      .select('*')
      .limit(3);

    if (orgError) {
      console.error('❌ 查询organizations表失败:', orgError);
    } else {
      console.log(`📊 organizations表记录数: ${orgData?.length || 0}`);
      if (orgData && orgData.length > 0) {
        console.log('📋 字段结构:');
        Object.keys(orgData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof orgData[0][key]} (${orgData[0][key]})`);
        });
        console.log('\n📄 示例数据:');
        console.log(JSON.stringify(orgData[0], null, 2));
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 检查org_position_employee表
    console.log('=== 2. 检查org_position_employee表 ===');
    const { data: orgPosData, error: orgPosError } = await supabase
      .from(TABLE_NAMES.ORG_POSITION_EMPLOYEE)
      .select('*')
      .limit(3);

    if (orgPosError) {
      console.error('❌ 查询org_position_employee表失败:', orgPosError);
    } else {
      console.log(`📊 org_position_employee表记录数: ${orgPosData?.length || 0}`);
      if (orgPosData && orgPosData.length > 0) {
        console.log('📋 字段结构:');
        Object.keys(orgPosData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof orgPosData[0][key]} (${orgPosData[0][key]})`);
        });
        console.log('\n📄 示例数据:');
        console.log(JSON.stringify(orgPosData[0], null, 2));
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 检查employee_basic_info表
    console.log('=== 3. 检查employee_basic_info表 ===');
    const { data: empData, error: empError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('*')
      .limit(3);

    if (empError) {
      console.error('❌ 查询employee_basic_info表失败:', empError);
    } else {
      console.log(`📊 employee_basic_info表记录数: ${empData?.length || 0}`);
      if (empData && empData.length > 0) {
        console.log('📋 字段结构:');
        Object.keys(empData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof empData[0][key]} (${empData[0][key]})`);
        });
        console.log('\n📄 示例数据:');
        console.log(JSON.stringify(empData[0], null, 2));
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. 分析员工与组织的关联关系
    console.log('=== 4. 分析员工与组织关联关系 ===');
    
    // 获取所有表的总记录数
    const { count: orgCount } = await supabase
      .from(TABLE_NAMES.ORGANIZATIONS)
      .select('*', { count: 'exact', head: true });
    
    const { count: orgPosCount } = await supabase
      .from(TABLE_NAMES.ORG_POSITION_EMPLOYEE)
      .select('*', { count: 'exact', head: true });
    
    const { count: empCount } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('*', { count: 'exact', head: true });

    console.log(`📊 数据统计:`);
    console.log(`  - organizations表: ${orgCount} 条记录`);
    console.log(`  - org_position_employee表: ${orgPosCount} 条记录`);
    console.log(`  - employee_basic_info表: ${empCount} 条记录`);

    // 5. 检查关键字段的数据分布
    console.log('\n=== 5. 检查关键字段数据分布 ===');
    
    // 检查组织编码分布
    const { data: orgCodes } = await supabase
      .from(TABLE_NAMES.ORGANIZATIONS)
      .select('组织编码')
      .not('组织编码', 'is', null)
      .limit(10);
    
    console.log('📋 组织编码示例:');
    orgCodes?.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.组织编码}`);
    });

    // 检查员工工号分布
    const { data: empIds } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_BASIC_INFO)
      .select('员工工号')
      .not('员工工号', 'is', null)
      .limit(10);
    
    console.log('\n📋 员工工号示例:');
    empIds?.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.员工工号}`);
    });

    console.log('\n✅ 组织架构表结构检查完成!');

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

checkOrgStructure();