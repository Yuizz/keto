import React, { useState, useEffect, useMemo } from "react";

// ---------- Storage ----------
const STORAGE_KEY = "keto:tracker:v1";

const DEFAULT_DATA = {
  days: {},        // "YYYY-MM-DD" -> { aguaDespertar, licuado, desayuno, comida, cena, omega3, multivit, refrigerio, mineralSal, magnesio, water }
  shopping: {},    // itemId -> true (checked / ya tengo)
  waterTarget: 12, // vasos de 250ml = 3L
};

// ---------- Plan data (del PDF de la nutrióloga) ----------
const DAILY_CORE = [
  { key: "aguaDespertar", label: "Vaso de agua al despertar", icon: "droplet" },
  { key: "licuado", label: "Licuado verde", icon: "leaf" },
  { key: "desayuno", label: "Desayuno", icon: "sunrise" },
  { key: "comida", label: "Comida", icon: "utensils" },
  { key: "cena", label: "Cena", icon: "moon" },
  { key: "omega3", label: "Omega 3 · 2 cápsulas", icon: "fish" },
  { key: "multivit", label: "Multivitamínico", icon: "pill" },
];
const CORE_KEYS = DAILY_CORE.map((d) => d.key);

const DAILY_EXTRA = [
  { key: "refrigerio", label: "Refrigerio (elige 1)", icon: "bowl" },
  { key: "mineralSal", label: "Agua mineral con sal", icon: "salt" },
  { key: "magnesio", label: "Magnesio (solo si hay estreñimiento)", icon: "pill" },
];

const LICUADO = {
  title: "Licuado verde",
  note: "Tómalo a diario, después del vaso de agua.",
  items: [
    "½ pepino sin semillas",
    "1 barita de apio",
    "¼ taza de frutos rojos",
    "1 cm de jengibre",
    "jugo de 1 limón",
  ],
};

const MENUS = [
  {
    id: "A",
    name: "Día A",
    meals: [
      {
        slot: "Desayuno",
        name: "Green omelette",
        items: [
          "3 huevos + 1 taza de espinacas + sal",
          "2 cdas de aceite de aguacate",
          "Relleno: 80 g de queso + 5 jitomates cherry",
          "Doblar y servir",
        ],
      },
      {
        slot: "Comida",
        name: "Proteína + verdura",
        items: [
          "180 g de pollo, pescado o res",
          "2 cdas de aceite de aguacate / aderezo / mantequilla / mayonesa",
          "2 tazas de verduras de hoja verde",
          "6 rebanadas de aguacate",
        ],
      },
      {
        slot: "Cena",
        name: "Tortitas de verdura",
        items: [
          "1 taza de espinaca picada + ¼ taza de calabacita rallada + 1 pimiento",
          "3 huevos + sal y pimienta",
          "50 g de queso Oaxaca",
          "Formar tortitas con aceite de aguacate y dorar por ambos lados",
        ],
      },
    ],
  },
  {
    id: "B",
    name: "Día B",
    meals: [
      {
        slot: "Desayuno",
        name: "Huevos con jamón y verdura",
        items: [
          "3 huevos + 1 cda de aceite + 3 reb. de jamón de pavo",
          "2 tazas de verdura verde",
          "5 rebanadas de aguacate",
        ],
      },
      {
        slot: "Comida",
        name: "Proteína + verdura",
        items: [
          "180 g de pollo, pescado o res",
          "2 cdas de aceite de aguacate / aderezo / mantequilla / mayonesa",
          "2 tazas de verduras de hoja verde",
          "6 rebanadas de aguacate",
        ],
      },
      {
        slot: "Cena",
        name: "Ensalada de atún",
        items: [
          "2 latas de atún en agua + 2 cdas de mayonesa o ½ aguacate",
          "2 tazas de verdura al gusto",
        ],
      },
    ],
  },
];

const REFRIGERIOS = [
  {
    name: "Pistaches enchilados",
    items: [
      "15 pz de pistache",
      "1 cda de chile en polvo",
      "jugo de ½ limón",
      "1 cda de chamoy sin azúcar",
      "Reposar 10 min",
    ],
  },
  {
    name: "Mix de pepino",
    items: [
      "2 tazas de pepino picado",
      "20 cacahuates enchilados o salados",
      "2 cdas de chamoy sin azúcar (Splenda o monk fruit)",
    ],
  },
  {
    name: "Verdura con parmesano",
    items: [
      "1 taza de brócoli + 2 pz de calabaza",
      "1 cda de aceite de oliva + 1 cda de parmesano",
      "sal y pimienta · horno 20 min a 180 °C",
    ],
  },
];

const SHOPPING = [
  {
    group: "Proteínas",
    items: [
      { name: "Huevos", qty: "~3 docenas" },
      { name: "Pollo", qty: "~500 g" },
      { name: "Pescado", qty: "~400 g" },
      { name: "Carne de res", qty: "~400 g" },
      { name: "Jamón de pavo", qty: "1 paquete" },
      { name: "Atún en agua", qty: "6 latas" },
    ],
  },
  {
    group: "Quesos",
    items: [
      { name: "Queso (manchego/panela)", qty: "~350 g" },
      { name: "Queso Oaxaca", qty: "~250 g" },
      { name: "Queso parmesano", qty: "~80 g" },
    ],
  },
  {
    group: "Verduras",
    items: [
      { name: "Espinaca", qty: "2–3 manojos" },
      { name: "Hoja verde (lechuga, etc.)", qty: "2 piezas" },
      { name: "Jitomate cherry", qty: "1 paquete (250 g)" },
      { name: "Calabacita", qty: "3–4 piezas" },
      { name: "Pimiento", qty: "4 piezas" },
      { name: "Brócoli", qty: "1 pieza" },
      { name: "Pepino", qty: "5–6 piezas" },
      { name: "Apio", qty: "1 manojo" },
    ],
  },
  {
    group: "Frutas permitidas",
    items: [
      { name: "Aguacate", qty: "8–10 piezas" },
      { name: "Frutos rojos", qty: "1 caja (250 g)" },
      { name: "Limón", qty: "8–10 piezas" },
    ],
  },
  {
    group: "Grasas",
    items: [
      { name: "Aceite de aguacate", qty: "1 botella" },
      { name: "Aceite de oliva extra virgen", qty: "1 botella" },
      { name: "Mantequilla", qty: "1 barra" },
      { name: "Mayonesa", qty: "1 frasco" },
    ],
  },
  {
    group: "Frutos secos",
    items: [
      { name: "Pistaches", qty: "1 bolsa" },
      { name: "Cacahuates", qty: "1 bolsa" },
      { name: "Almendras", qty: "1 bolsa" },
      { name: "Nueces", qty: "1 bolsa" },
    ],
  },
  {
    group: "Despensa",
    items: [
      { name: "Chamoy sin azúcar", qty: "1 frasco" },
      { name: "Chile en polvo", qty: "1 frasco" },
      { name: "Sal", qty: "1 paquete" },
      { name: "Jengibre", qty: "1 trozo" },
      { name: "Gelatina sin azúcar", qty: "2–3 cajas" },
      { name: "Monk fruit / Splenda", qty: "1 caja" },
      { name: "Agua mineral (Peñafiel twist)", qty: "1 six-pack" },
    ],
  },
  {
    group: "Suplementos",
    items: [
      { name: "Multivitamínico Centrum Silver", qty: "1 frasco" },
      { name: "Omega 3", qty: "1 frasco (≥60 caps)" },
      { name: "Magnesio 300–400 mg (por si acaso)", qty: "1 frasco" },
    ],
  },
];

const AVOID = [
  "Harinas, cereales y leguminosas",
  "Frutas (solo las indicadas) y almidones",
  "Leche de vaca y azúcares",
  "Etiquetas: evita lecitina de soya, sacarosa, sucralosa y polialcoholes",
];

// ---------- Helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => toKey(new Date());
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS = ["L","M","M","J","V","S","D"];

// Omega 3 son 2 cápsulas independientes; el esencial cuenta con ambas.
// Compat: datos viejos guardaban omega3 boolean (true = ambas).
const omega3Done = (day) => day.omega3 === true || (!!day.omega3a && !!day.omega3b);

// Migra datos viejos: omega3 boolean -> dos cápsulas (omega3a/omega3b).
function migrate(data) {
  Object.values(data.days || {}).forEach((day) => {
    if (day.omega3 === true) { day.omega3a = true; day.omega3b = true; }
    if ("omega3" in day) delete day.omega3;
  });
  return data;
}

function dayCompletion(day, waterTarget) {
  if (!day) return 0;
  let done = 0;
  CORE_KEYS.forEach((k) => {
    if (k === "omega3") { if (omega3Done(day)) done++; }
    else if (day[k]) done++;
  });
  if ((day.water || 0) >= waterTarget) done++;
  return done / (CORE_KEYS.length + 1);
}
const isComplete = (day, t) => dayCompletion(day, t) >= 0.999;

function computeStreak(days, waterTarget) {
  let streak = 0;
  const d = new Date();
  // si hoy aún no está completo, empieza a contar desde ayer
  if (!isComplete(days[toKey(d)], waterTarget)) d.setDate(d.getDate() - 1);
  while (isComplete(days[toKey(d)], waterTarget)) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ---------- Respaldo (export / import) ----------
// Descarga todo el estado como .json para respaldo o pasar de dispositivo.
function exportData(data) {
  const payload = JSON.stringify({ _app: "ruta-keto", _v: 1, ...data }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ruta-keto-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Lee un .json exportado y devuelve un estado saneado (merge con defaults).
function parseImport(raw) {
  const obj = JSON.parse(raw);
  if (!obj || typeof obj !== "object") throw new Error("Archivo inválido");
  return migrate({
    days: obj.days && typeof obj.days === "object" ? obj.days : {},
    shopping: obj.shopping && typeof obj.shopping === "object" ? obj.shopping : {},
    waterTarget: Number.isFinite(obj.waterTarget) ? obj.waterTarget : DEFAULT_DATA.waterTarget,
  });
}

// ---------- Icons (SVG de línea) ----------
function Icon({ name, size = 20, stroke = "currentColor", style }) {
  const c = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style,
  };
  switch (name) {
    case "droplet":
      return <svg {...c}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>;
    case "leaf":
      return <svg {...c}><path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14" /><path d="M5 19c2-5 5-7 9-8" /></svg>;
    case "sunrise":
      return <svg {...c}><path d="M12 3v3M5 8l1.6 1.6M19 8l-1.6 1.6M2 18h20M4.5 14h2M17.5 14h2" /><path d="M8 18a4 4 0 0 1 8 0" /></svg>;
    case "utensils":
      return <svg {...c}><path d="M4 3v6a2 2 0 0 0 4 0V3M6 11v10" /><path d="M17 3c-1.4 0-2.5 1.6-2.5 4.5S16 11 17 11m0-8v18" /></svg>;
    case "moon":
      return <svg {...c}><path d="M20 13A8 8 0 0 1 11 4a7 7 0 1 0 9 9Z" /></svg>;
    case "fish":
      return <svg {...c}><path d="M3 12c3-5 9-6 14-3 1.8 1.1 4 3 4 3s-2.2 1.9-4 3c-5 3-11 2-14-3Z" /><path d="M3 12s2.5 1.5 2.5 0S3 12 3 12Z" /><circle cx="15" cy="10.5" r=".6" fill={stroke} stroke="none" /></svg>;
    case "pill":
      return <svg {...c}><rect x="3" y="8" width="18" height="8" rx="4" /><path d="M12 8v8" /></svg>;
    case "bowl":
      return <svg {...c}><path d="M3 11h18a8 8 0 0 1-16 0Z" /><path d="M12 11V7M9 11V8.5" /></svg>;
    case "salt":
      return <svg {...c}><path d="M8 8h8l-1 12H9L8 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /><path d="M11 4.2v.8M13 4.2v.8M12 3v1" /></svg>;
    case "check":
      return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="m8.4 12 2.6 2.6 4.6-5.2" /></svg>;
    case "flame":
      return <svg {...c}><path d="M12 3c1.2 3-2 4.5-2 7.5a2 2 0 0 0 4 0c0-.8 0-1.2.4-1.8 1.4 1.4 2.6 3 2.6 5.3a5 5 0 0 1-10 0C7 11 9.6 8 12 3Z" /></svg>;
    case "cart":
      return <svg {...c}><circle cx="9.5" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /><path d="M2.5 3.5H5l2.3 12.5h11l1.9-9H6" /></svg>;
    case "book":
      return <svg {...c}><path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V4Z" /><path d="M17 6h2v14H7" /></svg>;
    case "sparkle":
      return <svg {...c}><path d="M12 3.5 13.7 9 19 10.5 13.7 12 12 17.5 10.3 12 5 10.5 10.3 9 12 3.5Z" /></svg>;
    case "download":
      return <svg {...c}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>;
    case "upload":
      return <svg {...c}><path d="M12 21V9" /><path d="m7 13 5-5 5 5" /><path d="M5 3h14" /></svg>;
    case "refresh":
      return <svg {...c}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" /></svg>;
    default:
      return null;
  }
}

// ---------- App ----------
export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("hoy");
  const [menuDay, setMenuDay] = useState("A");
  const [calOffset, setCalOffset] = useState(0);

  // load (localStorage — funciona offline y persiste en el dispositivo)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(migrate({ ...DEFAULT_DATA, ...JSON.parse(raw) }));
    } catch (e) {
      console.error("No se pudo leer el guardado", e);
    }
    setReady(true);
  }, []);

  // save
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { console.error("No se pudo guardar", e); }
  }, [data, ready]);

  const tk = todayKey();
  const today = data.days[tk] || {};
  const target = data.waterTarget;
  const progress = dayCompletion(today, target);
  const streak = useMemo(() => computeStreak(data.days, target), [data.days, target]);

  const toggle = (key) =>
    setData((prev) => {
      const day = { ...(prev.days[tk] || {}) };
      day[key] = !day[key];
      return { ...prev, days: { ...prev.days, [tk]: day } };
    });

  const setWater = (delta) =>
    setData((prev) => {
      const day = { ...(prev.days[tk] || {}) };
      day.water = Math.max(0, Math.min(20, (day.water || 0) + delta));
      return { ...prev, days: { ...prev.days, [tk]: day } };
    });

  const toggleShop = (id) =>
    setData((prev) => {
      const shopping = { ...prev.shopping };
      shopping[id] = !shopping[id];
      return { ...prev, shopping };
    });

  // desmarca toda la lista del súper (para empezar una compra nueva)
  const resetShopping = () =>
    setData((prev) => ({ ...prev, shopping: {} }));

  // importa un respaldo .json reemplazando el estado actual
  const importFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(parseImport(String(reader.result)));
      } catch (e) {
        alert("No se pudo importar el archivo: " + e.message);
      }
    };
    reader.onerror = () => alert("No se pudo leer el archivo.");
    reader.readAsText(file);
  };

  if (!ready) {
    return (
      <div style={S.boot}>
        <span style={{ fontFamily: "var(--display)", fontSize: 22 }}>cargando…</span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <div style={S.shell}>
        <Header progress={progress} streak={streak} />

        <main style={S.main}>
          {tab === "hoy" && (
            <Hoy
              today={today}
              target={target}
              progress={progress}
              toggle={toggle}
              setWater={setWater}
            />
          )}
          {tab === "menus" && (
            <Menus menuDay={menuDay} setMenuDay={setMenuDay} />
          )}
          {tab === "constancia" && (
            <Constancia
              days={data.days}
              target={target}
              streak={streak}
              offset={calOffset}
              setOffset={setCalOffset}
              onExport={() => exportData(data)}
              onImport={importFromFile}
            />
          )}
          {tab === "super" && (
            <Super shopping={data.shopping} toggleShop={toggleShop} resetShopping={resetShopping} />
          )}
        </main>

        <Nav tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

// ---------- Header ----------
function Header({ progress, streak }) {
  const now = new Date();
  const fecha = `${now.getDate()} de ${MESES[now.getMonth()].toLowerCase()}`;
  const r = 26, c = 2 * Math.PI * r;
  return (
    <header style={S.header}>
      <div>
        <div style={S.kicker}>Ruta keto</div>
        <div style={S.fecha}>{fecha}</div>
        <div style={S.racha}>
          <Icon name="flame" size={14} stroke="var(--accent)" />
          {streak > 0 ? `${streak} ${streak === 1 ? "día" : "días"} de constancia` : "empieza tu racha hoy"}
        </div>
      </div>
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--ring-bg)" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r} fill="none" stroke="var(--accent)" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            style={{ transition: "stroke-dashoffset .5s ease" }}
          />
        </svg>
        <div style={S.ringText}>{Math.round(progress * 100)}%</div>
      </div>
    </header>
  );
}

// ---------- Hoy ----------
function Hoy({ today, target, progress, toggle, setWater }) {
  const water = today.water || 0;
  const liters = (water * 0.25).toFixed(2);
  return (
    <div style={S.page}>
      {progress >= 0.999 && (
        <div style={S.win}>
          <Icon name="sparkle" size={16} stroke="#fff" />
          ¡Día completo! Sumaste a tu constancia
        </div>
      )}

      <Card title="Esenciales del día">
        {DAILY_CORE.map((d) =>
          d.key === "omega3" ? (
            <Omega3Row key={d.key} day={today} toggle={toggle} />
          ) : (
            <Check key={d.key} item={d} on={!!today[d.key]} onClick={() => toggle(d.key)} />
          )
        )}
      </Card>

      <Card title="Hidratación" sub={`Meta: ${(target * 0.25).toFixed(1)} L`}>
        <div style={S.waterRow}>
          <button style={S.waterBtn} onClick={() => setWater(-1)} aria-label="Quitar vaso">–</button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={S.waterBig}>{liters} L</div>
            <div style={S.waterSub}>{water} de {target} vasos (250 ml)</div>
          </div>
          <button style={S.waterBtn} onClick={() => setWater(1)} aria-label="Agregar vaso">+</button>
        </div>
        <div style={S.dots}>
          {Array.from({ length: target }).map((_, i) => (
            <span key={i} style={{ ...S.dot, background: i < water ? "var(--accent)" : "var(--ring-bg)" }} />
          ))}
        </div>
        <p style={S.tip}>En keto pierdes agua y minerales: no le temas a la sal y usa agua mineral con sal si te dan náusea o migraña.</p>
      </Card>

      <Card title="Opcionales">
        {DAILY_EXTRA.map((d) => (
          <Check key={d.key} item={d} on={!!today[d.key]} onClick={() => toggle(d.key)} />
        ))}
      </Card>
    </div>
  );
}

function Check({ item, on, onClick }) {
  return (
    <button style={{ ...S.check, ...(on ? S.checkOn : {}) }} onClick={onClick}>
      <span style={{ width: 24, display: "grid", placeItems: "center" }}>
        <Icon name={item.icon} size={20} stroke={on ? "var(--ink-soft)" : "var(--accent)"} />
      </span>
      <span style={{ ...S.checkLabel, ...(on ? { color: "var(--ink-soft)", textDecoration: "line-through" } : {}) }}>
        {item.label}
      </span>
      <span style={{ ...S.box, ...(on ? S.boxOn : {}) }}>{on ? "✓" : ""}</span>
    </button>
  );
}

// Omega 3: dos cápsulas con su propio botón cada una.
function Omega3Row({ day, toggle }) {
  const legacy = day.omega3 === true; // dato viejo: contaba como ambas tomadas
  const caps = [
    { key: "omega3a", n: 1 },
    { key: "omega3b", n: 2 },
  ];
  const both = omega3Done(day);
  return (
    <div style={S.check}>
      <span style={{ width: 24, display: "grid", placeItems: "center" }}>
        <Icon name="fish" size={20} stroke={both ? "var(--ink-soft)" : "var(--accent)"} />
      </span>
      <span style={{ ...S.checkLabel, ...(both ? { color: "var(--ink-soft)" } : {}) }}>
        Omega 3 <span style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>· 2 cápsulas</span>
      </span>
      <div style={S.capRow}>
        {caps.map((c) => {
          const on = legacy || !!day[c.key];
          return (
            <button
              key={c.key}
              style={{ ...S.cap, ...(on ? S.capOn : {}) }}
              onClick={() => toggle(c.key)}
              aria-label={`Cápsula ${c.n} de omega 3`}
            >
              {on ? "✓ " : ""}Cáps {c.n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Menús ----------
function Menus({ menuDay, setMenuDay }) {
  const menu = MENUS.find((m) => m.id === menuDay);
  return (
    <div style={S.page}>
      <Card title={LICUADO.title} sub={LICUADO.note}>
        <ul style={S.ul}>
          {LICUADO.items.map((it, i) => <li key={i} style={S.li}>{it}</li>)}
        </ul>
      </Card>

      <div style={S.toggle}>
        {MENUS.map((m) => (
          <button
            key={m.id}
            style={{ ...S.toggleBtn, ...(menuDay === m.id ? S.toggleOn : {}) }}
            onClick={() => setMenuDay(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {menu.meals.map((meal) => (
        <Card key={meal.slot} title={meal.slot} sub={meal.name}>
          <ul style={S.ul}>
            {meal.items.map((it, i) => <li key={i} style={S.li}>{it}</li>)}
          </ul>
        </Card>
      ))}

      <Card title="Refrigerios" sub="Elige 1 al día · gelatina sin azúcar libre">
        {REFRIGERIOS.map((r, i) => (
          <div key={i} style={{ marginBottom: i < REFRIGERIOS.length - 1 ? 14 : 0 }}>
            <div style={S.refName}>{r.name}</div>
            <ul style={S.ul}>
              {r.items.map((it, j) => <li key={j} style={S.li}>{it}</li>)}
            </ul>
          </div>
        ))}
      </Card>

      <Card title="Evita" tone="warn">
        <ul style={S.ul}>
          {AVOID.map((it, i) => <li key={i} style={S.li}>{it}</li>)}
        </ul>
      </Card>
    </div>
  );
}

// ---------- Constancia ----------
function Constancia({ days, target, streak, offset, setOffset, onExport, onImport }) {
  const base = new Date();
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7; // lunes = 0
  const total = new Date(year, month + 1, 0).getDate();
  const tk = todayKey();

  let completedThisMonth = 0;
  for (let d = 1; d <= total; d++) {
    if (isComplete(days[toKey(new Date(year, month, d))], target)) completedThisMonth++;
  }

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <div style={S.page}>
      <div style={S.statRow}>
        <Stat big={streak} label={streak === 1 ? "día seguido" : "días seguidos"} />
        <Stat big={completedThisMonth} label="días este mes" />
      </div>

      <Card>
        <div style={S.calHead}>
          <button style={S.navArrow} onClick={() => setOffset(offset - 1)}>‹</button>
          <span style={S.calTitle}>{MESES[month]} {year}</span>
          <button style={{ ...S.navArrow, opacity: offset >= 0 ? 0.3 : 1 }} disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>›</button>
        </div>
        <div style={S.grid}>
          {DIAS.map((d, i) => <div key={`h${i}`} style={S.gridHead}>{d}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const key = toKey(new Date(year, month, d));
            const comp = dayCompletion(days[key], target);
            const full = comp >= 0.999;
            const isToday = key === tk;
            return (
              <div
                key={key}
                style={{
                  ...S.cell,
                  background: full ? "var(--accent)" : comp > 0 ? "var(--accent-soft)" : "var(--ring-bg)",
                  color: full ? "#fff" : "var(--ink-soft)",
                  outline: isToday ? "2px solid var(--ink)" : "none",
                  outlineOffset: -2,
                }}
              >
                {d}
              </div>
            );
          })}
        </div>
        <div style={S.legend}>
          <span style={S.legItem}><span style={{ ...S.legDot, background: "var(--ring-bg)" }} />sin registro</span>
          <span style={S.legItem}><span style={{ ...S.legDot, background: "var(--accent-soft)" }} />parcial</span>
          <span style={S.legItem}><span style={{ ...S.legDot, background: "var(--accent)" }} />completo</span>
        </div>
      </Card>

      <Backup onExport={onExport} onImport={onImport} />

      <p style={S.note}>Un día cuenta como completo cuando marcas los 7 esenciales y llegas a tu meta de agua. Los datos se guardan en este dispositivo.</p>
    </div>
  );
}

// ---------- Respaldo UI ----------
function Backup({ onExport, onImport }) {
  const inputRef = React.useRef(null);
  const onPick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (confirm("Importar reemplazará los datos actuales de este dispositivo. ¿Continuar?")) {
      onImport(file);
    }
    e.target.value = ""; // permite reimportar el mismo archivo
  };
  return (
    <Card title="Respaldo" sub="Tus datos viven solo en este dispositivo">
      <p style={S.tip}>Exporta un archivo <b>.json</b> para respaldar o pasar tu progreso a otro dispositivo. No hay nube ni cuenta: tú tienes el control.</p>
      <div style={S.backupRow}>
        <button style={S.backupBtn} onClick={onExport}>
          <Icon name="download" size={18} stroke="var(--accent)" /> Exportar
        </button>
        <button style={S.backupBtn} onClick={() => inputRef.current && inputRef.current.click()}>
          <Icon name="upload" size={18} stroke="var(--accent)" /> Importar
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={onPick}
          style={{ display: "none" }}
        />
      </div>
    </Card>
  );
}

function Stat({ big, label }) {
  return (
    <div style={S.stat}>
      <div style={S.statBig}>{big}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

// ---------- Súper ----------
function Super({ shopping, toggleShop, resetShopping }) {
  const allItems = SHOPPING.flatMap((g) => g.items.map((it) => `${g.group}:${it.name}`));
  const got = allItems.filter((id) => shopping[id]).length;
  const onReset = () => {
    if (got === 0) return;
    if (confirm("¿Desmarcar todos los productos de la lista?")) resetShopping();
  };
  return (
    <div style={S.page}>
      <Card title="Lista del súper" sub={`${got} de ${allItems.length} marcados`}>
        <p style={S.tip}>Todo lo que necesitas para armar los menús. Las cantidades son un estimado para ~1 semana alternando Día A y B. Marca lo que ya tienes.</p>
        <button style={{ ...S.resetBtn, ...(got === 0 ? S.resetBtnOff : {}) }} onClick={onReset} disabled={got === 0}>
          <Icon name="refresh" size={16} stroke={got === 0 ? "var(--ink-soft)" : "var(--accent)"} /> Reiniciar lista
        </button>
      </Card>
      {SHOPPING.map((g) => (
        <Card key={g.group} title={g.group}>
          {g.items.map((it) => {
            const id = `${g.group}:${it.name}`;
            const on = !!shopping[id];
            return (
              <button key={id} style={{ ...S.check, ...(on ? S.checkOn : {}) }} onClick={() => toggleShop(id)}>
                <span style={{ ...S.checkLabel, ...(on ? { color: "var(--ink-soft)", textDecoration: "line-through" } : {}) }}>{it.name}</span>
                <span style={{ ...S.qty, ...(on ? { opacity: 0.5 } : {}) }}>{it.qty}</span>
                <span style={{ ...S.box, ...(on ? S.boxOn : {}) }}>{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </Card>
      ))}
    </div>
  );
}

// ---------- Shared UI ----------
function Card({ title, sub, children, tone }) {
  return (
    <section style={{ ...S.card, ...(tone === "warn" ? S.cardWarn : {}) }}>
      {title && (
        <div style={S.cardHead}>
          <h2 style={S.cardTitle}>{title}</h2>
          {sub && <span style={S.cardSub}>{sub}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

function Nav({ tab, setTab }) {
  const tabs = [
    { id: "hoy", label: "Hoy", icon: "check" },
    { id: "menus", label: "Menús", icon: "book" },
    { id: "constancia", label: "Constancia", icon: "flame" },
    { id: "super", label: "Súper", icon: "cart" },
  ];
  return (
    <nav style={S.nav}>
      {tabs.map((t) => (
        <button
          key={t.id}
          style={{ ...S.navBtn, ...(tab === t.id ? S.navOn : {}) }}
          onClick={() => setTab(t.id)}
        >
          <Icon name={t.icon} size={21} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ---------- Styles ----------
const CSS = `
:root{
  --bg:#EEF2EA; --paper:#FBFCF9; --ink:#1C2B22; --ink-soft:#6E7C72;
  --accent:#3F7D5A; --accent-soft:#BCD6C4; --ring-bg:#E2E8DD;
  --warn:#A8602E; --warn-bg:#F6ECE2;
  --display:'Fraunces',Georgia,serif; --body:'Inter',system-ui,sans-serif;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
button{cursor:pointer;border:none;background:none;font-family:var(--body);}
@media (prefers-reduced-motion: reduce){*{transition:none!important;}}
`;

const S = {
  boot: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#EEF2EA", color: "#1C2B22" },
  root: { minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--body)", color: "var(--ink)", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: 480, minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", position: "relative" },
  header: { padding: "22px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  kicker: { fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 },
  fecha: { fontFamily: "var(--display)", fontSize: 28, lineHeight: 1.1, marginTop: 2 },
  racha: { marginTop: 6, fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5 },
  ringText: { position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700 },

  main: { flex: 1, overflowY: "auto", paddingBottom: 90 },
  page: { padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 14 },

  card: { background: "var(--paper)", borderRadius: 18, padding: 16, boxShadow: "0 1px 3px rgba(28,43,34,.05)" },
  cardWarn: { background: "var(--warn-bg)" },
  cardHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, gap: 8 },
  cardTitle: { fontFamily: "var(--display)", fontSize: 19, fontWeight: 600, margin: 0 },
  cardSub: { fontSize: 12, color: "var(--ink-soft)", textAlign: "right", flexShrink: 0 },

  check: { width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", textAlign: "left" },
  checkOn: {},
  checkLabel: { flex: 1, fontSize: 15, color: "var(--ink)" },
  qty: { fontSize: 12.5, color: "var(--ink-soft)", flexShrink: 0, marginRight: 10, whiteSpace: "nowrap" },
  box: { width: 24, height: 24, borderRadius: 8, border: "2px solid var(--ring-bg)", display: "grid", placeItems: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 },
  boxOn: { background: "var(--accent)", borderColor: "var(--accent)" },

  capRow: { display: "flex", gap: 8, flexShrink: 0 },
  cap: { padding: "7px 11px", borderRadius: 10, border: "2px solid var(--ring-bg)", color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" },
  capOn: { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" },

  resetBtn: { marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 14, fontWeight: 600 },
  resetBtnOff: { background: "var(--ring-bg)", color: "var(--ink-soft)", cursor: "default" },

  waterRow: { display: "flex", alignItems: "center", gap: 12 },
  waterBtn: { width: 46, height: 46, borderRadius: 14, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 24, fontWeight: 700, display: "grid", placeItems: "center" },
  waterBig: { fontFamily: "var(--display)", fontSize: 30, lineHeight: 1 },
  waterSub: { fontSize: 12, color: "var(--ink-soft)", marginTop: 3 },
  dots: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 },
  dot: { width: 14, height: 14, borderRadius: "50%" },
  tip: { fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 12, marginBottom: 0 },

  ul: { margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 },
  li: { fontSize: 14.5, lineHeight: 1.45, color: "var(--ink)" },
  refName: { fontWeight: 600, fontSize: 14.5, marginBottom: 5 },

  toggle: { display: "flex", gap: 8, background: "var(--paper)", padding: 5, borderRadius: 14 },
  toggleBtn: { flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--ink-soft)" },
  toggleOn: { background: "var(--accent)", color: "#fff" },

  statRow: { display: "flex", gap: 12 },
  stat: { flex: 1, background: "var(--paper)", borderRadius: 18, padding: "18px 16px", textAlign: "center" },
  statBig: { fontFamily: "var(--display)", fontSize: 36, lineHeight: 1, color: "var(--accent)" },
  statLabel: { fontSize: 12, color: "var(--ink-soft)", marginTop: 5 },

  calHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calTitle: { fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 },
  navArrow: { width: 34, height: 34, borderRadius: 10, background: "var(--ring-bg)", fontSize: 20, color: "var(--ink)", display: "grid", placeItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 },
  gridHead: { textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", paddingBottom: 4 },
  cell: { aspectRatio: "1", borderRadius: 10, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600 },
  legend: { display: "flex", gap: 14, marginTop: 14, justifyContent: "center", flexWrap: "wrap" },
  legItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-soft)" },
  legDot: { width: 12, height: 12, borderRadius: 4 },
  note: { fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, textAlign: "center", padding: "0 8px" },
  backupRow: { display: "flex", gap: 10, marginTop: 12 },
  backupBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0", borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 14, fontWeight: 600 },
  win: { background: "var(--accent)", color: "#fff", padding: "12px 16px", borderRadius: 14, fontSize: 14, fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },

  nav: { position: "fixed", bottom: 0, width: "100%", maxWidth: 480, display: "flex", background: "var(--paper)", borderTop: "1px solid var(--ring-bg)", paddingBottom: "env(safe-area-inset-bottom)" },
  navBtn: { flex: 1, padding: "10px 0 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "var(--ink-soft)" },
  navOn: { color: "var(--accent)" },
};
