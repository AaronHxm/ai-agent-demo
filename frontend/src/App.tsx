import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Agent } from './api/client'

type MenuKey = 'dashboard' | 'agents' | 'tasks' | 'testing'
type AgentStatusFilter = 'ALL' | 'ONLINE' | 'OFFLINE'

const capabilityPool = [
  '日志采集',
  '脚本执行',
  '文件同步',
  '监控采样',
  '指标上报',
  '任务编排',
]

const scenes = ['边缘采集节点', '实时分析节点', '自动运维节点', '离线处理节点']
const commonCommands = [
  { name: '采集日志', payload: { action: 'collectLogs', taskId: 'task-log-001', rangeMinutes: 30 } },
  { name: '健康检查', payload: { action: 'healthCheck', taskId: 'task-health-001' } },
  { name: '重载配置', payload: { action: 'reloadConfig', taskId: 'task-config-001' } },
  { name: '上传指标', payload: { action: 'uploadMetrics', taskId: 'task-metrics-001', level: 'full' } },
]

function profileForAgent(agent: Agent) {
  const seed = (agent.agentId ?? '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const c1 = capabilityPool[seed % capabilityPool.length]
  const c2 = capabilityPool[(seed + 2) % capabilityPool.length]
  const scene = scenes[seed % scenes.length]
  return {
    title: agent.agentName || agent.agentId,
    scene,
    capabilities: [c1, c2, agent.registerType === 'LONG_CONNECTION' ? '长连接实时交互' : 'HTTP注册接入'],
    description: `负责${scene}，支持${c1}、${c2}，可按任务策略执行并持续回传进度。`,
  }
}

function App() {
  const pageSize = 6
  const queryClient = useQueryClient()
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [testingAgentId, setTestingAgentId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>('ALL')
  const [commandText, setCommandText] = useState('{"action":"collectLogs","taskId":"task-demo-001"}')
  const [registerForm, setRegisterForm] = useState({ agentId: '', agentName: '', host: '127.0.0.1', port: 10001 })
  const [sending, setSending] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [agentPage, setAgentPage] = useState(1)

  const overviewQuery = useQuery({ queryKey: ['overview'], queryFn: async () => (await api.getOverview()).data })
  const agentsQuery = useQuery({ queryKey: ['agents'], queryFn: async () => (await api.listAllAgents()).data })
  const onlineAgentsQuery = useQuery({ queryKey: ['online-agents'], queryFn: async () => (await api.listOnlineAgents()).data })
  const allTasksQuery = useQuery({ queryKey: ['tasks'], queryFn: async () => (await api.listLatestTasks()).data })

  const selectedAgent = useMemo(() => agentsQuery.data?.find((a) => a.agentId === selectedAgentId), [agentsQuery.data, selectedAgentId])
  const filteredAgents = useMemo(() => {
    const list = agentsQuery.data ?? []
    if (statusFilter === 'ALL') return list
    return list.filter((a) => a.status === statusFilter)
  }, [agentsQuery.data, statusFilter])
  const pagedAgents = useMemo(() => {
    const list = filteredAgents
    const start = (agentPage - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [filteredAgents, agentPage])
  const totalAgentPages = useMemo(() => {
    const total = filteredAgents.length
    return Math.max(1, Math.ceil(total / pageSize))
  }, [filteredAgents.length])
  const selectedProfile = useMemo(() => (selectedAgent ? profileForAgent(selectedAgent) : null), [selectedAgent])

  useEffect(() => {
    setAgentPage(1)
  }, [statusFilter])

  const agentTasksQuery = useQuery({
    queryKey: ['agent-tasks', selectedAgentId],
    enabled: !!selectedAgentId,
    queryFn: async () => (await api.listTasksByAgent(selectedAgentId)).data,
    retry: false,
  })
  const agentTasks = useMemo(() => agentTasksQuery.data ?? [], [agentTasksQuery.data])
  const taskSummary = useMemo(() => {
    const normalize = (status?: string) => (status || '').toUpperCase()
    let running = 0
    let pending = 0
    let completed = 0
    let failed = 0
    for (const t of agentTasks) {
      const s = normalize(t.status)
      if (s === 'RUNNING' || s === 'IN_PROGRESS') running += 1
      else if (s === 'PENDING' || s === 'QUEUED' || s === 'WAITING') pending += 1
      else if (s === 'COMPLETED' || s === 'SUCCESS') completed += 1
      else if (s === 'FAILED' || s === 'ERROR') failed += 1
    }
    return { running, pending, completed, failed }
  }, [agentTasks])
  const activeTasks = useMemo(() => {
    return agentTasks
      .filter((t) => {
        const s = (t.status || '').toUpperCase()
        return s === 'RUNNING' || s === 'IN_PROGRESS' || s === 'PENDING' || s === 'QUEUED' || s === 'WAITING'
      })
      .slice()
      .reverse()
      .slice(0, 6)
  }, [agentTasks])

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['agents'] }),
      queryClient.invalidateQueries({ queryKey: ['online-agents'] }),
      queryClient.invalidateQueries({ queryKey: ['overview'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    ])
  }

  const handleRegister = async () => {
    if (!registerForm.agentId.trim()) return alert('请输入 agentId')
    setRegistering(true)
    try {
      await api.register(registerForm)
      setRegisterForm({ ...registerForm, agentId: '', agentName: '' })
      await refreshData()
      alert('HTTP 注册成功')
    } catch {
      alert('注册失败，请检查后端是否启动')
    } finally {
      setRegistering(false)
    }
  }

  const handleOffline = async (agent: Agent) => {
    await api.offline(agent.agentId)
    await refreshData()
  }

  const handleSendCommand = async (agentId: string) => {
    if (!agentId) return alert('请先选择一个边端 Agent')
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(commandText)
    } catch {
      return alert('命令格式必须是 JSON')
    }
    setSending(true)
    try {
      const res = await api.sendCommand(agentId, payload)
      alert(res.data.message)
      await refreshData()
    } finally {
      setSending(false)
    }
  }

  const statusClass = (status?: string) => {
    const s = (status || '').toUpperCase()
    if (s === 'ONLINE' || s === 'RUNNING' || s === 'IN_PROGRESS' || s === 'COMPLETED' || s === 'SUCCESS') return 'ok'
    if (s === 'PENDING' || s === 'WAITING' || s === 'QUEUED') return 'warn'
    if (s === 'FAILED' || s === 'ERROR') return 'error'
    return 'muted'
  }

  const renderDashboard = () => (
    <section className="card">
      <h2>Dashboard 总览</h2>
      <div className="metrics-grid">
        <div className="metric"><span>注册总数</span><strong>{overviewQuery.data?.totalAgents ?? 0}</strong></div>
        <div className="metric"><span>在线 Agent</span><strong>{overviewQuery.data?.onlineAgents ?? 0}</strong></div>
        <div className="metric"><span>离线 Agent</span><strong>{overviewQuery.data?.offlineAgents ?? 0}</strong></div>
        <div className="metric"><span>任务记录</span><strong>{overviewQuery.data?.totalTaskRecords ?? 0}</strong></div>
        <div className="metric"><span>运行中任务</span><strong>{overviewQuery.data?.runningTaskRecords ?? 0}</strong></div>
        <div className="metric"><span>失败任务</span><strong>{overviewQuery.data?.failedTaskRecords ?? 0}</strong></div>
      </div>
      <p className="hint">统一左侧菜单 + 右侧主内容布局，可继续扩展趋势图与告警面板。</p>
    </section>
  )

  const renderAgents = () => (
    <div className="stack">
      {!selectedAgent && (
        <section className="card">
          <div className="agent-toolbar">
            <h2>Agent 列表</h2>
            <div className="filter-group">
              <button className={statusFilter === 'ALL' ? 'ghost active-filter' : 'ghost'} onClick={() => setStatusFilter('ALL')}>全部</button>
              <button className={statusFilter === 'ONLINE' ? 'ghost active-filter' : 'ghost'} onClick={() => setStatusFilter('ONLINE')}>在线</button>
              <button className={statusFilter === 'OFFLINE' ? 'ghost active-filter' : 'ghost'} onClick={() => setStatusFilter('OFFLINE')}>离线</button>
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
                    {profile.capabilities.map((c) => <span key={c} className="chip">{c}</span>)}
                  </div>
                  <div className="agent-meta">
                    <span>注册方式: {agent.registerType}</span>
                    <span>IP: {agent.host || '-'}</span>
                  </div>
                  <div className="actions">
                    <button className="ghost" onClick={() => setSelectedAgentId(agent.agentId)}>进入Agent</button>
                    <button className="danger" onClick={() => handleOffline(agent)}>下线</button>
                  </div>
                </article>
              )
            })}
            {!pagedAgents.length && <p className="empty">当前筛选条件下暂无 Agent</p>}
          </div>
          <div className="pagination">
            <button className="ghost" disabled={agentPage <= 1} onClick={() => setAgentPage((p) => Math.max(1, p - 1))}>上一页</button>
            <span>第 {agentPage} / {totalAgentPages} 页 · 共 {filteredAgents.length} 个 Agent</span>
            <button className="ghost" disabled={agentPage >= totalAgentPages} onClick={() => setAgentPage((p) => Math.min(totalAgentPages, p + 1))}>下一页</button>
          </div>
        </section>
      )}

      {selectedAgent && selectedProfile && (
        <section className="card">
          <div className="agent-detail-head">
            <button className="ghost" onClick={() => setSelectedAgentId('')}>返回列表</button>
            <h2>{selectedProfile.title} - 详情</h2>
          </div>
          <p className="agent-desc">{selectedProfile.description}</p>
          <div className="chips">
            {selectedProfile.capabilities.map((c) => <span key={c} className="chip">{c}</span>)}
          </div>
          <div className="detail-grid">
            <section className="card card-sub">
              <h3>Agent 信息与发送指令</h3>
              <div className="kv">
                <div><span>AgentID</span><strong>{selectedAgent.agentId}</strong></div>
                <div><span>注册时间</span><strong>{selectedAgent.onlineTime ?? '-'}</strong></div>
                <div><span>注册IP</span><strong>{selectedAgent.host ?? '-'}</strong></div>
                <div><span>注册方式</span><strong>{selectedAgent.registerType}</strong></div>
                <div><span>状态</span><strong><span className={`badge ${statusClass(selectedAgent.status)}`}>{selectedAgent.status}</span></strong></div>
              </div>
              <div className="panel">
                <div className="chips">
                  {commonCommands.map((cmd) => (
                    <button key={cmd.name} className="ghost" onClick={() => setCommandText(JSON.stringify(cmd.payload, null, 2))}>{cmd.name}</button>
                  ))}
                </div>
                <textarea rows={6} value={commandText} onChange={(e) => setCommandText(e.target.value)} />
                <button disabled={sending} onClick={() => handleSendCommand(selectedAgent.agentId)}>{sending ? '发送中...' : '下发指令'}</button>
              </div>
            </section>

            <section className="card card-sub">
              <h3>任务运行概览</h3>
              <div className="mini-metrics">
                <div className="mini-card"><span>运行中</span><strong>{taskSummary.running}</strong></div>
                <div className="mini-card"><span>等待中</span><strong>{taskSummary.pending}</strong></div>
                <div className="mini-card"><span>已完成</span><strong>{taskSummary.completed}</strong></div>
                <div className="mini-card"><span>失败</span><strong>{taskSummary.failed}</strong></div>
              </div>
              <h4>运行/等待中的任务</h4>
              <div className="history">
                {activeTasks.map((t, idx) => (
                  <div key={`${t.taskId}-${idx}`} className="history-item">
                    <div><strong>{t.taskId}</strong><p>{t.taskType} · {t.message || '-'}</p></div>
                    <span className={`badge ${statusClass(t.status)}`}>{t.status} {t.progress}%</span>
                  </div>
                ))}
                {!activeTasks.length && <p className="empty">当前无运行中/等待中任务</p>}
              </div>
            </section>
          </div>

          <section className="card card-sub">
            <h3>所有任务清单</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>TaskID</th>
                    <th>任务类型</th>
                    <th>状态</th>
                    <th>进度</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {agentTasks.slice().reverse().map((t, idx) => (
                    <tr key={`${t.taskId}-${idx}`}>
                      <td>{t.taskId}</td>
                      <td>{t.taskType}</td>
                      <td><span className={`badge ${statusClass(t.status)}`}>{t.status}</span></td>
                      <td>{t.progress}%</td>
                      <td>{t.message || '-'}</td>
                    </tr>
                  ))}
                  {!agentTasks.length && (
                    <tr><td colSpan={5} className="empty">暂无任务记录</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}
    </div>
  )

  const renderTasks = () => (
    <section className="card">
      <h2>任务列表</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>TaskID</th>
              <th>AgentID</th>
              <th>任务类型</th>
              <th>状态</th>
              <th>进度</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {(allTasksQuery.data ?? []).slice().reverse().map((t, idx) => (
              <tr key={`${t.agentId}-${t.taskId}-${idx}`}>
                <td>{t.taskId}</td>
                <td>{t.agentId}</td>
                <td>{t.taskType}</td>
                <td><span className={`badge ${statusClass(t.status)}`}>{t.status}</span></td>
                <td>{t.progress}%</td>
                <td>{t.message || '-'}</td>
              </tr>
            ))}
            {!allTasksQuery.data?.length && (
              <tr><td colSpan={6} className="empty">暂无任务数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderTesting = () => (
    <div className="split">
      <section className="card">
        <h2>测试页 - 注册 Agent</h2>
        <div className="form-grid compact">
          <input placeholder="agentId（必填）" value={registerForm.agentId} onChange={(e) => setRegisterForm({ ...registerForm, agentId: e.target.value })} />
          <input placeholder="agentName" value={registerForm.agentName} onChange={(e) => setRegisterForm({ ...registerForm, agentName: e.target.value })} />
          <input placeholder="host" value={registerForm.host} onChange={(e) => setRegisterForm({ ...registerForm, host: e.target.value })} />
          <input type="number" placeholder="port" value={registerForm.port} onChange={(e) => setRegisterForm({ ...registerForm, port: Number(e.target.value || 0) })} />
        </div>
        <button disabled={registering} onClick={handleRegister}>{registering ? '注册中...' : '执行注册测试'}</button>
      </section>

      <section className="card">
        <h2>测试页 - 下发指令</h2>
        <div className="panel">
          <select value={testingAgentId} onChange={(e) => setTestingAgentId(e.target.value)}>
            <option value="">请选择 Agent</option>
            {(agentsQuery.data ?? []).map((a) => (
              <option key={a.agentId} value={a.agentId}>{a.agentId} ({a.status})</option>
            ))}
          </select>
          <textarea rows={6} value={commandText} onChange={(e) => setCommandText(e.target.value)} />
          <button disabled={sending || !testingAgentId} onClick={() => handleSendCommand(testingAgentId)}>
            {sending ? '发送中...' : '执行下发测试'}
          </button>
        </div>
      </section>
    </div>
  )

  return (
    <div className="shell">
      <aside className="sidebar">
        <h2>CloudEdge</h2>
        <button className={activeMenu === 'dashboard' ? 'menu active' : 'menu'} onClick={() => setActiveMenu('dashboard')}>Dashboard</button>
        <button className={activeMenu === 'agents' ? 'menu active' : 'menu'} onClick={() => setActiveMenu('agents')}>Agent 列表</button>
        <button className={activeMenu === 'tasks' ? 'menu active' : 'menu'} onClick={() => setActiveMenu('tasks')}>任务列表</button>
        <button className={activeMenu === 'testing' ? 'menu active' : 'menu'} onClick={() => setActiveMenu('testing')}>测试页面</button>
        <div className="sidebar-foot">
          <p>在线: {onlineAgentsQuery.data?.length ?? 0}</p>
          <p>离线: {(agentsQuery.data?.length ?? 0) - (onlineAgentsQuery.data?.length ?? 0)}</p>
        </div>
      </aside>
      <main className="content">
        <header className="header">
          <div><h1>云边协同面板</h1><p>统一左右布局，聚焦 Agent 管理、任务管理和联调测试</p></div>
        </header>
        {activeMenu === 'dashboard' && renderDashboard()}
        {activeMenu === 'agents' && renderAgents()}
        {activeMenu === 'tasks' && renderTasks()}
        {activeMenu === 'testing' && renderTesting()}
      </main>
    </div>
  )
}

export default App
