import { useState, useEffect, useRef } from "react";

const API = "https://kamico-backend-production.up.railway.app";

async function request(path, options = {}) {
  const token = localStorage.getItem("kamico_token");
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
  primaryHover:  "#A81919",
  primaryLight:  "#FFF0F0",
  primaryBorder: "#F5CCCC",
  bg:            "#FFFFFF",
  surface:       "#F8F8F8",
  text:          "#111111",
  textSub:       "#555555",
  textMuted:     "#999999",
  border:        "#E8E8E8",
  borderStrong:  "#CCCCCC",
  success:       "#1A6B3C",
  error:         "#CC1F1F",
  warning:       "#8A5200",
};

const fmt = (n) => Number(n).toLocaleString("ru-RU");
const STATUSES = ["Принят","Собирается","Передан курьеру","В пути","Доставлен"];

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
      <div style={{ width:24, height:24, border:`2px solid ${C.primaryBorder}`, borderTop:`2px solid ${C.primary}`, borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── AUTH ─────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({ name:"", phone:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const endpoint = mode==="login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode==="login" ? { phone:form.phone, password:form.password } : form;
      const data = await request(endpoint, { method:"POST", body });
      localStorage.setItem("kamico_token", data.token);
      localStorage.setItem("kamico_user", JSON.stringify(data.user));
      onAuth(data.user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inp = { width:"100%", padding:"11px 14px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:14, outline:"none", background:"white", boxSizing:"border-box", fontFamily:"inherit", color:C.text };
  const lbl = { fontSize:11, fontWeight:500, color:C.textMuted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360 }}>
        <div style={{ marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
            <img src="https://giyuowciomkfcqlxlkrt.supabase.co/storage/v1/object/public/kamico.store/IMG_5208.JPG" alt="Kamico" style={{ height:44, width:"auto", objectFit:"contain" }} />
            <div style={{ fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>
              <span style={{ color:C.primary, fontStyle:"italic" }}>Kamico</span>
              <span style={{ color:C.text, fontWeight:900 }}> store</span>
            </div>
          </div>
          <div style={{ fontSize:13, color:C.textMuted }}>Косметика и уход за собой</div>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex:1, padding:"10px 0", border:"none", background:"none", fontSize:13, fontWeight:mode===m?600:400, color:mode===m?C.primary:C.textMuted, cursor:"pointer", borderBottom:`2px solid ${mode===m?C.primary:"transparent"}`, transition:"all .2s" }}>
              {m==="login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>
        {mode==="register" && (
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Имя</label>
            <input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ваше имя" />
          </div>
        )}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Телефон</label>
          <input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+998 90 123 45 67" type="tel" />
        </div>
        <div style={{ marginBottom: error ? 10 : 20 }}>
          <label style={lbl}>Пароль</label>
          <input style={inp} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()} />
        </div>
        {error && <div style={{ fontSize:12, color:C.error, marginBottom:14 }}>{error}</div>}
        <button onClick={submit} disabled={loading}
          style={{ width:"100%", padding:13, border:"none", background:C.primary, color:"white", fontWeight:600, fontSize:14, borderRadius:6, cursor:loading?"default":"pointer", opacity:loading?.7:1 }}>
          {loading ? "Загрузка..." : mode==="login" ? "Войти" : "Создать аккаунт"}
        </button>
        <button onClick={()=>onAuth(null)} style={{ width:"100%", marginTop:12, padding:"10px 0", border:"none", background:"none", color:C.textMuted, fontSize:13, cursor:"pointer" }}>
          Продолжить без входа
        </button>
      </div>
    </div>
  );
}

// ── PRODUCT CARD ─────────────────────────────────────────
function ProductCard({ product:p, onClick }) {
  const disc = p.old_price ? Math.round((1-p.price/p.old_price)*100) : 0;
  return (
    <div onClick={onClick}
      style={{ background:"white", border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer", overflow:"hidden" }}>
      <div style={{ aspectRatio:"1/1", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize:28, opacity:.2 }}>🌸</span>
        }
        {disc>0 && <div style={{ position:"absolute", top:5, left:5, background:C.primary, color:"white", fontSize:9, fontWeight:600, padding:"2px 5px", borderRadius:3 }}>−{disc}%</div>}
        {p.badge&&!disc && <div style={{ position:"absolute", top:5, left:5, background:C.text, color:"white", fontSize:9, fontWeight:600, padding:"2px 5px", borderRadius:3 }}>{p.badge}</div>}
      </div>
      <div style={{ padding:"7px 8px 9px" }}>
        <div style={{ fontSize:9, color:C.textMuted, marginBottom:2 }}>{p.brand||"Kamico"}</div>
        <div style={{ fontSize:11, fontWeight:500, color:C.text, lineHeight:1.35, marginBottom:5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.name}</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ fontSize:12, fontWeight:700, color:C.primary }}>{fmt(p.price)} сум</span>
          {p.old_price && <span style={{ fontSize:9, color:C.textMuted, textDecoration:"line-through" }}>{fmt(p.old_price)}</span>}
        </div>
        {p.stock<=10&&p.stock>0 && <div style={{ fontSize:9, color:C.warning, marginTop:3 }}>Осталось {p.stock} шт.</div>}
        {p.stock===0 && <div style={{ fontSize:9, color:C.textMuted, marginTop:3 }}>Нет в наличии</div>}
      </div>
    </div>
  );
}

// ── HOME SCREEN ──────────────────────────────────────────
function HomeScreen({ onProduct, categories, products, loading }) {
  const [activeCat, setActiveCat] = useState(0);
  const popular  = products.filter(p=>p.badge==="Хит").slice(0,6);
  const newItems = products.filter(p=>p.badge==="Новинка").slice(0,4);
  const filtered = activeCat===0 ? products : products.filter(p=>p.category_id===activeCat);

  return (
    <div style={{ paddingBottom:80 }}>
      {/* Hero */}
      <div style={{ background:"#111111", padding:"22px 16px 20px" }}>
        <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.primary, fontWeight:600, marginBottom:6 }}>Новая коллекция</div>
        <div style={{ fontSize:22, fontWeight:700, color:"white", lineHeight:1.25, marginBottom:14 }}>Уход за кожей<br/>весна 2026</div>
        <button
          onClick={()=>{ const h=products.find(p=>p.badge==="Хит"); if(h) onProduct(h); }}
          style={{ padding:"9px 20px", border:"1px solid #CC1F1F", background:"transparent", color:"#CC1F1F", fontWeight:600, fontSize:12, borderRadius:4, cursor:"pointer", letterSpacing:.3 }}>
          Смотреть коллекцию →
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", overflowX:"auto", scrollbarWidth:"none", paddingLeft:16 }}>
        {[{ id:0, name:"Все" }, ...categories].map(c=>(
          <button key={c.id} onClick={()=>setActiveCat(c.id)}
            style={{ padding:"13px 14px", border:"none", background:"none", fontSize:13, fontWeight:activeCat===c.id?600:400, color:activeCat===c.id?C.primary:C.textSub, cursor:"pointer", whiteSpace:"nowrap", borderBottom:`2px solid ${activeCat===c.id?C.primary:"transparent"}`, flexShrink:0, transition:"color .2s" }}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {activeCat===0 && popular.length>0 && (
            <div style={{ padding:"22px 16px 0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <span style={{ fontSize:16 }}>🔥</span>
                <span style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.textMuted, fontWeight:600 }}>Популярное</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                {popular.map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)} />)}
              </div>
            </div>
          )}
          {activeCat===0 && newItems.length>0 && (
            <div style={{ padding:"24px 16px 0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <span style={{ fontSize:16 }}>🆕</span>
                <span style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.textMuted, fontWeight:600 }}>Новинки</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                {newItems.map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)} />)}
              </div>
            </div>
          )}
          <div style={{ padding:"24px 16px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:C.textMuted, fontWeight:600 }}>
                {activeCat===0 ? "Все товары" : categories.find(c=>c.id===activeCat)?.name}
              </span>
              <span style={{ fontSize:12, color:C.textMuted }}>{filtered.length} шт.</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
              {filtered.map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── CATALOG SCREEN ───────────────────────────────────────
function CatalogScreen({ onProduct, categories, products, loading }) {
  const [activeCat, setActiveCat] = useState(0);
  const [sort, setSort]           = useState("popular");
  const [search, setSearch]       = useState("");

  const filtered = products
    .filter(p=>(!activeCat||p.category_id===activeCat)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())))
    .slice().sort((a,b)=>{
      if(sort==="price_asc")  return a.price-b.price;
      if(sort==="price_desc") return b.price-a.price;
      if(sort==="new")        return new Date(b.created_at)-new Date(a.created_at);
      return b.reviews-a.reviews;
    });

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Поиск товаров..."
          style={{ width:"100%", padding:"10px 14px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:"none", background:C.surface, boxSizing:"border-box", fontFamily:"inherit", color:C.text }} />
      </div>
      <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", overflowX:"auto", scrollbarWidth:"none", paddingLeft:16 }}>
        {[{ id:0, name:"Все" }, ...categories].map(c=>(
          <button key={c.id} onClick={()=>setActiveCat(c.id)}
            style={{ padding:"12px 14px", border:"none", background:"none", fontSize:12, fontWeight:activeCat===c.id?600:400, color:activeCat===c.id?C.primary:C.textSub, cursor:"pointer", whiteSpace:"nowrap", borderBottom:`2px solid ${activeCat===c.id?C.primary:"transparent"}`, flexShrink:0 }}>
            {c.name}
          </button>
        ))}
      </div>
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, color:C.textMuted }}>{filtered.length} товаров</span>
        <select value={sort} onChange={e=>setSort(e.target.value)}
          style={{ fontSize:12, color:C.text, background:"white", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", outline:"none", fontFamily:"inherit" }}>
          <option value="popular">По популярности</option>
          <option value="price_asc">Сначала дешевле</option>
          <option value="price_desc">Сначала дороже</option>
          <option value="new">Сначала новые</option>
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
          {filtered.map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)} />)}
          {filtered.length===0 && <div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:C.textMuted, fontSize:13 }}>Ничего не найдено</div>}
        </div>
      )}
    </div>
  );
}

// ── PRODUCT SCREEN ───────────────────────────────────────
function ProductScreen({ product:p, onBack, onAddCart, isInCart, onGoCart, categories }) {
  const [qty, setQty] = useState(1);
  const disc = p.old_price ? Math.round((1-p.price/p.old_price)*100) : 0;
  const cat  = categories.find(c=>c.id===p.category_id);

  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ padding:"13px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${C.border}`, background:"white", position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.text, padding:0, lineHeight:1 }}>←</button>
        <span style={{ fontSize:13, color:C.textSub }}>{cat?.name || "Товар"}</span>
      </div>

      <div style={{ background:C.surface, aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize:80, opacity:.15 }}>🌸</span>
        }
        {disc>0 && <div style={{ position:"absolute", top:14, left:14, background:C.primary, color:"white", fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:6 }}>−{disc}%</div>}
      </div>

      <div style={{ padding:"20px 16px" }}>
        {p.brand && <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:500, marginBottom:6 }}>{p.brand}</div>}
        <div style={{ fontSize:19, fontWeight:600, color:C.text, lineHeight:1.3, marginBottom:14 }}>{p.name}</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:7, marginBottom:16 }}>
          <span style={{ fontSize:22, fontWeight:700, color:C.primary }}>{fmt(p.price)} сум</span>
          {p.old_price && <span style={{ fontSize:14, color:C.textMuted, textDecoration:"line-through" }}>{fmt(p.old_price)} сум</span>}
        </div>

        {p.stock<=10&&p.stock>0 && (
          <div style={{ fontSize:12, color:C.warning, marginBottom:14, padding:"9px 12px", background:"#FEF3C7", borderRadius:6, borderLeft:`3px solid ${C.warning}` }}>
            ⚡ Осталось {p.stock} шт. — скоро закончится
          </div>
        )}

        {p.description && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:500, marginBottom:10 }}>Описание</div>
            <div style={{ fontSize:13, color:C.textSub, lineHeight:1.75 }}>{p.description}</div>
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <span style={{ fontSize:13, color:C.textSub }}>Количество</span>
          <div style={{ display:"flex", alignItems:"center", border:`1px solid ${C.border}`, borderRadius:6 }}>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:36, height:36, border:"none", background:"none", fontSize:17, cursor:"pointer", color:C.text }}>−</button>
            <span style={{ width:32, textAlign:"center", fontSize:14, fontWeight:500, color:C.text }}>{qty}</span>
            <button onClick={()=>setQty(q=>Math.min(p.stock,q+1))} style={{ width:36, height:36, border:"none", background:"none", fontSize:17, cursor:"pointer", color:C.text }}>+</button>
          </div>
          <span style={{ fontSize:13, color:C.textMuted }}>{fmt(p.price*qty)} сум</span>
        </div>
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:`1px solid ${C.border}`, padding:"12px 16px", zIndex:100 }}>
        {isInCart
          ? <button onClick={onGoCart} style={{ width:"100%", padding:13, border:`1px solid ${C.primary}`, background:"white", color:C.primary, fontWeight:600, fontSize:14, borderRadius:6, cursor:"pointer" }}>Перейти в корзину →</button>
          : <button onClick={()=>onAddCart(p,qty)} disabled={p.stock===0}
              style={{ width:"100%", padding:13, border:"none", background:p.stock===0?C.textMuted:C.primary, color:"white", fontWeight:600, fontSize:14, borderRadius:6, cursor:p.stock===0?"default":"pointer" }}>
              {p.stock===0 ? "Нет в наличии" : `Добавить в корзину · ${fmt(p.price*qty)} сум`}
            </button>
        }
      </div>
    </div>
  );
}

// ── CART SCREEN ──────────────────────────────────────────
function CartScreen({ cart, onBack, onChange, onRemove, onCheckout }) {
  const total = cart.reduce((s,x)=>s+x.price*x.qty, 0);
  const count = cart.reduce((s,x)=>s+x.qty, 0);

  if(cart.length===0) return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.text, padding:0 }}>←</button>
        <span style={{ fontSize:15, fontWeight:600, color:C.text }}>Корзина</span>
      </div>
      <div style={{ textAlign:"center", padding:"64px 20px" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🛒</div>
        <div style={{ fontSize:15, fontWeight:500, color:C.text, marginBottom:6 }}>Корзина пуста</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>Добавьте товары из каталога</div>
        <button onClick={onBack} style={{ padding:"10px 24px", border:`1px solid ${C.primary}`, background:"none", color:C.primary, fontWeight:500, fontSize:13, borderRadius:6, cursor:"pointer" }}>В каталог</button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.text, padding:0 }}>←</button>
        <span style={{ fontSize:15, fontWeight:600, color:C.text }}>Корзина — {count} шт.</span>
      </div>
      <div style={{ padding:"0 16px" }}>
        {cart.map(item=>(
          <div key={item.id} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"16px 0", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:62, height:62, background:C.surface, borderRadius:8, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.image_url ? <img src={item.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ opacity:.2, fontSize:22 }}>🌸</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:3, lineHeight:1.35 }}>{item.name}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:10 }}>{fmt(item.price)} сум</div>
              <div style={{ display:"flex", alignItems:"center", border:`1px solid ${C.border}`, borderRadius:6, width:"fit-content" }}>
                <button onClick={()=>onChange(item.id,-1)} style={{ width:30, height:30, border:"none", background:"none", fontSize:15, cursor:"pointer", color:C.text }}>−</button>
                <span style={{ width:28, textAlign:"center", fontSize:13, fontWeight:500 }}>{item.qty}</span>
                <button onClick={()=>onChange(item.id,1)} style={{ width:30, height:30, border:"none", background:"none", fontSize:15, cursor:"pointer", color:C.text }}>+</button>
              </div>
            </div>
            <button onClick={()=>onRemove(item.id)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer", padding:0, marginTop:2 }}>×</button>
          </div>
        ))}
        <div style={{ paddingTop:16, paddingBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, color:C.textSub }}>Товары ({count} шт.)</span>
            <span style={{ fontSize:13 }}>{fmt(total)} сум</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:13, color:C.textSub }}>Доставка</span>
            <span style={{ fontSize:13, color:C.success }}>Бесплатно</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:15, fontWeight:600 }}>Итого</span>
            <span style={{ fontSize:16, fontWeight:700, color:C.primary }}>{fmt(total)} сум</span>
          </div>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:60, left:0, right:0, background:"white", borderTop:`1px solid ${C.border}`, padding:"12px 16px", zIndex:100 }}>
        <button onClick={onCheckout} style={{ width:"100%", padding:13, border:"none", background:C.primary, color:"white", fontWeight:600, fontSize:14, borderRadius:6, cursor:"pointer" }}>
          Оформить заказ · {fmt(total)} сум
        </button>
      </div>
    </div>
  );
}

// ── CHECKOUT SCREEN ──────────────────────────────────────
const CARD_NUMBER = "5614 6821 1365 9165";
const CARD_OWNER  = "Mahbubova Kamola";

function CheckoutScreen({ cart, user, onBack, onDone }) {
  const [form, setForm]       = useState({ client_name:user?.name||"", phone:user?.phone||"", delivery_address:"", comment:"" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState("form"); // form | payment
  const [orderId, setOrderId] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const fileRef = useRef();
  const total = cart.reduce((s,x)=>s+x.price*x.qty, 0);

  const validate = () => {
    const e={};
    if(!form.client_name.trim()) e.client_name="Введите имя";
    if(!form.phone.trim())       e.phone="Введите телефон";
    if(!form.delivery_address.trim()) e.delivery_address="Введите адрес";
    setErrors(e); return Object.keys(e).length===0;
  };

  const submit = async () => {
    if(!validate()) return;
    setLoading(true);
    try {
      const items = cart.map(i=>({ product_id:i.id, quantity:i.qty }));
      const data = await request("/api/orders", { method:"POST", body:{ ...form, payment:"card", items } });
      setOrderId(data.data.order_id);
      setStep("payment");
    } catch(e) { setErrors({ general:e.message }); }
    finally { setLoading(false); }
  };

  const copyCard = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g,""));
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setScreenshot(ev.target.result);
    reader.readAsDataURL(file);
  };

  const sendScreenshot = async () => {
    if(!screenshot) return;
    setUploading(true);
    try {
      await request("/api/orders/payment", { method:"POST", body:{ order_id: orderId, screenshot_url: screenshot } });
      onDone({ ...form, order_id: orderId });
    } catch(e) { alert(e.message); }
    finally { setUploading(false); }
  };

  const inp = (field) => ({ width:"100%", padding:"11px 14px", border:`1px solid ${errors[field]?C.error:C.border}`, borderRadius:6, fontSize:13, outline:"none", background:"white", boxSizing:"border-box", fontFamily:"inherit", color:C.text });
  const lbl = { fontSize:11, fontWeight:500, color:C.textMuted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 };

  // ── PAYMENT STEP ─────────────────────────────────────
  if(step === "payment") return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:15, fontWeight:600, color:C.text }}>Оплата заказа #{orderId}</span>
      </div>
      <div style={{ padding:16 }}>
        {/* Card info */}
        <div style={{ background:"#111", borderRadius:12, padding:20, marginBottom:16, color:"white" }}>
          <div style={{ fontSize:11, color:"#888", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Переведите на карту</div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:3, marginBottom:8 }}>{CARD_NUMBER}</div>
          <div style={{ fontSize:13, color:"#aaa" }}>{CARD_OWNER}</div>
          <div style={{ marginTop:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, color:"#888" }}>Сумма к оплате</div>
              <div style={{ fontSize:20, fontWeight:700, color:C.primary }}>{fmt(total)} сум</div>
            </div>
            <button onClick={copyCard}
              style={{ padding:"8px 16px", borderRadius:8, border:"none", background:copied?"#1A6B3C":C.primary, color:"white", fontWeight:600, fontSize:12, cursor:"pointer", transition:"background .2s" }}>
              {copied ? "✓ Скопировано" : "Копировать"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ background:C.primaryLight, border:`1px solid ${C.primaryBorder}`, borderRadius:8, padding:14, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.primary, marginBottom:8 }}>Инструкция:</div>
          <div style={{ fontSize:12, color:C.textSub, lineHeight:1.8 }}>
            1. Скопируйте номер карты<br/>
            2. Откройте банковское приложение<br/>
            3. Переведите <strong>{fmt(total)} сум</strong><br/>
            4. Сделайте скриншот перевода<br/>
            5. Загрузите скриншот ниже
          </div>
        </div>

        {/* Screenshot upload */}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Скриншот оплаты</label>
          {screenshot ? (
            <div>
              <img src={screenshot} alt="screenshot" style={{ width:"100%", borderRadius:8, border:`1px solid ${C.border}`, marginBottom:8 }} />
              <button onClick={()=>setScreenshot(null)} style={{ fontSize:12, color:C.error, background:"none", border:"none", cursor:"pointer", padding:0 }}>✕ Удалить</button>
            </div>
          ) : (
            <div onClick={()=>fileRef.current.click()}
              style={{ border:`2px dashed ${C.border}`, borderRadius:8, padding:24, textAlign:"center", cursor:"pointer", background:C.surface }}>
              <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
              <div style={{ fontSize:13, color:C.textSub }}>Нажмите чтобы загрузить скриншот</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleScreenshot} />
        </div>
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:`1px solid ${C.border}`, padding:"12px 16px", zIndex:100 }}>
        <button onClick={sendScreenshot} disabled={!screenshot||uploading}
          style={{ width:"100%", padding:13, border:"none", background:!screenshot||uploading?"#ccc":C.primary, color:"white", fontWeight:600, fontSize:14, borderRadius:6, cursor:!screenshot||uploading?"default":"pointer" }}>
          {uploading ? "Отправляем..." : "Подтвердить оплату"}
        </button>
      </div>
    </div>
  );

  // ── FORM STEP ────────────────────────────────────────
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.text, padding:0 }}>←</button>
        <span style={{ fontSize:15, fontWeight:600, color:C.text }}>Оформление заказа</span>
      </div>
      <div style={{ padding:"16px" }}>
        <div style={{ background:C.primaryLight, border:`1px solid ${C.primaryBorder}`, borderRadius:8, padding:14, marginBottom:20 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.primary, fontWeight:600, marginBottom:10 }}>Ваш заказ</div>
          {cart.map(item=>(
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:C.textSub, marginBottom:5 }}>
              <span>{item.name} × {item.qty}</span>
              <span style={{ fontWeight:500, color:C.text }}>{fmt(item.price*item.qty)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:600, fontSize:14, borderTop:`1px solid ${C.primaryBorder}`, paddingTop:10, marginTop:10 }}>
            <span>Итого</span><span style={{ color:C.primary }}>{fmt(total)} сум</span>
          </div>
        </div>

        {errors.general && <div style={{ fontSize:12, color:C.error, marginBottom:14, padding:"10px 14px", background:"#FEF2F2", borderRadius:6 }}>{errors.general}</div>}

        {[["client_name","Имя","Имя и фамилия"],["phone","Телефон","+998 90 123 45 67"],["delivery_address","Адрес доставки","Город, улица, дом, квартира"]].map(([field,label,ph])=>(
          <div key={field} style={{ marginBottom:14 }}>
            <label style={lbl}>{label}</label>
            <input style={inp(field)} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={ph} type={field==="phone"?"tel":"text"} />
            {errors[field] && <div style={{ fontSize:11, color:C.error, marginTop:4 }}>{errors[field]}</div>}
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Комментарий</label>
          <textarea value={form.comment} onChange={e=>setForm(f=>({...f,comment:e.target.value}))} placeholder="Время доставки, особые пожелания..." rows={2}
            style={{ width:"100%", padding:"11px 14px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:"none", background:"white", boxSizing:"border-box", fontFamily:"inherit", resize:"none", color:C.text }} />
        </div>

        <div style={{ background:"#111", borderRadius:8, padding:12, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>💳</span>
          <div>
            <div style={{ fontSize:11, color:"#888" }}>Оплата картой при оформлении</div>
            <div style={{ fontSize:12, color:"white", fontWeight:500 }}>Реквизиты карты придут на следующем шаге</div>
          </div>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:`1px solid ${C.border}`, padding:"12px 16px", zIndex:100 }}>
        <button onClick={submit} disabled={loading} style={{ width:"100%", padding:13, border:"none", background:C.primary, color:"white", fontWeight:600, fontSize:14, borderRadius:6, cursor:loading?"default":"pointer", opacity:loading?.7:1 }}>
          {loading ? "Оформляем..." : "Далее — к оплате →"}
        </button>
      </div>
    </div>
  );
}

// ── SUCCESS SCREEN ───────────────────────────────────────
function SuccessScreen({ order, onHome }) {
  return (
    <div style={{ padding:"32px 20px", maxWidth:400, margin:"0 auto" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🎉</div>
      <div style={{ fontSize:11, color:C.success, fontWeight:600, letterSpacing:.5, marginBottom:6, textTransform:"uppercase" }}>Заказ оформлен</div>
      <div style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:6 }}>Спасибо за покупку!</div>
      <div style={{ fontSize:13, color:C.textSub, marginBottom:28 }}>Свяжемся с вами по номеру {order.phone}</div>

      <div style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:600, marginBottom:14 }}>Статус доставки</div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ width:20, height:20, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Принят</div>
            <div style={{ fontSize:11, color:C.primary }}>Сейчас</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:C.textMuted, marginTop:12 }}>Следите за статусом в разделе «Профиль → Мои заказы»</div>
      </div>

      <div style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:14, marginBottom:24 }}>
        <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:500, marginBottom:6 }}>Адрес доставки</div>
        <div style={{ fontSize:13, color:C.text }}>{order.delivery_address}</div>
      </div>

      <button onClick={onHome} style={{ width:"100%", padding:13, border:`1px solid ${C.primary}`, background:"none", color:C.primary, fontWeight:600, fontSize:14, borderRadius:6, cursor:"pointer" }}>
        Продолжить покупки
      </button>
    </div>
  );
}

// ── PROFILE SCREEN ───────────────────────────────────────
function ProfileScreen({ user, onLogout, onLogin }) {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [cancelling, setCancelling] = useState(null); // order being cancelled
  const [cardForm, setCardForm]     = useState({ card:"", bank:"Uzcard" });
  const [sending, setSending]       = useState(false);

  const loadOrders = () => {
    if(!user) return;
    setLoading(true);
    request("/api/orders").then(d=>setOrders(d.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ loadOrders(); },[user]);

  const cancelOrder = async () => {
    if(!cardForm.card.trim()) return alert("Введите номер карты");
    setSending(true);
    try {
      await request(`/api/orders/${cancelling.id}/cancel`, {
        method:"POST",
        body:{ card_number: cardForm.card, bank: cardForm.bank }
      });
      setOrders(os=>os.map(o=>o.id===cancelling.id?{...o,status:"cancelled"}:o));
      setCancelling(null);
      setCardForm({ card:"", bank:"Uzcard" });
    } catch(e) { alert(e.message); }
    finally { setSending(false); }
  };

  const statusLabel = { new:"Принят", processing:"Собирается", delivery:"В пути", completed:"Доставлен", cancelled:"Отменён" };
  const statusColor = (s) => s==="completed"?C.success:s==="cancelled"?C.error:C.primary;

  if(!user) return (
    <div style={{ padding:"24px 16px", paddingBottom:80 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:20 }}>Профиль</div>
      <div style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:28, textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>👤</div>
        <div style={{ fontSize:15, fontWeight:500, color:C.text, marginBottom:6 }}>Вы не вошли</div>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:20 }}>Войдите чтобы видеть историю заказов</div>
        <button onClick={onLogin} style={{ padding:"10px 28px", border:"none", background:C.primary, color:"white", fontWeight:600, fontSize:13, borderRadius:6, cursor:"pointer" }}>Войти</button>
      </div>
    </div>
  );

  // Cancel modal
  if(cancelling) return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={()=>setCancelling(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.text, padding:0 }}>←</button>
        <span style={{ fontSize:15, fontWeight:600, color:C.text }}>Отмена заказа #{cancelling.id}</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ background:"#FEF2F2", border:`1px solid #FECACA`, borderRadius:8, padding:14, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.error, marginBottom:6 }}>Вы отменяете заказ</div>
          <div style={{ fontSize:12, color:C.textSub }}>Сумма: <strong>{fmt(cancelling.total_price)} сум</strong></div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:4 }}>Для возврата укажите номер карты — мы переведём деньги в течение 24 часов.</div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:500, color:C.textMuted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>Номер карты</label>
          <input value={cardForm.card} onChange={e=>setCardForm(f=>({...f,card:e.target.value}))} placeholder="0000 0000 0000 0000"
            style={{ width:"100%", padding:"11px 14px", border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, outline:"none", background:"white", boxSizing:"border-box", fontFamily:"inherit" }} />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, fontWeight:500, color:C.textMuted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.6 }}>Банк</label>
          <div style={{ display:"flex", gap:8 }}>
            {["Uzcard","Humo"].map(b=>(
              <button key={b} onClick={()=>setCardForm(f=>({...f,bank:b}))}
                style={{ flex:1, padding:"10px 0", border:`1px solid ${cardForm.bank===b?C.primary:C.border}`, background:cardForm.bank===b?C.primaryLight:"white", color:cardForm.bank===b?C.primary:C.textSub, fontWeight:cardForm.bank===b?600:400, fontSize:13, borderRadius:6, cursor:"pointer" }}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:C.primaryLight, border:`1px solid ${C.primaryBorder}`, borderRadius:8, padding:12, marginBottom:20, fontSize:12, color:C.textSub }}>
          По вопросам возврата: <strong style={{ color:C.text }}>+998 77 302 85 10</strong>
        </div>
      </div>
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:`1px solid ${C.border}`, padding:"12px 16px", zIndex:100 }}>
        <button onClick={cancelOrder} disabled={sending}
          style={{ width:"100%", padding:13, border:"none", background:sending?"#ccc":C.error, color:"white", fontWeight:600, fontSize:14, borderRadius:6, cursor:sending?"default":"pointer" }}>
          {sending ? "Отменяем..." : "Подтвердить отмену"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:"20px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:500, marginBottom:6 }}>Аккаунт</div>
        <div style={{ fontSize:17, fontWeight:600, color:C.text }}>{user.name}</div>
        <div style={{ fontSize:13, color:C.textSub, marginTop:2 }}>{user.phone}</div>
      </div>
      <div style={{ padding:"20px 16px" }}>
        <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:C.textMuted, fontWeight:600, marginBottom:14 }}>История заказов</div>
        {loading ? <Spinner /> : orders.length===0
          ? <div style={{ fontSize:13, color:C.textMuted, padding:"20px 0" }}>Заказов пока нет</div>
          : orders.map(o=>(
            <div key={o.id} style={{ border:`1px solid ${o.status==="cancelled"?"#FECACA":C.border}`, borderRadius:8, padding:14, marginBottom:10, background:o.status==="cancelled"?"#FFF8F8":"white" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.textMuted }}>Заказ #{o.id} · {new Date(o.created_at).toLocaleDateString("ru-RU")}</span>
                <span style={{ fontSize:11, fontWeight:600, color:statusColor(o.status) }}>{statusLabel[o.status]||o.status}</span>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:3 }}>{fmt(o.total_price)} сум</div>
              <div style={{ fontSize:12, color:C.textSub, marginBottom: o.status==="new" ? 10 : 0 }}>{o.delivery_address}</div>
              {o.status==="new" && (
                <button onClick={()=>setCancelling(o)}
                  style={{ fontSize:12, color:C.error, background:"none", border:`1px solid #FECACA`, borderRadius:6, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit", fontWeight:500 }}>
                  Отменить заказ
                </button>
              )}
              {o.status==="cancelled" && (
                <div style={{ fontSize:11, color:C.error, marginTop:4 }}>Возврат: свяжитесь с нами — +998 77 302 85 10</div>
              )}
            </div>
          ))
        }
        <button onClick={onLogout} style={{ marginTop:16, padding:"11px 0", border:`1px solid ${C.border}`, background:"none", color:C.textSub, fontSize:13, borderRadius:6, cursor:"pointer", width:"100%" }}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ───────────────────────────────────────────
function BottomNav({ tab, setTab, cartCount }) {
  const tabs = [
    { id:"home",    icon:"🏠", label:"Главная" },
    { id:"catalog", icon:"🛍️", label:"Каталог" },
    { id:"cart",    icon:"🛒", label:"Корзина"  },
    { id:"profile", icon:"👤", label:"Профиль"  },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"white", borderTop:`1px solid ${C.border}`, display:"flex", zIndex:200 }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"9px 4px 11px", border:"none", background:"none", cursor:"pointer", position:"relative" }}>
          {t.id==="cart" && cartCount>0 && (
            <div style={{ position:"absolute", top:5, right:"calc(50% - 16px)", background:C.primary, color:"white", fontSize:9, fontWeight:700, width:15, height:15, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount>9?"9+":cartCount}</div>
          )}
          <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:2, background:tab===t.id?C.primary:"transparent", borderRadius:"0 0 2px 2px", transition:"background .2s" }} />
          <span style={{ fontSize:19 }}>{t.icon}</span>
          <span style={{ fontSize:10, fontWeight:tab===t.id?600:400, color:tab===t.id?C.primary:C.textMuted, letterSpacing:.2 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser]                 = useState(null);
  const [tab, setTab]                   = useState("home");
  const [screen, setScreen]             = useState("home");
  const [selectedProd, setSelectedProd] = useState(null);
  const [cart, setCart] = useState(()=>{ try{ return JSON.parse(localStorage.getItem("kamico_cart"))||[]; }catch{ return []; } });
  const [lastOrder, setLastOrder]       = useState(null);
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(()=>{
    Promise.all([request("/api/products"), request("/api/categories")])
      .then(([p,c])=>{ setProducts(p.data||[]); setCategories(c.data||[]); })
      .catch(console.error).finally(()=>setLoading(false));
    const u = localStorage.getItem("kamico_user");
    if(u) setUser(JSON.parse(u));
  },[]);

  const cartCount = cart.reduce((s,x)=>s+x.qty, 0);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("kamico_cart", JSON.stringify(newCart));
  };

  const addToCart = (p, qty=1) => {
    const newCart = cart.find(x=>x.id===p.id)
      ? cart.map(x=>x.id===p.id?{...x,qty:x.qty+qty}:x)
      : [...cart,{...p,qty}];
    saveCart(newCart);
    setScreen("home");
  };

  const handleTabChange = (t) => { setTab(t); setScreen("home"); };

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:"white", fontFamily:"'Inter','Segoe UI',system-ui,sans-serif" }}>
      {screen==="home" && (
        <div style={{ background:"white", borderBottom:`1px solid ${C.border}`, padding:"13px 16px", position:"sticky", top:0, zIndex:150 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src="https://giyuowciomkfcqlxlkrt.supabase.co/storage/v1/object/public/kamico.store/IMG_5208.JPG" alt="Kamico" style={{ height:32, width:"auto", objectFit:"contain" }} />
              <div style={{ fontSize:17, fontWeight:700, letterSpacing:-0.3 }}>
                <span style={{ color:C.primary, fontStyle:"italic" }}>Kamico</span>
                <span style={{ color:C.text, fontWeight:900 }}> store</span>
              </div>
            </div>
            <button onClick={()=>handleTabChange("cart")}
              style={{ position:"relative", background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"6px 14px", fontSize:12, color:C.textSub, cursor:"pointer", fontFamily:"inherit" }}>
              🛒 Корзина{cartCount>0 && ` (${cartCount})`}
            </button>
          </div>
        </div>
      )}

      {screen==="auth"     && <AuthScreen onAuth={u=>{ setUser(u); setScreen("home"); setTab("profile"); }} />}
      {screen==="product"  && selectedProd && <ProductScreen product={selectedProd} categories={categories} onBack={()=>setScreen("home")} onAddCart={addToCart} isInCart={!!cart.find(x=>x.id===selectedProd.id)} onGoCart={()=>{ setTab("cart"); setScreen("home"); }} />}
      {screen==="checkout" && <CheckoutScreen cart={cart} user={user} onBack={()=>{ setTab("cart"); setScreen("home"); }} onDone={form=>{ setLastOrder(form); saveCart([]); localStorage.removeItem("kamico_cart"); setScreen("success"); }} />}
      {screen==="success"  && lastOrder && <SuccessScreen order={lastOrder} onHome={()=>{ setTab("home"); setScreen("home"); }} />}

      {screen==="home" && (
        <>
          {tab==="home"    && <HomeScreen onProduct={p=>{ setSelectedProd(p); setScreen("product"); }} categories={categories} products={products} loading={loading} />}
          {tab==="catalog" && <CatalogScreen onProduct={p=>{ setSelectedProd(p); setScreen("product"); }} categories={categories} products={products} loading={loading} />}
          {tab==="cart"    && <CartScreen cart={cart} onBack={()=>setTab("home")} onChange={(id,d)=>{ const nc=cart.map(x=>x.id===id?{...x,qty:Math.max(1,x.qty+d)}:x); saveCart(nc); }} onRemove={id=>{ const nc=cart.filter(x=>x.id!==id); saveCart(nc); }} onCheckout={()=>setScreen("checkout")} />}
          {tab==="profile" && <ProfileScreen user={user} onLogout={()=>{ localStorage.removeItem("kamico_token"); localStorage.removeItem("kamico_user"); setUser(null); }} onLogin={()=>setScreen("auth")} />}
        </>
      )}

      {!["checkout","success","product","auth"].includes(screen) && (
        <BottomNav tab={tab} setTab={handleTabChange} cartCount={cartCount} />
      )}
    </div>
  );
}
