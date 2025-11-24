import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { adminApi } from '../../../utils/api'
import { DashboardStats, User } from '../../../types'

interface UseAdminDashboardResponse {
  analytics: DashboardStats | null
  users: User[]
  loading: {
    analytics: boolean
    users: boolean
  }
  error: string | null
  refetchAnalytics: () => Promise<void>
  refetchUsers: () => Promise<void>
}

export function useAdminDashboard(): UseAdminDashboardResponse {
  const [analytics, setAnalytics] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState({ analytics: true, users: true })
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(prev => ({ ...prev, analytics: true }))
    try {
      const response = await adminApi.getAnalytics()
      setAnalytics(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Unable to load analytics data right now.')
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }))
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }))
    try {
      const response = await adminApi.getAllUsers()
      setUsers(response.data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Unable to load users')
    } finally {
      setLoading(prev => ({ ...prev, users: false }))
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    fetchUsers()
  }, [fetchAnalytics, fetchUsers])

  return {
    analytics,
    users,
    loading,
    error,
    refetchAnalytics: fetchAnalytics,
    refetchUsers: fetchUsers
  }
}


