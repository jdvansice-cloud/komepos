import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCompanyTimezone, getDateInTimezone, formatDateShort, formatTime, formatDateTime } from '../lib/timezone'

type ReportTab = 'overview' | 'shifts' | 'discounts' | 'refunds'

interface UserStats {
  user_id: string
  full_name: string
  total_orders: number
  total_sales: number
  total_discounts: number
  total_refunds: number
}

interface ShiftReport {
  id: string
  user_name: string
  location_name: string
  started_at: string
  ended_at: string | null
  starting_cash: number
  ending_cash: number | null
  expected_cash: number | null
  cash_variance: number | null
  total_sales: number
  total_discounts: number
  order_count: number
}

export function ReportsPage() {
  const { activeLocation } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalCustomers: 0, totalDiscounts: 0, totalRefunds: 0 })
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>([])
  const [timezone, setTimezone] = useState('America/Panama')

  useEffect(() => {
    async function init() {
      const tz = await getCompanyTimezone()
      setTimezone(tz)
    }
    init()
  }, [])

  useEffect(() => { 
    fetchReports() 
  }, [dateRange, activeLocation])

  function getDateFilter() {
    // Get current date in company timezone
    const todayStr = getDateInTimezone(new Date(), timezone)
    
    switch (dateRange) {
      case 'today':
        return todayStr + 'T00:00:00'
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return getDateInTimezone(weekAgo, timezone) + 'T00:00:00'
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return getDateInTimezone(monthAgo, timezone) + 'T00:00:00'
      default:
        return null
    }
  }

  async function fetchReports() {
    setLoading(true)
    try {
      const dateFilter = getDateFilter()
      
      // Base query for orders
      let ordersQuery = supabase.from('orders').select('id, total, discount_amount, payment_status, user_id, created_at')
      if (dateFilter) ordersQuery = ordersQuery.gte('created_at', dateFilter)
      if (activeLocation?.id) ordersQuery = ordersQuery.eq('location_id', activeLocation.id)
      
      const { data: orders } = await ordersQuery

      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || []
      const refundedOrders = orders?.filter(o => o.payment_status === 'refunded') || []
      
      const totalOrders = paidOrders.length
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      const totalDiscounts = paidOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0)
      const totalRefunds = refundedOrders.reduce((sum, o) => sum + (o.total || 0), 0)

      const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true })
      
      setStats({ 
        totalOrders, 
        totalRevenue, 
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0, 
        totalCustomers: customerCount || 0,
        totalDiscounts,
        totalRefunds
      })

      // Fetch user stats
      const { data: users } = await supabase.from('users').select('id, full_name')
      
      if (users && orders) {
        const userStatsMap = new Map<string, UserStats>()
        
        users.forEach(user => {
          userStatsMap.set(user.id, {
            user_id: user.id,
            full_name: user.full_name,
            total_orders: 0,
            total_sales: 0,
            total_discounts: 0,
            total_refunds: 0
          })
        })

        orders.forEach(order => {
          if (order.user_id && userStatsMap.has(order.user_id)) {
            const stats = userStatsMap.get(order.user_id)!
            if (order.payment_status === 'paid') {
              stats.total_orders++
              stats.total_sales += order.total || 0
              stats.total_discounts += order.discount_amount || 0
            } else if (order.payment_status === 'refunded') {
              stats.total_refunds += order.total || 0
            }
          }
        })

        setUserStats(Array.from(userStatsMap.values()).filter(u => u.total_orders > 0 || u.total_refunds > 0))
      }

      // Fetch shift reports
      let shiftsQuery = supabase
        .from('shifts')
        .select(`
          id,
          started_at,
          ended_at,
          starting_cash,
          ending_cash,
          expected_cash,
          cash_variance,
          user:users(full_name),
          location:locations(name)
        `)
        .eq('status', 'closed')
        .order('ended_at', { ascending: false })
        .limit(20)

      if (dateFilter) shiftsQuery = shiftsQuery.gte('started_at', dateFilter)
      if (activeLocation?.id) shiftsQuery = shiftsQuery.eq('location_id', activeLocation.id)

      const { data: shifts } = await shiftsQuery

      if (shifts) {
        const shiftReportsData: ShiftReport[] = await Promise.all(shifts.map(async (shift: any) => {
          // Get orders for this shift
          const { data: shiftOrders } = await supabase
            .from('orders')
            .select('total, discount_amount, payment_status')
            .eq('shift_id', shift.id)

          const paidShiftOrders = shiftOrders?.filter(o => o.payment_status === 'paid') || []
          
          return {
            id: shift.id,
            user_name: shift.user?.full_name || 'Unknown',
            location_name: shift.location?.name || 'Unknown',
            started_at: shift.started_at,
            ended_at: shift.ended_at,
            starting_cash: shift.starting_cash,
            ending_cash: shift.ending_cash,
            expected_cash: shift.expected_cash,
            cash_variance: shift.cash_variance,
            total_sales: paidShiftOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            total_discounts: paidShiftOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0),
            order_count: paidShiftOrders.length
          }
        }))

        setShiftReports(shiftReportsData)
      }

    } catch (error) { 
      console.error('Error:', error) 
    } finally { 
      setLoading(false) 
    }
  }

  const tabs = [
    { id: 'overview' as ReportTab, label: 'Overview', icon: '📊' },
    { id: 'shifts' as ReportTab, label: 'Shift Reports', icon: '💰' },
    { id: 'discounts' as ReportTab, label: 'Discounts by User', icon: '🏷️' },
    { id: 'refunds' as ReportTab, label: 'Refunds by User', icon: '↩️' },
  ]

  if (loading) return <div className="p-6 flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-600">Business analytics, shifts, and user performance</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === range 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Avg Order</p>
              <p className="text-2xl font-bold text-blue-600">${stats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Discounts</p>
              <p className="text-2xl font-bold text-orange-600">${stats.totalDiscounts.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Refunds</p>
              <p className="text-2xl font-bold text-red-600">${stats.totalRefunds.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalCustomers}</p>
            </div>
          </div>

          {/* User Performance Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">User Performance Summary</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discounts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refunds</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {userStats.map(user => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{user.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.total_orders}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">${user.total_sales.toFixed(2)}</td>
                    <td className="px-6 py-4 text-orange-600">${user.total_discounts.toFixed(2)}</td>
                    <td className="px-6 py-4 text-red-600">${user.total_refunds.toFixed(2)}</td>
                  </tr>
                ))}
                {userStats.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No data for selected period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Shift Reports</h3>
            <p className="text-sm text-gray-500">End of day reconciliation for all shifts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discounts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Cash</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Cash</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shiftReports.map(shift => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-800">{formatDateShort(shift.started_at, timezone)}</td>
                    <td className="px-4 py-4 text-gray-600">{shift.user_name}</td>
                    <td className="px-4 py-4 text-gray-600">{shift.location_name}</td>
                    <td className="px-4 py-4 text-gray-500 text-sm">
                      {formatTime(shift.started_at, timezone)} - {shift.ended_at ? formatTime(shift.ended_at, timezone) : '-'}
                    </td>
                    <td className="px-4 py-4 text-gray-800">{shift.order_count}</td>
                    <td className="px-4 py-4 text-green-600 font-medium">${shift.total_sales.toFixed(2)}</td>
                    <td className="px-4 py-4 text-orange-600">${shift.total_discounts.toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-600">${shift.starting_cash.toFixed(2)}</td>
                    <td className="px-4 py-4 text-gray-600">${shift.ending_cash?.toFixed(2) || '-'}</td>
                    <td className="px-4 py-4">
                      {shift.cash_variance !== null && (
                        <span className={`font-medium ${shift.cash_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {shift.cash_variance >= 0 ? '+' : ''}${shift.cash_variance.toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {shiftReports.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500">No shifts found for selected period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Discounts by User</h3>
            <p className="text-sm text-gray-500">Track manual discounts given by each staff member</p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders with Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Discounts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userStats.filter(u => u.total_discounts > 0).map(user => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.total_orders}</td>
                  <td className="px-6 py-4 text-gray-600">-</td>
                  <td className="px-6 py-4 text-orange-600 font-medium">${user.total_discounts.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    ${user.total_orders > 0 ? (user.total_discounts / user.total_orders).toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))}
              {userStats.filter(u => u.total_discounts > 0).length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No discounts found for selected period</td></tr>
              )}
            </tbody>
          </table>
          
          {/* Total */}
          <div className="p-4 bg-orange-50 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-orange-800">Total Discounts Given</span>
              <span className="text-2xl font-bold text-orange-600">${stats.totalDiscounts.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Refunds by User</h3>
            <p className="text-sm text-gray-500">Track refunds processed by each staff member</p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Refunded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userStats.filter(u => u.total_refunds > 0).map(user => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">-</td>
                  <td className="px-6 py-4 text-red-600 font-medium">${user.total_refunds.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.total_sales > 0 ? ((user.total_refunds / user.total_sales) * 100).toFixed(1) : '0'}%
                  </td>
                </tr>
              ))}
              {userStats.filter(u => u.total_refunds > 0).length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No refunds found for selected period</td></tr>
              )}
            </tbody>
          </table>
          
          {/* Total */}
          <div className="p-4 bg-red-50 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-red-800">Total Refunds</span>
              <span className="text-2xl font-bold text-red-600">${stats.totalRefunds.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
