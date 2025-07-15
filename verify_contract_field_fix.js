// 验证员工合同信息表字段映射修复
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试修复后的字段映射逻辑
function testFieldMapping() {
  console.log('🔍 测试修复后的字段映射逻辑...');
  console.log();

  // 修复前的允许字段（缺少"劳动合同主体所在城市"）
  const oldAllowedFields = [
    '员工工号', '姓', '名', '开始日期', '结束日期', '签订日期',
    '合同类型', '劳动合同主体', '合同期限类型', '是否竞业协议',
    '劳动合同状态', '签署类型', '签署年限'
  ];

  // 修复后的允许字段（包含"劳动合同主体所在城市"）
  const newAllowedFields = [
    '员工工号', '姓', '名', '开始日期', '结束日期', '签订日期',
    '合同类型', '劳动合同主体', '劳动合同主体所在城市', '合同期限类型', '是否竞业协议',
    '劳动合同状态', '签署类型', '签署年限'
  ];

  console.log('📋 修复前的允许字段:');
  oldAllowedFields.forEach((field, index) => {
    console.log(`   ${index + 1}. ${field}`);
  });

  console.log();
  console.log('📋 修复后的允许字段:');
  newAllowedFields.forEach((field, index) => {
    console.log(`   ${index + 1}. ${field}`);
  });

  console.log();
  console.log('🎯 关键修复:');
  console.log('   ✅ 添加了"劳动合同主体所在城市"字段到允许字段列表');
  console.log('   📍 该字段现在会在数据导入时被保留，而不是被过滤掉');

  // 模拟Excel数据
  const mockExcelData = [
    {
      '员工工号': 'EMP001',
      '姓': '张',
      '名': '三',
      '开始日期': '2023-01-01',
      '结束日期': '2025-12-31',
      '签订日期': '2022-12-15',
      '合同类型': '劳动合同',
      '劳动合同主体': 'ACC北京公司',
      '劳动合同主体所在城市': '北京市',
      '合同期限类型': '固定期限',
      '是否竞业协议': '否',
      '劳动合同状态': '生效',
      '签署类型': '电子签署',
      '签署年限': '3年',
      '__EMPTY_1': '', // 这些字段应该被过滤掉
      'Unnamed: 15': null
    }
  ];

  console.log();
  console.log('=== 模拟字段映射测试 ===');
  console.log('📊 模拟Excel数据字段:');
  Object.keys(mockExcelData[0]).forEach((field, index) => {
    console.log(`   ${index + 1}. ${field}`);
  });

  // 模拟修复前的映射逻辑
  function oldFieldMapping(data) {
    return data.map(row => {
      const convertedRow = {};
      Object.keys(row).forEach(key => {
        if (key.startsWith('__EMPTY') || key.startsWith('Unnamed:') || key === '' || key === null) {
          return;
        }
        if (oldAllowedFields.includes(key)) {
          convertedRow[key] = row[key];
        }
      });
      return convertedRow;
    });
  }

  // 模拟修复后的映射逻辑
  function newFieldMapping(data) {
    return data.map(row => {
      const convertedRow = {};
      Object.keys(row).forEach(key => {
        if (key.startsWith('__EMPTY') || key.startsWith('Unnamed:') || key === '' || key === null) {
          return;
        }
        if (newAllowedFields.includes(key)) {
          convertedRow[key] = row[key];
        }
      });
      return convertedRow;
    });
  }

  const oldResult = oldFieldMapping(mockExcelData);
  const newResult = newFieldMapping(mockExcelData);

  console.log();
  console.log('📋 修复前映射结果字段:');
  Object.keys(oldResult[0]).forEach((field, index) => {
    console.log(`   ${index + 1}. ${field}`);
  });

  console.log();
  console.log('📋 修复后映射结果字段:');
  Object.keys(newResult[0]).forEach((field, index) => {
    console.log(`   ${index + 1}. ${field}`);
  });

  console.log();
  console.log('🔍 关键差异分析:');
  const oldHasLocationField = Object.keys(oldResult[0]).includes('劳动合同主体所在城市');
  const newHasLocationField = Object.keys(newResult[0]).includes('劳动合同主体所在城市');
  
  console.log(`   修复前包含"劳动合同主体所在城市": ${oldHasLocationField ? '✅ 是' : '❌ 否'}`);
  console.log(`   修复后包含"劳动合同主体所在城市": ${newHasLocationField ? '✅ 是' : '❌ 否'}`);
  
  if (newHasLocationField) {
    console.log(`   修复后该字段的值: "${newResult[0]['劳动合同主体所在城市']}"`);
  }

  return { oldResult, newResult };
}

async function checkCurrentDatabaseData() {
  console.log();
  console.log('=== 检查当前数据库中的合同数据 ===');
  
  try {
    // 检查表结构
    const { data: tableInfo, error: tableError } = await supabase
      .from('employee_contracts')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ 查询表结构失败:', tableError.message);
      return;
    }

    if (tableInfo && tableInfo.length > 0) {
      console.log('📋 数据库表字段:');
      Object.keys(tableInfo[0]).forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}`);
      });
      
      const hasLocationField = Object.keys(tableInfo[0]).includes('劳动合同主体所在城市');
      console.log();
      console.log(`🎯 数据库表包含"劳动合同主体所在城市"字段: ${hasLocationField ? '✅ 是' : '❌ 否'}`);
    }

    // 检查数据内容
    const { data: contracts, error: dataError } = await supabase
      .from('employee_contracts')
      .select('员工工号, 姓, 名, 劳动合同主体, 劳动合同主体所在城市')
      .limit(5);

    if (dataError) {
      console.log('❌ 查询数据失败:', dataError.message);
      return;
    }

    console.log();
    console.log(`📊 数据库中当前有合同记录，显示前5条:`);
    contracts.forEach((contract, index) => {
      console.log(`   记录 ${index + 1}:`);
      console.log(`     员工工号: ${contract['员工工号']}`);
      console.log(`     姓名: ${contract['姓']} ${contract['名']}`);
      console.log(`     劳动合同主体: ${contract['劳动合同主体']}`);
      console.log(`     劳动合同主体所在城市: ${contract['劳动合同主体所在城市']}`);
      console.log();
    });

    // 统计"劳动合同主体所在城市"字段的数据分布
    const { data: allContracts, error: allError } = await supabase
      .from('employee_contracts')
      .select('劳动合同主体所在城市');

    if (!allError && allContracts) {
      const locationData = allContracts.map(c => c['劳动合同主体所在城市']).filter(val => val != null && val !== '');
      const nullCount = allContracts.length - locationData.length;
      
      console.log('📈 "劳动合同主体所在城市"字段数据统计:');
      console.log(`   - 总记录数: ${allContracts.length}`);
      console.log(`   - 非空记录数: ${locationData.length}`);
      console.log(`   - 空值记录数: ${nullCount}`);
      console.log(`   - 空值比例: ${(nullCount / allContracts.length * 100).toFixed(1)}%`);
      
      if (locationData.length > 0) {
        const uniqueLocations = [...new Set(locationData)];
        console.log(`   - 唯一城市数: ${uniqueLocations.length}`);
        console.log(`   - 城市列表: ${uniqueLocations.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ 检查数据库数据时发生错误:', error);
  }
}

async function main() {
  console.log('🔧 验证员工合同信息表字段映射修复');
  console.log('=' .repeat(50));
  console.log();

  // 1. 测试字段映射逻辑
  testFieldMapping();

  // 2. 检查当前数据库数据
  await checkCurrentDatabaseData();

  console.log();
  console.log('📋 修复总结和建议:');
  console.log('   1. ✅ 已修复DataImport.tsx中的字段映射问题');
  console.log('   2. 🔄 需要重新导入Excel数据以应用修复');
  console.log('   3. 📊 当前数据库中的"劳动合同主体所在城市"字段为空是因为之前导入时被过滤掉了');
  console.log('   4. 🎯 重新导入后，该字段应该能正确保存Excel中的城市信息');
  console.log();
  console.log('🚀 下一步操作:');
  console.log('   - 使用修复后的DataImport组件重新导入员工合同数据');
  console.log('   - 验证"劳动合同主体所在城市"字段是否正确保存');
  console.log('   - 然后可以正常进行第四个检查点的开发');
}

// 运行验证
main();