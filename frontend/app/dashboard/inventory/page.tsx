'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => { fetchItems() }, [filter])

  async function fetchItems() {
    let query = supabase.from('inventory').select('*').order('item_name')
    if (filter !== 'all') query = query.eq('category', filter)
    const { data } = await query
    setItems(data || [])
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from('inventory').insert({
      item_name: form.get('item_name'),
      category: form.get('category'),
      quantity: parseInt(form.get('quantity') as string),
      unit: form.get('unit') || 'pcs',
      min_threshold: parseInt(form.get('min_threshold') as string) || 5,
      expiry_date: form.get('expiry_date') || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Item added!')
    setShowForm(false)
    fetchItems()
  }

  async function updateQuantity(id: string, delta: number) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(0, item.quantity + delta)
    await supabase.from('inventory').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', id)
    fetchItems()
  }

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 text-slate-900">💊 Inventory</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
          + Add Item
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'medicine', 'equipment', 'supplies'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-slate-900' : 'bg-zinc-800 text-slate-500 hover:bg-zinc-700'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="item_name" placeholder="Item Name *" required className={inputClass} />
            <select name="category" required className={inputClass}>
              <option value="medicine">Medicine</option>
              <option value="equipment">Equipment</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input name="quantity" type="number" placeholder="Qty *" required min={0} className={inputClass} />
            <input name="unit" placeholder="Unit (pcs)" className={inputClass} />
            <input name="min_threshold" type="number" placeholder="Min Threshold" className={inputClass} />
          </div>
          <input name="expiry_date" type="date" className={inputClass} />
          <button type="submit" className="w-full py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">Save</button>
        </form>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`bg-white border rounded-xl p-4 flex items-center justify-between ${item.quantity <= item.min_threshold ? 'border-red-700' : 'border-slate-200'}`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-slate-900 font-medium">{item.item_name}</h3>
                {item.quantity <= item.min_threshold && <span className="text-xs bg-rose-600 text-white px-2 py-0.5 rounded-full">LOW</span>}
              </div>
              <p className="text-xs text-slate-500">{item.category} · {item.unit}
                {item.expiry_date && ` · Exp: ${new Date(item.expiry_date).toLocaleDateString('en-IN')}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-slate-900 rounded-lg font-bold">−</button>
              <span className="text-lg font-bold text-slate-900 w-10 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 text-slate-900 rounded-lg font-bold">+</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No items in inventory.</p>}
      </div>
    </div>
  )
}
