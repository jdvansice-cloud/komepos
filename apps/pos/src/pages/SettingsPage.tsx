import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type TabType = 'company' | 'locations' | 'delivery' | 'users'
type UserRole = 'admin' | 'supervisor' | 'operator'

interface Company { id: string; name: string; ruc: string; dv: string; itbms_rate: number; address: string; phone: string; email: string }
interface Location { id: string; name: string; address: string; phone: string; is_active: boolean; opening_time: string; closing_time: string; delivery_enabled: boolean; latitude: number | null; longitude: number | null }
interface LocationOption { id: string; name: string }
interface User { id: string; full_name: string; email: string; role: UserRole; is_active: boolean }
interface DeliveryZone { id: string; name: string; delivery_fee: number; is_active: boolean; locations: LocationOption[] }

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('company')

  const tabs = [
    { id: 'company' as TabType, label: 'Company', icon: '🏢' },
    { id: 'locations' as TabType, label: 'Locations', icon: '📍' },
    { id: 'delivery' as TabType, label: 'Delivery Zones', icon: '🚚' },
    { id: 'users' as TabType, label: 'Users', icon: '👤' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your company, locations, and users</p>
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
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'company' && <CompanySettings />}
      {activeTab === 'locations' && <LocationsSettings />}
      {activeTab === 'delivery' && <DeliverySettings />}
      {activeTab === 'users' && <UsersSettings />}
    </div>
  )
}

// Company Settings Component
function CompanySettings() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', ruc: '', dv: '', itbms_rate: 0.07, address: '', phone: '', email: '' })

  useEffect(() => { fetchCompany() }, [])

  async function fetchCompany() {
    try {
      const { data } = await supabase.from('companies').select('*').single()
      if (data) { setCompany(data); setFormData({ name: data.name || '', ruc: data.ruc || '', dv: data.dv || '', itbms_rate: data.itbms_rate || 0.07, address: data.address || '', phone: data.phone || '', email: data.email || '' }) }
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase.from('companies').update(formData).eq('id', company?.id)
      alert('Settings saved!')
    } catch (error) { console.error('Error:', error) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Company Information</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
            <input type="text" value={formData.ruc} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DV *</label>
            <input type="text" value={formData.dv} onChange={(e) => setFormData({ ...formData, dv: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ITBMS Rate (%)</label>
          <input type="number" step="0.01" min="0" max="1" value={formData.itbms_rate} onChange={(e) => setFormData({ ...formData, itbms_rate: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
          <p className="text-xs text-gray-500 mt-1">Enter as decimal (e.g., 0.07 for 7%)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// Locations Settings Component
function LocationsSettings() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', is_active: true, opening_time: '', closing_time: '', delivery_enabled: true, latitude: '', longitude: '' })

  useEffect(() => { fetchLocations() }, [])

  async function fetchLocations() {
    try { const { data } = await supabase.from('locations').select('*').order('name'); setLocations(data || []) }
    catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(location?: Location) {
    if (location) { setEditing(location); setFormData({ name: location.name, address: location.address || '', phone: location.phone || '', is_active: location.is_active, opening_time: location.opening_time || '', closing_time: location.closing_time || '', delivery_enabled: location.delivery_enabled, latitude: location.latitude?.toString() || '', longitude: location.longitude?.toString() || '' }) }
    else { setEditing(null); setFormData({ name: '', address: '', phone: '', is_active: true, opening_time: '', closing_time: '', delivery_enabled: true, latitude: '', longitude: '' }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const submitData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        is_active: formData.is_active,
        opening_time: formData.opening_time || null,
        closing_time: formData.closing_time || null,
        delivery_enabled: formData.delivery_enabled,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      }
      if (editing) { await supabase.from('locations').update(submitData).eq('id', editing.id) }
      else { const { data: company } = await supabase.from('companies').select('id').single(); await supabase.from('locations').insert({ ...submitData, company_id: company?.id }) }
      setShowModal(false); fetchLocations()
    } catch (error) { console.error('Error:', error) }
  }

  async function toggleActive(location: Location) {
    await supabase.from('locations').update({ is_active: !location.is_active }).eq('id', location.id)
    fetchLocations()
  }

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Restaurant Locations</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Location</button>
      </div>

      <div className="grid gap-4">
        {locations.map(location => (
          <div key={location.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{location.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${location.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {location.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                <p className="text-sm text-gray-500">{location.phone}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  {location.delivery_enabled && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">🚚 Delivery</span>}
                  {(location.opening_time || location.closing_time) && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{location.opening_time || '?'} - {location.closing_time || '?'}</span>}
                  {location.latitude && location.longitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      📍 View Map
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(location)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm">Edit</button>
                <button onClick={() => toggleActive(location)} className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-lg text-sm">{location.is_active ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
          </div>
        ))}
        {locations.length === 0 && <p className="text-gray-500 text-center py-8">No locations yet. Add your first location.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Latitude (e.g. 9.0820)" className="border border-gray-300 rounded-lg px-4 py-2" />
                  <input type="text" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Longitude (e.g. -79.5200)" className="border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => setFormData({ ...formData, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }),
                        (err) => alert('Could not get location: ' + err.message)
                      )
                    } else {
                      alert('Geolocation not supported by your browser')
                    }
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  📍 Use Current Location
                </button>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label><input type="time" value={formData.opening_time} onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label><input type="time" value={formData.closing_time} onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.delivery_enabled} onChange={(e) => setFormData({ ...formData, delivery_enabled: e.target.checked })} className="rounded" /><span className="text-sm">Delivery Enabled</span></label>
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

// Delivery Zones Settings Component
function DeliverySettings() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState<{ name: string; delivery_fee: string; location_ids: string[]; is_active: boolean }>({ name: '', delivery_fee: '', location_ids: [], is_active: true })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [zonesRes, locationsRes] = await Promise.all([
        supabase.from('delivery_zones').select('id, name, delivery_fee, is_active').order('name'),
        supabase.from('locations').select('id, name').order('name'),
      ])
      
      // Fetch zone locations for each zone
      const zonesWithLocations = await Promise.all(
        (zonesRes.data || []).map(async (zone) => {
          const { data: zoneLocs } = await supabase
            .from('delivery_zone_locations')
            .select('location:locations(id, name)')
            .eq('zone_id', zone.id)
          const locs = zoneLocs?.map((zl: any) => zl.location).filter(Boolean) || []
          return { ...zone, locations: locs as LocationOption[] }
        })
      )
      
      setZones(zonesWithLocations)
      setLocations(locationsRes.data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(zone?: DeliveryZone) {
    if (zone) {
      setEditing(zone)
      setFormData({ 
        name: zone.name, 
        delivery_fee: zone.delivery_fee.toString(), 
        location_ids: zone.locations.map(l => l.id), 
        is_active: zone.is_active 
      })
    } else {
      setEditing(null)
      setFormData({ name: '', delivery_fee: '', location_ids: [], is_active: true })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.location_ids.length === 0) {
      alert('Please assign at least one location')
      return
    }
    
    try {
      const zoneData = {
        name: formData.name,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        is_active: formData.is_active,
        location_id: formData.location_ids[0], // Primary location (required field)
      }

      if (editing) {
        const { error: updateError } = await supabase.from('delivery_zones').update(zoneData).eq('id', editing.id)
        if (updateError) {
          console.error('Update error:', updateError)
          alert('Error updating zone: ' + updateError.message)
          return
        }
        
        // Update location assignments
        await supabase.from('delivery_zone_locations').delete().eq('zone_id', editing.id)
        if (formData.location_ids.length > 0) {
          const { error: locError } = await supabase.from('delivery_zone_locations').insert(
            formData.location_ids.map(loc_id => ({ zone_id: editing.id, location_id: loc_id }))
          )
          if (locError) console.error('Location assignment error:', locError)
        }
      } else {
        const { data: company } = await supabase.from('companies').select('id').single()
        if (!company?.id) {
          alert('Error: Company not found')
          return
        }
        
        const { data: newZone, error: insertError } = await supabase
          .from('delivery_zones')
          .insert({ ...zoneData, company_id: company.id })
          .select()
          .single()
        
        if (insertError) {
          console.error('Insert error:', insertError)
          alert('Error creating zone: ' + insertError.message)
          return
        }
        
        if (newZone && formData.location_ids.length > 0) {
          const { error: locError } = await supabase.from('delivery_zone_locations').insert(
            formData.location_ids.map(loc_id => ({ zone_id: newZone.id, location_id: loc_id }))
          )
          if (locError) console.error('Location assignment error:', locError)
        }
      }
      setShowModal(false)
      fetchData()
    } catch (error) { 
      console.error('Error:', error)
      alert('An error occurred')
    }
  }

  async function toggleActive(zone: DeliveryZone) {
    await supabase.from('delivery_zones').update({ is_active: !zone.is_active }).eq('id', zone.id)
    fetchData()
  }

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Delivery Zones</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Zone</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locations</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {zones.map(zone => (
              <tr key={zone.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{zone.name}</td>
                <td className="px-6 py-4 text-gray-600">${zone.delivery_fee.toFixed(2)}</td>
                <td className="px-6 py-4">
                  {zone.locations.length === 0 ? (
                    <span className="text-red-500 text-sm">None assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {zone.locations.map(loc => (
                        <span key={loc.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{loc.name}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${zone.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(zone)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button onClick={() => toggleActive(zone)} className="text-gray-600 hover:text-gray-800">{zone.is_active ? 'Disable' : 'Enable'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {zones.length === 0 && <p className="text-gray-500 text-center py-8">No delivery zones yet. Add your first zone.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Zone' : 'Add Zone'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="e.g., Downtown, Costa del Este" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Price ($) *</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee} onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="3.00" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Locations</label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.location_ids.includes(e.target.value)) {
                      setFormData(prev => ({ ...prev, location_ids: [...prev.location_ids, e.target.value] }))
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
                >
                  <option value="">Select location to add...</option>
                  {locations.filter(loc => !formData.location_ids.includes(loc.id)).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {formData.location_ids.map(locId => {
                    const loc = locations.find(l => l.id === locId)
                    return loc ? (
                      <span key={locId} className="inline-flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm">
                        {loc.name}
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, location_ids: prev.location_ids.filter(id => id !== locId) }))} className="text-gray-500 hover:text-gray-700 ml-1">✕</button>
                      </span>
                    ) : null
                  })}
                  {formData.location_ids.length === 0 && <p className="text-sm text-gray-500 italic">No locations assigned</p>}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
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

// Users Settings Component
interface UserWithLocations {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  locations: LocationOption[]
}

function UsersSettings() {
  const [users, setUsers] = useState<UserWithLocations[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<UserWithLocations | null>(null)
  const [formData, setFormData] = useState<{ full_name: string; email: string; password: string; role: UserRole; location_ids: string[]; is_active: boolean }>({ full_name: '', email: '', password: '', role: 'operator', location_ids: [], is_active: true })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [usersRes, locationsRes] = await Promise.all([
        supabase.from('users').select('id, full_name, email, role, is_active').order('full_name'),
        supabase.from('locations').select('id, name').order('name'),
      ])
      
      // Fetch user_locations for each user
      const usersWithLocations = await Promise.all(
        (usersRes.data || []).map(async (user) => {
          const { data: userLocs } = await supabase
            .from('user_locations')
            .select('location:locations(id, name)')
            .eq('user_id', user.id)
          const locs = userLocs?.map((ul: any) => ul.location).filter(Boolean) || []
          return { ...user, locations: locs as LocationOption[] }
        })
      )
      
      setUsers(usersWithLocations as UserWithLocations[])
      setLocations(locationsRes.data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(user?: UserWithLocations) {
    if (user) { 
      setEditing(user)
      setFormData({ 
        full_name: user.full_name, 
        email: user.email, 
        password: '',
        role: user.role, 
        location_ids: user.locations.map(l => l.id), 
        is_active: user.is_active 
      }) 
    } else { 
      setEditing(null)
      setFormData({ full_name: '', email: '', password: '', role: 'operator', location_ids: [], is_active: true }) 
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        // Update user basic info
        await supabase.from('users').update({ 
          full_name: formData.full_name, 
          role: formData.role, 
          is_active: formData.is_active 
        }).eq('id', editing.id)
        
        // Delete existing location assignments
        await supabase.from('user_locations').delete().eq('user_id', editing.id)
        
        // Insert new location assignments
        if (formData.location_ids.length > 0) {
          await supabase.from('user_locations').insert(
            formData.location_ids.map(loc_id => ({ user_id: editing.id, location_id: loc_id }))
          )
        }
      } else {
        // Validate password
        if (formData.password.length < 6) {
          alert('Password must be at least 6 characters')
          return
        }

        // Get company_id FIRST before anything else
        const { data: company, error: companyError } = await supabase.from('companies').select('id').single()
        if (companyError || !company?.id) {
          alert('Error: Company not found')
          return
        }
        const companyId = company.id

        // Save current admin session BEFORE signUp (signUp will change the session)
        const { data: { session: adminSession } } = await supabase.auth.getSession()
        
        // Create auth user with signUp
        // Note: Email confirmation should be disabled in Supabase Auth settings
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.full_name }
          }
        })

        if (authError) {
          // Restore admin session on error
          if (adminSession) await supabase.auth.setSession(adminSession)
          alert('Error creating user: ' + authError.message)
          return
        }

        if (!authData.user) {
          if (adminSession) await supabase.auth.setSession(adminSession)
          alert('Error: No user returned from signup')
          return
        }

        const newUserId = authData.user.id

        // Restore admin session BEFORE database operations (so RLS policies work for admin)
        if (adminSession) {
          await supabase.auth.setSession(adminSession)
        }

        // Create user profile (now as admin)
        const { error: profileError } = await supabase.from('users').insert({
          id: newUserId,
          company_id: companyId,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active
        })

        if (profileError) {
          alert('Error creating profile: ' + profileError.message)
          return
        }

        // Assign locations (now as admin, so RLS allows it)
        if (formData.location_ids.length > 0) {
          const { error: locError } = await supabase.from('user_locations').insert(
            formData.location_ids.map(loc_id => ({ user_id: newUserId, location_id: loc_id }))
          )
          if (locError) {
            console.error('Error assigning locations:', locError)
            alert('User created but location assignment failed: ' + locError.message)
          }
        }

        alert(`User created successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nThey can now login to the POS.`)
      }
      setShowModal(false)
      fetchData()
    } catch (error) { 
      console.error('Error:', error)
      alert('An error occurred')
    }
  }

  const roleColors: Record<UserRole, string> = { admin: 'bg-purple-100 text-purple-700', supervisor: 'bg-blue-100 text-blue-700', operator: 'bg-gray-100 text-gray-700' }

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Staff Members</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add User</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locations</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{user.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[user.role]}`}>{user.role}</span></td>
                <td className="px-6 py-4 text-gray-600">
                  {user.role === 'admin' ? (
                    <span className="text-purple-600 text-sm">All Locations</span>
                  ) : user.locations.length === 0 ? (
                    <span className="text-red-500 text-sm">None assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.locations.map(loc => (
                        <span key={loc.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{loc.name}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-right"><button onClick={() => openModal(user)} className="text-blue-600 hover:text-blue-800">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-gray-500 text-center py-8">No users found.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" disabled={!!editing} required /></div>
              {!editing && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" minLength={6} required /><p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p></div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role *</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="operator">Operator</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></div>
              
              {formData.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Locations</label>
                  
                  {/* Dropdown to add locations */}
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !formData.location_ids.includes(e.target.value)) {
                        setFormData(prev => ({
                          ...prev,
                          location_ids: [...prev.location_ids, e.target.value]
                        }))
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
                  >
                    <option value="">Select location to add...</option>
                    {locations
                      .filter(loc => !formData.location_ids.includes(loc.id))
                      .map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))
                    }
                  </select>
                  
                  {/* Selected locations as tags */}
                  <div className="flex flex-wrap gap-2">
                    {formData.location_ids.map(locId => {
                      const loc = locations.find(l => l.id === locId)
                      return loc ? (
                        <span 
                          key={locId} 
                          className="inline-flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-sm"
                        >
                          {loc.name}
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              location_ids: prev.location_ids.filter(id => id !== locId)
                            }))}
                            className="text-gray-500 hover:text-gray-700 ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ) : null
                    })}
                    {formData.location_ids.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No locations assigned</p>
                    )}
                  </div>
                </div>
              )}
              {formData.role === 'admin' && (
                <p className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                  👑 Admins have access to all locations automatically
                </p>
              )}
              
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" /><span className="text-sm">Active</span></label>
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
