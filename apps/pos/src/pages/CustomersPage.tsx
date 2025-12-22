import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCompanyTimezone, formatDateShort } from '../lib/timezone'

interface Customer { id: string; full_name: string; email: string; phone: string; created_at: string }

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [timezone, setTimezone] = useState('America/Panama')

  useEffect(() => { 
    async function init() {
      const tz = await getCompanyTimezone()
      setTimezone(tz)
      fetchCustomers()
    }
    init()
  }, [])

  async function fetchCustomers() {
    try {
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
      setCustomers(data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  const filteredCustomers = customers.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  return (
    <div className="p-6">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-800">Customers</h1><p className="text-gray-600">View customer information</p></div>
      <div className="mb-6"><input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2" /></div>

      {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">{customer.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                      <span className="font-medium text-gray-800">{customer.full_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><p className="text-gray-800">{customer.email || '-'}</p><p className="text-sm text-gray-500">{customer.phone || '-'}</p></td>
                  <td className="px-6 py-4 text-gray-500">{formatDateShort(customer.created_at, timezone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <div className="p-8 text-center text-gray-500">No customers found</div>}
        </div>
      )}
    </div>
  )
}
