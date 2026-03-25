/**
 * 能力池 - 用于生成 Agent 画像
 */
export const capabilityPool = [
  '日志采集',
  '脚本执行',
  '文件同步',
  '监控采样',
  '指标上报',
  '任务编排',
] as const

/**
 * 场景类型
 */
export const scenes = ['边缘采集节点', '实时分析节点', '自动运维节点', '离线处理节点'] as const

/**
 * 预定义命令
 */
export const commonCommands = [
  { name: '采集日志', payload: { action: 'collectLogs', taskId: 'task-log-001', rangeMinutes: 30 } },
  { name: '健康检查', payload: { action: 'healthCheck', taskId: 'task-health-001' } },
  { name: '重载配置', payload: { action: 'reloadConfig', taskId: 'task-config-001' } },
  { name: '上传指标', payload: { action: 'uploadMetrics', taskId: 'task-metrics-001', level: 'full' } },
] as const

/**
 * 分页大小
 */
export const PAGE_SIZE = 6

/**
 * 应用名称
 */
export const APP_NAME = 'CloudEdge'

/**
 * 菜单配置
 */
export const menuItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'agents', label: 'Agent 列表' },
  { key: 'tasks', label: '任务列表' },
  { key: 'testing', label: '测试页面' },
] as const
