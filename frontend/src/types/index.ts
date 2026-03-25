/**
 * Agent 状态类型
 */
export type AgentStatus = 'ONLINE' | 'OFFLINE'

/**
 * Agent 注册方式
 */
export type RegisterType = 'HTTP' | 'LONG_CONNECTION'

/**
 * 任务状态
 */
export type TaskStatus = 'RUNNING' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'QUEUED' | 'WAITING' | 'SUCCESS' | 'ERROR'

/**
 * Agent 实体
 */
export interface Agent {
  agentId: string
  agentName?: string
  host?: string
  port?: number
  status: AgentStatus
  channelId?: string
  registerType: RegisterType
  lastHeartbeat?: string
  onlineTime?: string
  skillDescription?: string
  skillTags?: string
}

/**
 * 任务进度实体
 */
export interface TaskProgress {
  taskId: string
  agentId: string
  taskType: string
  status: TaskStatus
  progress: number
  message?: string
  updateTime?: string
}

/**
 * 概览数据
 */
export interface Overview {
  totalAgents: number
  onlineAgents: number
  offlineAgents: number
  totalTaskRecords: number
  runningTaskRecords: number
  failedTaskRecords: number
}

/**
 * Agent 画像（前端展示用）
 */
export interface AgentProfile {
  title: string
  scene: string
  capabilities: string[]
  description: string
}

/**
 * 任务汇总统计
 */
export interface TaskSummary {
  running: number
  pending: number
  completed: number
  failed: number
}

/**
 * 菜单 key 类型
 */
export type MenuKey = 'dashboard' | 'agents' | 'tasks' | 'testing'

/**
 * Agent 状态筛选
 */
export type AgentStatusFilter = 'ALL' | 'ONLINE' | 'OFFLINE'

/**
 * 注册表单
 */
export interface RegisterForm {
  agentId: string
  agentName: string
  host: string
  port: number
  skillDescription?: string
  skillTags?: string
  registerType?: RegisterType
}

/**
 * 命令载荷
 */
export interface CommandPayload {
  [key: string]: unknown
}
