// 测试修改后的缴交地一致性检查逻辑
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAMES = {
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  EMPLOYEE_CONTRACTS: 'employee_contracts'
};

// 复制检查逻辑中的辅助函数
const normalizeCityName = (cityName) => {
  if (!cityName) return '';
  return cityName.replace(/市$|地区$|区$/g, '').trim().toLowerCase();
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const isTimeOverlap = (period1, period2) => {
  if (!period1.start || !period2.start) return false;
  
  const p1End = period1.end || new Date('2099-12-31');
  const p2End = period2.end || new Date('2099-12-31');
  
  return period1.start <= p2End && period2.start <= p1End;
};

async function testLocationConsistency() {
  console.log('🧪 测试修改后的缴交地一致性检查逻辑...');
  console.log();

  try {
    // 获取社保数据样本
    const { data: socialData, error: socialError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE)
      .select('员工工号, 姓, 名, 开始时间, 结束时间, 缴交地')
      .limit(3);

    if (socialError) {
      console.error('❌ 查询社保数据失败:', socialError);
      return;
    }

    // 获取合同数据
    const { data: contractData, error: contractError } = await supabase
      .from(TABLE_NAMES.EMPLOYEE_CONTRACTS)
      .select('员工工号, 姓, 名, 开始日期, 结束日期, 劳动合同主体, 劳动合同主体所在城市');

    if (contractError) {
      console.error('❌ 查询合同数据失败:', contractError);
      return;
    }

    console.log(`📊 测试数据: ${socialData?.length || 0} 条社保记录, ${contractData?.length || 0} 条合同记录`);
    console.log();

    // 测试每条社保记录的匹配逻辑
    socialData?.forEach((socialRecord, index) => {
      console.log(`=== 测试记录 ${index + 1}: ${socialRecord.员工工号} (${socialRecord.姓}${socialRecord.名}) ===`);
      console.log(`社保时间段: ${socialRecord.开始时间} - ${socialRecord.结束时间}`);
      console.log(`缴交地: ${socialRecord.缴交地}`);
      
      const empId = socialRecord.员工工号;
      const socialStart = normalizeDate(socialRecord.开始时间);
      const socialEnd = normalizeDate(socialRecord.结束时间);
      
      // 精确时间段匹配
       const exactMatches = (contractData || []).filter(contract => {
         if (String(contract.员工工号) !== String(empId)) return false;
        
        const contractStart = normalizeDate(contract.开始日期);
        const contractEnd = normalizeDate(contract.结束日期);
        
        return isTimeOverlap(
          { start: socialStart, end: socialEnd },
          { start: contractStart, end: contractEnd }
        );
      });
      
      console.log(`🔍 精确匹配结果: ${exactMatches.length} 条记录`);
      
      if (exactMatches.length > 0) {
        exactMatches.forEach((contract, i) => {
          console.log(`  精确匹配${i + 1}: ${contract.开始日期} - ${contract.结束日期}, 城市: ${contract.劳动合同主体所在城市}`);
          
          const normalizedPayment = normalizeCityName(socialRecord.缴交地);
          const normalizedContract = normalizeCityName(contract.劳动合同主体所在城市);
          
          if (normalizedPayment === normalizedContract) {
            console.log(`  ✅ 城市匹配: ${socialRecord.缴交地} ≈ ${contract.劳动合同主体所在城市}`);
          } else {
            console.log(`  ❌ 城市不匹配: ${socialRecord.缴交地} ≠ ${contract.劳动合同主体所在城市}`);
          }
        });
      } else {
        // 备选匹配策略
         const employeeContracts = (contractData || []).filter(contract => String(contract.员工工号) === String(empId));
        
        if (employeeContracts.length === 0) {
          console.log(`  ❌ 未找到该员工的任何合同记录`);
        } else {
          console.log(`  📋 该员工共有 ${employeeContracts.length} 条合同记录`);
          
          // 选择最新的合同记录
          const sortedContracts = employeeContracts.sort((a, b) => {
            const dateA = normalizeDate(a.开始日期);
            const dateB = normalizeDate(b.开始日期);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateB.getTime() - dateA.getTime();
          });
          
          const latestContract = sortedContracts[0];
          console.log(`  🔄 使用最新合同: ${latestContract.开始日期} - ${latestContract.结束日期}, 城市: ${latestContract.劳动合同主体所在城市}`);
          
          const normalizedPayment = normalizeCityName(socialRecord.缴交地);
          const normalizedContract = normalizeCityName(latestContract.劳动合同主体所在城市);
          
          if (normalizedPayment === normalizedContract) {
            console.log(`  ⚠️  时间段不匹配但城市一致: ${socialRecord.缴交地} ≈ ${latestContract.劳动合同主体所在城市}`);
          } else {
            console.log(`  ❌ 时间段不匹配且城市不一致: ${socialRecord.缴交地} ≠ ${latestContract.劳动合同主体所在城市}`);
          }
        }
      }
      
      console.log();
    });

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testLocationConsistency();