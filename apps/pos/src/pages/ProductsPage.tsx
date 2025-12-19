import { useEffect, useState } from 'react'
import { supabase } from '@komepos/supabase/client'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  is_taxable: boolean
  is_active: boolean
  has_options: boolean
  category_id: string
  category?: { name: string }
}

interface Category {
  id: string
  name: string
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [filter, setFilter] = useState('')
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, image_url: '', is_taxable: true, is_active: true, category_id: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(name)').order('name'),
        supabase.from('categories').select('id, name').order('name'),
      ])
      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditing(product)
      setFormData({ name: product.name, description: product.description || '', price: product.price, image_url: product.image_url || '', is_taxable: product.is_taxable, is_active: product.is_active, category_id: product.category_id })
    } else {
      setEditing(null)
      setFormData({ name: '', description: '', price: 0, image_url: '', is_taxable: true, is_active: true, category_id: categories[0]?.id || '' })
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
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function toggleActive(product: Product) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    fetchData()
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.category?.name?.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-600">Manage your menu items</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Product</button>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Search products..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2" />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
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
                  <td className="px-6 py-4 font-medium">${product.price.toFixed(2)}</td>
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
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://..." />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_taxable} onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })} className="rounded" /><span className="text-sm">Taxable</span></label>
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
