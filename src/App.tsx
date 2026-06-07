import { useState } from "react";
import Icon from "@/components/ui/icon";

type Page = "dashboard" | "orders" | "catalog" | "analytics" | "settings";

const NAV_ITEMS = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "orders", label: "Заказы кодов", icon: "ClipboardList" },
  { id: "catalog", label: "Каталог кодов", icon: "QrCode" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  { id: "settings", label: "Настройки", icon: "Settings" },
] as const;

const ORDERS = [
  { id: "ORD-2026-001", product: "Молоко 3.2% 1л", gtin: "04607097010230", count: 500, status: "completed", date: "05.06.2026", received: 500 },
  { id: "ORD-2026-002", product: "Сыр Гауда 400г", gtin: "04607097010247", count: 1000, status: "processing", date: "06.06.2026", received: 0 },
  { id: "ORD-2026-003", product: "Кефир 2.5% 900мл", gtin: "04607097010254", count: 300, status: "pending", date: "07.06.2026", received: 0 },
  { id: "ORD-2026-004", product: "Масло сливочное 82.5%", gtin: "04607097010261", count: 750, status: "completed", date: "04.06.2026", received: 750 },
  { id: "ORD-2026-005", product: "Йогурт питьевой 430мл", gtin: "04607097010278", count: 200, status: "error", date: "03.06.2026", received: 0 },
];

const CODES = [
  { code: "010460709701023021LD9KQ3CE7JE", gtin: "04607097010230", product: "Молоко 3.2% 1л", status: "active", created: "05.06.2026", serial: "LD9KQ3CE7JE" },
  { code: "010460709701023021MK8PR4DF8IH", gtin: "04607097010230", product: "Молоко 3.2% 1л", status: "active", created: "05.06.2026", serial: "MK8PR4DF8IH" },
  { code: "010460709701024721NL0QS5EG9JI", gtin: "04607097010247", product: "Сыр Гауда 400г", status: "used", created: "01.06.2026", serial: "NL0QS5EG9JI" },
  { code: "010460709701025421OM1RT6FH0KJ", gtin: "04607097010254", product: "Кефир 2.5% 900мл", status: "active", created: "05.06.2026", serial: "OM1RT6FH0KJ" },
  { code: "010460709701026121PN2SU7GI1LK", gtin: "04607097010261", product: "Масло сливочное 82.5%", status: "active", created: "04.06.2026", serial: "PN2SU7GI1LK" },
  { code: "010460709701027821QO3TV8HJ2ML", gtin: "04607097010278", product: "Йогурт питьевой 430мл", status: "used", created: "03.06.2026", serial: "QO3TV8HJ2ML" },
];

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
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Dashboard() {
  const stats = [
    { label: "Всего заказов", value: "1 248", delta: "+12 за неделю", icon: "ClipboardList", color: "text-blue-500" },
    { label: "Кодов получено", value: "84 320", delta: "+2 750 за неделю", icon: "QrCode", color: "text-green-500" },
    { label: "Кодов использовано", value: "71 540", delta: "84.8% утилизация", icon: "CheckCircle2", color: "text-emerald-500" },
    { label: "Ожидают обработки", value: "3", delta: "2 заказа в очереди", icon: "Clock", color: "text-amber-500" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Дашборд</h1>
        <p className="text-sm text-muted-foreground mt-1">Статистика по кодам маркировки Честного знака</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
                <p className="text-2xl font-semibold mt-1 text-foreground">{s.value}</p>
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
          <div className="space-y-0">
            {ORDERS.slice(0, 4).map((o) => (
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
        </div>

        <div className="bg-white border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Активность по дням</h2>
          <div className="flex items-end gap-1.5 h-32">
            {[42, 28, 65, 80, 55, 90, 73, 48, 62, 85, 70, 95, 60, 45].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div
                  className="rounded-sm bg-blue-500 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>25 мая</span>
            <span>7 июня 2026</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Статус подключения к Честному знаку</h2>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-foreground">API подключён · GTIN активен · Последняя синхронизация: 07.06.2026 14:32</span>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ gtin: "", product: "", count: "", comment: "" });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Заказы кодов маркировки</h1>
          <p className="text-sm text-muted-foreground mt-1">Создание и управление заказами через Честный знак</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-foreground text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="Plus" size={16} />
          Новый заказ
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-border rounded-lg p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Новый заказ кодов маркировки</h2>
            <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">GTIN товара</label>
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="04607097010230"
                value={form.gtin}
                onChange={e => setForm(f => ({ ...f, gtin: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Наименование товара</label>
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Молоко 3.2% 1л"
                value={form.product}
                onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Количество кодов</label>
              <input
                type="number"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="500"
                value={form.count}
                onChange={e => setForm(f => ({ ...f, count: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Комментарий</label>
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Необязательно"
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="bg-foreground text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Отправить заказ в ЧЗ
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">История заказов</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="border border-border rounded-md pl-8 pr-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring w-48" placeholder="Поиск по ID или GTIN..." />
            </div>
            <button className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
              <Icon name="Download" size={13} />
              Экспорт
            </button>
          </div>
        </div>
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
            {ORDERS.map((o) => (
              <tr key={o.id} className="data-table-row">
                <td className="px-5 py-3.5 font-mono text-xs text-foreground">{o.id}</td>
                <td className="px-5 py-3.5 text-foreground">{o.product}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{o.gtin}</td>
                <td className="px-5 py-3.5 text-right">{o.count.toLocaleString("ru")}</td>
                <td className="px-5 py-3.5 text-right">{o.received.toLocaleString("ru")}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{o.date}</td>
                <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3.5">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="MoreHorizontal" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Catalog() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = CODES.filter(c => {
    const matchSearch = c.code.includes(search) || c.product.toLowerCase().includes(search.toLowerCase()) || c.gtin.includes(search);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Каталог кодов маркировки</h1>
          <p className="text-sm text-muted-foreground mt-1">84 320 кодов в базе данных</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Icon name="Upload" size={15} />
            Импорт
          </button>
          <button className="flex items-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Icon name="Download" size={15} />
            Экспорт CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full border border-border rounded-md pl-8 pr-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Поиск по коду, GTIN, товару..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {[["all", "Все"], ["active", "Активные"], ["used", "Использованные"]].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterStatus === val ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

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
            {filtered.map((c) => (
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
                  <button className="text-muted-foreground hover:text-foreground transition-colors" title="Скопировать код">
                    <Icon name="Copy" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Коды не найдены по заданным критериям
          </div>
        )}

        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Показано {filtered.length} из 84 320 кодов</span>
          <div className="flex gap-1">
            <button className="px-2 py-1 border border-border rounded hover:bg-muted transition-colors"><Icon name="ChevronLeft" size={13} /></button>
            <button className="px-2 py-1 border border-border rounded hover:bg-muted transition-colors"><Icon name="ChevronRight" size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Analytics() {
  const products = [
    { name: "Молоко 3.2% 1л", total: 24000, used: 21500, pct: 89.6 },
    { name: "Масло сливочное 82.5%", total: 18500, used: 15200, pct: 82.2 },
    { name: "Сыр Гауда 400г", total: 14000, used: 10800, pct: 77.1 },
    { name: "Кефир 2.5% 900мл", total: 10500, used: 7400, pct: 70.5 },
    { name: "Йогурт питьевой 430мл", total: 8200, used: 4300, pct: 52.4 },
    { name: "Творог 9% 200г", total: 6120, used: 5800, pct: 94.8 },
  ];

  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];
  const ordered = [12000, 18500, 15000, 22000, 19500, 24000];
  const usedArr = [9000, 15200, 12800, 18500, 16200, 21500];
  const maxV = Math.max(...ordered);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Аналитика</h1>
          <p className="text-sm text-muted-foreground mt-1">Статистика и экспорт данных по маркировке</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Icon name="Download" size={15} />
            Скачать отчёт
          </button>
          <button className="flex items-center gap-1.5 bg-foreground text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            <Icon name="FileSpreadsheet" size={15} />
            Экспорт Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Заказано за период", value: "111 000", sub: "с января 2026" },
          { label: "Использовано", value: "71 540", sub: "64.5% от заказанных" },
          { label: "Среднее за месяц", value: "18 500", sub: "кодов маркировки" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Динамика заказов и использования</h2>
        <p className="text-xs text-muted-foreground mb-5">Январь — Июнь 2026</p>
        <div className="flex items-end gap-4 h-40">
          {months.map((m, i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: "128px" }}>
                <div className="w-5/12 bg-blue-500 rounded-t-sm opacity-80" style={{ height: `${(ordered[i] / maxV) * 100}%` }} />
                <div className="w-5/12 bg-green-500 rounded-t-sm opacity-70" style={{ height: `${(usedArr[i] / maxV) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{m}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-80" /> Заказано
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-green-500 opacity-70" /> Использовано
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Утилизация по товарам</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left">
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Товар</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Заказано</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Использовано</th>
              <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Утилизация</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
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
      </div>
    </div>
  );
}

function Settings() {
  const [omsId, setOmsId] = useState("1234567890abcdef");
  const [env, setEnv] = useState("production");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Конфигурация подключения к Честному знаку (ГИС МТ)</p>
      </div>

      <div className="bg-white border border-border rounded-lg p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">API Честного знака</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Среда</label>
              <div className="flex gap-2">
                {[["production", "Боевая"], ["sandbox", "Тестовая"]].map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setEnv(val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${env === val ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">OMS ID</label>
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                value={omsId}
                onChange={e => setOmsId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">API ключ</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue="sk_live_••••••••••••••••••••••••••••••••"
                />
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="Eye" size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Token</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue="ct_••••••••••••••••••••••••••••••••"
                />
                <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="Eye" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">API для внешних систем учёта</h2>
          <div className="bg-muted/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Webhook URL</p>
                <p className="text-xs text-muted-foreground mt-0.5">Отправка уведомлений при получении кодов</p>
              </div>
            </div>
            <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring" placeholder="https://erp.company.ru/webhook/marking" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Токен авторизации для исходящих запросов</p>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Bearer token для ERP/WMS" />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Организация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">ИНН</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="7707123456" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Наименование</label>
              <input className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder='ООО "МолПродукт"' />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="bg-foreground text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {saved ? "Сохранено ✓" : "Сохранить настройки"}
          </button>
          <button className="border border-border px-4 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors">
            Проверить подключение
          </button>
        </div>
      </div>
    </div>
  );
}

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
            <button
              key={item.id}
              onClick={() => setPage(item.id as Page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                page === item.id
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
              }`}
            >
              <Icon name={item.icon} size={16} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-[hsl(var(--sidebar-foreground))]">API подключён</span>
            </div>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60">Боевая среда · ГИС МТ</p>
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