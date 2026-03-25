import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { RegisterForm } from '../types'

/**
 * 测试页面
 */
export function TestingPage() {
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    agentId: '',
    agentName: '',
    host: '127.0.0.1',
    port: 10001,
  })
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [commandText, setCommandText] = useState('{"action":"collectLogs","taskId":"task-demo-001"}')
  const [registering, setRegistering] = useState(false)
  const [sending, setSending] = useState(false)

  const queryClient = useQueryClient()

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await api.listAllAgents()).data,
  })

  const handleRegister = async () => {
    if (!registerForm.agentId.trim()) {
      alert('请输入 agentId')
      return
    }
    setRegistering(true)
    try {
      await api.register(registerForm)
      setRegisterForm({ ...registerForm, agentId: '', agentName: '' })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      alert('HTTP 注册成功')
    } catch {
      alert('注册失败，请检查后端是否启动')
    } finally {
      setRegistering(false)
    }
  }

  const handleSend = async () => {
    if (!selectedAgentId) {
      alert('请先选择一个边端 Agent')
      return
    }
    try {
      const payload = JSON.parse(commandText)
      setSending(true)
      const res = await api.sendCommand(selectedAgentId, payload)
      alert(res.data.message)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch {
      alert('命令格式必须是 JSON')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* 注册 Agent */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">注册 Agent</div>
            <div className="card-subtitle">通过 HTTP 接口注册边端节点</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Agent ID *</label>
            <input
              className="form-input"
              placeholder="唯一标识"
              value={registerForm.agentId}
              onChange={(e) => setRegisterForm({ ...registerForm, agentId: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Agent Name</label>
            <input
              className="form-input"
              placeholder="显示名称"
              value={registerForm.agentName}
              onChange={(e) => setRegisterForm({ ...registerForm, agentName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Host</label>
            <input
              className="form-input"
              placeholder="127.0.0.1"
              value={registerForm.host}
              onChange={(e) => setRegisterForm({ ...registerForm, host: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Port</label>
            <input
              className="form-input"
              type="number"
              placeholder="10001"
              value={registerForm.port}
              onChange={(e) => setRegisterForm({ ...registerForm, port: Number(e.target.value || 0) })}
            />
          </div>
        </div>

        <button className="btn btn-primary" disabled={registering} onClick={handleRegister} style={{ width: '100%' }}>
          {registering ? '注册中...' : '执行注册'}
        </button>
      </div>

      {/* 下发指令 */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">下发指令</div>
            <div className="card-subtitle">向在线 Agent 发送命令</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">选择 Agent</label>
          <select
            className="form-input"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            <option value="">请选择 Agent</option>
            {(agents ?? []).map((a) => (
              <option key={a.agentId} value={a.agentId}>
                {a.agentId} ({a.status})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">命令内容 (JSON)</label>
          <textarea
            className="form-input"
            rows={6}
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '13px' }}
          />
        </div>

        <button
          className="btn btn-primary"
          disabled={sending || !selectedAgentId}
          onClick={handleSend}
          style={{ width: '100%' }}
        >
          {sending ? '发送中...' : '执行下发'}
        </button>
      </div>
    </div>
  )
}
