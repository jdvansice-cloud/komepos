import { useEffect, useState } from 'react'
import { supabase } from '@komepos/supabase/client'

interface Category { id: string; name: string; description: string; image_url: string; sort_order: number; is_active: boolean }

export function CategoriesPage() {
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
    if (!confirm('Delete this category?')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold text-gray-800">Categories</h1><p className="text-gray-600">Organize your menu items</p></div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Category</button>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : (
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
      )}

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
