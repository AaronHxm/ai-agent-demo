import { useState, useMemo } from 'react'
import type { Agent, AgentStatusFilter, TaskProgress } from '../types'
import { profileForAgent, statusClass, paginate } from '../utils'
import { PAGE_SIZE, commonCommands } from '../constants'
import { AgentDetail } from './AgentDetail'

interface AgentListProps {
  agents: Agent[] | undefined
  onOffline: (agent: Agent) => void
  tasks: TaskProgress[]
}

export function AgentList({ agents, onOffline, tasks }: AgentListProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('ALL')
  const [page, setPage] = useState(1)

  // 筛选 Agent
  const filteredAgents = useMemo(() => {
    const list = agents ?? []
    if (statusFilter === 'ALL') return list
    return list.filter((a) => a.status === statusFilter)
  }, [agents, statusFilter])

  // 分页
  const { pagedAgents, totalPages } = useMemo(
    () => paginate(filteredAgents, page, PAGE_SIZE),
    [filteredAgents, page]
  )

  // 选中 Agent
  const selectedAgent = useMemo(
    () => agents?.find((a) => a.agentId === selectedAgentId),
    [agents, selectedAgentId]
  )

  // 筛选变化时重置页码
  const handleFilterChange = (filter: AgentStatusFilter) => {
    setStatusFilter(filter)
    setPage(1)
  }

  // 渲染列表
  if (!selectedAgent) {
    return (
      <section className="card">
        <div className="agent-toolbar">
          <h2>Agent 列表</h2>
          <div className="filter-group">
            <button
              className={statusFilter === 'ALL' ? 'ghost active-filter' : 'ghost'}
              onClick={() => handleFilterChange('ALL')}
            >
              全部
            </button>
            <button
              className={statusFilter === 'ONLINE' ? 'ghost active-filter' : 'ghost'}
              onClick={() => handleFilterChange('ONLINE')}
            >
              在线
            </button>
            <button
              className={statusFilter === 'OFFLINE' ? 'ghost active-filter' : 'ghost'}
              onClick={() => handleFilterChange('OFFLINE')}
            >
              离线
            </button>
          </div>
        </div>

        <div className="agent-grid">
          {pagedAgents.map((agent) => {
            const profile = profileForAgent(agent)
            return (
              <article key={agent.agentId} className="agent-market-card">
                <div className="agent-market-head">
                  <div className="agent-avatar">{(profile.title[0] || 'A').toUpperCase()}</div>
                  <div>
                    <strong>{profile.title}</strong>
                    <p>{profile.scene}</p>
                  </div>
                  <span className={`badge ${statusClass(agent.status)}`}>{agent.status}</span>
                </div>
                <p className="agent-desc">{profile.description}</p>
                <div className="chips">
                  {profile.capabilities.map((c) => (
                    <span key={c} className="chip">{c}</span>
                  ))}
                </div>
                <div className="agent-meta">
                  <span>注册方式: {agent.registerType}</span>
                  <span>IP: {agent.host || '-'}</span>
                </div>
                <div className="actions">
                  <button className="ghost" onClick={() => setSelectedAgentId(agent.agentId)}>进入Agent</button>
                  <button className="danger" onClick={() => onOffline(agent)}>下线</button>
                </div>
              </article>
            )
          })}
          {!pagedAgents.length && <p className="empty">当前筛选条件下暂无 Agent</p>}
        </div>

        <div className="pagination">
          <button className="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</button>
          <span>第 {page} / {totalPages} 页 · 共 {filteredAgents.length} 个 Agent</span>
          <button className="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</button>
        </div>
      </section>
    )
  }

  // 渲染详情
  return (
    <AgentDetail
      agent={selectedAgent}
      tasks={tasks.filter((t) => t.agentId === selectedAgentId)}
      onBack={() => setSelectedAgentId('')}
    />
  )
}
