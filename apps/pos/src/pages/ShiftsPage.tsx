import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCompanyTimezone, formatTime, formatDateShort, formatDateTime, getNowISO } from '../lib/timezone'

interface Shift {
  id: string
  location_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  starting_cash: number
  ending_cash: number | null
  expected_cash: number | null
  cash_variance: number | null
  status: 'open' | 'closed'
  notes: string | null
  user?: { full_name: string }
  location?: { name: string }
}

interface CashTransaction {
  id: string
  shift_id: string
  type: 'cash_in' | 'cash_out' | 'sale' | 'refund' | 'adjustment'
  amount: number
  reason: string | null
  order_id: string | null
  created_at: string
  performed_by_user?: { full_name: string }
}

interface ShiftSummary {
  totalSales: number
  cashSales: number
  cardSales: number
  refunds: number
  discounts: number
  orderCount: number
}

export function ShiftsPage() {
  const { profile, activeLocation } = useAuth()
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [recentShifts, setRecentShifts] = useState<Shift[]>([])
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [endingCash, setEndingCash] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [cashAction, setCashAction] = useState<'cash_in' | 'cash_out'>('cash_in')
  const [cashAmount, setCashAmount] = useState('')
  const [cashReason, setCashReason] = useState('')
  const [timezone, setTimezone] = useState('America/Panama')

  useEffect(() => {
    async function init() {
      const tz = await getCompanyTimezone()
      setTimezone(tz)
    }
    init()
  }, [])

  useEffect(() => {
    fetchShiftData()
  }, [activeLocation])

  async function fetchShiftData() {
    setLoading(true)
    try {
      // Get current open shift for this user at this location
      const { data: openShift } = await supabase
        .from('shifts')
        .select('*, user:users(full_name), location:locations(name)')
        .eq('user_id', profile?.id)
        .eq('status', 'open')
        .maybeSingle()

      setCurrentShift(openShift)

      if (openShift) {
        // Fetch transactions for current shift
        const { data: trans } = await supabase
          .from('cash_drawer_transactions')
          .select('*, performed_by_user:users!cash_drawer_transactions_performed_by_fkey(full_name)')
          .eq('shift_id', openShift.id)
          .order('created_at', { ascending: false })
        
        setTransactions(trans || [])

        // Calculate shift summary from orders
        const { data: orders } = await supabase
          .from('orders')
          .select('total, discount_amount, payment_method, payment_status')
          .eq('shift_id', openShift.id)

        if (orders) {
          const summary: ShiftSummary = {
            totalSales: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0),
            cashSales: orders.filter(o => o.payment_method === 'cash' && o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0),
            cardSales: orders.filter(o => o.payment_method === 'card' && o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0),
            refunds: orders.filter(o => o.payment_status === 'refunded').reduce((sum, o) => sum + (o.total || 0), 0),
            discounts: orders.reduce((sum, o) => sum + (o.discount_amount || 0), 0),
            orderCount: orders.filter(o => o.payment_status === 'paid').length
          }
          setSummary(summary)
        }
      }

      // Fetch recent closed shifts
      const locationFilter = activeLocation?.id 
        ? supabase.from('shifts').select('*, user:users(full_name), location:locations(name)').eq('location_id', activeLocation.id)
        : supabase.from('shifts').select('*, user:users(full_name), location:locations(name)')
      
      const { data: shifts } = await locationFilter
        .eq('status', 'closed')
        .order('ended_at', { ascending: false })
        .limit(10)

      setRecentShifts(shifts || [])
    } catch (error) {
      console.error('Error fetching shift data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function startShift() {
    if (!startingCash || !activeLocation?.id) {
      alert('Please enter starting cash amount and select a location')
      return
    }

    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          location_id: activeLocation.id,
          user_id: profile?.id,
          starting_cash: parseFloat(startingCash),
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Log the starting cash
      await supabase.from('cash_drawer_transactions').insert({
        shift_id: data.id,
        type: 'cash_in',
        amount: parseFloat(startingCash),
        reason: 'Starting cash',
        performed_by: profile?.id
      })

      setShowStartModal(false)
      setStartingCash('')
      fetchShiftData()
    } catch (error) {
      console.error('Error starting shift:', error)
      alert('Error starting shift')
    }
  }

  async function endShift() {
    if (!currentShift || !endingCash) {
      alert('Please enter ending cash amount')
      return
    }

    try {
      const ending = parseFloat(endingCash)
      const expectedCash = currentShift.starting_cash + (summary?.cashSales || 0) - (summary?.refunds || 0)
      const variance = ending - expectedCash

      const { error } = await supabase
        .from('shifts')
        .update({
          ended_at: getNowISO(),
          ending_cash: ending,
          expected_cash: expectedCash,
          cash_variance: variance,
          status: 'closed',
          notes: closeNotes || null
        })
        .eq('id', currentShift.id)

      if (error) throw error

      setShowEndModal(false)
      setEndingCash('')
      setCloseNotes('')
      fetchShiftData()
    } catch (error) {
      console.error('Error ending shift:', error)
      alert('Error ending shift')
    }
  }

  async function addCashTransaction() {
    if (!currentShift || !cashAmount) {
      alert('Please enter amount')
      return
    }

    try {
      const { error } = await supabase.from('cash_drawer_transactions').insert({
        shift_id: currentShift.id,
        type: cashAction,
        amount: parseFloat(cashAmount),
        reason: cashReason || null,
        performed_by: profile?.id
      })

      if (error) throw error

      setShowCashModal(false)
      setCashAmount('')
      setCashReason('')
      fetchShiftData()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Error adding transaction')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Cash Register</h1>
        <p className="text-gray-600">Manage shifts and cash drawer reconciliation</p>
      </div>

      {/* Current Shift Status */}
      {currentShift ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <h2 className="text-lg font-semibold text-green-800">Shift Active</h2>
              </div>
              <p className="text-green-700">Started at {formatTime(currentShift.started_at, timezone)} • {currentShift.location?.name}</p>
              <p className="text-green-600 text-sm mt-1">Starting Cash: ${currentShift.starting_cash.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCashModal(true)}
                className="bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50"
              >
                💵 Cash In/Out
              </button>
              <button
                onClick={() => setShowEndModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                End Shift
              </button>
            </div>
          </div>

          {/* Shift Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-2xl font-bold text-gray-800">{summary.orderCount}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">${summary.totalSales.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Cash Sales</p>
                <p className="text-2xl font-bold text-blue-600">${summary.cashSales.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Card Sales</p>
                <p className="text-2xl font-bold text-purple-600">${summary.cardSales.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Discounts Given</p>
                <p className="text-2xl font-bold text-orange-600">${summary.discounts.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-500">Refunds</p>
                <p className="text-2xl font-bold text-red-600">${summary.refunds.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 col-span-2">
                <p className="text-sm text-gray-500">Expected Cash in Drawer</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${(currentShift.starting_cash + summary.cashSales - summary.refunds).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-green-800 mb-3">Cash Drawer Activity</h3>
              <div className="bg-white rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500">Time</th>
                      <th className="px-4 py-2 text-left text-gray-500">Type</th>
                      <th className="px-4 py-2 text-left text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-left text-gray-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id}>
                        <td className="px-4 py-2 text-gray-600">{formatTime(t.created_at, timezone)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            t.type === 'cash_in' || t.type === 'sale' ? 'bg-green-100 text-green-700' :
                            t.type === 'cash_out' || t.type === 'refund' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-4 py-2 font-medium ${t.type === 'cash_out' || t.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                          {t.type === 'cash_out' || t.type === 'refund' ? '-' : '+'}${t.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{t.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-6">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Shift</h2>
          <p className="text-gray-600 mb-4">Start a shift to begin taking orders and track your cash drawer</p>
          <button
            onClick={() => setShowStartModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Start Shift
          </button>
        </div>
      )}

      {/* Recent Shifts History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Recent Shifts</h2>
        </div>
        {recentShifts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent shifts</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starting</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentShifts.map(shift => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800">{formatDateShort(shift.started_at, timezone)}</td>
                  <td className="px-6 py-4 text-gray-600">{shift.user?.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">{shift.location?.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatTime(shift.started_at, timezone)} - {shift.ended_at ? formatTime(shift.ended_at, timezone) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-800">${shift.starting_cash.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-800">${shift.ending_cash?.toFixed(2) || '-'}</td>
                  <td className="px-6 py-4">
                    {shift.cash_variance !== null && (
                      <span className={`font-medium ${shift.cash_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {shift.cash_variance >= 0 ? '+' : ''}${shift.cash_variance.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Start Shift Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Start New Shift</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-800 font-medium">{activeLocation?.name || 'No location selected'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Cash *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Count and enter the cash in your drawer</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowStartModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={startShift} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Start Shift</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Shift Modal */}
      {showEndModal && currentShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">End Shift & Reconcile</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Expected Cash:</strong> ${(currentShift.starting_cash + (summary?.cashSales || 0) - (summary?.refunds || 0)).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Starting (${currentShift.starting_cash.toFixed(2)}) + Cash Sales (${summary?.cashSales.toFixed(2)}) - Refunds (${summary?.refunds.toFixed(2)})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cash Count *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={endingCash}
                  onChange={(e) => setEndingCash(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0.00"
                />
              </div>
              {endingCash && (
                <div className={`p-3 rounded-lg ${
                  parseFloat(endingCash) - (currentShift.starting_cash + (summary?.cashSales || 0) - (summary?.refunds || 0)) >= 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <strong>Variance: </strong>
                  ${(parseFloat(endingCash) - (currentShift.starting_cash + (summary?.cashSales || 0) - (summary?.refunds || 0))).toFixed(2)}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={2}
                  placeholder="Any notes about this shift..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowEndModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={endShift} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Close Shift</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash In/Out Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Cash In/Out</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCashAction('cash_in')}
                  className={`flex-1 py-2 rounded-lg font-medium ${cashAction === 'cash_in' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  💵 Cash In
                </button>
                <button
                  onClick={() => setCashAction('cash_out')}
                  className={`flex-1 py-2 rounded-lg font-medium ${cashAction === 'cash_out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  💸 Cash Out
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={cashReason}
                  onChange={(e) => setCashReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="e.g., Change for customer, Bank deposit..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowCashModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={addCashTransaction} className={`px-4 py-2 text-white rounded-lg ${cashAction === 'cash_in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {cashAction === 'cash_in' ? 'Add Cash' : 'Remove Cash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
