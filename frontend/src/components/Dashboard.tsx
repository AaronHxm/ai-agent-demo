import type { Overview } from '../types'

interface DashboardProps {
  overview: Overview | undefined
}

/**
 * Dashboard 页面组件
 */
export function Dashboard({ overview }: DashboardProps) {
  return (
    <section className="card">
      <h2>Dashboard 总览</h2>
      <div className="metrics-grid">
        <div className="metric">
          <span>注册总数</span>
          <strong>{overview?.totalAgents ?? 0}</strong>
        </div>
        <div className="metric">
          <span>在线 Agent</span>
          <strong>{overview?.onlineAgents ?? 0}</strong>
        </div>
        <div className="metric">
          <span>离线 Agent</span>
          <strong>{overview?.offlineAgents ?? 0}</strong>
        </div>
        <div className="metric">
          <span>任务记录</span>
          <strong>{overview?.totalTaskRecords ?? 0}</strong>
        </div>
        <div className="metric">
          <span>运行中任务</span>
          <strong>{overview?.runningTaskRecords ?? 0}</strong>
        </div>
        <div className="metric">
          <span>失败任务</span>
          <strong>{overview?.failedTaskRecords ?? 0}</strong>
        </div>
      </div>
      <p className="hint">统一左侧菜单 + 右侧主内容布局，可继续扩展趋势图与告警面板。</p>
    </section>
  )
}
