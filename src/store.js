import { create } from 'zustand';

// Basic in-memory store to mimic sheets in JuiceShop_App_Backend_With_WhatsApp.xlsx
// Sheets: Products, Inventory, Sales, Customers, Recipes, AI_Predictions, WhatsApp_Logs

const initialData = () => ({
  Products: [
    { id: 'P-MANGO', name: 'Mango Shake', price: 120, image: '', active: true },
    { id: 'P-ORANGE', name: 'Orange Juice', price: 90, image: '', active: true },
    { id: 'P-WATERMELON', name: 'Watermelon Juice', price: 80, image: '', active: true },
  ],
  Inventory: [
    { id: 'I-MANGO', name: 'Mango Pulp (100g)', qty: 50, reorderLevel: 10, unitCost: 15 },
    { id: 'I-ORANGE', name: 'Orange (1 pc)', qty: 80, reorderLevel: 15, unitCost: 6 },
    { id: 'I-WATERMELON', name: 'Watermelon (100g)', qty: 100, reorderLevel: 20, unitCost: 2 },
    { id: 'I-SUGAR', name: 'Sugar (10g)', qty: 300, reorderLevel: 60, unitCost: 0.8 },
    { id: 'I-ICE', name: 'Ice (1 cube)', qty: 500, reorderLevel: 100, unitCost: 0.05 },
    { id: 'I-CUP', name: 'Cup (1 pc)', qty: 200, reorderLevel: 50, unitCost: 2 },
  ],
  Recipes: [
    // productId, ingredientId, qty per 1 cup
    { productId: 'P-MANGO', ingredientId: 'I-MANGO', qty: 2 },
    { productId: 'P-MANGO', ingredientId: 'I-SUGAR', qty: 1 },
    { productId: 'P-MANGO', ingredientId: 'I-ICE', qty: 3 },
    { productId: 'P-MANGO', ingredientId: 'I-CUP', qty: 1 },

    { productId: 'P-ORANGE', ingredientId: 'I-ORANGE', qty: 3 },
    { productId: 'P-ORANGE', ingredientId: 'I-SUGAR', qty: 1 },
    { productId: 'P-ORANGE', ingredientId: 'I-ICE', qty: 3 },
    { productId: 'P-ORANGE', ingredientId: 'I-CUP', qty: 1 },

    { productId: 'P-WATERMELON', ingredientId: 'I-WATERMELON', qty: 3 },
    { productId: 'P-WATERMELON', ingredientId: 'I-ICE', qty: 3 },
    { productId: 'P-WATERMELON', ingredientId: 'I-CUP', qty: 1 },
  ],
  Sales: [],
  Customers: [
    { id: 'CUST-1', name: 'Walk-in', phone: '' },
  ],
  AI_Predictions: [],
  WhatsApp_Logs: [],
});

function formatINR(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

export const useStore = create((set, get) => ({
  role: 'Owner', // Owner or Salesperson
  data: initialData(),

  bootstrap: () => {
    // Could load from IndexedDB or remote sheet; for now, use defaults
  },

  scheduleDailySummary: () => {
    // Schedule a daily summary at 21:00 local time
    if (get()._timer) return;
    function schedule() {
      const now = new Date();
      const target = new Date();
      target.setHours(21, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target - now;
      const t = setTimeout(() => {
        get().sendDailySummary();
        schedule();
      }, delay);
      set({ _timer: t });
    }
    schedule();
  },

  updateInventory: (ingredientId, { qtyDelta = 0, unitCost }) => set((state) => {
    const Inventory = state.data.Inventory.map((i) => {
      if (i.id !== ingredientId) return i;
      const next = { ...i };
      if (qtyDelta) next.qty = Math.max(0, (next.qty || 0) + qtyDelta);
      if (typeof unitCost === 'number') next.unitCost = Math.max(0, unitCost);
      return next;
    });
    // dynamic pricing alert: when unitCost changed a lot, we can adjust prices
    return { data: { ...state.data, Inventory } };
  }),

  updateRecipe: (productId, ingredientId, qty) => set((state) => {
    const Recipes = state.data.Recipes.map((r) => (r.productId === productId && r.ingredientId === ingredientId ? { ...r, qty } : r));
    return { data: { ...state.data, Recipes } };
  }),

  updateProduct: (productId, patch) => set((state) => {
    const Products = state.data.Products.map((p) => (p.id === productId ? { ...p, ...patch } : p));
    return { data: { ...state.data, Products } };
  }),

  addSale: ({ productId, qty, paymentMode, customerPhone, sendWhatsApp }) => set((state) => {
    const p = state.data.Products.find((x) => x.id === productId);
    if (!p) return {};
    const recipes = state.data.Recipes.filter((r) => r.productId === productId);

    // Deduct inventory according to recipe
    const Inventory = state.data.Inventory.map((i) => ({ ...i }));
    for (const r of recipes) {
      const inv = Inventory.find((i) => i.id === r.ingredientId);
      if (inv) inv.qty = Math.max(0, inv.qty - r.qty * qty);
    }

    const total = (p.price || 0) * qty;
    const sale = {
      id: `S-${Date.now()}`,
      date: new Date().toISOString(),
      productId,
      qty,
      paymentMode,
      total,
      customerPhone: customerPhone || '',
    };

    // WhatsApp Bill
    const logs = [...state.data.WhatsApp_Logs];
    if (sendWhatsApp && customerPhone) {
      const message = `Thanks for visiting! Your total: ${formatINR(total)}.`;
      logs.push({ timestamp: Date.now(), to: customerPhone, template: 'Customer Bill', message, status: 'SENT' });
    }

    return {
      data: {
        ...state.data,
        Sales: [...state.data.Sales, sale],
        Inventory,
        WhatsApp_Logs: logs,
      },
    };
  }),

  predictAll: () => set((state) => {
    const Sales = state.data.Sales;
    const Products = state.data.Products;
    const AI_Predictions = Products.map((p) => {
      // Simple moving average over last 14 days, adjust by weather factor
      const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000);
      const series = Sales.filter((s) => s.productId === p.id && new Date(s.date) >= cutoff).map((s) => s.qty);
      const avg = series.length ? series.reduce((a, b) => a + b, 0) / series.length : 8; // default base demand
      const weather = mockWeatherFactor();
      const predictedQty = Math.max(0, Math.round(avg * weather));
      const confidence = Math.min(0.95, 0.5 + series.length / 40);
      const comment = weather > 1 ? 'Hot day expected, higher demand' : weather < 1 ? 'Cooler day, lower demand' : 'Neutral weather';
      return { productId: p.id, productName: p.name, predictedQty, confidence, comment };
    });
    return { data: { ...state.data, AI_Predictions } };
  }),

  suggestions: () => {
    const { Inventory, Products, AI_Predictions, Recipes } = get().data;
    const tips = [];

    // Restock suggestions
    Inventory.forEach((i) => {
      if (i.qty <= (i.reorderLevel ?? 5)) tips.push(`Low stock: ${i.name}. Consider restocking to ${Math.max(i.reorderLevel * 2, 20)}.`);
    });

    // Pricing suggestions based on cost changes
    Products.forEach((p) => {
      const cost = Recipes.filter((r) => r.productId === p.id).reduce((sum, r) => {
        const ing = Inventory.find((i) => i.id === r.ingredientId);
        return sum + (ing ? (ing.unitCost || 0) * r.qty : 0);
      }, 0);
      const margin = p.price - cost;
      const marginPct = cost ? (margin / cost) * 100 : 0;
      if (marginPct < 20) tips.push(`${p.name} margin low (${marginPct.toFixed(0)}%). Consider raising price to ${formatINR(cost * 1.3)}.`);
      if (marginPct > 60) tips.push(`${p.name} margin high (${marginPct.toFixed(0)}%). You can run a promo.`);
    });

    // Demand suggestions
    if (AI_Predictions.length) {
      const top = [...AI_Predictions].sort((a, b) => b.predictedQty - a.predictedQty)[0];
      const low = [...AI_Predictions].sort((a, b) => a.predictedQty - b.predictedQty)[0];
      if (top) tips.push(`Prepare more for ${top.productName}: forecast ${top.predictedQty} cups.`);
      if (low) tips.push(`Consider cross-selling ${low.productName}: only ${low.predictedQty} cups predicted.`);
    }

    return tips;
  },

  sendDailySummary: () => set((state) => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysSales = state.data.Sales.filter((s) => s.date?.startsWith(today));
    const amount = todaysSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const counts = {};
    todaysSales.forEach((s) => (counts[s.productId] = (counts[s.productId] || 0) + s.qty));
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topJuice = state.data.Products.find((p) => p.id === topId)?.name || 'N/A';
    const message = `Today’s Sales: ${formatINR(amount)}. Top Juice: ${topJuice}.`;
    const logs = [...state.data.WhatsApp_Logs, { timestamp: Date.now(), to: 'OWNER', template: 'Daily Summary', message, status: 'SENT' }];
    return { data: { ...state.data, WhatsApp_Logs: logs } };
  }),
}));

function mockWeatherFactor() {
  // 0.85 cool, 1 neutral, 1.2 hot; vary by time of year slightly
  const m = new Date().getMonth();
  const base = (m >= 3 && m <= 6) ? 1.15 : (m >= 10 || m <= 1) ? 0.93 : 1.0;
  const jitter = 0.95 + Math.random() * 0.1;
  return Math.round(base * jitter * 100) / 100;
}
