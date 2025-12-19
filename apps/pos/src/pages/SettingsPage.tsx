import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type TabType = 'company' | 'locations' | 'users'
type UserRole = 'admin' | 'supervisor' | 'operator'

interface Company { id: string; name: string; ruc: string; dv: string; itbms_rate: number; address: string; phone: string; email: string }
interface Location { id: string; name: string; address: string; phone: string; is_active: boolean; opening_hours: string; accepts_delivery: boolean; delivery_fee: number }
interface LocationOption { id: string; name: string }
interface User { id: string; full_name: string; email: string; role: UserRole; location_id: string | null; is_active: boolean; location?: { name: string } }

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('company')

  const tabs = [
    { id: 'company' as TabType, label: 'Company', icon: '🏢' },
    { id: 'locations' as TabType, label: 'Locations', icon: '📍' },
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
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', is_active: true, opening_hours: '', accepts_delivery: true, delivery_fee: 3.00 })

  useEffect(() => { fetchLocations() }, [])

  async function fetchLocations() {
    try { const { data } = await supabase.from('locations').select('*').order('name'); setLocations(data || []) }
    catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(location?: Location) {
    if (location) { setEditing(location); setFormData({ name: location.name, address: location.address || '', phone: location.phone || '', is_active: location.is_active, opening_hours: location.opening_hours || '', accepts_delivery: location.accepts_delivery, delivery_fee: location.delivery_fee || 3.00 }) }
    else { setEditing(null); setFormData({ name: '', address: '', phone: '', is_active: true, opening_hours: '', accepts_delivery: true, delivery_fee: 3.00 }) }
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
                  {location.accepts_delivery && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Delivery: ${location.delivery_fee?.toFixed(2)}</span>}
                  {location.opening_hours && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{location.opening_hours}</span>}
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
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label><input type="text" value={formData.opening_hours} onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })} placeholder="Mon-Fri 9am-9pm" className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.accepts_delivery} onChange={(e) => setFormData({ ...formData, accepts_delivery: e.target.checked })} className="rounded" /><span className="text-sm">Accepts Delivery</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" /><span className="text-sm">Active</span></label>
              </div>
              {formData.accepts_delivery && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee ($)</label><input type="number" step="0.01" min="0" value={formData.delivery_fee} onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
              )}
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
function UsersSettings() {
  const [users, setUsers] = useState<User[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [formData, setFormData] = useState<{ full_name: string; email: string; role: UserRole; location_id: string; is_active: boolean }>({ full_name: '', email: '', role: 'operator', location_id: '', is_active: true })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [usersRes, locationsRes] = await Promise.all([
        supabase.from('users').select('*, location:locations(name)').order('full_name'),
        supabase.from('locations').select('id, name').order('name'),
      ])
      setUsers(usersRes.data || []); setLocations(locationsRes.data || [])
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  function openModal(user?: User) {
    if (user) { setEditing(user); setFormData({ full_name: user.full_name, email: user.email, role: user.role, location_id: user.location_id || '', is_active: user.is_active }) }
    else { setEditing(null); setFormData({ full_name: '', email: '', role: 'operator', location_id: '', is_active: true }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) { await supabase.from('users').update({ full_name: formData.full_name, role: formData.role, location_id: formData.location_id || null, is_active: formData.is_active }).eq('id', editing.id) }
      else { alert('Create users via Supabase Dashboard → Authentication'); return }
      setShowModal(false); fetchData()
    } catch (error) { console.error('Error:', error) }
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{user.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[user.role]}`}>{user.role}</span></td>
                <td className="px-6 py-4 text-gray-600">{user.location?.name || 'All Locations'}</td>
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" disabled={!!editing} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role *</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="operator">Operator</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2"><option value="">All Locations</option>{locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}</select></div>
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
