// src/pages/Dashboard.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { FiPackage, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import ConfirmDialog from "./compoents/ConfirmDialog";

// ── Constants ────────────────────────────────────────────────
const ACCOUNTS = [
  { key: "cash",        label: "Cash",         color: "#10b981" },
  { key: "federalBank", label: "Federal Bank", color: "#6366f1" },
  { key: "vibgyorBank", label: "Vibgyor Bank", color: "#f59e0b" },
  { key: "asifAccount", label: "Asif Account", color: "#f43f5e" },
];
const PIE_COLORS = ["#6366f1","#f43f5e","#f59e0b","#10b981","#8b5cf6","#14b8a6","#ec4899","#0ea5e9"];
const fmt = n => `₹${Number(n||0).toLocaleString("en-IN")}`;

// ── Null-safe amount helper ──────────────────────────────────
const safeAmt = item =>
  item && typeof item === "object" && "amount" in item ? Number(item.amount || 0) : 0;

// ── Expense calculators ──────────────────────────────────────
const calcPurchaseCost = e => (e.purchaseCost || []).reduce((s, p) => s + safeAmt(p), 0);

const calcIndirectExpenses = e => {
  const ex = e.expenses || {};
  return Object.values(ex).reduce((sum, val) => {
    if (Array.isArray(val)) return sum + val.reduce((s, i) => s + safeAmt(i), 0);
    if (val && typeof val === "object" && "amount" in val) return sum + (val.amount || 0);
    if (typeof val === "number") return sum + val;
    return sum;
  }, 0);
};

// ── Custom Tooltip ───────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0D0D0D", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
      <p style={{ color: "#888", marginBottom: 6, fontSize: 11 }}>
        {typeof label === "string" ? label : new Date(label).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: "#fff", margin: "2px 0" }}>
          <span style={{ color: "#888" }}>{p.name}: </span>{fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Drill-down modal ─────────────────────────────────────────
function DrillModal({ title, rows, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.35)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:18, padding:24, minWidth:320, maxWidth:480, width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:"#0D0D0D" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#888", cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <tbody>
            {rows.map(([label, val, color], i) => (
              <tr key={i} style={{ borderBottom: i < rows.length-1 ? "1px solid #F0EEE9" : "none" }}>
                <td style={{ padding:"10px 0", color:"#555" }}>{label}</td>
                <td style={{ padding:"10px 0", textAlign:"right", fontWeight:600, color:color||"#0D0D0D", fontFamily:"'DM Mono',monospace" }}>{fmt(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Staff Advance Mini Card ──────────────────────────────────
function AdvanceMiniCard({ advances, onNavigate }) {
  const totalCredit      = advances.reduce((s, a) => s + (a.totalCredit    || 0), 0);
  const totalSettled     = advances.reduce((s, a) => s + (a.totalSettled   || 0), 0);
  const totalOutstanding = advances.reduce((s, a) => s + (a.outstanding    || 0), 0);

  // Staff with non-zero outstanding
  const withBalance = advances.filter(a => (a.outstanding || 0) > 0);

  return (
    <div style={{ background:"#fff", border:"1px solid #ECEAE4", borderRadius:18, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.05)", gridColumn:"span 2" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:600, color:"#A8A49C", letterSpacing:".12em", textTransform:"uppercase" }}>
          Staff Advances
        </div>
        <button onClick={onNavigate} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          Manage →
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom: withBalance.length ? 16 : 0 }}>
        {[
          ["Total Given", totalCredit, "#f59e0b"],
          ["Settled",     totalSettled, "#10b981"],
          ["Outstanding", totalOutstanding, totalOutstanding > 0 ? "#ef4444" : "#10b981"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:"#FAFAF8", borderRadius:10, padding:"10px 12px", border:"1px solid #ECEAE4" }}>
            <div style={{ fontSize:10, color:"#A8A49C", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 }}>{label}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:16, fontWeight:700, color }}>{fmt(val)}</div>
          </div>
        ))}
      </div>

      {/* Per-staff outstanding list */}
      {withBalance.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ fontSize:10, color:"#A8A49C", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:2 }}>
            Outstanding by Staff
          </div>
          {withBalance.slice(0, 4).map((a, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:"#FAFAF8", borderRadius:8, border:"1px solid #ECEAE4" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#0D0D0D" }}>{a.staffName || a.staffId?.name || "Staff"}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700, color:"#ef4444" }}>{fmt(a.outstanding)}</span>
            </div>
          ))}
          {withBalance.length > 4 && (
            <button onClick={onNavigate} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left", paddingLeft:2 }}>
              +{withBalance.length - 4} more →
            </button>
          )}
        </div>
      )}

      {withBalance.length === 0 && totalCredit > 0 && (
        <div style={{ fontSize:12, color:"#10b981", fontWeight:500 }}>✓ All advances fully settled</div>
      )}
      {totalCredit === 0 && (
        <div style={{ fontSize:12, color:"#C8C4BB" }}>No advances recorded yet.</div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("lifetime");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialog, setDialog] = useState({ open:false, action:null, requestId:null });
  const [drill, setDrill]   = useState(null);

  const { data: me } = useQuery({ queryKey:["me"], queryFn: async () => (await client.get("/auth/me")).data.user });

  const { data: entries = [] } = useQuery({
    queryKey: ["roi", filter, startDate, endDate],
    queryFn: async () => {
      const params = { filter };
      if (filter === "custom" && startDate && endDate) { params.startDate = startDate; params.endDate = endDate; }
      return (await client.get("/roi", { params })).data;
    },
    enabled: !(filter === "custom" && (!startDate || !endDate)),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["editRequests"],
    queryFn: async () => (await client.get("/roi/edit-requests")).data.requests,
  });

  // ── Staff advances ──────────────────────────────────────────
  const { data: advances = [] } = useQuery({
    queryKey: ["staff-advances"],
    queryFn: async () => (await client.get("/staff/advances")).data,
  });

  // ── Stock today ───────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: stockToday = {} } = useQuery({
    queryKey: ["stock-today-dash", todayStr],
    queryFn:  async () => (await client.get(`/stock/today?date=${todayStr}`)).data,
  });
  const { data: stockSummary = {} } = useQuery({
    queryKey: ["stock-summary-dash"],
    queryFn:  async () => (await client.get("/stock/summary")).data,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, action }) => (await client.patch(`/roi/edit-request/${id}`, { status: action })).data,
    onSuccess: () => queryClient.invalidateQueries(["editRequests"]),
  });

  const confirmAction = () => {
    if (dialog.requestId && dialog.action) mutation.mutate({ id:dialog.requestId, action:dialog.action });
    setDialog({ open:false, action:null, requestId:null });
  };

  const pendingRequests = requests?.filter(r => r.status === "PENDING") || [];
  const latestRequests  = pendingRequests.slice(0, 3);

  // ── Financial calculations ────────────────────────────────
  const totalRevenue      = entries.reduce((s, e) => s + (e.totalRevenue || 0), 0);
  const totalPurchaseCost = entries.reduce((s, e) => s + calcPurchaseCost(e), 0);
  const totalIndirect     = entries.reduce((s, e) => s + calcIndirectExpenses(e), 0);
  const totalExpenses     = totalPurchaseCost + totalIndirect;
  const profit            = totalRevenue - totalExpenses;
  const profitMargin      = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // ── Account balances ──────────────────────────────────────
  const accountBalance = { cash:0, federalBank:0, vibgyorBank:0, asifAccount:0 };
  entries.forEach(e => {
    const rs = e.revenueSplit || {};
    ACCOUNTS.forEach(a => { accountBalance[a.key] += (rs[a.key] || 0); });
    const ex = e.expenses || {};
    const deductSource = item => {
      if (!item || !item.source || !item.amount) return;
      if (accountBalance[item.source] !== undefined) accountBalance[item.source] -= (item.amount || 0);
    };
    Object.values(ex).forEach(val => {
      if (Array.isArray(val)) val.forEach(deductSource);
      else if (val && typeof val === "object" && "source" in val) deductSource(val);
    });
    (e.settlements || []).forEach(s => {
      if (s.account && accountBalance[s.account] !== undefined) accountBalance[s.account] -= (s.amount || 0);
    });
  });

  // ── Credit / Settlement totals ────────────────────────────
  const totalCredit      = entries.reduce((s, e) => s + (e.creditAmount  || 0), 0);
  const totalSettled     = entries.reduce((s, e) => s + (e.settledAmount || 0), 0);
  const totalOutstanding = totalCredit - totalSettled;

  // ── Staff advance totals ──────────────────────────────────
  const totalAdvanceOutstanding = advances.reduce((s, a) => s + (a.outstanding || 0), 0);

  // ── Expense breakdown for pie ─────────────────────────────
  const expBreakdown = {};
  entries.forEach(e => {
    const ex = e.expenses || {};
    Object.entries(ex).forEach(([key, val]) => {
      let amt = 0;
      if (Array.isArray(val)) amt = val.reduce((s, i) => s + safeAmt(i), 0);
      else if (val && typeof val === "object" && "amount" in val) amt = val.amount || 0;
      else if (typeof val === "number") amt = val;
      if (amt > 0) expBreakdown[key] = (expBreakdown[key] || 0) + amt;
    });
    const pc = calcPurchaseCost(e);
    if (pc > 0) expBreakdown["Purchase Cost"] = (expBreakdown["Purchase Cost"] || 0) + pc;
  });
  const expPieData = Object.entries(expBreakdown).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  // ── Trend data ─────────────────────────────────────────────
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const trendData = [...sortedEntries].reverse().map(e => ({
    date:     e.date,
    Revenue:  e.totalRevenue || 0,
    Expenses: calcPurchaseCost(e) + calcIndirectExpenses(e),
    Profit:   (e.totalRevenue || 0) - calcPurchaseCost(e) - calcIndirectExpenses(e),
  }));

  // ── Drill rows helpers ─────────────────────────────────────
  const revenueDrillRows = () => {
    const rows = entries.reduce((acc, e) => {
      const rs = e.revenueSplit || {};
      ACCOUNTS.forEach(a => { acc[a.key] = (acc[a.key] || 0) + (rs[a.key] || 0); });
      return acc;
    }, {});
    return ACCOUNTS.map(a => [a.label, rows[a.key] || 0, a.color]);
  };

  const expenseDrillRows = () => [
    ["Purchase Cost",         totalPurchaseCost, "#f43f5e"],
    ["Indirect / Operations", totalIndirect,     "#f59e0b"],
  ];

  const creditDrillRows = () => [
    ["Total Credit Raised", totalCredit,      "#f43f5e"],
    ["Total Settled",       totalSettled,     "#10b981"],
    ["Outstanding Balance", totalOutstanding, totalOutstanding > 0 ? "#f43f5e" : "#10b981"],
  ];

  const advanceDrillRows = () => {
    const withBalance = advances.filter(a => (a.outstanding || 0) > 0);
    if (!withBalance.length) return [["No outstanding advances", 0, "#10b981"]];
    return withBalance.map(a => [a.staffName || a.staffId?.name || "Staff", a.outstanding, "#f43f5e"]);
  };

  const filterLabels = { lifetime:"All time", today:"Today", thisMonth:"This month", thisYear:"This year", custom:"Custom" };

  return (
    <div style={{ minHeight:"100vh", background:"#F7F6F3", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        .card { background:#fff; border:1px solid #ECEAE4; border-radius:18px; transition:box-shadow .2s,transform .15s; box-shadow:0 1px 4px rgba(0,0,0,.05); }
        .card:hover { box-shadow:0 6px 28px rgba(0,0,0,.09); transform:translateY(-1px); }
        .card-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.12em; text-transform:uppercase; margin-bottom:14px; }
        .btn-ink { background:#0D0D0D; color:#fff; border:none; border-radius:11px; padding:10px 20px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.18); transition:background .12s,transform .1s; }
        .btn-ink:hover { background:#222; transform:translateY(-1px); }
        .btn-ink:active { transform:scale(.98); }
        .btn-ghost { background:#fff; color:#333; border:1px solid #ECEAE4; border-radius:11px; padding:10px 20px; font-family:inherit; font-size:13px; font-weight:500; cursor:pointer; transition:all .12s; }
        .btn-ghost:hover { border-color:#bbb; box-shadow:0 2px 8px rgba(0,0,0,.07); }
        .btn-sm { background:#0D0D0D; color:#fff; border:none; border-radius:8px; padding:6px 14px; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; transition:background .1s; }
        .btn-sm:hover { background:#222; }
        .btn-sm-red { background:#fff; color:#E11D48; border:1px solid #FCA5A5; border-radius:8px; padding:6px 14px; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; transition:all .1s; }
        .btn-sm-red:hover { background:#FFF1F2; }
        .filter-pill { padding:6px 16px; border-radius:20px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #ECEAE4; background:#fff; color:#888; transition:all .12s; font-family:inherit; }
        .filter-pill.active { background:#0D0D0D; color:#fff; border-color:#0D0D0D; box-shadow:0 2px 8px rgba(0,0,0,.16); }
        .filter-pill:hover:not(.active) { border-color:#bbb; color:#333; }
        input[type="date"] { background:#fff; border:1px solid #ECEAE4; color:#333; padding:6px 11px; border-radius:8px; font-family:inherit; font-size:12px; outline:none; }
        input[type="date"]:focus { border-color:#0D0D0D; }
        .row-tr:hover td { background:#FAFAF8; }
        .req-row { background:#FAFAF8; border:1px solid #ECEAE4; border-radius:12px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; transition:all .12s; }
        .req-row:hover { background:#F5F3EF; box-shadow:0 2px 8px rgba(0,0,0,.06); }
        .tappable { cursor:pointer; }
        .num { font-family:'DM Mono',monospace; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        .fade-up { animation:fadeUp .35s ease both; }
      `}</style>

      <div style={{ maxWidth:1300, margin:"0 auto", padding:"36px 24px" }}>

        {/* ── Header ── */}
        <div className="fade-up" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
          <div>
            <p style={{ fontSize:10, color:"#A8A49C", letterSpacing:".14em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", marginBottom:5 }}>ROI Tracker</p>
            <h1 style={{ fontSize:30, fontWeight:800, color:"#0D0D0D", letterSpacing:"-.03em" }}>KBC Restaurant</h1>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
            {pendingRequests.length > 0 && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#92400E", fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#F59E0B", display:"inline-block" }} />
                {pendingRequests.length} pending
              </div>
            )}
            {totalAdvanceOutstanding > 0 && (
              <div style={{ background:"#FEF3C7", border:"1px solid #FDE68A", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#92400E", fontWeight:500, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}
                onClick={() => setDrill({ title:"Staff Advance Outstanding", rows:advanceDrillRows() })}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#F59E0B", display:"inline-block" }} />
                Advances: {fmt(totalAdvanceOutstanding)}
              </div>
            )}
            <button className="btn-ink" onClick={() => navigate("/add")}>+ Add entry</button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="fade-up" style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24, alignItems:"center", animationDelay:".04s" }}>
          {Object.entries(filterLabels).map(([f, label]) => (
            <button key={f} className={`filter-pill${filter===f?" active":""}`} onClick={() => { setFilter(f); setStartDate(""); setEndDate(""); }}>{label}</button>
          ))}
          {filter === "custom" && (
            <div style={{ display:"flex", gap:8, alignItems:"center", marginLeft:4 }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span style={{ color:"#C8C4BB", fontSize:13 }}>→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}
        </div>

        {/* ── Stat Cards (5 cards — added Staff Advance Outstanding) ── */}
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14, marginBottom:20, animationDelay:".08s" }}>

          {/* Revenue */}
          <div className="card tappable" style={{ padding:"20px 22px", borderTop:"3px solid #6366f1" }}
            onClick={() => setDrill({ title:"Revenue by Account", rows:revenueDrillRows() })}>
            <div className="card-label">Total Revenue ↗</div>
            <div className="num" style={{ fontSize:24, fontWeight:700, color:"#6366f1", marginBottom:4 }}>{fmt(totalRevenue)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>{entries.length} entries · tap for split</div>
          </div>

          {/* Expenses */}
          <div className="card tappable" style={{ padding:"20px 22px", borderTop:"3px solid #f43f5e" }}
            onClick={() => setDrill({ title:"Expense Breakdown", rows:expenseDrillRows() })}>
            <div className="card-label">Total Expenses ↗</div>
            <div className="num" style={{ fontSize:24, fontWeight:700, color:"#f43f5e", marginBottom:4 }}>{fmt(totalExpenses)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>
              PC: {fmt(totalPurchaseCost)} · Ind: {fmt(totalIndirect)}
            </div>
          </div>

          {/* Profit */}
          <div className="card" style={{ padding:"20px 22px", borderTop:`3px solid ${profit>=0?"#10b981":"#ef4444"}` }}>
            <div className="card-label">Net Profit</div>
            <div className="num" style={{ fontSize:24, fontWeight:700, color:profit>=0?"#10b981":"#ef4444", marginBottom:4 }}>{fmt(profit)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>{profitMargin.toFixed(1)}% margin</div>
          </div>

          {/* Revenue Credit Outstanding */}
          <div className="card tappable" style={{ padding:"20px 22px", borderTop:"3px solid #f59e0b" }}
            onClick={() => setDrill({ title:"Credit / Settlement", rows:creditDrillRows() })}>
            <div className="card-label">Credit Outstanding ↗</div>
            <div className="num" style={{ fontSize:24, fontWeight:700, color:totalOutstanding>0?"#f59e0b":"#10b981", marginBottom:4 }}>{fmt(totalOutstanding)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>Settled: {fmt(totalSettled)} · tap detail</div>
          </div>

          {/* Staff Advance Outstanding */}
          <div className="card tappable" style={{ padding:"20px 22px", borderTop:"3px solid #8b5cf6" }}
            onClick={() => setDrill({ title:"Staff Advance Outstanding", rows:advanceDrillRows() })}>
            <div className="card-label">Staff Advance ↗</div>
            <div className="num" style={{ fontSize:24, fontWeight:700, color:totalAdvanceOutstanding>0?"#8b5cf6":"#10b981", marginBottom:4 }}>{fmt(totalAdvanceOutstanding)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>
              {advances.filter(a=>(a.outstanding||0)>0).length} staff with balance
            </div>
          </div>
        </div>

        {/* ── Account Balances ── */}
        <div className="fade-up card" style={{ padding:"20px 22px", marginBottom:20, animationDelay:".12s" }}>
          <div className="card-label">Account Balances</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
            {ACCOUNTS.map(a => (
              <div key={a.key} style={{ background:"#FAFAF8", borderRadius:12, padding:"14px 16px", border:"1px solid #ECEAE4" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:a.color, display:"inline-block" }} />
                  <span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{a.label}</span>
                </div>
                <div className="num" style={{ fontSize:18, fontWeight:700, color:accountBalance[a.key]>=0?"#0D0D0D":"#ef4444" }}>
                  {fmt(accountBalance[a.key])}
                </div>
                <div style={{ fontSize:10, color:"#A8A49C", marginTop:3 }}>inflow − outflow</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Staff Advances Panel ── */}
        <div className="fade-up" style={{ marginBottom:20, animationDelay:".14s" }}>
          <AdvanceMiniCard advances={advances} onNavigate={() => navigate("/attendance")} />
        </div>

        {/* ── Stock Widget ── */}
        <div className="fade-up card" style={{ padding:"20px 22px", marginBottom:20, animationDelay:".15s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div className="card-label" style={{ marginBottom:0, display:"flex", alignItems:"center", gap:6 }}>
              <FiPackage size={12} /> Today's Stock
            </div>
            <button onClick={() => navigate("/stock")} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              Manage →
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
            {[
              {
                label:    "Opening Stock",
                val:      fmt(stockToday?.opening?.totalValue || 0),
                items:    stockToday?.opening?.items?.length || 0,
                color:    "#6366f1",
                bg:       "#EEF2FF",
                border:   "#C7D2FE",
                icon:     <FiTrendingUp size={14} color="#6366f1"/>,
                status:   stockToday?.opening ? "saved" : "pending",
              },
              {
                label:    "Closing Stock",
                val:      fmt(stockToday?.closing?.totalValue || 0),
                items:    stockToday?.closing?.items?.length || 0,
                color:    "#10b981",
                bg:       "#ECFDF5",
                border:   "#A7F3D0",
                icon:     <FiTrendingDown size={14} color="#10b981"/>,
                status:   stockToday?.closing ? "saved" : "pending",
              },
              {
                label:    "Monthly Opening",
                val:      fmt(stockSummary?.totalOpeningValue || 0),
                items:    null,
                color:    "#6366f1",
                bg:       "#F5F3FF",
                border:   "#DDD6FE",
                icon:     <FiPackage size={14} color="#6366f1"/>,
                status:   null,
              },
              {
                label:    "Monthly Closing",
                val:      fmt(stockSummary?.totalClosingValue || 0),
                items:    null,
                color:    "#10b981",
                bg:       "#ECFDF5",
                border:   "#A7F3D0",
                icon:     <FiPackage size={14} color="#10b981"/>,
                status:   null,
              },
            ].map(({ label, val, items, color, bg, border, icon, status }) => (
              <div key={label} style={{ background:bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${border}`, cursor:"pointer" }}
                onClick={() => navigate("/stock")}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {icon}
                    <span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{label}</span>
                  </div>
                  {status === "saved"   && <span style={{ fontSize:9, fontWeight:700, background:"#fff", color:color, border:`1px solid ${border}`, borderRadius:4, padding:"1px 6px" }}>✓ Saved</span>}
                  {status === "pending" && <span style={{ fontSize:9, fontWeight:700, background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A", borderRadius:4, padding:"1px 6px" }}>Pending</span>}
                </div>
                <div className="num" style={{ fontSize:20, fontWeight:700, color }}>{val}</div>
                {items !== null && (
                  <div style={{ fontSize:10, color:"#A8A49C", marginTop:3 }}>
                    {items > 0 ? `${items} items` : "No items entered"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:14, marginBottom:20, animationDelay:".16s" }}>
          {/* Area Chart */}
          <div className="card" style={{ padding:"22px 24px" }}>
            <div className="card-label">Performance Trend</div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trendData}>
                <defs>
                  {[["gradR","#6366f1"],["gradE","#f43f5e"],["gradP","#10b981"]].map(([id,c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 5" stroke="#F0EEE9" vertical={false} />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})} tick={{ fill:"#B0AEA8", fontSize:10, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill:"#B0AEA8", fontSize:10, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="Revenue"  stroke="#6366f1" strokeWidth={2.5} fill="url(#gradR)" dot={false} />
                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2}   fill="url(#gradE)" dot={false} />
                <Area type="monotone" dataKey="Profit"   stroke="#10b981" strokeWidth={2}   fill="url(#gradP)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", gap:18, marginTop:10 }}>
              {[["#6366f1","Revenue"],["#f43f5e","Expenses"],["#10b981","Profit"]].map(([c,l]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#A8A49C" }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:c }} /> {l}
                </div>
              ))}
            </div>
          </div>

          {/* Pie */}
          <div className="card" style={{ padding:"22px 24px" }}>
            <div className="card-label">Expense Split</div>
            {expPieData.length === 0 ? <p style={{ color:"#C8C4BB", fontSize:13 }}>No data</p> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={expPieData} dataKey="value" cx="50%" cy="50%" outerRadius={68} innerRadius={38} paddingAngle={2} strokeWidth={0}>
                      {expPieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
                  {expPieData.slice(0,5).map((d,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }} />
                        <span style={{ fontSize:11, color:"#666", textTransform:"capitalize" }}>{d.name}</span>
                      </div>
                      <span className="num" style={{ fontSize:11, color:"#0D0D0D" }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Row: Staff + Pending Requests ── */}
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:14, marginBottom:20, animationDelay:".2s" }}>
          <div className="card" style={{ padding:"22px", display:"flex", flexDirection:"column", gap:9 }}>
            <div className="card-label">Staff</div>
            <button className="btn-ink"   style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/users")}>View staff</button>
            <button className="btn-ghost" style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/register")}>Add staff</button>
            <button className="btn-ghost" style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/attendance")}>Attendance & Advances</button>
          </div>

          <div className="card" style={{ padding:"22px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div className="card-label" style={{ marginBottom:0 }}>Pending Requests</div>
              {pendingRequests.length > 0 && (
                <span style={{ fontSize:11, fontWeight:600, background:"#F5F3EF", color:"#666", border:"1px solid #ECEAE4", borderRadius:20, padding:"2px 10px" }}>{pendingRequests.length}</span>
              )}
            </div>
            {latestRequests.length === 0 ? (
              <p style={{ color:"#C8C4BB", fontSize:13 }}>No pending requests</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {latestRequests.map(r => (
                  <div key={r._id} className="req-row">
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#0D0D0D", marginBottom:2 }}>{r.requesterName}</div>
                      <div style={{ fontSize:11, color:"#A8A49C", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:300 }}>{r.reason}</div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:14 }}>
                      <button className="btn-sm"     onClick={() => setDialog({ open:true, action:"APPROVED", requestId:r._id })}>Approve</button>
                      <button className="btn-sm-red" onClick={() => setDialog({ open:true, action:"REJECTED", requestId:r._id })}>Decline</button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length > 3 && (
                  <button onClick={() => navigate("/requests")} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, textAlign:"right", cursor:"pointer", fontFamily:"inherit", padding:"4px 0" }}>
                    See all {pendingRequests.length} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Entries ── */}
        <div className="fade-up card" style={{ overflow:"hidden", animationDelay:".24s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 22px", borderBottom:"1px solid #ECEAE4" }}>
            <div className="card-label" style={{ marginBottom:0 }}>Recent Entries</div>
            <button onClick={() => navigate("/entries")} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>View all →</button>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #F5F3EF" }}>
                  {["Date","Revenue","Purchase Cost","Indirect","Profit","Credit",""].map((h,i) => (
                    <th key={i} style={{ padding:"11px 20px", textAlign:i>0&&i<6?"right":"left", color:"#B0AEA8", fontWeight:500, fontSize:10, letterSpacing:".1em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.slice(0,5).map(e => {
                  const pc   = calcPurchaseCost(e);
                  const ind  = calcIndirectExpenses(e);
                  const p    = (e.totalRevenue||0) - pc - ind;
                  const cred = (e.creditAmount||0) - (e.settledAmount||0);
                  return (
                    <tr key={e._id} className="row-tr" style={{ borderBottom:"1px solid #F7F6F3" }}>
                      <td style={{ padding:"14px 20px" }}>
                        <span className="num" style={{ fontSize:12, color:"#666" }}>
                          {new Date(e.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}
                        </span>
                      </td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ fontWeight:600, color:"#6366f1" }}>{fmt(e.totalRevenue)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ color:"#f43f5e" }}>{fmt(pc)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ color:"#888" }}>{fmt(ind)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ fontWeight:700, color:p>=0?"#10b981":"#ef4444" }}>{fmt(p)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}>
                        {cred > 0
                          ? <span style={{ fontSize:11, background:"#FFFBEB", color:"#92400E", border:"1px solid #FDE68A", borderRadius:20, padding:"2px 8px" }}>{fmt(cred)}</span>
                          : <span style={{ color:"#C8C4BB", fontSize:11 }}>—</span>}
                      </td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}>
                        <button className="btn-sm" onClick={() => navigate(`/entries/${e._id}`)}>View</button>
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:"40px 20px", textAlign:"center", color:"#C8C4BB" }}>No entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Drill modal */}
      {drill && <DrillModal title={drill.title} rows={drill.rows} onClose={() => setDrill(null)} />}

      <ConfirmDialog
        open={dialog.open}
        onCancel={() => setDialog({ open:false, action:null, requestId:null })}
        onConfirm={confirmAction}
        title={`${dialog.action==="APPROVED"?"Approve":"Reject"} Request`}
        message={`Are you sure you want to ${dialog.action==="APPROVED"?"approve":"reject"} this request?`}
      />
    </div>
  );
}