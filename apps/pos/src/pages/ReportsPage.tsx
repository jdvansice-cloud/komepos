import { useEffect, useState } from 'react'
import { supabase } from '@komepos/supabase/client'

export function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalCustomers: 0 })

  useEffect(() => { fetchReports() }, [])

  async function fetchReports() {
    try {
      const { data: orders } = await supabase.from('orders').select('total')
      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0) || 0
      const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true })
      setStats({ totalOrders, totalRevenue, avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0, totalCustomers: customerCount || 0 })
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="p-6 flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div className="p-6">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-800">Reports</h1><p className="text-gray-600">Business analytics and insights</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Total Orders</p><p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p></div>
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p></div>
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Avg Order Value</p><p className="text-3xl font-bold text-blue-600">${stats.avgOrderValue.toFixed(2)}</p></div>
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Total Customers</p><p className="text-3xl font-bold text-purple-600">{stats.totalCustomers}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6"><h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview</h3><div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg"><p className="text-gray-400">📈 Chart coming soon</p></div></div>
        <div className="bg-white rounded-lg shadow p-6"><h3 className="text-lg font-semibold text-gray-800 mb-4">Order Types</h3><div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg"><p className="text-gray-400">🥧 Chart coming soon</p></div></div>
      </div>
    </div>
  )
}
