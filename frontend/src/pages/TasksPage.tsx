import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

/**
 * 任务列表页面
 */
export function TasksPage() {
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.listLatestTasks()).data,
  })

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">任务列表</div>
            <div className="card-subtitle">所有边端任务执行记录</div>
          </div>
        </div>

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
              {(tasks ?? []).slice().reverse().map((t, idx) => (
                <tr key={`${t.agentId}-${t.taskId}-${idx}`}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{t.taskId}</td>
                  <td>{t.agentId}</td>
                  <td>{t.taskType}</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'COMPLETED' || t.status === 'SUCCESS' ? 'badge-success' :
                      t.status === 'FAILED' || t.status === 'ERROR' ? 'badge-danger' :
                      t.status === 'RUNNING' || t.status === 'IN_PROGRESS' ? 'badge-warning' :
                      'badge-default'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${t.progress}%`,
                          height: '100%',
                          background: t.progress === 100 ? '#10b981' : '#4f46e5',
                          borderRadius: '3px'
                        }} />
                      </div>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{t.progress}%</span>
                    </div>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '13px' }}>{t.message || '-'}</td>
                </tr>
              ))}
              {!tasks?.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">暂无任务数据</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
