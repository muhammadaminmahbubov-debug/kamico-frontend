import { useState, useRef, useEffect } from "react";

const API = "https://kamico-backend-production.up.railway.app";

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
  success:       "#1A6B3C",
  warning:       "#8A5200",
  error:         "#CC1F1F",
};

const fmt = (n) => Number(n).toLocaleString("ru-RU");
const LOGO = "https://giyuowciomkfcqlxlkrt.supabase.co/storage/v1/object/public/kamico.store/IMG_5208.JPG";

const STATUS_CONFIG = {
  new:        { label: "Новый заказ", color: "#CC1F1F", bg: "#FFF0F0", next: "processing" },
  processing: { label: "Собирается",  color: "#8A5200", bg: "#FFF8E6", next: "delivery"   },
  delivery:   { label: "В пути",      color: "#1D4ED8", bg: "#EFF6FF", next: "completed"  },
  completed:  { label: "Доставлен",   color: "#1A6B3C", bg: "#ECFDF5", next: null         },
  cancelled:  { label: "Отменён",     color: "#555555", bg: "#F5F5F5", next: null         },
};

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
      <div style={{ width:24, height:24, border:`2px solid ${C.primaryBorder}`, borderTop:`2px solid ${C.primary}`, borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return <span style={{ fontSize:11, fontWeight:600, color:cfg.color, background:cfg.bg, padding:"3px 9px", borderRadius:4, border:`1px solid ${cfg.color}30` }}>{cfg.label}</span>;
}

const sBtn = (c) => ({ fontSize:11, padding:"4px 10px", borderRadius:6, border:`1px solid ${c}30`, background:c+"15", color:c, cursor:"pointer", fontWeight:500, fontFamily:"inherit" });
const inp  = { width:"100%", padding:"9px 12px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:12, outline:"none", background:C.bg, boxSizing:"border-box", fontFamily:"inherit", color:C.text };
const lbl  = { fontSize:11, fontWeight:500, color:C.textMuted, display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 };

// ── LOGIN ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const data = await request("/api/auth/login", { method:"POST", body:{ phone, password:pass } });
      if (data.user?.role !== "admin") { setErr("Нет прав администратора."); return; }
      localStorage.setItem("kamico_admin_token", data.token);
      onLogin(data.user);
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:340 }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <img src={LOGO} alt="Kamico" style={{ height:40, objectFit:"contain" }} />
            <div style={{ fontSize:22, fontWeight:700 }}>
              <span style={{ color:C.primary, fontStyle:"italic" }}>Kamico</span>
              <span style={{ color:"white", fontWeight:900 }}> store</span>
            </div>
          </div>
          <div style={{ fontSize:13, color:"#666" }}>Панель управления</div>
        </div>
        <div style={{ background:"#2A2A2A", borderRadius:10, padding:22, border:"1px solid #333" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"white", marginBottom:16 }}>Вход для администратора</div>
          <div style={{ marginBottom:12 }}>
            <label style={{ ...lbl, color:"#666" }}>Логин</label>
            <input value={phone} onChange={e=>{setPhone(e.target.value);setErr("");}} placeholder="Kamico.store"
              style={{ ...inp, background:"#333", border:"1px solid #444", color:"white" }} />
          </div>
          <div style={{ marginBottom:err?10:18 }}>
            <label style={{ ...lbl, color:"#666" }}>Пароль</label>
            <input value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} type="password" placeholder="••••••••"
              onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{ ...inp, background:"#333", border:`1px solid ${err?C.error:"#444"}`, color:"white" }} />
          </div>
          {err && <div style={{ fontSize:12, color:C.error, marginBottom:12 }}>{err}</div>}
          <button onClick={submit} disabled={loading}
            style={{ width:"100%", padding:11, borderRadius:6, border:"none", background:loading?"#555":C.primary, color:"white", fontWeight:600, fontSize:14, cursor:loading?"default":"pointer" }}>
            {loading ? "Загрузка..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────
function Dashboard() {
  const [orders, setOrders]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    Promise.all([
      request("/api/admin/orders?limit=50"),
      request("/api/products?limit=100"),
    ]).then(([o, p]) => {
      setOrders(o.data || []);
      setProducts(p.data || []);
    }).catch(e => setError(e.message))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <div style={{ color:C.error, fontSize:13, padding:20 }}>Ошибка: {error}</div>;

  const delivered   = orders.filter(o=>o.status==="completed");
  const revenue     = delivered.reduce((s,o)=>s+o.total_price, 0);
  const newOrders   = orders.filter(o=>o.status==="new").length;
  const today       = new Date().toISOString().slice(0,10);
  const todayCount  = orders.filter(o=>o.created_at?.startsWith(today)).length;
  const lowStock    = products.filter(p=>p.stock<=10).length;

  const byStatus = {};
  orders.forEach(o=>{ byStatus[o.status]=(byStatus[o.status]||0)+1; });

  const stats = [
    { label:"Выручка",        value:`${fmt(revenue)} сум`, color:C.primary },
    { label:"Новых заказов",  value:newOrders,              color:C.warning },
    { label:"Сегодня",        value:todayCount,             color:"#1D4ED8" },
    { label:"Мало на складе", value:lowStock,               color:C.error   },
  ];

  return (
    <div>
      <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.textMuted, fontWeight:600, marginBottom:14 }}>Дашборд</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {stats.map((st,i)=>(
          <div key={i} style={{ background:C.white, borderRadius:8, padding:13, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:15, fontWeight:700, color:st.color }}>{st.value}</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:3, textTransform:"uppercase", letterSpacing:.4 }}>{st.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:C.white, borderRadius:8, padding:14, marginBottom:12, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:600, marginBottom:12 }}>Заказы по статусам</div>
        {Object.entries(STATUS_CONFIG).map(([key,cfg])=>{
          const count = byStatus[key]||0;
          const pct = orders.length ? Math.round(count/orders.length*100) : 0;
          return (
            <div key={key} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:C.textSub }}>{cfg.label}</span>
                <span style={{ fontSize:12, fontWeight:600, color:cfg.color }}>{count}</span>
              </div>
              <div style={{ height:4, background:C.bg, borderRadius:2 }}>
                <div style={{ height:4, background:cfg.color, borderRadius:2, width:`${pct}%`, transition:"width .5s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background:C.white, borderRadius:8, padding:14, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:600, marginBottom:12 }}>Последние заказы</div>
        {orders.slice(0,5).map(o=>(
          <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{o.client_name}</div>
              <div style={{ fontSize:11, color:C.textMuted }}>#{o.id} · {new Date(o.created_at).toLocaleDateString("ru-RU")}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.primary, marginBottom:3 }}>{fmt(o.total_price)} сум</div>
              <StatusBadge status={o.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ORDERS ───────────────────────────────────────────────
function OrdersPanel() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    request("/api/admin/orders?limit=100")
      .then(d => setOrders(d.data||[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o=>{
    const ms = filter==="all" || o.status===filter;
    const mq = !search || o.client_name?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search);
    return ms && mq;
  });

  const advance = async (id, next) => {
    setUpdating(true);
    try {
      await request(`/api/orders/${id}/status`, { method:"PATCH", body:{ status:next } });
      setOrders(os=>os.map(o=>o.id===id?{...o,status:next}:o));
      if(selected?.id===id) setSelected(s=>({...s,status:next}));
    } catch(e) { alert(e.message); }
    finally { setUpdating(false); }
  };

  if(selected) return (
    <div>
      <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:C.primary, fontWeight:700, fontSize:13, cursor:"pointer", padding:0, marginBottom:14 }}>← Назад</button>
      <div style={{ background:C.white, borderRadius:10, padding:16, border:`1px solid ${C.border}`, marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Заказ #{selected.id}</div>
            <div style={{ fontSize:11, color:C.textMuted }}>{new Date(selected.created_at).toLocaleDateString("ru-RU")}</div>
          </div>
          <StatusBadge status={selected.status} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          {[["Клиент",selected.client_name],["Телефон",selected.phone],["Оплата",selected.payment==="cash"?"Наличные":"Карта"],["Адрес",selected.delivery_address]].map(([l,v])=>(
            <div key={l} style={{ background:C.bg, borderRadius:6, padding:"8px 10px" }}>
              <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:.4 }}>{l}</div>
              <div style={{ fontSize:12, fontWeight:500, color:C.text, marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
        {selected.comment && <div style={{ background:"#FFF8E6", borderRadius:6, padding:"8px 10px", marginBottom:10, fontSize:12, color:C.warning }}>💬 {selected.comment}</div>}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Состав заказа</div>
          {(selected.order_items||[]).map((item,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
              <span style={{ color:C.textSub }}>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight:600 }}>{fmt(item.price*item.quantity)} сум</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:14, borderTop:`1px dashed ${C.border}`, paddingTop:8, marginTop:6 }}>
            <span>Итого</span><span style={{ color:C.primary }}>{fmt(selected.total_price)} сум</span>
          </div>
        </div>
      </div>
      <div style={{ background:C.white, borderRadius:10, padding:14, border:`1px solid ${C.border}`, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>Статус доставки</div>
        {Object.entries(STATUS_CONFIG).filter(([k])=>k!=="cancelled").map(([key,cfg],i,arr)=>{
          const keys=arr.map(([k])=>k);
          const ci=keys.indexOf(selected.status);
          const ti=keys.indexOf(key);
          const done=ti<=ci, active=key===selected.status;
          return (
            <div key={key} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:done?C.primary:C.bg, border:`2px solid ${done?C.primary:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {done && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                {i<arr.length-1 && <div style={{ width:2, height:18, background:ti<ci?C.primary:C.border, margin:"3px 0" }} />}
              </div>
              <div style={{ paddingTop:2, paddingBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:active?700:400, color:done?C.text:C.textMuted }}>{cfg.label}</div>
                {active && <span style={{ fontSize:10, color:C.primary, fontWeight:600 }}>Текущий</span>}
              </div>
            </div>
          );
        })}
      </div>
      {STATUS_CONFIG[selected.status]?.next && (
        <button onClick={()=>advance(selected.id, STATUS_CONFIG[selected.status].next)} disabled={updating}
          style={{ width:"100%", padding:12, borderRadius:8, border:"none", background:C.primary, color:"white", fontWeight:600, fontSize:14, cursor:updating?"default":"pointer", opacity:updating?.7:1 }}>
          {updating ? "Обновляем..." : `Перевести → ${STATUS_CONFIG[STATUS_CONFIG[selected.status].next]?.label}`}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.textMuted, fontWeight:600, marginBottom:12 }}>Заказы</div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по клиенту или телефону..."
        style={{ ...inp, marginBottom:10 }} />
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {[["all","Все"],...Object.entries(STATUS_CONFIG).map(([k,v])=>[k,v.label])].map(([k,label])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{ padding:"4px 11px", borderRadius:20, border:`1px solid ${filter===k?C.primary:C.border}`, background:filter===k?C.primaryLight:C.white, color:filter===k?C.primary:C.textSub, fontWeight:600, fontSize:11, cursor:"pointer" }}>
            {label}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length===0
        ? <div style={{ textAlign:"center", padding:30, color:C.textMuted, fontSize:13 }}>Заказов нет</div>
        : filtered.map(o=>(
          <div key={o.id} onClick={()=>setSelected(o)}
            style={{ background:C.white, borderRadius:10, padding:"11px 13px", marginBottom:8, border:`1px solid ${C.border}`, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>#{o.id} · {o.client_name}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{o.phone} · {new Date(o.created_at).toLocaleDateString("ru-RU")}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontSize:11, color:C.textSub }}>{o.delivery_address}</div>
              <div style={{ fontWeight:700, color:C.primary, fontSize:13 }}>{fmt(o.total_price)} сум</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ── PRODUCTS ─────────────────────────────────────────────
function ProductsPanel() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState(0);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const fileRef = useRef();
  const emptyForm = { name:"", description:"", price:"", old_price:"", stock:"", category_id:"", badge:"", image_url:"", brand:"" };
  const [form, setForm] = useState(emptyForm);

  useEffect(()=>{
    Promise.all([request("/api/products?limit=100"), request("/api/categories")])
      .then(([p,c])=>{ setProducts(p.data||[]); setCategories(c.data||[]); })
      .catch(console.error).finally(()=>setLoading(false));
  },[]);

  const visible = products.filter(p=>(!catFilter||p.category_id===catFilter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())));

  const handlePhoto = (e) => {
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader(); r.onload=ev=>setForm(f=>({...f,image_url:ev.target.result})); r.readAsDataURL(file);
  };

  const save = async () => {
    if(!form.name||!form.price) return;
    setSaving(true);
    try {
      const body={ ...form, price:Number(form.price), old_price:form.old_price?Number(form.old_price):null, stock:Number(form.stock)||0, category_id:form.category_id?Number(form.category_id):null, badge:form.badge||null };
      if(editing==="new"){
        const data=await request("/api/products",{method:"POST",body});
        setProducts(ps=>[...ps,data.data]);
      } else {
        const data=await request(`/api/products/${editing.id}`,{method:"PUT",body});
        setProducts(ps=>ps.map(p=>p.id===editing.id?data.data:p));
      }
      setEditing(null);
    } catch(e){ alert(e.message); }
    finally{ setSaving(false); }
  };

  const del = async (id) => {
    if(!window.confirm("Удалить товар?")) return;
    try{ await request(`/api/products/${id}`,{method:"DELETE"}); setProducts(ps=>ps.filter(p=>p.id!==id)); }
    catch(e){ alert(e.message); }
  };

  if(editing!==null) return (
    <div>
      <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", color:C.primary, fontWeight:700, fontSize:13, cursor:"pointer", padding:0, marginBottom:14 }}>← Назад</button>
      <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:14 }}>{editing==="new"?"Новый товар":"Редактировать товар"}</div>
      <div style={{ background:C.white, borderRadius:10, padding:14, border:`1px solid ${C.border}`, marginBottom:12 }}>
        <label style={lbl}>Фото товара</label>
        {form.image_url ? (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src={form.image_url} alt="" style={{ width:72, height:72, objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}` }} />
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <button onClick={()=>fileRef.current.click()} style={sBtn(C.primary)}>✏️ Изменить</button>
              <button onClick={()=>setForm(f=>({...f,image_url:""}))} style={sBtn(C.error)}>✕ Удалить</button>
            </div>
          </div>
        ):(
          <div onClick={()=>fileRef.current.click()} style={{ width:72, height:72, borderRadius:8, border:`2px dashed ${C.border}`, background:C.primaryLight, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:3 }}>
            <span style={{ fontSize:20 }}>📷</span>
            <span style={{ fontSize:9, color:C.primary, fontWeight:600 }}>Добавить</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
      </div>
      <div style={{ background:C.white, borderRadius:10, padding:14, border:`1px solid ${C.border}`, marginBottom:12 }}>
        {[["name","Название *",""],["description","Описание",""],["brand","Бренд","Kamico"]].map(([f,l,ph])=>(
          <div key={f} style={{ marginBottom:10 }}>
            <label style={lbl}>{l}</label>
            {f==="description"
              ? <textarea style={{ ...inp, height:56, resize:"vertical" }} value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={ph} />
              : <input style={inp} value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={ph} />
            }
          </div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          {[["price","Цена (сум) *","number"],["old_price","Старая цена","number"],["stock","В наличии","number"]].map(([f,l,t])=>(
            <div key={f}>
              <label style={lbl}>{l}</label>
              <input style={inp} type={t} value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder="0" />
            </div>
          ))}
          <div>
            <label style={lbl}>Значок</label>
            <select style={inp} value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))}>
              <option value="">Нет</option>
              {["Хит","Новинка","Скидка"].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={lbl}>Категория</label>
          <select style={inp} value={form.category_id} onChange={e=>setForm(f=>({...f,category_id:e.target.value}))}>
            <option value="">Без категории</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={save} disabled={saving} style={{ flex:1, padding:12, borderRadius:8, border:"none", background:saving?"#ccc":C.primary, color:"white", fontWeight:600, fontSize:14, cursor:saving?"default":"pointer" }}>
          {saving?"Сохраняем...":editing==="new"?"Добавить товар":"Сохранить"}
        </button>
        <button onClick={()=>setEditing(null)} style={{ padding:"12px 18px", borderRadius:8, border:`1px solid ${C.border}`, background:C.white, color:C.textSub, fontWeight:500, fontSize:13, cursor:"pointer" }}>Отмена</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.textMuted, fontWeight:600 }}>Товары</div>
        <button onClick={()=>{setForm(emptyForm);setEditing("new");}}
          style={{ padding:"7px 16px", borderRadius:20, border:"none", background:C.primary, color:"white", fontWeight:600, fontSize:12, cursor:"pointer" }}>+ Добавить</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск товара..."
        style={{ ...inp, marginBottom:10 }} />
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        <button onClick={()=>setCatFilter(0)} style={{ padding:"4px 11px", borderRadius:20, border:`1px solid ${!catFilter?C.primary:C.border}`, background:!catFilter?C.primaryLight:C.white, color:!catFilter?C.primary:C.textSub, fontWeight:600, fontSize:11, cursor:"pointer" }}>Все</button>
        {categories.map(c=>(
          <button key={c.id} onClick={()=>setCatFilter(catFilter===c.id?0:c.id)}
            style={{ padding:"4px 11px", borderRadius:20, border:`1px solid ${catFilter===c.id?C.primary:C.border}`, background:catFilter===c.id?C.primaryLight:C.white, color:catFilter===c.id?C.primary:C.textSub, fontWeight:600, fontSize:11, cursor:"pointer" }}>
            {c.name}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : visible.map(p=>(
        <div key={p.id} style={{ background:C.white, borderRadius:10, padding:"10px 12px", marginBottom:8, border:`1px solid ${p.stock<=5?"#fecdd3":C.border}`, display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ width:48, height:48, borderRadius:8, background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
            {p.image_url ? <img src={p.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" /> : <span style={{ opacity:.3 }}>📦</span>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:2 }}>{p.name}</div>
            <div style={{ fontSize:11, color:C.textMuted }}>{categories.find(c=>c.id===p.category_id)?.name||"—"} · {p.stock<=5?<span style={{ color:C.error }}>⚠️ {p.stock} шт.</span>:`${p.stock} шт.`}</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontWeight:700, color:C.primary, fontSize:13 }}>{fmt(p.price)}</div>
            {p.old_price&&<div style={{ fontSize:10, color:C.textMuted, textDecoration:"line-through" }}>{fmt(p.old_price)}</div>}
            <div style={{ display:"flex", gap:4, marginTop:5 }}>
              <button onClick={()=>{setForm({name:p.name,description:p.description||"",price:p.price,old_price:p.old_price||"",stock:p.stock,category_id:p.category_id||"",badge:p.badge||"",image_url:p.image_url||"",brand:p.brand||""});setEditing(p);}} style={sBtn(C.primary)}>✏️</button>
              <button onClick={()=>del(p.id)} style={sBtn(C.error)}>🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────
export default function AdminApp() {
  const [user, setUser]         = useState(null);
  const [tab, setTab]           = useState("dashboard");
  const [checking, setChecking] = useState(true);

  useEffect(()=>{
    const token = localStorage.getItem("kamico_admin_token");
    if(!token){ setChecking(false); return; }
    request("/api/auth/me")
      .then(d=>{ if(d.role==="admin") setUser({ name:"Admin" }); })
      .catch(()=>localStorage.removeItem("kamico_admin_token"))
      .finally(()=>setChecking(false));
  },[]);

  const logout = () => { localStorage.removeItem("kamico_admin_token"); setUser(null); };

  if(checking) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#1A1A1A" }}>
      <div style={{ width:28, height:28, border:`2px solid #333`, borderTop:`2px solid ${C.primary}`, borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(!user) return <LoginScreen onLogin={setUser} />;

  const navItems = [
    { id:"dashboard", icon:"📊", label:"Дашборд" },
    { id:"orders",    icon:"📦", label:"Заказы"   },
    { id:"products",  icon:"🛍️", label:"Товары"   },
  ];

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:C.bg, fontFamily:"'Inter','Segoe UI',sans-serif", paddingBottom:64 }}>
      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <img src={LOGO} alt="Kamico" style={{ height:28, objectFit:"contain" }} />
          <div style={{ fontSize:15, fontWeight:700 }}>
            <span style={{ color:C.primary, fontStyle:"italic" }}>Kamico</span>
            <span style={{ color:C.text, fontWeight:900 }}> store</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:12, color:C.textMuted }}>Администратор</span>
          <button onClick={logout} style={{ fontSize:12, color:C.error, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit" }}>Выйти</button>
        </div>
      </div>
      <div style={{ padding:14 }}>
        {tab==="dashboard" && <Dashboard />}
        {tab==="orders"    && <OrdersPanel />}
        {tab==="products"  && <ProductsPanel />}
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, maxWidth:480, margin:"0 auto", background:C.white, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:200 }}>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"9px 4px 11px", border:"none", background:"none", cursor:"pointer", position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:tab===n.id?C.primary:"transparent", borderRadius:"0 0 2px 2px" }} />
            <span style={{ fontSize:18 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:tab===n.id?600:400, color:tab===n.id?C.primary:C.textMuted }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
