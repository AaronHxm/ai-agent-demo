import type { MenuKey } from '../types'
import { menuItems, APP_NAME } from '../constants'

interface SidebarProps {
  activeMenu: MenuKey
  onMenuChange: (menu: MenuKey) => void
  onlineCount: number
  totalCount: number
}

/**
 * 侧边栏组件
 */
export function Sidebar({ activeMenu, onMenuChange, onlineCount, totalCount }: SidebarProps) {
  const offlineCount = totalCount - onlineCount

  return (
    <aside className="sidebar">
      <h2>{APP_NAME}</h2>
      {menuItems.map((item) => (
        <button
          key={item.key}
          className={activeMenu === item.key ? 'menu active' : 'menu'}
          onClick={() => onMenuChange(item.key as MenuKey)}
        >
          {item.label}
        </button>
      ))}
      <div className="sidebar-foot">
        <p>在线: {onlineCount}</p>
        <p>离线: {offlineCount}</p>
      </div>
    </aside>
  )
}

/**
 * 顶部 Header 组件
 */
export function Header() {
  return (
    <header className="header">
      <div>
        <h1>云边协同面板</h1>
        <p>统一左右布局，聚焦 Agent 管理、任务管理和联调测试</p>
      </div>
    </header>
  )
}
