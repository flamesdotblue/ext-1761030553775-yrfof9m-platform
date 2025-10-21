import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { IndianRupee, Send } from 'lucide-react';

export default function POS() {
  const products = useStore((s) => s.data.Products);
  const inventory = useStore((s) => s.data.Inventory);
  const customers = useStore((s) => s.data.Customers);
  const recipes = useStore((s) => s.data.Recipes);
  const addSale = useStore((s) => s.addSale);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState('Cash');
  const [customerPhone, setCustomerPhone] = useState('');

  const visible = useMemo(() => products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())), [products, query]);

  const stockAvailable = (productId) => {
    const recipe = recipes.filter(r => r.productId === productId);
    if (!recipe.length) return 0;
    // compute min possible cups based on limiting ingredient
    let minCups = Infinity;
    for (const r of recipe) {
      const inv = inventory.find(i => i.id === r.ingredientId);
      if (!inv) return 0;
      const possible = Math.floor(inv.qty / r.qty);
      minCups = Math.min(minCups, possible);
    }
    return Number.isFinite(minCups) ? minCups : 0;
  };

  const total = selected ? (selected.price || 0) * qty : 0;

  const handleSale = () => {
    if (!selected) return;
    addSale({
      productId: selected.id,
      qty,
      paymentMode: payment,
      customerPhone,
      sendWhatsApp: Boolean(customerPhone),
    });
    setQty(1);
    setCustomerPhone('');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search juice..." className="w-full rounded-xl border px-3 py-2" />
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(p => (
            <button key={p.id} onClick={()=>setSelected(p)} className={`text-left p-3 rounded-xl border bg-slate-50 hover:bg-white transition ${selected?.id===p.id?'ring-2 ring-slate-900':''}`}>
              <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 mb-2" />
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-600">₹{p.price.toFixed(2)} • Stock: {stockAvailable(p.id)}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Checkout</h3>
        {selected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-slate-600">Item</span><span className="font-medium">{selected.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-600">Price</span><span className="font-medium">₹{selected.price.toFixed(2)}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Qty</span>
              <div className="flex items-center gap-2">
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} className="px-2 py-1 rounded-lg border">-</button>
                <input value={qty} onChange={(e)=>setQty(Math.max(1, parseInt(e.target.value||'1')))} className="w-16 text-center rounded-lg border px-2 py-1" />
                <button onClick={()=>setQty(q=>q+1)} className="px-2 py-1 rounded-lg border">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between"><span className="text-slate-600">Payment</span>
              <select value={payment} onChange={(e)=>setPayment(e.target.value)} className="rounded-lg border px-3 py-1">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Customer WhatsApp</label>
              <input value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} placeholder="e.g. +91XXXXXXXXXX" className="w-full rounded-lg border px-3 py-2" />
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-xl font-semibold"><IndianRupee size={18}/> {total.toFixed(2)}</div>
              <button onClick={handleSale} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl"><Send size={16}/> Complete & WhatsApp Bill</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Select an item from the left.</div>
        )}
      </div>
    </div>
  );
}
