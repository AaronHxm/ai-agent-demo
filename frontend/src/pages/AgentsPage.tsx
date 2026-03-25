import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { profileForAgent, statusClass, paginate } from '../utils'
import { PAGE_SIZE, commonCommands } from '../constants'
import type { Agent, AgentStatusFilter } from '../types'

/**
 * Agent 列表页面
 */
export function AgentsPage() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('ALL')
  const [page, setPage] = useState(1)

  // 数据查询
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await api.listAllAgents()).data,
  })

  const { data: allTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.listLatestTasks()).data,
  })

  // 筛选 Agent
  const filteredAgents = useMemo(() => {
    const list = agents ?? []
    if (statusFilter === 'ALL') return list
    return list.filter((a) => a.status === statusFilter)
  }, [agents, statusFilter])

  // 分页
  const { pagedItems: pagedAgents, totalPages } = useMemo(
    () => paginate(filteredAgents, page, PAGE_SIZE),
    [filteredAgents, page]
  )

  // 选中 Agent
  const selectedAgent = useMemo(
    () => agents?.find((a) => a.agentId === agentId),
    [agents, agentId]
  )

  // 选中 Agent 的任务
  const selectedAgentTasks = useMemo(
    () => allTasks?.filter((t) => t.agentId === agentId) ?? [],
    [allTasks, agentId]
  )

  // 下线操作
  const handleOffline = async (agent: Agent) => {
    await api.offline(agent.agentId)
    queryClient.invalidateQueries({ queryKey: ['agents'] })
    queryClient.invalidateQueries({ queryKey: ['online-agents'] })
  }

  // 筛选变化时重置页码
  const handleFilterChange = (filter: AgentStatusFilter) => {
    setStatusFilter(filter)
    setPage(1)
  }

  // 如果有选中的 Agent，显示详情
  if (agentId && selectedAgent) {
    return (
      <AgentDetailView
        agent={selectedAgent}
        tasks={selectedAgentTasks}
        onBack={() => navigate('/agents')}
        onOffline={handleOffline}
      />
    )
  }

  // 渲染列表
  return (
    <>
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h2 className="toolbar-title">Agent 列表</h2>
          <div className="filter-group" style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => handleFilterChange('ALL')}
            >
              全部
            </button>
            <button
              className={`filter-btn ${statusFilter === 'ONLINE' ? 'active' : ''}`}
              onClick={() => handleFilterChange('ONLINE')}
            >
              在线
            </button>
            <button
              className={`filter-btn ${statusFilter === 'OFFLINE' ? 'active' : ''}`}
              onClick={() => handleFilterChange('OFFLINE')}
            >
              离线
            </button>
          </div>
        </div>
      </div>

      {/* Agent 卡片列表 */}
      <div className="agent-grid">
        {pagedAgents.map((agent) => {
          const profile = profileForAgent(agent)
          return (
            <div key={agent.agentId} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-card-avatar">
                  {(profile.title[0] || 'A').toUpperCase()}
                </div>
                <div className="agent-card-info">
                  <div className="agent-card-name">{profile.title}</div>
                  <div className="agent-card-meta">
                    <span className={`status-dot ${agent.status.toLowerCase()}`} /> {agent.host || '-'}
                  </div>
                </div>
                <span className={`badge ${agent.status === 'ONLINE' ? 'badge-success' : 'badge-default'}`}>
                  {agent.status}
                </span>
              </div>
              <div className="agent-card-body">
                <p className="agent-card-desc">{profile.description}</p>
                <div className="agent-card-tags">
                  {profile.capabilities.map((c) => (
                    <span key={c} className="agent-card-tag">{c}</span>
                  ))}
                </div>
              </div>
              <div className="agent-card-footer">
                <div className="agent-card-stats">
                  <div className="agent-card-stat">
                    <div className="agent-card-stat-value">{agent.registerType}</div>
                    <div className="agent-card-stat-label">注册方式</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/agents/${agent.agentId}`)}>
                    查看详情
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleOffline(agent)}>
                    下线
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!pagedAgents.length && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <div className="empty-state-text">当前筛选条件下暂无 Agent</div>
          </div>
        </div>
      )}

      {/* 分页 */}
      {filteredAgents.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            第 {page} / {totalPages} 页 · 共 {filteredAgents.length} 个 Agent
          </div>
          <div className="pagination-btns">
            <button
              className="btn btn-sm btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            <button
              className="btn btn-sm btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Agent 详情组件
import type { TaskProgress as Task } from '../types'

function AgentDetailView({
  agent,
  tasks,
  onBack,
  onOffline,
}: {
  agent: Agent
  tasks: Task[]
  onBack: () => void
  onOffline: (agent: Agent) => void
}) {
  const [commandText, setCommandText] = useState('{"action":"collectLogs","taskId":"task-demo-001"}')
  const [sending, setSending] = useState(false)
  const queryClient = useQueryClient()

  const profile = profileForAgent(agent)

  const handleSendCommand = async () => {
    try {
      const payload = JSON.parse(commandText)
      setSending(true)
      const res = await api.sendCommand(agent.agentId, payload)
      alert(res.data.message)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch {
      alert('命令格式必须是 JSON')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* 返回按钮和标题 */}
      <div className="detail-header">
        <button className="detail-back" onClick={onBack}>
          ←
        </button>
        <div>
          <h2 className="detail-title">{profile.title}</h2>
          <p className="agent-card-desc" style={{ margin: 0 }}>{profile.description}</p>
        </div>
      </div>

      <div className="detail-grid">
        {/* Agent 信息 */}
        <div className="card">
          <div className="detail-section">
            <div className="detail-section-title">Agent 信息</div>
            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-key">AgentID</span>
                <span className="kv-value">{agent.agentId}</span>
              </div>
              <div className="kv-item">
                <span className="kv-key">注册时间</span>
                <span className="kv-value">{agent.onlineTime ?? '-'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-key">注册IP</span>
                <span className="kv-value">{agent.host ?? '-'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-key">注册方式</span>
                <span className="kv-value">{agent.registerType}</span>
              </div>
              <div className="kv-item">
                <span className="kv-key">状态</span>
                <span className="kv-value">
                  <span className={`badge ${agent.status === 'ONLINE' ? 'badge-success' : 'badge-default'}`}>
                    {agent.status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">发送指令</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {commonCommands.map((cmd) => (
                <button
                  key={cmd.name}
                  className="btn btn-sm btn-ghost"
                  onClick={() => setCommandText(JSON.stringify(cmd.payload, null, 2))}
                >
                  {cmd.name}
                </button>
              ))}
            </div>
            <textarea
              className="form-input"
              rows={6}
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" disabled={sending} onClick={handleSendCommand}>
                {sending ? '发送中...' : '下发指令'}
              </button>
              <button className="btn btn-danger" onClick={() => onOffline(agent)}>
                下线
              </button>
            </div>
          </div>
        </div>

        {/* 任务概览 */}
        <div className="card">
          <div className="detail-section">
            <div className="detail-section-title">任务运行概览</div>
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="metric-card" style={{ padding: '12px' }}>
                <div className="metric-content">
                  <div className="metric-label">运行中</div>
                  <div className="metric-value" style={{ fontSize: '20px' }}>
                    {tasks.filter(t => t.status === 'RUNNING').length}
                  </div>
                </div>
              </div>
              <div className="metric-card" style={{ padding: '12px' }}>
                <div className="metric-content">
                  <div className="metric-label">已完成</div>
                  <div className="metric-value" style={{ fontSize: '20px' }}>
                    {tasks.filter(t => t.status === 'COMPLETED').length}
                  </div>
                </div>
              </div>
              <div className="metric-card" style={{ padding: '12px' }}>
                <div className="metric-content">
                  <div className="metric-label">失败</div>
                  <div className="metric-value" style={{ fontSize: '20px' }}>
                    {tasks.filter(t => t.status === 'FAILED').length}
                  </div>
                </div>
              </div>
              <div className="metric-card" style={{ padding: '12px' }}>
                <div className="metric-content">
                  <div className="metric-label">总计</div>
                  <div className="metric-value" style={{ fontSize: '20px' }}>
                    {tasks.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">任务列表</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>TaskID</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>进度</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 10).map((t, idx) => (
                    <tr key={`${t.taskId}-${idx}`}>
                      <td>{t.taskId}</td>
                      <td>{t.taskType}</td>
                      <td>
                        <span className={`badge ${
                          t.status === 'COMPLETED' ? 'badge-success' :
                          t.status === 'FAILED' ? 'badge-danger' :
                          t.status === 'RUNNING' ? 'badge-warning' : 'badge-default'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.progress}%</td>
                    </tr>
                  ))}
                  {!tasks.length && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af' }}>暂无任务记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
