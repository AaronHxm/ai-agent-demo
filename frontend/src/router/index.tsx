import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../App'
import { DashboardPage, AgentsPage, TasksPage, TestingPage } from '../pages'

/**
 * 应用路由配置
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'agents',
        element: <AgentsPage />,
      },
      {
        path: 'agents/:agentId',
        element: <AgentsPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'testing',
        element: <TestingPage />,
      },
    ],
  },
])
