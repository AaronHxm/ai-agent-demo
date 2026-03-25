import { Link, useLocation, Outlet } from 'react-router-dom'
import { menuItems } from './constants'

// 导航图标组件
const DashboardIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
)

const AgentsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

const TasksIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
)

const TestingIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
)

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
)

// 菜单图标映射
const navIcons: Record<string, React.ReactNode> = {
  dashboard: <DashboardIcon />,
  agents: <AgentsIcon />,
  tasks: <TasksIcon />,
  testing: <TestingIcon />,
}

// 页面标题映射
const pageTitles: Record<string, string> = {
  dashboard: '仪表盘',
  agents: 'Agent 管理',
  tasks: '任务列表',
  testing: '测试中心',
}

/**
 * 应用布局组件
 */
function AppLayout() {
  const location = useLocation()

  // 获取当前页面
  const getCurrentPage = () => {
    const path = location.pathname
    if (path.startsWith('/dashboard')) return 'dashboard'
    if (path.startsWith('/agents')) return 'agents'
    if (path.startsWith('/tasks')) return 'tasks'
    if (path.startsWith('/testing')) return 'testing'
    return 'dashboard'
  }

  const currentPage = getCurrentPage()

  return (
    <div className="shell">
      {/* 左侧导航 */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">C</div>
          <span className="logo-text">CloudEdge</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">导航</div>
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={`/${item.key}`}
              className={`sidebar-link ${currentPage === item.key ? 'active' : ''}`}
            >
              {navIcons[item.key]}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">A</div>
            <div className="user-details">
              <div className="user-name">管理员</div>
              <div className="user-role">Administrator</div>
            </div>
            <div className="user-actions">
              <button className="user-action-btn" title="设置">
                <SettingsIcon />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 右侧主内容 */}
      <main className="main">
        {/* 顶部导航 */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{pageTitles[currentPage]}</h1>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <SearchIcon />
              <input type="text" placeholder="搜索 Agent..." />
            </div>

            <button className="topbar-btn" title="通知">
              <BellIcon />
              <span className="badge" />
            </button>

            <button className="topbar-btn" title="设置">
              <SettingsIcon />
            </button>

            <div className="topbar-user">
              <div className="avatar">A</div>
              <span className="name">管理员</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
