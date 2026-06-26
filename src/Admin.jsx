import { useState, useRef, useEffect } from "react";

const API = "https://kamico-backend-production.up.railway.app";

// ─── API helper ──────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem("kamico_admin_token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

// ─── TOKENS ──────────────────────────────────────────────
const C = {
  primary:       "#CC1F1F",
  primaryLight:  "#FFF0F0",
  primaryBorder: "#F5CCCC",
  bg:            "#F8F8F8",
  white:         "#FFFFFF",
  text:          "#111111",
  textSub:       "#555555",
  textMuted:     "#999999",
  border:        "#E8E8E8",
  borderStrong:  "#CCCCCC",
  success:       "#1A6B3C",
  warning:       "#8A5200",
  error:         "#CC1F1F",
};

const fmt = (n) => Number(n).toLocaleString("ru-RU");

const STATUS_CONFIG = {
  new:        { label: "Новый заказ",  color: "#CC1F1F", bg: "#FFF0F0", next: "processing" },
  processing: { label: "Собирается",   color: "#8A5200", bg: "#FFF8E6", next: "delivery"   },
  delivery:   { label: "В пути",       color: "#1D4ED8", bg: "#EFF6FF", next: "completed"  },
  completed:  { label: "Доставлен",    color: "#1A6B3C", bg: "#ECFDF5", next: null         },
  cancelled:  { label: "Отменён",      color: "#555555", bg: "#F5F5F5", next: null         },
};

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${C.primaryBorder}`, borderTop: `2px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: "3px 9px", borderRadius: 4, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>;
}

const smallBtn = (color) => ({ fontSize: 11, padding: "4px 10px", borderRadius: 7, border: `1.5px solid ${color}20`, background: color + "10", color, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" });

// ─── LOGIN ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [phone, setPhone]     = useState("");
  const [pass, setPass]       = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const data = await request("/api/auth/login", { method: "POST", body: { phone, password: pass } });
      if (data.user?.role !== "admin") {
        setErr("У вас нет прав администратора.");
        return;
      }
      localStorage.setItem("kamico_admin_token", data.token);
      onLogin(data.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <img src="https://giyuowciomkfcqlxlkrt.supabase.co/storage/v1/object/public/kamico.store/IMG_5208.JPG" alt="Kamico" style={{ height: 40, width: "auto", objectFit: "contain" }} />
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              <span style={{ color: C.primary, fontStyle: "italic" }}>Kamico</span>
              <span style={{ color: "white", fontWeight: 900 }}> store</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#6A6A6A" }}>Панель управления</div>
        </div>
        <div style={{ background: "#2A2A2A", borderRadius: 12, padding: 22, border: "1px solid #333" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 18 }}>Вход для администратора</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#6A6A6A", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Телефон</label>
            <input value={phone} onChange={e => { setPhone(e.target.value); setErr(""); }} placeholder="+998000000000"
              style={{ width: "100%", padding: "10px 13px", borderRadius: 6, border: "1px solid #444", background: "#333", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: err ? 10 : 18 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: "#6A6A6A", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Пароль</label>
            <input value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} type="password" placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 6, border: `1px solid ${err ? C.error : "#444"}`, background: "#333", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          {err && <div style={{ fontSize: 12, color: C.error, marginBottom: 12 }}>{err}</div>}
          <button onClick={submit} disabled={loading}
            style={{ width: "100%", padding: 11, borderRadius: 6, border: "none", background: loading ? "#555" : C.primary, color: "white", fontWeight: 600, fontSize: 14, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Загрузка..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────
function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      request("/api/admin/stats"),
      request("/api/admin/orders?limit=5"),
    ]).then(([s, o]) => {
      setStats(s.data);
      setOrders(o.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats)  return <div style={{ color: C.error, fontSize: 13 }}>Ошибка загрузки</div>;

  const statCards = [
    { label: "Выручка", value: `${fmt(stats.totalRevenue)} сум`, icon: "💰", color: C.primary },
    { label: "Новых заказов", value: stats.newOrders, icon: "🆕", color: C.warning },
    { label: "Сегодня", value: stats.todayOrders, icon: "📦", color: "#1D4ED8" },
    { label: "Мало на складе", value: stats.lowStock, icon: "⚠️", color: C.error },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.textMuted, fontWeight: 600, marginBottom: 14 }}>Дашборд</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {statCards.map((st, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 8, padding: 13, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{st.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: st.color, lineHeight: 1.2 }}>{st.value}</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, textTransform: "uppercase", letterSpacing: .4 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Status chart */}
      <div style={{ background: C.white, borderRadius: 8, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.textMuted, fontWeight: 600, marginBottom: 12 }}>Заказы по статусам</div>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = stats.byStatus?.[key] || 0;
          const pct = stats.totalOrders ? Math.round(count / stats.totalOrders * 100) : 0;
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.textSub }}>{cfg.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{count}</span>
              </div>
              <div style={{ height: 4, background: C.bg, borderRadius: 2 }}>
                <div style={{ height: 4, background: cfg.color, borderRadius: 2, width: `${pct}%`, transition: "width .5s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div style={{ background: C.white, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.textMuted, fontWeight: 600, marginBottom: 12 }}>Последние заказы</div>
        {orders.map(o => (
          <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{o.client_name}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>#{o.id} · {new Date(o.created_at).toLocaleDateString("ru-RU")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 3 }}>{fmt(o.total_price)} сум</div>
              <StatusBadge status={o.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ORDERS PANEL ────────────────────────────────────────
function OrdersPanel() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (filter !== "all") params.append("status", filter);
    if (search) params.append("search", search);
    request(`/api/admin/orders?${params}`)
      .then(d => setOrders(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [filter, search]);

  const advance = async (id, nextStatus) => {
    setUpdating(true);
    try {
      await request(`/api/orders/${id}/status`, { method: "PATCH", body: { status: nextStatus } });
      setOrders(os => os.map(o => o.id === id ? { ...o, status: nextStatus } : o));
      if (selected?.id === id) setSelected(s => ({ ...s, status: nextStatus }));
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Назад</button>
      <div style={{ background: C.white, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Заказ #{selected.id}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(selected.created_at).toLocaleDateString("ru-RU")}</div>
          </div>
          <StatusBadge status={selected.status} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { label: "Клиент",  val: selected.client_name },
            { label: "Телефон", val: selected.phone },
            { label: "Оплата",  val: selected.payment === "cash" ? "💵 Наличные" : "💳 Карта" },
            { label: "Дата",    val: new Date(selected.created_at).toLocaleDateString("ru-RU") },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: C.bg, borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ background: C.bg, borderRadius: 9, padding: "8px 10px", marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: .4, marginBottom: 2 }}>Адрес доставки</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>📍 {selected.delivery_address}</div>
        </div>
        {selected.comment && (
          <div style={{ background: "#fffbeb", borderRadius: 9, padding: "8px 10px", marginBottom: 10, border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 11, color: "#92400e" }}>💬 {selected.comment}</div>
          </div>
        )}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>СОСТАВ ЗАКАЗА</div>
          {(selected.order_items || []).map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: C.textSub }}>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: 700, color: C.text }}>{fmt(item.price * item.quantity)} сум</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, borderTop: `1px dashed ${C.border}`, paddingTop: 8, marginTop: 6 }}>
            <span>Итого</span><span style={{ color: C.primary }}>{fmt(selected.total_price)} сум</span>
          </div>
        </div>
      </div>

      {/* Status tracker */}
      <div style={{ background: C.white, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>Статус доставки</div>
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "cancelled").map(([key, cfg], i, arr) => {
          const keys = arr.map(([k]) => k);
          const currentIdx = keys.indexOf(selected.status);
          const thisIdx = keys.indexOf(key);
          const done = thisIdx <= currentIdx;
          const active = key === selected.status;
          return (
            <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? `linear-gradient(135deg,${C.primary},${C.accent})` : C.bg, border: `2px solid ${done ? C.primary : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {done && <span style={{ fontSize: 11, color: "white" }}>✓</span>}
                </div>
                {i < arr.length - 1 && <div style={{ width: 2, height: 20, background: thisIdx < currentIdx ? C.primary : C.border, margin: "3px 0" }} />}
              </div>
              <div style={{ paddingTop: 2, paddingBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: done ? C.text : C.textMuted }}>{cfg.label}</div>
                {active && <span style={{ fontSize: 10, background: C.primaryLight, color: C.primary, padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>Текущий</span>}
              </div>
            </div>
          );
        })}
      </div>

      {STATUS_CONFIG[selected.status]?.next && (
        <button onClick={() => advance(selected.id, STATUS_CONFIG[selected.status].next)} disabled={updating}
          style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: "white", fontWeight: 800, fontSize: 14, cursor: updating ? "default" : "pointer", opacity: updating ? .7 : 1 }}>
          {updating ? "Обновляем..." : `Перевести → ${STATUS_CONFIG[STATUS_CONFIG[selected.status].next]?.label}`}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 12 }}>📦 Заказы</div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Поиск по клиенту или телефону..."
        style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 12, outline: "none", background: C.bg, boxSizing: "border-box", fontFamily: "inherit", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {[["all","Все"], ...Object.entries(STATUS_CONFIG).map(([k,v]) => [k, v.label])].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${filter===k ? C.primary : C.border}`, background: filter===k ? C.primaryLight : C.white, color: filter===k ? C.primary : C.textSub, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      {loading ? <Spinner /> : orders.length === 0
        ? <div style={{ textAlign: "center", padding: 30, color: C.textMuted, fontSize: 13 }}>Заказов нет</div>
        : orders.map(o => (
          <div key={o.id} onClick={() => setSelected(o)} style={{ background: C.white, borderRadius: 12, padding: "11px 13px", marginBottom: 8, border: `1px solid ${C.border}`, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>#{o.id} · {o.client_name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{o.phone} · {new Date(o.created_at).toLocaleDateString("ru-RU")}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: C.textSub }}>📍 {o.delivery_address}</div>
              <div style={{ fontWeight: 800, color: C.primary, fontSize: 13 }}>{fmt(o.total_price)} сум</div>
            </div>
            {o.comment && <div style={{ fontSize: 10, color: "#92400e", background: "#fffbeb", padding: "3px 8px", borderRadius: 7, marginTop: 5, display: "inline-block" }}>💬 {o.comment}</div>}
          </div>
        ))
      }
    </div>
  );
}

// ─── PRODUCTS PANEL ──────────────────────────────────────
function ProductsPanel() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState(0);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef();

  const emptyForm = { name: "", description: "", price: "", old_price: "", stock: "", category_id: "", badge: "", image_url: "", brand: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([
      request("/api/products?limit=100"),
      request("/api/categories"),
    ]).then(([p, c]) => {
      setProducts(p.data || []);
      setCategories(c.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const visible = products.filter(p => {
    const mc = !catFilter || p.category_id === catFilter;
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const openNew  = () => { setForm(emptyForm); setEditing("new"); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || "", price: p.price, old_price: p.old_price || "", stock: p.stock, category_id: p.category_id || "", badge: p.badge || "", image_url: p.image_url || "", brand: p.brand || "" });
    setEditing(p);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, image_url: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price), old_price: form.old_price ? Number(form.old_price) : null, stock: Number(form.stock) || 0, category_id: form.category_id ? Number(form.category_id) : null, badge: form.badge || null };
      if (editing === "new") {
        const data = await request("/api/products", { method: "POST", body });
        setProducts(ps => [...ps, data.data]);
      } else {
        const data = await request(`/api/products/${editing.id}`, { method: "PUT", body });
        setProducts(ps => ps.map(p => p.id === editing.id ? data.data : p));
      }
      setEditing(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Удалить товар?")) return;
    try {
      await request(`/api/products/${id}`, { method: "DELETE" });
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const inp = { width: "100%", padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 12, outline: "none", background: C.bg, boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { fontSize: 11, fontWeight: 600, color: C.textSub, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: .4 };

  if (editing !== null) return (
    <div>
      <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: C.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Назад</button>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>{editing === "new" ? "Новый товар" : "Редактировать товар"}</div>

      {/* Photo */}
      <div style={{ background: C.white, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <label style={lbl}>Фото товара</label>
        {form.image_url ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={form.image_url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: `2px solid ${C.border}` }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button onClick={() => fileRef.current.click()} style={smallBtn(C.primary)}>✏️ Изменить</button>
              <button onClick={() => setForm(f => ({ ...f, image_url: "" }))} style={smallBtn(C.error)}>✕ Удалить</button>
            </div>
          </div>
        ) : (
          <div onClick={() => fileRef.current.click()} style={{ width: 72, height: 72, borderRadius: 10, border: `2px dashed ${C.border}`, background: C.primaryLight, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 3 }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <span style={{ fontSize: 9, color: C.primary, fontWeight: 700 }}>Добавить</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
      </div>

      {/* Fields */}
      <div style={{ background: C.white, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Название *</label>
          <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название товара" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Описание</label>
          <textarea style={{ ...inp, height: 60, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание товара..." />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Бренд</label>
          <input style={inp} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Kamico" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl}>Цена (сум) *</label>
            <input style={inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="85000" />
          </div>
          <div>
            <label style={lbl}>Старая цена</label>
            <input style={inp} type="number" value={form.old_price} onChange={e => setForm(f => ({ ...f, old_price: e.target.value }))} placeholder="110000" />
          </div>
          <div>
            <label style={lbl}>В наличии</label>
            <input style={inp} type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
          </div>
          <div>
            <label style={lbl}>Значок</label>
            <select style={inp} value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
              <option value="">Нет</option>
              {["Хит","Новинка","Скидка"].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={lbl}>Категория</label>
          <select style={inp} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">Без категории</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: "white", fontWeight: 800, fontSize: 14, cursor: saving ? "default" : "pointer", opacity: saving ? .7 : 1 }}>
          {saving ? "Сохраняем..." : editing === "new" ? "Добавить товар" : "Сохранить"}
        </button>
        <button onClick={() => setEditing(null)} style={{ padding: "13px 18px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.textSub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Отмена</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>🛍️ Товары</div>
        <button onClick={openNew} style={{ padding: "7px 16px", borderRadius: 20, border: "none", background: `linear-gradient(135deg,${C.primary},${C.accent})`, color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", boxShadow: `0 2px 10px ${C.primary}44` }}>+ Добавить</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Поиск товара..."
        style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 12, outline: "none", background: C.bg, boxSizing: "border-box", fontFamily: "inherit", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => setCatFilter(0)} style={{ padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${!catFilter ? C.primary : C.border}`, background: !catFilter ? C.primaryLight : C.white, color: !catFilter ? C.primary : C.textSub, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Все</button>
        {categories.map(c => <button key={c.id} onClick={() => setCatFilter(catFilter === c.id ? 0 : c.id)} style={{ padding: "4px 11px", borderRadius: 20, border: `1.5px solid ${catFilter===c.id ? C.primary : C.border}`, background: catFilter===c.id ? C.primaryLight : C.white, color: catFilter===c.id ? C.primary : C.textSub, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>{c.name}</button>)}
      </div>
      {loading ? <Spinner /> : visible.map(p => (
        <div key={p.id} style={{ background: C.white, borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: `1px solid ${p.stock <= 5 ? "#fecdd3" : C.border}`, display: "flex", gap: 10, alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, overflow: "hidden" }}>
            {p.image_url ? <img src={p.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : "✨"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{categories.find(c => c.id === p.category_id)?.name || "—"} · {p.stock <= 5 ? <span style={{ color: C.error, fontWeight: 700 }}>⚠️ {p.stock} шт.</span> : `${p.stock} шт.`}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontWeight: 800, color: C.primary, fontSize: 13 }}>{fmt(p.price)}</div>
            {p.old_price && <div style={{ fontSize: 10, color: C.textMuted, textDecoration: "line-through" }}>{fmt(p.old_price)}</div>}
            <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
              <button onClick={() => openEdit(p)} style={smallBtn(C.primary)}>✏️</button>
              <button onClick={() => del(p.id)}   style={smallBtn(C.error)}>🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────
export default function AdminApp() {
  const [user, setUser]   = useState(null);
  const [tab, setTab]     = useState("dashboard");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kamico_admin_token");
    if (!token) { setChecking(false); return; }
    request("/api/auth/me").then(d => {
      if (d.role === "admin") setUser(d.admin);
    }).catch(() => {
      localStorage.removeItem("kamico_admin_token");
    }).finally(() => setChecking(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("kamico_admin_token");
    setUser(null);
  };

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#16111E" }}>
      <div style={{ width: 32, height: 32, border: "3px solid rgba(155,31,232,.3)", borderTop: `3px solid ${C.primary}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser} />;

  const navItems = [
    { id:"dashboard", icon:"📊", label:"Дашборд" },
    { id:"orders",    icon:"📦", label:"Заказы"  },
    { id:"products",  icon:"🛍️", label:"Товары"  },
  ];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: `1px solid ${C.border}`, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="https://giyuowciomkfcqlxlkrt.supabase.co/storage/v1/object/public/kamico.store/IMG_5208.JPG" alt="Kamico" style={{ height: 28, width: "auto", objectFit: "contain" }} />
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
            <span style={{ color: C.primary, fontStyle: "italic" }}>Kamico</span>
            <span style={{ color: C.text, fontWeight: 900 }}> store</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>Администратор</span>
          <button onClick={logout} style={{ fontSize: 12, color: C.error, background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Выйти</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 14 }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "orders"    && <OrdersPanel />}
        {tab === "products"  && <ProductsPanel />}
      </div>

      {/* Bottom nav — clean white */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "white", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 200 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 4px 11px", border: "none", background: "none", cursor: "pointer", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: tab === n.id ? C.primary : "transparent", borderRadius: "0 0 2px 2px" }} />
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === n.id ? 600 : 400, color: tab === n.id ? C.primary : C.textMuted }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
