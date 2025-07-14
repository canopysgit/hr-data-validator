// 通过姓名匹配修复员工社保数据中的员工工号
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEmployeeIdMapping() {
  console.log('🔧 开始修复员工社保数据中的员工工号...');
  console.log();

  try {
    // 1. 获取所有员工基本信息
    console.log('📋 获取员工基本信息...');
    const { data: basicData, error: basicError } = await supabase
      .from('employee_basic_info')
      .select('员工工号, 姓, 名');

    if (basicError) {
      console.error('❌ 查询员工基本信息失败:', basicError);
      return;
    }

    // 创建姓名到员工工号的映射
    const nameToIdMap = new Map();
    basicData?.forEach(emp => {
      if (emp.员工工号 && emp.姓 && emp.名) {
        const fullName = `${emp.姓}${emp.名}`;
        nameToIdMap.set(fullName, emp.员工工号);
      }
    });

    console.log(`✅ 创建了 ${nameToIdMap.size} 个姓名到员工工号的映射`);
    console.log('映射示例:');
    let count = 0;
    for (const [name, id] of nameToIdMap) {
      if (count < 5) {
        console.log(`  ${name} -> ${id}`);
        count++;
      }
    }

    // 2. 获取所有员工社保数据
    console.log('\n📋 获取员工社保数据...');
    const { data: socialData, error: socialError } = await supabase
      .from('employee_social_insurance')
      .select('*');

    if (socialError) {
      console.error('❌ 查询员工社保数据失败:', socialError);
      return;
    }

    console.log(`📊 找到 ${socialData?.length || 0} 条社保记录`);

    // 3. 匹配并更新员工工号
    let matchedCount = 0;
    let unmatchedCount = 0;
    const updatePromises = [];

    console.log('\n🔍 开始匹配员工工号...');
    
    socialData?.forEach(record => {
      if (record.姓 && record.名) {
        const fullName = `${record.姓}${record.名}`;
        const employeeId = nameToIdMap.get(fullName);
        
        if (employeeId) {
          matchedCount++;
          console.log(`✅ 匹配成功: ${fullName} -> ${employeeId}`);
          
          // 准备更新操作
          const updatePromise = supabase
            .from('employee_social_insurance')
            .update({ 员工工号: employeeId })
            .eq('id', record.id);
          
          updatePromises.push(updatePromise);
        } else {
          unmatchedCount++;
          console.log(`❌ 未匹配: ${fullName}`);
        }
      } else {
        unmatchedCount++;
        console.log(`❌ 姓名信息不完整: 姓=${record.姓}, 名=${record.名}`);
      }
    });

    console.log(`\n📊 匹配结果:`);
    console.log(`  成功匹配: ${matchedCount} 条`);
    console.log(`  未匹配: ${unmatchedCount} 条`);

    // 4. 执行批量更新
    if (updatePromises.length > 0) {
      console.log(`\n🔄 开始批量更新 ${updatePromises.length} 条记录...`);
      
      try {
        const results = await Promise.all(updatePromises);
        
        let successCount = 0;
        let errorCount = 0;
        
        results.forEach((result, index) => {
          if (result.error) {
            errorCount++;
            console.error(`❌ 更新失败 (记录 ${index + 1}):`, result.error);
          } else {
            successCount++;
          }
        });
        
        console.log(`\n✅ 更新完成:`);
        console.log(`  成功: ${successCount} 条`);
        console.log(`  失败: ${errorCount} 条`);
        
        // 5. 验证更新结果
        console.log('\n🔍 验证更新结果...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('employee_social_insurance')
          .select('员工工号, 姓, 名')
          .not('员工工号', 'is', null);
        
        if (verifyData) {
          console.log(`✅ 验证结果: ${verifyData.length} 条记录有员工工号`);
          
          if (verifyData.length > 0) {
            console.log('更新后的记录示例:');
            verifyData.slice(0, 3).forEach(record => {
              console.log(`  ${record.员工工号}: ${record.姓}${record.名}`);
            });
          }
        }
        
      } catch (updateError) {
        console.error('❌ 批量更新失败:', updateError);
      }
    } else {
      console.log('⚠️  没有需要更新的记录');
    }

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixEmployeeIdMapping();