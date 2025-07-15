"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, TABLE_NAMES } from "@/lib/supabase";
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Eye,
  Users,
  Building,
  FileText
} from "lucide-react";

const tableConfig = [
  {
    tableName: TABLE_NAMES.ORGANIZATIONS,
    displayName: '组织架构数据',
    icon: <Building className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.ORG_POSITION_EMPLOYEE,
    displayName: '组织-岗位-人员架构',
    icon: <Users className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.EMPLOYEE_BASIC_INFO,
    displayName: '员工基本信息',
    icon: <Users className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.EMPLOYEE_CONTRACTS,
    displayName: '员工合同信息',
    icon: <FileText className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.EMPLOYEE_SOCIAL_INSURANCE,
    displayName: '员工社保信息',
    icon: <FileText className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.EMPLOYEE_DOCUMENTS,
    displayName: '证件信息',
    icon: <FileText className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.EMPLOYEE_DATES,
    displayName: '日期说明',
    icon: <FileText className="h-4 w-4" />
  },
  {
    tableName: TABLE_NAMES.CITY_STANDARDS,
    displayName: '城市社保标准配置表',
    icon: <Database className="h-4 w-4" />
  }
];

interface TableStat {
  tableName: string;
  displayName: string;
  count: number;
  icon: React.ReactNode;
}

export default function DataViewer() {
  const [tableStats, setTableStats] = useState<TableStat[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20); // 每页显示20条记录

  const loadTableStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stats: TableStat[] = [];

      for (const table of tableConfig) {
        const { count, error } = await supabase
          .from(table.tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Error counting ${table.tableName}:`, error);
          stats.push({
            ...table,
            count: 0
          });
        } else {
          stats.push({
            ...table,
            count: count || 0
          });
        }
      }

      setTableStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTableData = async (tableName: string, page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      // 获取总数
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // 获取分页数据
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, to);

      if (error) {
        throw error;
      }

      setTableData(data || []);
      setSelectedTable(tableName);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载表数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTableStats();
  }, [loadTableStats]);

  const handlePageChange = (page: number) => {
    if (selectedTable) {
      loadTableData(selectedTable, page);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const renderTableData = () => {
    if (tableData.length === 0) {
      return (
        <div className="text-center py-8">
          <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无数据或请选择要查看的表</p>
        </div>
      );
    }

    const columns = Object.keys(tableData[0]);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="whitespace-nowrap">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column} className="whitespace-nowrap">
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column]).length > 30
                        ? String(row[column]).substring(0, 30) + '...'
                        : String(row[column])
                      : '-'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} 条，共 {totalCount} 条记录
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                首页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600 px-2">
                第 {currentPage} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                末页
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalRecords = tableStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            数据库状态概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              总记录数: <span className="font-bold text-lg">{totalRecords}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTableStats}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              刷新统计
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableStats.map((stat) => (
              <Card key={stat.tableName} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setCurrentPage(1);
                      loadTableData(stat.tableName, 1);
                    }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="font-medium text-sm">{stat.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={stat.count > 0 ? "default" : "secondary"}>
                        {stat.count} 条
                      </Badge>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                {tableConfig.find(t => t.tableName === selectedTable)?.displayName} - 数据预览
              </div>
              {totalCount > 0 && (
                <Badge variant="outline" className="text-sm">
                  共 {totalCount} 条记录
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : (
              renderTableData()
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
