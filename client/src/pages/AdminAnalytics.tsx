import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { useAdminDashboard } from '../features/admin/hooks/useAdminDashboard'
import StatsOverview from '../features/admin/components/StatsOverview'
import AppointmentsInsights from '../features/admin/components/AppointmentsInsights'
import RevenueInsights from '../features/admin/components/RevenueInsights'
import TopDoctorsTable from '../features/admin/components/TopDoctorsTable'

export default function AdminAnalytics() {
  const { user } = useAuth()
  const { analytics, loading, error, refetchAnalytics } = useAdminDashboard()

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const showAnalyticsLoader = loading.analytics && !analytics

  if (showAnalyticsLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
            {error}
          </div>
        )}

        {analytics ? (
          <>
            <StatsOverview stats={analytics} loading={loading.analytics} onRefresh={refetchAnalytics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentsInsights
                statusData={analytics.appointmentsByStatus}
                trendData={analytics.appointmentsByDay}
              />
              <RevenueInsights
                trendData={analytics.revenueTrend}
                breakdownData={analytics.revenueBreakdown}
                userDistribution={analytics.userDistribution}
              />
            </div>

            <TopDoctorsTable doctors={analytics.topDoctors} />
          </>
        ) : (
          <Card className="p-6">
            <p className="text-gray-600">
              We couldn't load analytics data. Please try refreshing the dashboard.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

