"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, TABLE_NAMES } from "@/lib/supabase";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Database,
  RefreshCw
} from "lucide-react";

interface ImportProgress {
  sheet: string;
  total: number;
  current: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const SHEET_TABLE_MAPPING = {
  '组织架构数据': TABLE_NAMES.ORGANIZATIONS,
  '组织-岗位-人员架构数据': TABLE_NAMES.ORG_POSITION_EMPLOYEE,
  '员工基本信息': TABLE_NAMES.EMPLOYEE_BASIC_INFO,
  '员工社保信息': TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE,
  '证件信息': TABLE_NAMES.EMPLOYEE_DOCUMENTS,
  '日期说明': TABLE_NAMES.EMPLOYEE_DATES,
  '城市社保标准配置表': TABLE_NAMES.CITY_STANDARDS,
  '员工合同信息': TABLE_NAMES.EMPLOYEE_CONTRACTS,
  '工资核算结果信息': TABLE_NAMES.SALARY_CALCULATION_RESULTS,
};

export default function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<Record<string, { success: boolean; count?: number; error?: string }> | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);

      // 读取Excel文件获取sheet列表
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames.filter(name =>
          Object.keys(SHEET_TABLE_MAPPING).includes(name)
        );
        setSheets(sheetNames);
        setSelectedSheets([]); // 初始状态不选择任何sheet，让用户主动选择
      };
      reader.readAsBinaryString(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  // 定义各表允许的字段
  const ALLOWED_FIELDS = {
    [TABLE_NAMES.ORGANIZATIONS]: [
      '序号', '本级组织名称', '组织编码', '一级组织名称', '二级组织名称', '三级组织名称',
      '四级组织名称', '本级组织名称_1', '生效开始时间', '生效结束时间', '组织职责描述',
      '上级组织编码', '上级组织名称', '组织负责人岗位编码', '组织负责人岗位名称',
      '组织负责人员工工号', '组织负责人员工姓名', '组织类型', '组织层级', '办公地点',
      '劳动合同主体', '成本中心', '费用中心'
    ],
    [TABLE_NAMES.EMPLOYEE_BASIC_INFO]: [
      '序号', '员工工号', '姓', '名', '中间名', '性别', '婚姻状态', '出生日期', '国籍',
      '死亡日期', '是否退役军人', '子女人数', '教育程度', '宗教', '民族', '政治面貌',
      '身高', '体重'
    ],
    [TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE]: [
      '员工工号', '姓', '名', '社保年度', '开始时间', '结束时间', '险种类型', '缴交地', '缴交基数',
      '个人缴交比例', '公司缴交比例'
    ],
    [TABLE_NAMES.CITY_STANDARDS]: [
      'ID', '城市', '年度', '险种类型', '最低缴费基数', '最高缴费基数', '个人缴费比例',
      '公司缴费比例', '生效日期', '失效日期', '社保年度', '缴费基数生效依据', '缴费比例生效依据', '备注'
    ],
    [TABLE_NAMES.ORG_POSITION_EMPLOYEE]: [
      '序号', '员工工号', '姓', '名', '部门编码', '部门名称', '岗位编码', '岗位名称',
      '岗位名称_1', '岗位序列', '岗位等级', '岗位职级', '汇报关系类型', '汇报对象员工工号',
      '汇报对象姓名', '生效开始时间', '生效结束时间'
    ],
    [TABLE_NAMES.EMPLOYEE_DOCUMENTS]: [
      '员工工号', '姓', '名', '证件类型', '证件号码', '签发日期', '到期日期', '签发机关',
      '签发地点'
    ],
    [TABLE_NAMES.EMPLOYEE_DATES]: [
      '员工工号', '姓', '名', '日期类型', '日期', '备注'
    ],
    [TABLE_NAMES.EMPLOYEE_CONTRACTS]: [
      '员工工号', '姓', '名', '开始日期', '结束日期', '签订日期',
      '合同类型', '劳动合同主体', '劳动合同主体所在城市', '合同期限类型', '是否竞业协议',
      '劳动合同状态', '签署类型', '签署年限'
    ],
    [TABLE_NAMES.SALARY_CALCULATION_RESULTS]: [
      'employee_id', 'last_name', 'first_name', 'start_date', 'end_date',
      'salary_item_code', 'salary_item_name', 'amount', 'currency'
    ]
  };

  const convertExcelDataToDbFormat = (data: Record<string, unknown>[], sheetName: string) => {
    const tableName = SHEET_TABLE_MAPPING[sheetName as keyof typeof SHEET_TABLE_MAPPING];
    const allowedFields = ALLOWED_FIELDS[tableName] || [];

    return data.map(row => {
      const convertedRow: Record<string, unknown> = {};

      // 处理字段名中的特殊字符
      Object.keys(row).forEach(key => {
        let dbKey = key;

        // 跳过空列和无效列
        if (key.startsWith('__EMPTY') ||
            key.startsWith('Unnamed:') ||
            key === '' ||
            key === null ||
            key === undefined) {
          return; // 跳过这些列
        }

        // 处理特殊字段名
        if (key === '本级组织名称.1') {
          dbKey = '本级组织名称_1';
        } else if (key === '国家/地区') {
          dbKey = '国家地区';
        } else if (key === '岗位名称.1') {
          dbKey = '岗位名称_1';
        } else if (key === 'ID') {
          // 城市社保标准配置表的ID字段映射为大写
          dbKey = 'ID';
        } else if (key.toUpperCase() === 'ID') {
          // 处理各种形式的ID字段
          dbKey = 'ID';
        } else if (key === '险种' || key === '保险类型' || key === '类型') {
          // 将Excel中的险种相关列名映射到数据库的'险种类型'字段
          dbKey = '险种类型';
          console.log(`字段名映射: ${key} -> ${dbKey}`);
        } else if (key.includes('缴费基数生效依据')) {
          // 处理可能被截断的'缴费基数生效依据'字段
          dbKey = '缴费基数生效依据';
          console.log(`字段名映射: ${key} -> ${dbKey}`);
        } else if (key.includes('缴费比例生效依据')) {
          // 处理可能被截断的'缴费比例生效依据'字段
          dbKey = '缴费比例生效依据';
          console.log(`字段名映射: ${key} -> ${dbKey}`);
        } else if (key.includes('备注') || key.toLowerCase().includes('remark') || key.toLowerCase().includes('note')) {
          // 处理备注字段的各种可能名称
          dbKey = '备注';
          console.log(`字段名映射: ${key} -> ${dbKey}`);
        } else if (tableName === TABLE_NAMES.SALARY_CALCULATION_RESULTS) {
          // 工资核算结果信息表的字段映射
          if (key === '员工工号') {
            dbKey = 'employee_id';
          } else if (key === '姓') {
            dbKey = 'last_name';
          } else if (key === '名') {
            dbKey = 'first_name';
          } else if (key === '开始时间') {
            dbKey = 'start_date';
          } else if (key === '结束时间') {
            dbKey = 'end_date';
          } else if (key === '工资项名称') {
            dbKey = 'salary_item_name';
          } else if (key === '金额') {
            dbKey = 'amount';
          } else if (key === '币种') {
            dbKey = 'currency';
          }
          console.log(`工资表字段映射: ${key} -> ${dbKey}`);
        }

        // 处理数据类型转换
        let value = row[key];

        // 🔥 处理日期字段 - 完全按文本处理，禁用Excel日期序列号转换
        if (dbKey === '开始时间' || dbKey === '结束时间' ||
            dbKey === '生效日期' || dbKey === '失效日期' ||
            dbKey === '生效开始时间' || dbKey === '生效结束时间' ||
            dbKey === '出生日期' || dbKey === '入职日期' ||
            dbKey === '开始日期' || dbKey === '结束日期' || dbKey === '签订日期' ||
            dbKey === 'start_date' || dbKey === 'end_date') {

          console.log(`🗓️ 处理日期字段 ${dbKey}:`, { 原始值: value, 类型: typeof value });

          // ✅ 正确处理Excel日期：使用XLSX库解析日期序列号
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'number') {
              // Excel日期序列号：使用XLSX库的正确解析方法
              try {
                // 使用XLSX库解析Excel日期序列号
                const excelDate = XLSX.SSF.parse_date_code(value);
                if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
                  const year = excelDate.y;
                  const month = String(excelDate.m).padStart(2, '0');
                  const day = String(excelDate.d).padStart(2, '0');
                  value = `${year}-${month}-${day}`;
                  console.log(`✅ Excel序列号解析: ${value} (原始: ${row[key]}) -> ${year}-${month}-${day}`);
                } else {
                  // 如果解析失败，保持原始数字转字符串
                  value = String(value);
                  console.log(`⚠️ Excel日期解析失败，保持原始值: ${value}`);
                }
              } catch (error) {
                console.error(`❌ Excel日期解析错误:`, error);
                value = String(value);
              }
            }
            else if (typeof value === 'string') {
              // 字符串类型：处理各种文本日期格式
              const dateStr = value.trim();
              console.log(`📝 字符串日期处理: "${dateStr}"`);

              // 如果已经是标准格式 YYYY-MM-DD，直接使用
              if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                const parts = dateStr.split('-');
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                value = `${year}-${month}-${day}`;
                console.log(`✅ 标准格式日期: ${value}`);
              }
              // 处理 YYYY/MM/DD 格式
              else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
                const parts = dateStr.split('/');
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                value = `${year}-${month}-${day}`;
                console.log(`✅ 斜杠格式转换: ${dateStr} -> ${value}`);
              }
              // 处理 MM/DD/YY 格式（如 1/1/23）
              else if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
                const parts = dateStr.split('/');
                const month = parts[0].padStart(2, '0');
                const day = parts[1].padStart(2, '0');
                const year = '20' + parts[2]; // 假设是21世纪
                value = `${year}-${month}-${day}`;
                console.log(`✅ 美式短格式转换: ${dateStr} -> ${value}`);
              }
              // 其他字符串格式保持原样
              else {
                value = dateStr;
                console.log(`✅ 保持原始字符串: ${value}`);
              }
            }
            else {
              // 其他类型转为字符串
              value = String(value);
              console.log(`⚠️ 其他类型转字符串: ${value}`);
            }
          } else {
            value = null;
            console.log(`❌ 空值处理: null`);
          }
        } else {
          // 非日期字段的数字转换
          if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              value = numValue;
            }
          }
        }

        // 处理空值
        if (value === '' || value === null || value === undefined) {
          value = null;
        }

        // 检查字段是否在允许列表中
        if (allowedFields.length > 0 && !allowedFields.includes(dbKey)) {
          console.warn(`跳过不存在的字段: ${dbKey} (表: ${tableName})`);
          return; // 跳过数据库中不存在的字段
        }

        convertedRow[dbKey] = value;
      });

      return convertedRow;
    });
  };

  const importDataToSupabase = async () => {
    if (!file) {
      alert('请先上传Excel文件');
      return;
    }
    if (selectedSheets.length === 0) {
      alert('请至少选择一个Sheet进行导入');
      return;
    }

    setIsImporting(true);
    const progress: ImportProgress[] = selectedSheets.map(sheet => ({
      sheet,
      total: 0,
      current: 0,
      status: 'pending'
    }));
    setImportProgress(progress);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const results: Record<string, { success: boolean; count?: number; error?: string }> = {};

        // 🔥 第一步：并行清空所有选中的表，确保数据一致性
        console.log('🗑️ 开始清空所有选中的表...');
        const clearPromises = selectedSheets.map(async (sheetName) => {
          const tableName = SHEET_TABLE_MAPPING[sheetName as keyof typeof SHEET_TABLE_MAPPING];
          console.log(`清空表: ${tableName} (对应工作表: ${sheetName})`);

          try {
            const { error: deleteError } = await supabase.from(tableName).delete().neq('id', 0);
            if (deleteError) {
              console.warn(`清空表 ${tableName} 时出现警告:`, deleteError);
              return { tableName, success: false, error: deleteError.message };
            }
            console.log(`✅ 表 ${tableName} 清空成功`);
            return { tableName, success: true };
          } catch (error) {
            console.error(`❌ 清空表 ${tableName} 失败:`, error);
            return { tableName, success: false, error: String(error) };
          }
        });

        // 等待所有表清空完成
        const clearResults = await Promise.all(clearPromises);
        const failedClears = clearResults.filter(result => !result.success);

        if (failedClears.length > 0) {
          console.warn('⚠️ 部分表清空失败:', failedClears);
          // 继续执行，但记录警告
        }

        console.log('✅ 所有表清空完成，开始导入数据...');

        // 🔥 第二步：顺序导入数据到各个表
        for (let i = 0; i < selectedSheets.length; i++) {
          const sheetName = selectedSheets[i];
          const tableName = SHEET_TABLE_MAPPING[sheetName as keyof typeof SHEET_TABLE_MAPPING];

          // 更新进度状态
          const newProgress = [...progress];
          newProgress[i].status = 'processing';
          setImportProgress(newProgress);

          try {
            // 读取sheet数据
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

            newProgress[i].total = jsonData.length;
            setImportProgress([...newProgress]);

            if (jsonData.length > 0) {
              // 转换数据格式
              const convertedData = convertExcelDataToDbFormat(jsonData, sheetName);

              console.log(`处理表 ${sheetName}:`, {
                原始数据条数: jsonData.length,
                转换后数据条数: convertedData.length,
                原始字段: Object.keys(jsonData[0] || {}),
                转换后字段: Object.keys(convertedData[0] || {}),
                第一条数据示例: convertedData[0],
                目标表名: tableName
              });

              // 🔥 优化：使用更大的批量大小和优化的插入策略
              console.log(`📥 向已清空的表 ${tableName} 插入新数据`);

              // 🚀 大幅优化批量大小：根据数据量动态调整，显著提升导入速度
              const batchSize = convertedData.length > 2000 ? 500 : convertedData.length > 500 ? 300 : 150;
              let insertedCount = 0;

              for (let j = 0; j < convertedData.length; j += batchSize) {
                const batch = convertedData.slice(j, j + batchSize);

                const batchIndex = Math.floor(j/batchSize) + 1;
                console.log(`📦 处理批次 ${batchIndex}/${Math.ceil(convertedData.length/batchSize)}:`, {
                  表名: tableName,
                  批次大小: batch.length,
                  进度: `${j + batch.length}/${convertedData.length}`
                });

                try {
                  // 🔥 优化：移除 .select() 减少网络传输量，提高插入速度
                  const { error } = await supabase.from(tableName).insert(batch);

                  if (error) {
                    console.error(`❌ 批次 ${batchIndex} 插入失败:`, {
                      错误消息: error.message,
                      错误代码: error.code,
                      表名: tableName,
                      批次大小: batch.length
                    });
                    throw new Error(`插入失败: ${error.message}`);
                  }

                  console.log(`✅ 批次 ${batchIndex} 插入成功: ${batch.length} 条记录`);
                  insertedCount += batch.length;

                  // 🔥 优化：减少UI更新频率，每5个批次更新一次进度
                  if (batchIndex % 5 === 0 || j + batchSize >= convertedData.length) {
                    newProgress[i].current = insertedCount;
                    setImportProgress([...newProgress]);
                  }

                } catch (batchError) {
                  console.error(`❌ 批次 ${batchIndex} 处理失败:`, batchError);
                  throw batchError; // 重新抛出错误，让外层catch处理
                }
              }

              results[sheetName] = {
                success: true,
                count: insertedCount
              };

              console.log(`表 ${sheetName} 导入完成，共插入 ${insertedCount} 条记录`);
            }

            newProgress[i].status = 'completed';
            setImportProgress([...newProgress]);

          } catch (error: unknown) {
            console.error(`导入表 ${sheetName} 时发生错误:`, error);

            let errorMessage = '未知错误';
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else if (error && typeof error === 'object') {
              errorMessage = JSON.stringify(error);
            }

            newProgress[i].status = 'error';
            newProgress[i].error = errorMessage;
            setImportProgress([...newProgress]);
            results[sheetName] = {
              success: false,
              error: errorMessage
            };
          }
        }

        setImportResults(results);
        console.log('所有表导入完成，结果:', results);
      } catch (error: unknown) {
        console.error('整体导入失败:', error);
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const resetImport = () => {
    setFile(null);
    setSheets([]);
    setSelectedSheets([]);
    setImportProgress([]);
    setImportResults(null);
    setIsImporting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Excel数据导入工具
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">1. 上传文件</TabsTrigger>
              <TabsTrigger value="select">2. 选择Sheet</TabsTrigger>
              <TabsTrigger value="import">3. 执行导入</TabsTrigger>
            </TabsList>

            {/* 文件上传 */}
            <TabsContent value="upload">
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="text-lg font-medium text-green-600 mb-2">
                        已选择文件: {file.name}
                      </p>
                      <Badge variant="secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        拖拽Excel文件到此处或点击选择
                      </p>
                      <p className="text-sm text-gray-500">支持 .xlsx 和 .xls 格式</p>
                    </div>
                  )}
                </div>

                {file && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      文件上传成功！发现 {sheets.length} 个可导入的数据表。
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {/* 选择Sheet */}
            <TabsContent value="select">
              <div className="space-y-4">
                {sheets.length > 0 ? (
                  <div>
                    <h3 className="font-medium mb-3">选择要导入的数据表：</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sheets.map((sheet) => (
                        <div
                          key={sheet}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSheets.includes(sheet)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            if (selectedSheets.includes(sheet)) {
                              setSelectedSheets(selectedSheets.filter(s => s !== sheet));
                            } else {
                              setSelectedSheets([...selectedSheets, sheet]);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{sheet}</span>
                            {selectedSheets.includes(sheet) && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            目标表: {SHEET_TABLE_MAPPING[sheet as keyof typeof SHEET_TABLE_MAPPING]}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedSheets(sheets)}
                      >
                        全选
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedSheets([])}
                      >
                        清空
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      请先上传Excel文件
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {/* 执行导入 */}
            <TabsContent value="import">
              <div className="space-y-4">
                {selectedSheets.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">
                        准备导入 {selectedSheets.length} 个数据表
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={importDataToSupabase}
                          disabled={isImporting}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isImporting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              导入中...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              开始导入
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={resetImport}>
                          重置
                        </Button>
                      </div>
                    </div>

                    {/* 导入进度 */}
                    {importProgress.length > 0 && (
                      <div className="space-y-3">
                        {importProgress.map((progress, index) => (
                          <div key={progress.sheet} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{progress.sheet}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {progress.current}/{progress.total}
                                </span>
                                {progress.status === 'completed' && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                {progress.status === 'error' && (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </div>
                            <Progress
                              value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                              className="h-2"
                            />
                            {progress.error && (
                              <p className="text-sm text-red-600">{progress.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 导入结果 */}
                    {importResults && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-medium">导入完成！</p>
                            {Object.entries(importResults).map(([sheet, result]) => (
                              <p key={sheet} className="text-sm">
                                {sheet}: {result.success ? `成功导入 ${result.count} 条记录` : `失败 - ${result.error}`}
                              </p>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      请先选择要导入的数据表
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
