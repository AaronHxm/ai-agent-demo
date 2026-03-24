import axios from 'axios';

const API_BASE = '/api';

export interface Agent {
  agentId: string;
  agentName: string;
  host: string;
  port?: number;
  status: 'ONLINE' | 'OFFLINE';
  channelId?: string;
  registerType: 'HTTP' | 'LONG_CONNECTION';
  lastHeartbeat?: string;
  onlineTime?: string;
}

export interface TaskProgress {
  taskId: string;
  agentId: string;
  taskType: string;
  status: string;
  progress: number;
  message?: string;
  updateTime?: string;
}

export interface DashboardOverview {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  totalTaskRecords: number;
  runningTaskRecords: number;
  completedTaskRecords: number;
  failedTaskRecords: number;
}

export interface RegisterRequest {
  agentId: string;
  agentName?: string;
  host?: string;
  port?: number;
}

export const api = {
  getOverview: () => axios.get<DashboardOverview>(`${API_BASE}/dashboard/overview`),
  listOnlineAgents: () => axios.get<Agent[]>(`${API_BASE}/agents/online`),
  listAllAgents: () => axios.get<Agent[]>(`${API_BASE}/agents`),
  getAgent: (agentId: string) => axios.get<Agent>(`${API_BASE}/agents/${agentId}`),
  getProgress: (agentId: string) => axios.get<TaskProgress>(`${API_BASE}/agents/${agentId}/progress`),
  getProgressHistory: (agentId: string) => axios.get<TaskProgress[]>(`${API_BASE}/agents/${agentId}/progress/history`),
  register: (data: RegisterRequest) => axios.post<Agent>(`${API_BASE}/agents/register`, data),
  offline: (agentId: string) => axios.post(`${API_BASE}/agents/${agentId}/offline`),
  sendCommand: (agentId: string, command: Record<string, unknown>) =>
    axios.post<{ success: boolean; message: string }>(`${API_BASE}/agents/${agentId}/command`, command),
  listAllTasks: () => axios.get<TaskProgress[]>(`${API_BASE}/tasks`),
  listLatestTasks: () => axios.get<TaskProgress[]>(`${API_BASE}/tasks/latest`),
  listTasksByAgent: (agentId: string) => axios.get<TaskProgress[]>(`${API_BASE}/tasks/agents/${agentId}`),
};
