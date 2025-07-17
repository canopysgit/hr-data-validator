"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DataImport from "@/components/DataImport";
import DataViewer from "@/components/DataViewer";
import ComplianceChecker from "@/components/ComplianceChecker";
import {
  Upload,
  Database,
  Settings,
  CheckCircle,
  FileText,
  BarChart3,
  AlertTriangle,
  Users,
  Building,
  DollarSign
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HR数据检查工具</h1>
                <p className="text-sm text-gray-500">智能数据质量验证平台</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              v1.0
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-1/2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              数据上传
            </TabsTrigger>
            <TabsTrigger value="basedata" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              基础数据
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              业务规则
            </TabsTrigger>
            <TabsTrigger value="check" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              数据检查
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              检查报告
            </TabsTrigger>
          </TabsList>

          {/* 数据上传模块 */}
          <TabsContent value="upload" className="space-y-6">
            <DataImport />
          </TabsContent>

          {/* 基础数据管理模块 */}
          <TabsContent value="basedata" className="space-y-6">
            <DataViewer />
          </TabsContent>

          {/* 业务规则配置模块 */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  五险一金合规检查规则
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <h3 className="font-medium mb-2 text-green-800">员工社保记录完整性检查</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      检查【员工基本信息】表中的所有员工是否都在【员工社保信息】表中有对应的社保缴纳记录，
                      识别出没有任何社保记录的员工。
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">已实现</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <h3 className="font-medium mb-2 text-orange-800">员工社保缴纳比例一致性检查</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      检查员工实际缴费比例与城市标准配置是否一致。
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">已实现</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <h3 className="font-medium mb-2 text-blue-800">员工社保记录项目完整性检查</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      检查每个员工每个年度是否具备完整的4项基本险种记录。
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">已实现</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                    <h3 className="font-medium mb-2 text-purple-800">员工缴纳地一致性检查</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      检查员工社保缴纳地与签约公司主体所在地是否一致。
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">已实现</Badge>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                    <h3 className="font-medium mb-2 text-indigo-800">社保缴交基数与月均收入一致性检查</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      验证员工社保缴交基数是否与其月均收入保持一致，确保缴费基数的合规性。
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">已实现</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 数据检查模块 */}
          <TabsContent value="check" className="space-y-6">
            <ComplianceChecker />
          </TabsContent>

          {/* 检查报告模块 */}
          <TabsContent value="report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  五险一金合规检查报告
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      暂无检查报告，请先执行数据检查。
                    </AlertDescription>
                  </Alert>

                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">导入数据并执行检查后，这里将显示详细的检查报告</p>
                    <Button variant="outline" disabled>
                      查看历史报告
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
