import axios from 'axios';
import type { Agent, TaskProgress, RegisterForm } from '../types';

const API_BASE = 'http://localhost:8080/api';

export interface DashboardOverview {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  totalTaskRecords: number;
  runningTaskRecords: number;
  completedTaskRecords: number;
  failedTaskRecords: number;
}

// 重新导出类型供外部使用
export type { Agent, TaskProgress };

export const api = {
  getOverview: () => axios.get<DashboardOverview>(`${API_BASE}/dashboard/overview`),
  listOnlineAgents: () => axios.get<Agent[]>(`${API_BASE}/agents/online`),
  listAllAgents: () => axios.get<Agent[]>(`${API_BASE}/agents`),
  getAgent: (agentId: string) => axios.get<Agent>(`${API_BASE}/agents/${agentId}`),
  getProgress: (agentId: string) => axios.get<TaskProgress>(`${API_BASE}/agents/${agentId}/progress`),
  getProgressHistory: (agentId: string) => axios.get<TaskProgress[]>(`${API_BASE}/agents/${agentId}/progress/history`),
  register: (data: RegisterForm) => axios.post<Agent>(`${API_BASE}/agents/register`, data),
  offline: (agentId: string) => axios.post(`${API_BASE}/agents/${agentId}/offline`),
  sendCommand: (agentId: string, command: Record<string, unknown>) =>
    axios.post<{ success: boolean; message: string }>(`${API_BASE}/agents/${agentId}/command`, command),
  listAllTasks: () => axios.get<TaskProgress[]>(`${API_BASE}/tasks`),
  listLatestTasks: () => axios.get<TaskProgress[]>(`${API_BASE}/tasks/latest`),
  listTasksByAgent: (agentId: string) => axios.get<TaskProgress[]>(`${API_BASE}/tasks/agents/${agentId}`),
};
