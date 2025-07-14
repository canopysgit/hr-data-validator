import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyxzdprlbkvrbwwntaik.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eHpkcHJsYmt2cmJ3d250YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDMyNjUsImV4cCI6MjA2NzYxOTI2NX0.vH3HhUYf8VtpdJ881gD8yDPn2yhdfKRYUtNNgH75Cw0'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 数据库表名映射
export const TABLE_NAMES = {
  ORGANIZATIONS: 'organizations',
  ORG_POSITION_EMPLOYEE: 'org_position_employee',
  EMPLOYEE_BASIC_INFO: 'employee_basic_info',
  EMPLOYEE_SOCIAL_INSURANCE: 'employee_social_insurance',
  EMPLOYEE_DOCUMENTS: 'employee_documents',
  EMPLOYEE_DATES: 'employee_dates',
  CITY_STANDARDS: 'city_social_insurance_standards'
} as const

// 类型定义
export type Database = {
  organizations: {
    id: number
    序号: number | null
    本级组织名称: string | null
    组织编码: string | null
    一级组织名称: string | null
    二级组织名称: string | null
    三级组织名称: string | null
    四级组织名称: string | null
    本级组织名称_1: string | null
    生效开始时间: string | null
    生效结束时间: string | null
    组织职责描述: string | null
    上级组织编码: string | null
    上级组织名称: string | null
    组织负责人岗位编码: string | null
    组织负责人岗位名称: string | null
    组织负责人员工工号: string | null
    组织负责人员工姓名: string | null
    组织类型: string | null
    组织层级: string | null
    办公地点: string | null
    劳动合同主体: string | null
    成本中心: string | null
    费用中心: string | null
    created_at: string
  }
  employee_basic_info: {
    id: number
    序号: number | null
    员工工号: string | null
    姓: string | null
    名: string | null
    中间名: string | null
    性别: string | null
    婚姻状态: string | null
    出生日期: string | null
    国籍: string | null
    死亡日期: string | null
    是否退役军人: string | null
    子女人数: number | null
    教育程度: string | null
    宗教: string | null
    民族: string | null
    政治面貌: string | null
    身高: number | null
    体重: number | null
    created_at: string
  }
  employee_social_insurance: {
    id: number
    员工工号: string | null
    姓: string | null
    名: string | null
    年度: string | null
    开始时间: string | null
    结束时间: string | null
    险种类型: string | null
    缴交地: string | null
    缴交基数: number | null
    个人缴交比例: number | null
    公司缴交比例: number | null
    created_at: string
  }
}
