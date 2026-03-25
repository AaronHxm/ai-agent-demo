import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

/**
 * Dashboard 页面
 */
export function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.getOverview()).data,
  })

  const { data: onlineAgents } = useQuery({
    queryKey: ['online-agents'],
    queryFn: async () => (await api.listOnlineAgents()).data,
  })

  const { data: allAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await api.listAllAgents()).data,
  })

  return (
    <>
      {/* 指标卡片 */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">注册总数</div>
            <div className="metric-value">{overview?.totalAgents ?? 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">在线 Agent</div>
            <div className="metric-value">{overview?.onlineAgents ?? 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">离线 Agent</div>
            <div className="metric-value">{overview?.offlineAgents ?? 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">任务记录</div>
            <div className="metric-value">{overview?.totalTaskRecords ?? 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">运行中任务</div>
            <div className="metric-value">{overview?.runningTaskRecords ?? 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-label">失败任务</div>
            <div className="metric-value">{overview?.failedTaskRecords ?? 0}</div>
          </div>
        </div>
      </div>

      {/* 在线 Agent 列表 */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">在线 Agent</div>
            <div className="card-subtitle">当前在线的边端节点</div>
          </div>
        </div>

        {onlineAgents && onlineAgents.length > 0 ? (
          <div className="agent-grid">
            {onlineAgents.map((agent) => (
              <div key={agent.agentId} className="agent-card">
                <div className="agent-card-header">
                  <div className="agent-card-avatar">
                    {(agent.agentName || agent.agentId)[0].toUpperCase()}
                  </div>
                  <div className="agent-card-info">
                    <div className="agent-card-name">{agent.agentName || agent.agentId}</div>
                    <div className="agent-card-meta">
                      <span className="status-dot online" /> {agent.host || '-'}
                    </div>
                  </div>
                  <span className="badge badge-success">在线</span>
                </div>
                <div className="agent-card-body">
                  <div className="agent-card-tags">
                    <span className="agent-card-tag">{agent.registerType}</span>
                    <span className="agent-card-tag">端口: {agent.port || '-'}</span>
                  </div>
                </div>
                <div className="agent-card-footer">
                  <div className="agent-card-stats">
                    <div className="agent-card-stat">
                      <div className="agent-card-stat-value">
                        {agent.lastHeartbeat ? '活跃' : '-'}
                      </div>
                      <div className="agent-card-stat-label">状态</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <div className="empty-state-text">暂无在线 Agent</div>
          </div>
        )}
      </div>
    </>
  )
}
