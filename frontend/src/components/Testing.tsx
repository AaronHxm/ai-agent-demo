import { useState } from 'react'
import type { Agent, RegisterForm, CommandPayload, RegisterType } from '../types'

interface TestingProps {
  agents: Agent[] | undefined
  onRegister: (form: RegisterForm) => Promise<void>
  onSendCommand: (agentId: string, payload: CommandPayload) => Promise<void>
  registering: boolean
  sending: boolean
}

// 命令模板
const COMMAND_TEMPLATES = [
  { label: '收集日志', value: '{"action":"collectLogs","taskId":"task-demo-001"}' },
  { label: '文件传输', value: '{"action":"fileTransfer","taskId":"task-demo-002","params":{"filePath":"/tmp/test.txt"}}' },
  { label: '系统信息', value: '{"action":"getSystemInfo","taskId":"task-demo-003"}' },
  { label: '执行命令', value: '{"action":"execute","taskId":"task-demo-004","params":{"command":"ls -la"}}' },
  { label: '心跳检测', value: '{"action":"ping","taskId":"task-demo-005"}' },
]

/**
 * 测试页面组件
 */
export function Testing({ agents, onRegister, onSendCommand, registering, sending }: TestingProps) {
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    agentId: '',
    agentName: '',
    host: '127.0.0.1',
    port: 10001,
    skillDescription: '',
    skillTags: '',
  })
  const [registerType, setRegisterType] = useState<RegisterType>('HTTP')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [commandText, setCommandText] = useState(COMMAND_TEMPLATES[0].value)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleRegister = async () => {
    if (!registerForm.agentId.trim()) {
      showMessage('error', '请输入 agentId')
      return
    }
    try {
      const formWithType = { ...registerForm, registerType }
      await onRegister(formWithType)
      showMessage('success', `Agent ${registerForm.agentId} 注册成功！`)
      setRegisterForm({ ...registerForm, agentId: '', agentName: '' })
    } catch (e) {
      showMessage('error', `注册失败: ${e}`)
    }
  }

  const handleSend = async () => {
    if (!selectedAgentId) {
      showMessage('error', '请先选择一个边端 Agent')
      return
    }
    try {
      const payload = JSON.parse(commandText)
      await onSendCommand(selectedAgentId, payload)
      showMessage('success', `命令已发送给 ${selectedAgentId}`)
    } catch {
      showMessage('error', '命令格式必须是有效的 JSON')
    }
  }

  return (
    <div>
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="split">
        <section className="card">
          <h2>测试页 - 注册 Agent</h2>
          <div className="form-grid compact">
            <select value={registerType} onChange={(e) => setRegisterType(e.target.value as RegisterType)}>
              <option value="HTTP">HTTP 注册</option>
              <option value="LONG_CONNECTION">Netty 长连接</option>
            </select>
            <input
              placeholder="agentId（必填）"
              value={registerForm.agentId}
              onChange={(e) => setRegisterForm({ ...registerForm, agentId: e.target.value })}
            />
            <input
              placeholder="agentName"
              value={registerForm.agentName}
              onChange={(e) => setRegisterForm({ ...registerForm, agentName: e.target.value })}
            />
            <input
              placeholder="host"
              value={registerForm.host}
              onChange={(e) => setRegisterForm({ ...registerForm, host: e.target.value })}
            />
            <input
              type="number"
              placeholder="port"
              value={registerForm.port}
              onChange={(e) => setRegisterForm({ ...registerForm, port: Number(e.target.value || 0) })}
            />
            <input
              placeholder="技能描述（可选）"
              value={registerForm.skillDescription || ''}
              onChange={(e) => setRegisterForm({ ...registerForm, skillDescription: e.target.value })}
              style={{ gridColumn: '1 / -1' }}
            />
            <input
              placeholder="技能标签，用逗号分隔（如：日志收集,文件传输）"
              value={registerForm.skillTags || ''}
              onChange={(e) => setRegisterForm({ ...registerForm, skillTags: e.target.value })}
              style={{ gridColumn: '1 / -1' }}
            />
          </div>
          <button disabled={registering} onClick={handleRegister}>
            {registering ? '注册中...' : '执行注册测试'}
          </button>
        </section>

        <section className="card">
          <h2>测试页 - 下发指令</h2>
          <div className="panel">
            <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
              <option value="">请选择 Agent</option>
              {(agents ?? []).map((a) => (
                <option key={a.agentId} value={a.agentId}>
                  {a.agentId} ({a.status})
                </option>
              ))}
            </select>

            <div className="template-buttons">
              <span className="template-label">快速模板:</span>
              {COMMAND_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  className="template-btn"
                  onClick={() => setCommandText(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea rows={6} value={commandText} onChange={(e) => setCommandText(e.target.value)} />
            <button disabled={sending || !selectedAgentId} onClick={handleSend}>
              {sending ? '发送中...' : '执行下发测试'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
