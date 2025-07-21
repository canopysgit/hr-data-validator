const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugHuangXiaoxiaDeep() {
  console.log('🔍 深度调试黄笑霞的工资数据问题...\n');
  
  try {
    // 1. 查询黄笑霞的员工工号
    console.log('👤 查找黄笑霞的员工工号...');
    const { data: basicInfo } = await supabase
      .from('employee_basic_info')
      .select('员工工号, 姓, 名')
      .eq('姓', '黄')
      .eq('名', '笑霞');
    
    if (!basicInfo || basicInfo.length === 0) {
      console.log('❌ 未找到黄笑霞的基本信息');
      return;
    }
    
    const empId = basicInfo[0].员工工号;
    console.log(`✅ 黄笑霞的员工工号: ${empId}`);
    
    // 2. 查询所有相关的工资数据（不只是税前应发合计）
    console.log('\n💰 查询黄笑霞的所有工资数据...');
    const { data: allSalaryData } = await supabase
      .from('salary_calculation_results')
      .select('*')
      .eq('employee_id', empId)
      .order('start_date, salary_item_name');
    
    console.log(`📊 总工资记录数: ${allSalaryData?.length || 0}`);
    
    if (allSalaryData && allSalaryData.length > 0) {
      // 按年度和工资项分组
      const salaryByYearItem = {};
      allSalaryData.forEach(record => {
        const year = new Date(record.start_date).getFullYear();
        const item = record.salary_item_name;
        
        if (!salaryByYearItem[year]) {
          salaryByYearItem[year] = {};
        }
        if (!salaryByYearItem[year][item]) {
          salaryByYearItem[year][item] = [];
        }
        salaryByYearItem[year][item].push(record);
      });
      
      console.log('\n📋 工资数据按年度和项目分组:');
      Object.keys(salaryByYearItem).forEach(year => {
        console.log(`\n${year}年:`);
        Object.keys(salaryByYearItem[year]).forEach(item => {
          const records = salaryByYearItem[year][item];
          console.log(`  ${item}: ${records.length} 条记录`);
        });
      });
      
      // 特别关注税前应发合计
      console.log('\n🎯 重点分析税前应发合计:');
      const taxableRecords = allSalaryData.filter(record => 
        record.salary_item_name === '税前应发合计'
      );
      
      console.log(`税前应发合计记录数: ${taxableRecords.length}`);
      
      if (taxableRecords.length > 0) {
        console.log('\n详细记录:');
        taxableRecords.forEach((record, index) => {
          console.log(`${index + 1}. ${record.start_date} ~ ${record.end_date}: ¥${record.amount} (ID: ${record.id})`);
        });
        
        // 按年度分组税前应发合计
        const taxableByYear = {};
        taxableRecords.forEach(record => {
          const year = new Date(record.start_date).getFullYear();
          if (!taxableByYear[year]) {
            taxableByYear[year] = [];
          }
          taxableByYear[year].push(record);
        });
        
        console.log('\n📊 税前应发合计按年度统计:');
        Object.keys(taxableByYear).forEach(year => {
          const records = taxableByYear[year];
          const total = records.reduce((sum, record) => sum + (record.amount || 0), 0);
          const average = Math.round(total / records.length);
          
          console.log(`\n${year}年:`);
          console.log(`  记录数: ${records.length} 个月`);
          console.log(`  年度总收入: ¥${total.toLocaleString()}`);
          console.log(`  月均收入: ¥${average.toLocaleString()}`);
          
          if (records.length === 12) {
            console.log(`  ✅ 数据完整 (12个月)`);
          } else {
            console.log(`  ❌ 数据不完整 (${records.length}/12个月)`);
            console.log(`  缺失月份分析:`);
            
            // 分析缺失的月份
            const existingMonths = new Set();
            records.forEach(record => {
              const month = new Date(record.start_date).getMonth() + 1;
              existingMonths.add(month);
            });
            
            const allMonths = [1,2,3,4,5,6,7,8,9,10,11,12];
            const missingMonths = allMonths.filter(month => !existingMonths.has(month));
            
            console.log(`    现有月份: ${Array.from(existingMonths).sort((a,b) => a-b).join(', ')}`);
            console.log(`    缺失月份: ${missingMonths.join(', ')}`);
          }
        });
      }
    }
    
    // 3. 查询黄笑霞的社保数据，特别关注缴交基数
    console.log('\n🏥 查询黄笑霞的社保数据...');
    const { data: socialData } = await supabase
      .from('employee_social_insurance')
      .select('*')
      .eq('员工工号', empId)
      .order('社保年度, 险种类型');
    
    console.log(`📊 社保记录数: ${socialData?.length || 0}`);
    
    if (socialData && socialData.length > 0) {
      console.log('\n📋 社保缴交基数分析:');
      socialData.forEach(record => {
        console.log(`\n${record.社保年度}年度 ${record.险种类型}:`);
        console.log(`  缴交基数: ¥${record.缴交基数?.toLocaleString()}`);
        console.log(`  缴交地: ${record.缴交地}`);
        console.log(`  时间: ${record.开始时间} ~ ${record.结束时间}`);
        
        // 检查异常的缴交基数
        if (record.缴交基数 > 100000) {
          console.log(`  ⚠️ 异常！缴交基数过高: ¥${record.缴交基数?.toLocaleString()}`);
        }
      });
      
      // 特别关注2024年度的551718
      const social2024 = socialData.filter(record => record.社保年度 === '2024');
      if (social2024.length > 0) {
        console.log('\n🎯 2024年度社保基数分析:');
        social2024.forEach(record => {
          console.log(`${record.险种类型}: ¥${record.缴交基数?.toLocaleString()}`);
        });
        
        // 检查是否所有险种都是551718
        const uniqueBases = new Set(social2024.map(record => record.缴交基数));
        console.log(`唯一缴交基数值: ${Array.from(uniqueBases).map(base => `¥${base?.toLocaleString()}`).join(', ')}`);
        
        if (uniqueBases.has(551718)) {
          console.log('\n❌ 发现问题：551718这个基数明显异常！');
          console.log('   正常的社保缴交基数应该在几千到几万之间');
          console.log('   551718可能是年度总收入，而不是月均收入');
        }
      }
    }
    
    // 4. 查询北京的社保标准配置
    console.log('\n🏛️ 查询北京2024年度社保标准...');
    const { data: standardData } = await supabase
      .from('city_social_insurance_standards')
      .select('*')
      .eq('城市', '北京')
      .eq('社保年度', '2024');
    
    if (standardData && standardData.length > 0) {
      console.log('\n📋 北京2024年度社保标准:');
      standardData.forEach(record => {
        console.log(`\n${record.险种类型}:`);
        console.log(`  最低缴费基数: ¥${record.最低缴费基数?.toLocaleString()}`);
        console.log(`  最高缴费基数: ¥${record.最高缴费基数?.toLocaleString()}`);
      });
      
      // 检查黄笑霞的基数是否超标
      const yangLaoStandard = standardData.find(record => 
        record.险种类型?.includes('养老') || record.险种类型?.includes('基本养老')
      );
      
      if (yangLaoStandard) {
        const maxBase = yangLaoStandard.最高缴费基数;
        console.log(`\n🔍 基数合规性检查:`);
        console.log(`  养老保险最高基数: ¥${maxBase?.toLocaleString()}`);
        console.log(`  黄笑霞实际基数: ¥551,718`);
        console.log(`  超出倍数: ${Math.round(551718 / maxBase)}倍`);
        console.log(`  ❌ 严重超标！应该按最高基数¥${maxBase?.toLocaleString()}缴交`);
      }
    }
    
    // 5. 计算正确的月均收入
    console.log('\n🧮 计算黄笑霞2023年正确的月均收入...');
    const taxable2023 = allSalaryData?.filter(record => 
      record.salary_item_name === '税前应发合计' && 
      new Date(record.start_date).getFullYear() === 2023
    ) || [];
    
    if (taxable2023.length === 12) {
      const total2023 = taxable2023.reduce((sum, record) => sum + (record.amount || 0), 0);
      const monthly2023 = Math.round(total2023 / 12);
      
      console.log(`✅ 2023年数据完整:`);
      console.log(`  年度总收入: ¥${total2023.toLocaleString()}`);
      console.log(`  月均收入: ¥${monthly2023.toLocaleString()}`);
      console.log(`  应该用于计算2024年度社保基数: ¥${monthly2023.toLocaleString()}`);
      
      // 对比异常的551718
      console.log(`\n🔍 问题对比:`);
      console.log(`  正确的月均收入: ¥${monthly2023.toLocaleString()}`);
      console.log(`  异常的缴交基数: ¥551,718`);
      console.log(`  差异: ¥${Math.abs(551718 - monthly2023).toLocaleString()}`);
      
      if (Math.abs(total2023 - 551718) < 100) {
        console.log(`  🎯 发现问题根源：551718 ≈ 年度总收入 (¥${total2023.toLocaleString()})`);
        console.log(`  ❌ 系统错误地使用了年度总收入而不是月均收入！`);
      }
    } else {
      console.log(`❌ 2023年数据不完整: ${taxable2023.length}/12个月`);
      console.log(`这可能是系统报告"工资数据不足"的原因`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行深度调试
debugHuangXiaoxiaDeep();
