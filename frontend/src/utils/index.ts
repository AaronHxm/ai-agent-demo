import type { Agent, AgentProfile, TaskProgress, TaskSummary } from '../types'
import { capabilityPool, scenes } from '../constants'

/**
 * 根据 Agent 生成画像信息
 */
export function profileForAgent(agent: Agent): AgentProfile {
  const seed = (agent.agentId ?? '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const c1 = capabilityPool[seed % capabilityPool.length]
  const c2 = capabilityPool[(seed + 2) % capabilityPool.length]
  const scene = scenes[seed % scenes.length]

  return {
    title: agent.agentName || agent.agentId,
    scene,
    capabilities: [
      c1,
      c2,
      agent.registerType === 'LONG_CONNECTION' ? '长连接实时交互' : 'HTTP注册接入',
    ],
    description: `负责${scene}，支持${c1}、${c2}，可按任务策略执行并持续回传进度。`,
  }
}

/**
 * 根据状态返回 CSS 类名
 */
export function statusClass(status?: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'ONLINE' || s === 'RUNNING' || s === 'IN_PROGRESS' || s === 'COMPLETED' || s === 'SUCCESS') return 'ok'
  if (s === 'PENDING' || s === 'WAITING' || s === 'QUEUED') return 'warn'
  if (s === 'FAILED' || s === 'ERROR') return 'error'
  return 'muted'
}

/**
 * 计算任务汇总统计
 */
export function calculateTaskSummary(tasks: TaskProgress[]): TaskSummary {
  const normalize = (status?: string) => (status || '').toUpperCase()

  let running = 0
  let pending = 0
  let completed = 0
  let failed = 0

  for (const t of tasks) {
    const s = normalize(t.status)
    if (s === 'RUNNING' || s === 'IN_PROGRESS') {
      running += 1
    } else if (s === 'PENDING' || s === 'QUEUED' || s === 'WAITING') {
      pending += 1
    } else if (s === 'COMPLETED' || s === 'SUCCESS') {
      completed += 1
    } else if (s === 'FAILED' || s === 'ERROR') {
      failed += 1
    }
  }

  return { running, pending, completed, failed }
}

/**
 * 获取活跃任务（运行中/等待中）
 */
export function getActiveTasks(tasks: TaskProgress[], limit = 6): TaskProgress[] {
  return tasks
    .filter((t) => {
      const s = (t.status || '').toUpperCase()
      return s === 'RUNNING' || s === 'IN_PROGRESS' || s === 'PENDING' || s === 'QUEUED' || s === 'WAITING'
    })
    .slice()
    .reverse()
    .slice(0, limit)
}

/**
 * 分页计算
 */
export function paginate<T>(items: T[], page: number, pageSize: number): {
  pagedItems: T[]
  totalPages: number
} {
  const start = (page - 1) * pageSize
  const pagedItems = items.slice(start, start + pageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  return { pagedItems, totalPages }
}

/**
 * 刷新所有查询数据
 */
export async function refreshAllData(queryClient: { invalidateQueries: (options: { queryKey: string[] }) => Promise<void> }) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['agents'] }),
    queryClient.invalidateQueries({ queryKey: ['online-agents'] }),
    queryClient.invalidateQueries({ queryKey: ['overview'] }),
    queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  ])
}
