import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/483ba43a-f264-408b-bd8b-ff3f38efaa15";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function api(action: string, method = "GET", body?: object): Promise<any> {
  const res = await fetch(`${API}?action=${action}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

type Order = { id: string; product: string; gtin: string; count: number; status: string; received: number; order_id_cz?: string; date: string };
type Code = { code: string; gtin: string; product: string; serial: string; status: string; created: string };
type Product = { name: string; total: number; used: number; pct: number };
type AnalyticsData = { total_orders: number; total_ordered: number; total_received: number; active_codes: number; used_codes: number; products: Product[] };
type SettingsData = { oms_id: string; client_token: string; api_key: string; env: string; inn: string; org_name: string; webhook_url: string; webhook_token: string; configured: boolean };

type Page = "dashboard" | "orders" | "catalog" | "analytics" | "settings";

const NAV_ITEMS = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "orders", label: "Заказы кодов", icon: "ClipboardList" },
  { id: "catalog", label: "Каталог кодов", icon: "QrCode" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  { id: "settings", label: "Настройки", icon: "Settings" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Выполнен", cls: "badge-active" },
    processing: { label: "Обрабатывается", cls: "badge-pending" },
    pending: { label: "Ожидает", cls: "badge-pending" },
    error: { label: "Ошибка", cls: "badge-error" },
    active: { label: "Активен", cls: "badge-active" },
    used: { label: "Использован", cls: "badge-used" },
  };
  const s = map[status] ?? { label: status, cls: "badge-used" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("analytics"), api("orders"), api("settings")]).then(([an, or, st]) => {
      setData(an);
      setOrders((or.orders || []).slice(0, 4));
      setConfigured(st.configured || false);
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Дашборд</h1>
        <p className="text-sm text-muted-foreground mt-1">Статистика по кодам маркировки Честного знака</p>
      </div>

      {!configured && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="AlertTriangle" size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Настройте подключение к Честному знаку</p>
            <p className="text-xs text-amber-700 mt-0.5">Перейдите в раздел «Настройки» и укажите OMS ID, Client Token и API ключ.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Всего заказов", value: loading ? "—" : (data?.total_orders ?? 0).toString(), delta: "заказов в системе", icon: "ClipboardList", color: "text-blue-500" },
          { label: "Кодов заказано", value: loading ? "—" : (data?.total_ordered ?? 0).toLocaleString("ru"), delta: "суммарно по всем заказам", icon: "QrCode", color: "text-green-500" },
          { label: "Кодов получено", value: loading ? "—" : (data?.total_received ?? 0).toLocaleString("ru"), delta: "из Честного знака", icon: "CheckCircle2", color: "text-emerald-500" },
          { label: "Активных кодов", value: loading ? "—" : (data?.active_codes ?? 0).toLocaleString("ru"), delta: "готовы к нанесению", icon: "Clock", color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
                <p className="text-2xl font-semibold mt-1 text-foreground">{loading ? <Spinner /> : s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.delta}</p>
              </div>
              <Icon name={s.icon} size={20} className={s.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Последние заказы</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Заказов пока нет</p>
          ) : (
            <div>
              {orders.map((o) => (
                <div key={o.id} className="data-table-row flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{o.product}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <p className="text-xs text-muted-foreground mt-1">{o.count} кодов · {o.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Утилизация по товарам</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (data?.products || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Данных пока нет</p>
          ) : (
            <div className="space-y-3">
              {(data?.products || []).slice(0, 5).map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground truncate max-w-[200px]">{p.name}</span>
                    <span className="text-muted-foreground ml-2">{p.pct}%</span>
                  </div>
                  <div className="bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Статус подключения</h2>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${configured ? "bg-green-500 animate-pulse" : "bg-amber-400"}`} />
          <span className="text-sm text-foreground">
            {configured ? "API Честного знака настроен и подключён" : "Требуется настройка API"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── ORDERS ───────────────────────────────────────────────────────────────────
function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ gtin: "", product: "", count: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    api("orders").then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const createOrder = async () => {
    if (!form.gtin || !form.product || !form.count) {
      setMsg({ text: "Заполните GTIN, наименование и количество", ok: false });
      return;
    }
    setSubmitting(true);
    const res = await api("create_order", "POST", { ...form, count: parseInt(form.count) });
    setSubmitting(false);
    if (res.ok) {
      setMsg({ text: `Заказ ${res.order.id} создан`, ok: true });
      setShowNew(false);
      setForm({ gtin: "", product: "", count: "", comment: "" });
      loadOrders();
    } else {
      setMsg({ text: res.message || "Ошибка создания заказа", ok: false });
    }
    setTimeout(() => setMsg(null), 4000);
  };

  const syncOrder = async (orderId: string) => {
    setSyncing(orderId);
    const res = await api("sync_order", "POST", { order_id: orderId });
    setSyncing(null);
    if (res.ok) loadOrders();
    else setMsg({ text: res.message || "Ошибка синхронизации", ok: false });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Заказы кодов маркировки</h1>
          <p className="text-sm text-muted-foreground mt-1">Создание и управление заказами через Честный знак</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-foreground text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} />Новый заказ
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${msg.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          <Icon name={msg.ok ? "CheckCircle2" : "AlertCircle"} size={15} />
          {msg.text}
        </div>
      )}

      {showNew && (
        <div className="bg-white border border-border rounded-lg p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Новый заказ кодов маркировки</h2>
            <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground"><Icon name="X" size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">GTIN товара *</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="04607097010230" value={form.gtin} onChange={e => setForm(f => ({ ...f, gtin: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Наименование товара *</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Молоко 3.2% 1л" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Количество кодов *</label>
              <input type="number" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="500" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Комментарий</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Необязательно" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createOrder} disabled={submitting} className="flex items-center gap-2 bg-foreground text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting && <Spinner />} Отправить заказ в ЧЗ
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors">Отмена</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">История заказов</h2>
          <button onClick={loadOrders} className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Icon name="RefreshCw" size={13} />Обновить
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Заказов пока нет. Создайте первый заказ кодов маркировки.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">ID заказа</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Товар</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">GTIN</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Кол-во</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Получено</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Дата</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="data-table-row">
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground">{o.id}</td>
                  <td className="px-5 py-3.5 text-foreground">{o.product}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{o.gtin}</td>
                  <td className="px-5 py-3.5 text-right">{o.count.toLocaleString("ru")}</td>
                  <td className="px-5 py-3.5 text-right">{o.received.toLocaleString("ru")}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{o.date}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5">
                    {o.order_id_cz && (
                      <button onClick={() => syncOrder(o.id)} disabled={syncing === o.id} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        {syncing === o.id ? <Spinner /> : <Icon name="RefreshCw" size={13} />}
                        Синхр.
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── CATALOG ──────────────────────────────────────────────────────────────────
function Catalog() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ action: "codes", status: filterStatus });
    if (search) params.set("search", search);
    fetch(`${API}?${params}`).then(r => r.json()).then(d => {
      setCodes(d.codes || []);
      setTotal(d.total || 0);
      setLoading(false);
    });
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Каталог кодов маркировки</h1>
          <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString("ru")} кодов в базе данных</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full border border-border rounded-md pl-8 pr-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Поиск по коду, GTIN, товару..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {[["all", "Все"], ["active", "Активные"], ["used", "Использованные"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilterStatus(val)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterStatus === val ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>{lbl}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : codes.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {total === 0 ? "Коды появятся после получения заказа из Честного знака" : "Коды не найдены по заданным критериям"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Код маркировки</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Товар</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">GTIN</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Серийный №</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Создан</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="data-table-row">
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground max-w-xs">
                    <span className="truncate block" title={c.code}>{c.code.slice(0, 28)}…</span>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{c.product}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{c.gtin}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground">{c.serial}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.created}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground transition-colors" title="Скопировать код">
                      <Icon name="Copy" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Показано {codes.length} из {total.toLocaleString("ru")} кодов</span>
        </div>
      </div>
    </div>
  );
}

// ── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("analytics").then((d: AnalyticsData) => { setData(d); setLoading(false); });
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Аналитика</h1>
          <p className="text-sm text-muted-foreground mt-1">Статистика и данные по маркировке</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Всего заказов", value: data?.total_orders ?? 0, sub: "в системе" },
          { label: "Кодов заказано", value: (data?.total_ordered ?? 0).toLocaleString("ru"), sub: "суммарно" },
          { label: "Кодов получено", value: (data?.total_received ?? 0).toLocaleString("ru"), sub: "из Честного знака" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
            {loading ? <div className="mt-2"><Spinner /></div> : <p className="text-2xl font-semibold mt-1 text-foreground">{s.value}</p>}
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Утилизация по товарам</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (data?.products || []).length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Данные появятся после создания заказов</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Товар</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Заказано</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Получено</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Выполнение</th>
              </tr>
            </thead>
            <tbody>
              {(data?.products || []).map((p) => (
                <tr key={p.name} className="data-table-row">
                  <td className="px-5 py-3.5 text-foreground">{p.name}</td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground">{p.total.toLocaleString("ru")}</td>
                  <td className="px-5 py-3.5 text-right text-foreground">{p.used.toLocaleString("ru")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${p.pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-10 text-right">{p.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings() {
  const [form, setForm] = useState({
    oms_id: "", client_token: "", api_key: "",
    env: "sandbox", inn: "", org_name: "",
    webhook_url: "", webhook_token: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [checkResult, setCheckResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    api("settings").then((d: SettingsData) => {
      setForm(f => ({
        ...f,
        oms_id: d.oms_id || "",
        client_token: d.client_token || "",
        api_key: d.api_key || "",
        env: d.env || "sandbox",
        inn: d.inn || "",
        org_name: d.org_name || "",
        webhook_url: d.webhook_url || "",
        webhook_token: d.webhook_token || "",
      }));
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await api("settings", "POST", form);
    setSaving(false);
    setMsg({ text: res.message || (res.ok ? "Сохранено" : "Ошибка"), ok: !!res.ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const check = async () => {
    setChecking(true);
    setCheckResult(null);
    const res = await api("check", "POST", {});
    setChecking(false);
    setCheckResult({ ok: res.ok, message: res.message });
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Конфигурация подключения к Честному знаку (ГИС МТ)</p>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${msg.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          <Icon name={msg.ok ? "CheckCircle2" : "AlertCircle"} size={15} />
          {msg.text}
        </div>
      )}

      <div className="bg-white border border-border rounded-lg p-5 space-y-5">
        {/* API ЧЗ */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">API Честного знака</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Среда</label>
              <div className="flex gap-2">
                {[["sandbox", "Тестовая"], ["production", "Боевая"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, env: val }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${form.env === val ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">OMS ID</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                value={form.oms_id} onChange={e => setForm(f => ({ ...f, oms_id: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Token</label>
              <div className="relative">
                <input type={showToken ? "text" : "password"}
                  className="w-full border border-border rounded-md px-3 py-2 pr-9 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="eyJhbGciOiJSUzI1NiJ9..."
                  value={form.client_token} onChange={e => setForm(f => ({ ...f, client_token: e.target.value }))} />
                <button onClick={() => setShowToken(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name={showToken ? "EyeOff" : "Eye"} size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">API ключ</label>
              <div className="relative">
                <input type={showKey ? "text" : "password"}
                  className="w-full border border-border rounded-md px-3 py-2 pr-9 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} />
                <button onClick={() => setShowKey(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name={showKey ? "EyeOff" : "Eye"} size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Организация */}
        <div className="border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Организация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">ИНН</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="7707123456" value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Наименование</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder='ООО "МолПродукт"' value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">API для внешних систем учёта</h2>
          <div className="bg-muted/40 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Webhook URL</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="https://erp.company.ru/webhook/marking"
                value={form.webhook_url} onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Bearer токен для ERP/WMS</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Bearer token..."
                value={form.webhook_token} onChange={e => setForm(f => ({ ...f, webhook_token: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-foreground text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving && <Spinner />} Сохранить настройки
          </button>
          <button onClick={check} disabled={checking} className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
            {checking && <Spinner />} Проверить подключение
          </button>
          {checkResult && (
            <span className={`flex items-center gap-1.5 text-sm ${checkResult.ok ? "text-green-600" : "text-red-600"}`}>
              <Icon name={checkResult.ok ? "CheckCircle2" : "XCircle"} size={15} />
              {checkResult.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    orders: <Orders />,
    catalog: <Catalog />,
    analytics: <Analytics />,
    settings: <Settings />,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
        <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center">
              <Icon name="QrCode" size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[hsl(var(--sidebar-accent-foreground))] leading-tight">МаркировкаПро</p>
              <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] leading-tight">Честный знак</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setPage(item.id as Page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                page === item.id
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
              }`}>
              <Icon name={item.icon} size={16} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="px-3 py-2.5">
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60">ГИС МТ · Молочная продукция</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {pages[page]}
        </div>
      </main>
    </div>
  );
}