import type { TaskProgress } from '../types'
import { statusClass } from '../utils'

interface TaskListProps {
  tasks: TaskProgress[] | undefined
}

/**
 * 任务列表组件
 */
export function TaskList({ tasks }: TaskListProps) {
  return (
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
            {(tasks ?? []).slice().reverse().map((t, idx) => (
              <tr key={`${t.agentId}-${t.taskId}-${idx}`}>
                <td>{t.taskId}</td>
                <td>{t.agentId}</td>
                <td>{t.taskType}</td>
                <td><span className={`badge ${statusClass(t.status)}`}>{t.status}</span></td>
                <td>{t.progress}%</td>
                <td>{t.message || '-'}</td>
              </tr>
            ))}
            {!tasks?.length && (
              <tr><td colSpan={6} className="empty">暂无任务数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
