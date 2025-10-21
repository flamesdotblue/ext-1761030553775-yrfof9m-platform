import { useMemo } from 'react';
import { useStore } from '../store';
import { IndianRupee, TrendingUp, Brain, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const sales = useStore((s) => s.data.Sales);
  const products = useStore((s) => s.data.Products);
  const inventory = useStore((s) => s.data.Inventory);
  const aiPred = useStore((s) => s.data.AI_Predictions);
  const predictAll = useStore((s) => s.predictAll);

  const today = new Date().toISOString().slice(0, 10);

  const { todaysSalesAmount, topJuice, lowStock } = useMemo(() => {
    let total = 0;
    const counts = {};
    sales.forEach((s) => {
      if (s.date?.startsWith(today)) {
        total += s.total || 0;
        counts[s.productId] = (counts[s.productId] || 0) + s.qty;
      }
    });
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topJuiceName = products.find((p) => p.id === topId)?.name || 'N/A';
    const low = inventory.filter((i) => i.qty <= (i.reorderLevel ?? 5));
    return { todaysSalesAmount: total, topJuice: topJuiceName, lowStock: low };
  }, [sales, products, inventory, today]);

  const lowPerf = useMemo(() => {
    const last7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const counts = {};
    sales.forEach((s) => {
      if (new Date(s.date) >= last7) counts[s.productId] = (counts[s.productId] || 0) + s.qty;
    });
    const entries = Object.entries(counts);
    if (!entries.length) return [];
    const sorted = entries.sort((a, b) => a[1] - b[1]).slice(0, 3).map(([id]) => products.find((p) => p.id === id)?.name || id);
    return sorted;
  }, [sales, products]);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card icon={<IndianRupee size={18} />} title="Today's Sales" value={`₹${todaysSalesAmount.toFixed(2)}`} />
        <Card icon={<TrendingUp size={18} />} title="Top Juice" value={topJuice} />
        <Card icon={<AlertTriangle size={18} />} title="Low Stock Items" value={`${lowStock.length}`} subtitle={lowStock.map(i => i.name).join(', ') || 'All good'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">AI Prediction Dashboard</h3>
            <button onClick={predictAll} className="text-sm px-3 py-1.5 rounded-full bg-slate-900 text-white">Run Predictions</button>
          </div>
          <div className="space-y-3">
            {aiPred.length === 0 && <div className="text-sm text-slate-500">No predictions yet. Click "Run Predictions"</div>}
            {aiPred.map((p) => (
              <div key={p.productId} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                <div className="font-medium">{p.productName}</div>
                <div className="text-sm text-slate-700">Tomorrow: {p.predictedQty} cups</div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{Math.round(p.confidence * 100)}% conf</div>
                <div className="text-xs text-slate-500">{p.comment}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Brain size={18} /><h3 className="font-semibold">AI Suggestions</h3></div>
          <AISuggestions />
          <div className="mt-4 text-xs text-slate-500">Pricing auto-updates when ingredient costs change significantly.</div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, value, subtitle }) {
  return (
    <div className="p-4 md:p-6 rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center gap-2 text-slate-600 mb-2">{icon}<span className="text-sm">{title}</span></div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{subtitle}</div>}
    </div>
  );
}

function AISuggestions() {
  const suggestions = useStore((s) => s.suggestions());
  return (
    <ul className="space-y-2 text-sm">
      {suggestions.map((s, i) => (
        <li key={i} className="p-2 rounded-lg bg-slate-50 border">{s}</li>
      ))}
      {suggestions.length === 0 && <li className="text-slate-500">No suggestions today.</li>}
    </ul>
  );
}
