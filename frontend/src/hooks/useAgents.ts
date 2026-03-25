import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Agent, TaskProgress } from '../types'
import { refreshAllData } from '../utils'

/**
 * Agent 相关数据查询 Hooks
 */
export function useAgents() {
  return {
    overview: useQuery({ queryKey: ['overview'], queryFn: async () => (await api.getOverview()).data }),
    agents: useQuery({ queryKey: ['agents'], queryFn: async () => (await api.listAllAgents()).data }),
    onlineAgents: useQuery({ queryKey: ['online-agents'], queryFn: async () => (await api.listOnlineAgents()).data }),
    allTasks: useQuery({ queryKey: ['tasks'], queryFn: async () => (await api.listLatestTasks()).data }),
  }
}

/**
 * 获取指定 Agent 的任务
 */
export function useAgentTasks(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent-tasks', agentId],
    enabled: !!agentId,
    queryFn: async () => (await api.listTasksByAgent(agentId!)).data,
    retry: false,
  })
}

/**
 * 刷新所有数据
 */
export function useRefreshData() {
  const queryClient = useQueryClient()
  return () => refreshAllData(queryClient)
}

/**
 * Agent 操作 Hook
 */
export function useAgentActions(refreshData: () => Promise<void>) {
  const handleOffline = async (agent: Agent) => {
    await api.offline(agent.agentId)
    await refreshData()
  }

  return { handleOffline }
}

/**
 * 解析 JSON 命令
 */
export function parseCommand(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
