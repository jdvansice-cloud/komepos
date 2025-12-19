import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface CompanySettings { id: string; name: string; ruc: string; dv: string; itbms_rate: number; phone: string; email: string; address: string }

export function SettingsPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchCompany() }, [])

  async function fetchCompany() {
    try { const { data } = await supabase.from('companies').select('*').single(); setCompany(data) }
    catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return
    setSaving(true); setMessage('')
    try {
      await supabase.from('companies').update({ name: company.name, ruc: company.ruc, dv: company.dv, itbms_rate: company.itbms_rate, phone: company.phone, email: company.email, address: company.address }).eq('id', company.id)
      setMessage('Settings saved successfully!')
    } catch (error) { console.error('Error:', error); setMessage('Error saving settings') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div className="p-6">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-800">Settings</h1><p className="text-gray-600">Manage company information</p></div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Company Information</h2>
          {message && <div className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={company?.name || ''} onChange={(e) => setCompany({ ...company!, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">RUC</label><input type="text" value={company?.ruc || ''} onChange={(e) => setCompany({ ...company!, ruc: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">DV</label><input type="text" value={company?.dv || ''} onChange={(e) => setCompany({ ...company!, dv: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ITBMS Rate (%)</label><input type="number" step="0.01" value={(company?.itbms_rate || 0) * 100} onChange={(e) => setCompany({ ...company!, itbms_rate: parseFloat(e.target.value) / 100 })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /><p className="text-xs text-gray-500 mt-1">Current: {((company?.itbms_rate || 0) * 100).toFixed(2)}%</p></div>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 pt-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={company?.phone || ''} onChange={(e) => setCompany({ ...company!, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={company?.email || ''} onChange={(e) => setCompany({ ...company!, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={company?.address || ''} onChange={(e) => setCompany({ ...company!, address: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          <div className="flex justify-end pt-4"><button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      </div>
    </div>
  )
}
