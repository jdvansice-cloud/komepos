import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type TabType = 'company' | 'locations' | 'delivery' | 'users' | 'categories' | 'products' | 'promos'
type UserRole = 'admin' | 'supervisor' | 'operator'
type PromoDiscountType = 'item_percentage' | 'item_fixed' | 'order_percentage' | 'order_fixed' | 'free_delivery'

interface Company { id: string; name: string; ruc: string; dv: string; itbms_rate: number; address: string; phone: string; email: string }
interface Location { id: string; name: string; address: string; phone: string; is_active: boolean; opening_time: string; closing_time: string; delivery_enabled: boolean; latitude: number | null; longitude: number | null }
interface LocationOption { id: string; name: string }
interface User { id: string; full_name: string; email: string; role: UserRole; is_active: boolean }
interface DeliveryZone { id: string; name: string; delivery_fee: number; is_active: boolean; locations: LocationOption[] }
interface Category { id: string; name: string; description: string; image_url: string; sort_order: number; is_active: boolean }
interface Product { id: string; name: string; description: string; base_price: number; image_url: string; is_taxable: boolean; is_active: boolean; has_options: boolean; category_id: string; category?: { name: string } }
interface Promo { id: string; name: string; description: string; discount_type: PromoDiscountType; discount_value: number; start_date: string; end_date: string; is_active: boolean }

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('company')

  const tabs = [
    { id: 'company' as TabType, label: 'Company', icon: '🏢' },
    { id: 'locations' as TabType, label: 'Locations', icon: '📍' },
    { id: 'delivery' as TabType, label: 'Delivery Zones', icon: '🚚' },
    { id: 'categories' as TabType, label: 'Categories', icon: '📁' },
    { id: 'products' as TabType, label: 'Products', icon: '🍔' },
    { id: 'promos' as TabType, label: 'Promotions', icon: '🎉' },
    { id: 'users' as TabType, label: 'Users', icon: '👤' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your restaurant configuration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
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
      {activeTab === 'categories' && <CategoriesSettings />}
      {activeTab === 'products' && <ProductsSettings />}
      {activeTab === 'promos' && <PromosSettings />}
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

// Categories Settings Component
function CategoriesSettings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', image_url: '', sort_order: 0, is_active: true })

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    try {
      const { data } = await supabase.from('categories').select('*').order('sort_order')
      setCategories(data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(category?: Category) {
    if (category) {
      setEditing(category)
      setFormData({ name: category.name, description: category.description || '', image_url: category.image_url || '', sort_order: category.sort_order, is_active: category.is_active })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '', image_url: '', sort_order: categories.length, is_active: true })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) { await supabase.from('categories').update(formData).eq('id', editing.id) }
      else {
        const { data: company } = await supabase.from('companies').select('id').single()
        await supabase.from('categories').insert({ ...formData, company_id: company?.id })
      }
      setShowModal(false)
      fetchCategories()
    } catch (error) { console.error('Error:', error) }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Products in this category will need to be reassigned.')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Menu Categories</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Category</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
            {category.image_url && <img src={category.image_url} alt={category.name} className="w-full h-32 object-cover" />}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{category.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openModal(category)} className="flex-1 text-blue-600 border border-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 text-sm">Edit</button>
                <button onClick={() => deleteCategory(category.id)} className="text-red-600 border border-red-600 px-3 py-1 rounded-lg hover:bg-red-50 text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {categories.length === 0 && <p className="text-gray-500 text-center py-8">No categories yet. Add your first category.</p>}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label><input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
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

// Products Settings Component
function ProductsSettings() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [filter, setFilter] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '', base_price: 0, image_url: '', is_taxable: true, is_active: true, category_id: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(name)').order('name'),
        supabase.from('categories').select('id, name').order('name'),
      ])
      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditing(product)
      setFormData({ name: product.name, description: product.description || '', base_price: product.base_price, image_url: product.image_url || '', is_taxable: product.is_taxable, is_active: product.is_active, category_id: product.category_id })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '', base_price: 0, image_url: '', is_taxable: true, is_active: true, category_id: categories[0]?.id || '' })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await supabase.from('products').update(formData).eq('id', editing.id)
      } else {
        const { data: company } = await supabase.from('companies').select('id').single()
        await supabase.from('products').insert({ ...formData, company_id: company?.id })
      }
      setShowModal(false)
      fetchData()
    } catch (error) { console.error('Error:', error) }
  }

  async function toggleActive(product: Product) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    fetchData()
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.category?.name?.toLowerCase().includes(filter.toLowerCase()))

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Menu Products</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Product</button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search products..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.image_url ? <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">🍽️</div>}
                    <span className="font-medium text-gray-800">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{product.category?.name}</td>
                <td className="px-6 py-4 font-medium">${product.base_price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openModal(product)} className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                  <button onClick={() => toggleActive(product)} className="text-gray-600 hover:text-gray-800">{product.is_active ? 'Disable' : 'Enable'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && <p className="text-gray-500 text-center py-8">No products found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Price *</label><input type="number" step="0.01" min="0" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required><option value="">Select category</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label><input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://..." /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_taxable} onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })} className="rounded" /><span className="text-sm">Taxable (ITBMS)</span></label>
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

// Promotions Settings Component
function PromosSettings() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allLocations, setAllLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promo | null>(null)
  const [formData, setFormData] = useState<{ name: string; description: string; discount_type: PromoDiscountType; discount_value: number; start_date: string; end_date: string; is_active: boolean }>({ name: '', description: '', discount_type: 'order_percentage', discount_value: 10, start_date: '', end_date: '', is_active: true })
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [promoProductCounts, setPromoProductCounts] = useState<Record<string, number>>({})
  const [promoLocationCounts, setPromoLocationCounts] = useState<Record<string, number>>({})

  useEffect(() => { fetchPromos(); fetchProducts(); fetchLocations() }, [])

  async function fetchPromos() {
    try { 
      const { data } = await supabase.from('promos').select('*').order('created_at', { ascending: false })
      setPromos(data || [])
      
      // Get product counts for each promo
      const { data: promoProdData } = await supabase.from('promo_products').select('promo_id')
      if (promoProdData) {
        const counts: Record<string, number> = {}
        promoProdData.forEach(pp => {
          counts[pp.promo_id] = (counts[pp.promo_id] || 0) + 1
        })
        setPromoProductCounts(counts)
      }
      
      // Get location counts for each promo
      const { data: promoLocData } = await supabase.from('promo_locations').select('promo_id')
      if (promoLocData) {
        const counts: Record<string, number> = {}
        promoLocData.forEach(pl => {
          counts[pl.promo_id] = (counts[pl.promo_id] || 0) + 1
        })
        setPromoLocationCounts(counts)
      }
    }
    catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*, category:categories(name)').eq('is_active', true).order('name')
    setAllProducts(data || [])
  }

  async function fetchLocations() {
    const { data } = await supabase.from('locations').select('id, name').eq('is_active', true).order('name')
    setAllLocations(data || [])
  }

  async function openModal(promo?: Promo) {
    if (promo) { 
      setEditing(promo)
      setFormData({ name: promo.name, description: promo.description || '', discount_type: promo.discount_type, discount_value: promo.discount_value, start_date: promo.start_date?.split('T')[0] || '', end_date: promo.end_date?.split('T')[0] || '', is_active: promo.is_active })
      
      // Load selected products for this promo
      const { data: promoProducts } = await supabase.from('promo_products').select('product_id').eq('promo_id', promo.id)
      setSelectedProducts(promoProducts?.map(pp => pp.product_id) || [])
      
      // Load selected locations for this promo
      const { data: promoLocs } = await supabase.from('promo_locations').select('location_id').eq('promo_id', promo.id)
      setSelectedLocations(promoLocs?.map(pl => pl.location_id) || [])
    } else { 
      setEditing(null)
      setFormData({ name: '', description: '', discount_type: 'order_percentage', discount_value: 10, start_date: new Date().toISOString().split('T')[0], end_date: '', is_active: true })
      setSelectedProducts([])
      setSelectedLocations(allLocations.map(l => l.id)) // Default to all locations
    }
    setProductSearch('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate: item discounts need at least one product
    const isItemDiscount = formData.discount_type === 'item_percentage' || formData.discount_type === 'item_fixed'
    if (isItemDiscount && selectedProducts.length === 0) {
      alert('Please select at least one product for item discounts')
      return
    }
    
    // Validate: need at least one location
    if (selectedLocations.length === 0) {
      alert('Please select at least one location')
      return
    }
    
    try {
      let promoId: string
      
      if (editing) { 
        await supabase.from('promos').update(formData).eq('id', editing.id)
        promoId = editing.id
      } else { 
        const { data: company } = await supabase.from('companies').select('id').single()
        const { data: newPromo } = await supabase.from('promos').insert({ ...formData, company_id: company?.id }).select().single()
        promoId = newPromo.id
      }
      
      // Update promo_products for item discounts
      if (isItemDiscount) {
        await supabase.from('promo_products').delete().eq('promo_id', promoId)
        if (selectedProducts.length > 0) {
          const promoProducts = selectedProducts.map(productId => ({
            promo_id: promoId,
            product_id: productId
          }))
          await supabase.from('promo_products').insert(promoProducts)
        }
      } else {
        await supabase.from('promo_products').delete().eq('promo_id', promoId)
      }
      
      // Update promo_locations
      await supabase.from('promo_locations').delete().eq('promo_id', promoId)
      if (selectedLocations.length > 0) {
        const promoLocs = selectedLocations.map(locationId => ({
          promo_id: promoId,
          location_id: locationId
        }))
        await supabase.from('promo_locations').insert(promoLocs)
      }
      
      setShowModal(false)
      fetchPromos()
    } catch (error) { 
      console.error('Error:', error)
      alert('Error saving promo')
    }
  }

  async function toggleActive(promo: Promo) { await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id); fetchPromos() }

  function getStatus(promo: Promo) {
    const now = new Date(), start = new Date(promo.start_date), end = promo.end_date ? new Date(promo.end_date) : null
    if (!promo.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' }
    if (now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' }
    if (end && now > end) return { label: 'Expired', color: 'bg-red-100 text-red-700' }
    return { label: 'Active', color: 'bg-green-100 text-green-700' }
  }

  function getPromoTypeDisplay(type: PromoDiscountType, value: number) {
    switch (type) {
      case 'item_percentage': return { label: `${value}% off items`, color: 'bg-green-100 text-green-700', icon: '🏷️' }
      case 'item_fixed': return { label: `$${value} off items`, color: 'bg-green-100 text-green-700', icon: '🏷️' }
      case 'order_percentage': return { label: `${value}% off order`, color: 'bg-blue-100 text-blue-700', icon: '🛒' }
      case 'order_fixed': return { label: `$${value} off order`, color: 'bg-blue-100 text-blue-700', icon: '🛒' }
      case 'free_delivery': return { label: 'Free Delivery', color: 'bg-purple-100 text-purple-700', icon: '🚚' }
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: '❓' }
    }
  }

  const isItemDiscount = formData.discount_type === 'item_percentage' || formData.discount_type === 'item_fixed'
  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(productSearch.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Promotions & Discounts</h2>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Promo</button>
      </div>

      {promos.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No promotions yet. Create your first promo.</p>
      ) : (
        <div className="grid gap-4">
          {promos.map(promo => {
            const status = getStatus(promo)
            const typeDisplay = getPromoTypeDisplay(promo.discount_type, promo.discount_value)
            const productCount = promoProductCounts[promo.id] || 0
            const locationCount = promoLocationCounts[promo.id] || 0
            const isItemPromo = promo.discount_type === 'item_percentage' || promo.discount_type === 'item_fixed'
            return (
              <div key={promo.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">{promo.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                    <div className="flex gap-3 mt-2 items-center flex-wrap">
                      <span className={`text-sm px-2 py-0.5 rounded flex items-center gap-1 ${typeDisplay.color}`}>
                        <span>{typeDisplay.icon}</span>
                        {typeDisplay.label}
                      </span>
                      {isItemPromo && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {productCount} product{productCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                        📍 {locationCount === allLocations.length ? 'All locations' : `${locationCount} location${locationCount !== 1 ? 's' : ''}`}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(promo.start_date).toLocaleDateString()}{promo.end_date && ` - ${new Date(promo.end_date).toLocaleDateString()}`}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(promo)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm">Edit</button>
                    <button onClick={() => toggleActive(promo)} className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-lg text-sm">{promo.is_active ? 'Disable' : 'Enable'}</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Promo' : 'Add Promo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Promo Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="e.g., Summer Special, Happy Hour" required /></div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Promo Type *</label>
                <div className="space-y-2">
                  {/* Item Discounts with inline product selector */}
                  <div className={`border rounded-lg p-3 ${isItemDiscount ? 'border-green-400 bg-green-50' : ''}`}>
                    <p className="text-sm font-medium text-gray-700 mb-2">🏷️ Item Discount (applies to specific products)</p>
                    <div className="flex gap-2 mb-3">
                      <label className={`flex-1 flex items-center gap-2 p-2 border rounded cursor-pointer ${formData.discount_type === 'item_percentage' ? 'border-green-500 bg-green-100' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" name="discount_type" checked={formData.discount_type === 'item_percentage'} onChange={() => setFormData({ ...formData, discount_type: 'item_percentage' })} />
                        <span className="text-sm">% off items</span>
                      </label>
                      <label className={`flex-1 flex items-center gap-2 p-2 border rounded cursor-pointer ${formData.discount_type === 'item_fixed' ? 'border-green-500 bg-green-100' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" name="discount_type" checked={formData.discount_type === 'item_fixed'} onChange={() => setFormData({ ...formData, discount_type: 'item_fixed' })} />
                        <span className="text-sm">$ off items</span>
                      </label>
                    </div>
                    
                    {/* Inline Product Selector */}
                    {isItemDiscount && (
                      <div className="border-t border-green-200 pt-3 mt-2">
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          Select Products * ({selectedProducts.length} selected)
                        </label>
                        
                        <input 
                          type="text" 
                          placeholder="Search products..." 
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm"
                        />
                        
                        {selectedProducts.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {selectedProducts.slice(0, 5).map(productId => {
                              const product = allProducts.find(p => p.id === productId)
                              return product ? (
                                <span key={productId} className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                                  {product.name}
                                  <button type="button" onClick={() => setSelectedProducts(prev => prev.filter(id => id !== productId))} className="hover:text-green-200">×</button>
                                </span>
                              ) : null
                            })}
                            {selectedProducts.length > 5 && (
                              <span className="text-xs text-green-700">+{selectedProducts.length - 5} more</span>
                            )}
                          </div>
                        )}
                        
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                          {filteredProducts.length === 0 ? (
                            <p className="text-gray-500 text-center py-3 text-sm">No products found</p>
                          ) : (
                            filteredProducts.map(product => {
                              const isSelected = selectedProducts.includes(product.id)
                              return (
                                <div 
                                  key={product.id} 
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedProducts(prev => prev.filter(id => id !== product.id))
                                    } else {
                                      setSelectedProducts(prev => [...prev, product.id])
                                    }
                                  }}
                                  className={`flex items-center gap-2 p-2 cursor-pointer border-b last:border-b-0 text-sm ${isSelected ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                                >
                                  <input type="checkbox" checked={isSelected} readOnly className="rounded" />
                                  <span className="flex-1 truncate">{product.name}</span>
                                  <span className="text-xs text-gray-500">${product.base_price.toFixed(2)}</span>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Order Discounts */}
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">🛒 Order Discount (applies to total order)</p>
                    <div className="flex gap-2">
                      <label className={`flex-1 flex items-center gap-2 p-2 border rounded cursor-pointer ${formData.discount_type === 'order_percentage' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" name="discount_type" checked={formData.discount_type === 'order_percentage'} onChange={() => setFormData({ ...formData, discount_type: 'order_percentage' })} />
                        <span className="text-sm">% off order</span>
                      </label>
                      <label className={`flex-1 flex items-center gap-2 p-2 border rounded cursor-pointer ${formData.discount_type === 'order_fixed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <input type="radio" name="discount_type" checked={formData.discount_type === 'order_fixed'} onChange={() => setFormData({ ...formData, discount_type: 'order_fixed' })} />
                        <span className="text-sm">$ off order</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Free Delivery */}
                  <div className="border rounded-lg p-3">
                    <label className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${formData.discount_type === 'free_delivery' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                      <input type="radio" name="discount_type" checked={formData.discount_type === 'free_delivery'} onChange={() => setFormData({ ...formData, discount_type: 'free_delivery' })} />
                      <span className="text-sm">🚚 Free Delivery</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {formData.discount_type !== 'free_delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value {formData.discount_type.includes('percentage') ? '(%)' : '($)'}
                  </label>
                  <input type="number" min="0" step={formData.discount_type.includes('percentage') ? '1' : '0.01'} value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions for Operators</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} placeholder="Explain how operators should apply this promo..." />
                <p className="text-xs text-gray-500 mt-1">Shown to operators in Active Promos</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              </div>
              
              {/* Location Availability */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  📍 Location Availability * ({selectedLocations.length} of {allLocations.length} selected)
                </label>
                <p className="text-xs text-blue-600 mb-3">Select which locations this promo will be active at</p>
                
                <div className="flex gap-2 mb-3">
                  <button 
                    type="button" 
                    onClick={() => setSelectedLocations(allLocations.map(l => l.id))}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedLocations([])}
                    className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {allLocations.map(location => {
                    const isSelected = selectedLocations.includes(location.id)
                    return (
                      <label 
                        key={location.id}
                        className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white'}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedLocations(prev => prev.filter(id => id !== location.id))
                            } else {
                              setSelectedLocations(prev => [...prev, location.id])
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{location.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              
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
