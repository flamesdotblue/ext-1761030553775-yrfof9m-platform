import { useMemo, useState } from 'react';
import { useStore } from '../store';

const tabs = ['Inventory', 'Recipes', 'WhatsApp Logs'];

export default function ManagementPanel() {
  const [tab, setTab] = useState(tabs[0]);
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full border ${tab===t? 'bg-slate-900 text-white':'bg-white'}`}>{t}</button>
        ))}
      </div>
      {tab === 'Inventory' && <InventoryTab />}
      {tab === 'Recipes' && <RecipesTab />}
      {tab === 'WhatsApp Logs' && <WhatsAppTab />}
    </div>
  );
}

function InventoryTab(){
  const inventory = useStore((s)=>s.data.Inventory);
  const updateInventory = useStore((s)=>s.updateInventory);
  const [incoming, setIncoming] = useState({});
  const low = useMemo(()=>inventory.filter(i=>i.qty <= (i.reorderLevel ?? 5)),[inventory]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Current Stock</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500"><th className="py-2">Ingredient</th><th>Qty</th><th>Reorder</th><th>Unit Cost</th></tr>
          </thead>
          <tbody>
            {inventory.map(i=> (
              <tr key={i.id} className="border-t">
                <td className="py-2">{i.name}</td>
                <td>{i.qty}</td>
                <td>{i.reorderLevel}</td>
                <td>₹{(i.unitCost||0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-xs text-slate-500">Low stock: {low.map(i=>i.name).join(', ')||'None'}</div>
      </div>
      <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Add Purchase Stock</h3>
        <div className="space-y-3">
          {inventory.map(i=> (
            <div key={i.id} className="flex items-center gap-2">
              <div className="w-36 text-sm">{i.name}</div>
              <input type="number" min="0" value={incoming[i.id]||''} onChange={(e)=>setIncoming(prev=>({...prev, [i.id]: e.target.value}))} placeholder="Qty" className="w-24 rounded-lg border px-2 py-1" />
              <input type="number" min="0" step="0.01" value={i.unitCost} onChange={(e)=>updateInventory(i.id, { unitCost: parseFloat(e.target.value||'0') })} placeholder="Unit Cost" className="w-28 rounded-lg border px-2 py-1" />
            </div>
          ))}
          <button onClick={()=>{
            Object.entries(incoming).forEach(([id, q])=>{
              const qty = parseFloat(q||'0');
              if (qty>0) updateInventory(id, { qtyDelta: qty });
            });
            setIncoming({});
          }} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Update Stock</button>
        </div>
      </div>
    </div>
  );
}

function RecipesTab(){
  const products = useStore((s)=>s.data.Products);
  const recipes = useStore((s)=>s.data.Recipes);
  const inventory = useStore((s)=>s.data.Inventory);
  const updateRecipe = useStore((s)=>s.updateRecipe);
  const updateProduct = useStore((s)=>s.updateProduct);

  const costForProduct = (productId) => {
    const lines = recipes.filter(r=>r.productId===productId);
    return lines.reduce((sum, r)=>{
      const ing = inventory.find(i=>i.id===r.ingredientId);
      return sum + (ing ? (ing.unitCost || 0) * r.qty : 0);
    }, 0);
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
      <h3 className="font-semibold mb-3">Recipes & Dynamic Pricing</h3>
      <div className="space-y-6">
        {products.map(p=>{
          const lines = recipes.filter(r=>r.productId===p.id);
          const cost = costForProduct(p.id);
          return (
            <div key={p.id} className="border rounded-xl p-3 bg-slate-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm">Cost: ₹{cost.toFixed(2)} • Selling: ₹{p.price.toFixed(2)}</div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {lines.map(line=> (
                  <div key={line.ingredientId} className="flex items-center gap-2">
                    <div className="w-40 text-sm">{inventory.find(i=>i.id===line.ingredientId)?.name}</div>
                    <input type="number" min="0" step="0.1" value={line.qty} onChange={(e)=>updateRecipe(p.id, line.ingredientId, parseFloat(e.target.value||'0'))} className="w-28 rounded-lg border px-2 py-1" />
                    <div className="text-xs text-slate-500">unit cost ₹{(inventory.find(i=>i.id===line.ingredientId)?.unitCost||0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-sm text-slate-600">Markup %</label>
                <input type="number" min="0" step="1" value={Math.round(((p.price||0)/Math.max(0.01,cost)-1)*100)} onChange={(e)=>{
                  const percent = parseFloat(e.target.value||'0');
                  const newPrice = cost * (1 + percent/100);
                  updateProduct(p.id, { price: Math.round(newPrice*100)/100 });
                }} className="w-24 rounded-lg border px-2 py-1" />
                <button onClick={()=>{
                  // Auto update price if any ingredient cost changed significantly
                  const newPrice = cost * 1.3; // default 30% markup
                  updateProduct(p.id, { price: Math.round(newPrice*100)/100 });
                }} className="px-3 py-1.5 rounded-lg border bg-white">Auto 30% Markup</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WhatsAppTab(){
  const logs = useStore((s)=>s.data.WhatsApp_Logs);
  return (
    <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
      <h3 className="font-semibold mb-3">Sent Messages Log</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500"><th className="py-2">Time</th><th>To</th><th>Type</th><th>Message</th><th>Status</th></tr>
        </thead>
        <tbody>
          {logs.slice().reverse().map((l, idx)=> (
            <tr key={idx} className="border-t">
              <td className="py-2">{new Date(l.timestamp).toLocaleString()}</td>
              <td>{l.to}</td>
              <td>{l.template}</td>
              <td className="max-w-[400px] truncate" title={l.message}>{l.message}</td>
              <td>{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
