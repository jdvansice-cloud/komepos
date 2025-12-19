import { useEffect, useState } from 'react'
import { supabase } from '@komepos/supabase/client'

interface Location { id: string; name: string; address: string; phone: string; email: string; is_active: boolean; delivery_enabled: boolean; opening_time: string; closing_time: string }

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', email: '', is_active: true, delivery_enabled: true, opening_time: '09:00', closing_time: '21:00' })

  useEffect(() => { fetchLocations() }, [])

  async function fetchLocations() {
    try { const { data } = await supabase.from('locations').select('*').order('name'); setLocations(data || []) }
    catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(location?: Location) {
    if (location) { setEditing(location); setFormData({ name: location.name, address: location.address || '', phone: location.phone || '', email: location.email || '', is_active: location.is_active, delivery_enabled: location.delivery_enabled, opening_time: location.opening_time || '09:00', closing_time: location.closing_time || '21:00' }) }
    else { setEditing(null); setFormData({ name: '', address: '', phone: '', email: '', is_active: true, delivery_enabled: true, opening_time: '09:00', closing_time: '21:00' }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) { await supabase.from('locations').update(formData).eq('id', editing.id) }
      else { const { data: company } = await supabase.from('companies').select('id').single(); await supabase.from('locations').insert({ ...formData, company_id: company?.id }) }
      setShowModal(false); fetchLocations()
    } catch (error) { console.error('Error:', error) }
  }

  async function toggleActive(location: Location) { await supabase.from('locations').update({ is_active: !location.is_active }).eq('id', location.id); fetchLocations() }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold text-gray-800">Locations</h1><p className="text-gray-600">Manage restaurant locations</p></div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Location</button>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
        <div className="grid gap-4">
          {locations.map(location => (
            <div key={location.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">{location.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${location.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{location.is_active ? 'Active' : 'Inactive'}</span>
                    {location.delivery_enabled && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Delivery</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{location.address}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    {location.phone && <span>📞 {location.phone}</span>}
                    {location.opening_time && <span>🕐 {location.opening_time} - {location.closing_time}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(location)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg">Edit</button>
                  <button onClick={() => toggleActive(location)} className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-lg">{location.is_active ? 'Deactivate' : 'Activate'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening</label><input type="time" value={formData.opening_time} onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Closing</label><input type="time" value={formData.closing_time} onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" /><span className="text-sm">Active</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.delivery_enabled} onChange={(e) => setFormData({ ...formData, delivery_enabled: e.target.checked })} className="rounded" /><span className="text-sm">Delivery</span></label>
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
