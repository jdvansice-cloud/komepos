import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Promo { id: string; name: string; description: string; discount_type: 'percentage' | 'fixed'; discount_value: number; free_delivery: boolean; start_date: string; end_date: string; is_active: boolean }

export function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promo | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', discount_type: 'percentage' as const, discount_value: 10, free_delivery: false, start_date: '', end_date: '', is_active: true })

  useEffect(() => { fetchPromos() }, [])

  async function fetchPromos() {
    try { const { data } = await supabase.from('promos').select('*').order('created_at', { ascending: false }); setPromos(data || []) }
    catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(promo?: Promo) {
    if (promo) { setEditing(promo); setFormData({ name: promo.name, description: promo.description || '', discount_type: promo.discount_type, discount_value: promo.discount_value, free_delivery: promo.free_delivery, start_date: promo.start_date?.split('T')[0] || '', end_date: promo.end_date?.split('T')[0] || '', is_active: promo.is_active }) }
    else { setEditing(null); setFormData({ name: '', description: '', discount_type: 'percentage', discount_value: 10, free_delivery: false, start_date: new Date().toISOString().split('T')[0], end_date: '', is_active: true }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) { await supabase.from('promos').update(formData).eq('id', editing.id) }
      else { const { data: company } = await supabase.from('companies').select('id').single(); await supabase.from('promos').insert({ ...formData, company_id: company?.id }) }
      setShowModal(false); fetchPromos()
    } catch (error) { console.error('Error:', error) }
  }

  async function toggleActive(promo: Promo) { await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id); fetchPromos() }

  function getStatus(promo: Promo) {
    const now = new Date(), start = new Date(promo.start_date), end = promo.end_date ? new Date(promo.end_date) : null
    if (!promo.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' }
    if (now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' }
    if (end && now > end) return { label: 'Expired', color: 'bg-red-100 text-red-700' }
    return { label: 'Active', color: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold text-gray-800">Promotions</h1><p className="text-gray-600">Manage discounts and offers</p></div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Promo</button>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : promos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center"><p className="text-gray-500 text-lg">No promotions yet</p></div>
      ) : (
        <div className="grid gap-4">
          {promos.map(promo => {
            const status = getStatus(promo)
            return (
              <div key={promo.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-800">{promo.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-gray-600 mt-1">{promo.description}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">{promo.discount_type === 'percentage' ? `${promo.discount_value}% off` : `$${promo.discount_value} off`}</span>
                      {promo.free_delivery && <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Free Delivery</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(promo.start_date).toLocaleDateString()}{promo.end_date && ` - ${new Date(promo.end_date).toLocaleDateString()}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(promo)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg">Edit</button>
                    <button onClick={() => toggleActive(promo)} className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-lg">{promo.is_active ? 'Disable' : 'Enable'}</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Promo' : 'Add Promo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Value</label><input type="number" min="0" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.free_delivery} onChange={(e) => setFormData({ ...formData, free_delivery: e.target.checked })} className="rounded" /><span className="text-sm">Free Delivery</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" /><span className="text-sm">Active</span></label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
