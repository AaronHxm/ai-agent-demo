import { useState, useMemo } from 'react'
import type { Agent, TaskProgress } from '../types'
import { profileForAgent, statusClass, calculateTaskSummary, getActiveTasks } from '../utils'
import { commonCommands } from '../constants'

interface AgentDetailProps {
  agent: Agent
  tasks: TaskProgress[]
  onBack: () => void
}

interface AgentDetailViewProps extends AgentDetailProps {
  onSendCommand: (agentId: string, payload: Record<string, unknown>) => void
  sending: boolean
}

function AgentDetailView({ agent, tasks, onBack, onSendCommand, sending }: AgentDetailViewProps) {
  const [commandText, setCommandText] = useState('{"action":"collectLogs","taskId":"task-demo-001"}')

  const profile = profileForAgent(agent)
  const summary = calculateTaskSummary(tasks)
  const activeTasks = getActiveTasks(tasks)

  const handleSend = () => {
    try {
      const payload = JSON.parse(commandText)
      onSendCommand(agent.agentId, payload)
    } catch {
      alert('命令格式必须是 JSON')
    }
  }

  return (
    <section className="card">
      <div className="agent-detail-head">
        <button className="ghost" onClick={onBack}>返回列表</button>
        <h2>{profile.title} - 详情</h2>
      </div>
      <p className="agent-desc">{profile.description}</p>
      <div className="chips">
        {profile.capabilities.map((c) => (
          <span key={c} className="chip">{c}</span>
        ))}
      </div>
      <div className="detail-grid">
        <section className="card card-sub">
          <h3>Agent 信息与发送指令</h3>
          <div className="kv">
            <div><span>AgentID</span><strong>{agent.agentId}</strong></div>
            <div><span>注册时间</span><strong>{agent.onlineTime ?? '-'}</strong></div>
            <div><span>注册IP</span><strong>{agent.host ?? '-'}</strong></div>
            <div><span>注册方式</span><strong>{agent.registerType}</strong></div>
            <div><span>状态</span><strong><span className={`badge ${statusClass(agent.status)}`}>{agent.status}</span></strong></div>
          </div>
          <div className="panel">
            <div className="chips">
              {commonCommands.map((cmd) => (
                <button
                  key={cmd.name}
                  className="ghost"
                  onClick={() => setCommandText(JSON.stringify(cmd.payload, null, 2))}
                >
                  {cmd.name}
                </button>
              ))}
            </div>
            <textarea rows={6} value={commandText} onChange={(e) => setCommandText(e.target.value)} />
            <button disabled={sending} onClick={handleSend}>{sending ? '发送中...' : '下发指令'}</button>
          </div>
        </section>

        <section className="card card-sub">
          <h3>任务运行概览</h3>
          <div className="mini-metrics">
            <div className="mini-card"><span>运行中</span><strong>{summary.running}</strong></div>
            <div className="mini-card"><span>等待中</span><strong>{summary.pending}</strong></div>
            <div className="mini-card"><span>已完成</span><strong>{summary.completed}</strong></div>
            <div className="mini-card"><span>失败</span><strong>{summary.failed}</strong></div>
          </div>
          <h4>运行/等待中的任务</h4>
          <div className="history">
            {activeTasks.map((t, idx) => (
              <div key={`${t.taskId}-${idx}`} className="history-item">
                <div>
                  <strong>{t.taskId}</strong>
                  <p>{t.taskType} · {t.message || '-'}</p>
                </div>
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
              {tasks.slice().reverse().map((t, idx) => (
                <tr key={`${t.taskId}-${idx}`}>
                  <td>{t.taskId}</td>
                  <td>{t.taskType}</td>
                  <td><span className={`badge ${statusClass(t.status)}`}>{t.status}</span></td>
                  <td>{t.progress}%</td>
                  <td>{t.message || '-'}</td>
                </tr>
              ))}
              {!tasks.length && (
                <tr><td colSpan={5} className="empty">暂无任务记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

export { AgentDetailView }
