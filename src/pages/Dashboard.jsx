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
const fmt = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ── Amount helpers ────────────────────────────────────────────
const toN    = v => Number(v || 0);
const safeAmt = item =>
  item && typeof item === "object" && "amount" in item ? toN(item.amount) : 0;

// ── Expense calculators ───────────────────────────────────────
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

// ── Expense credit calculator (handles BOTH storage formats) ─
// Format A (EditEntry/new): item.isCredit + item.creditSettled
// Format B (AddEntry numeric): item.credit + item.settled
//
// Outstanding = amount not yet paid to the vendor/supplier.
const itemCreditOutstanding = item => {
  if (!item || typeof item !== "object") return 0;

  // Format A: boolean isCredit flag
  if (item.isCredit) {
    return Math.max(0, toN(item.amount) - toN(item.creditSettled));
  }

  // Format B: numeric credit/settled fields
  const creditAmt = toN(item.credit);
  if (creditAmt > 0) {
    return Math.max(0, creditAmt - toN(item.settled));
  }

  return 0;
};

const itemCreditRaised = item => {
  if (!item || typeof item !== "object") return 0;
  if (item.isCredit) return toN(item.amount);
  return toN(item.credit);
};

// Sum credit outstanding across all expense items of an entry
const calcExpCreditOutstanding = e => {
  let out = 0;

  // Purchase cost items
  (e.purchaseCost || []).forEach(p => { out += itemCreditOutstanding(p); });

  const ex = e.expenses || {};

  // Single-object fields
  const SINGLE_KEYS = ["commissionOnSales","foodRefreshment","rent","electricity",
    "travelFuel","mobileInternet","maintenance","incentive","gasStaff","gasStore"];
  SINGLE_KEYS.forEach(k => { if (ex[k]) out += itemCreditOutstanding(ex[k]); });

  // Array fields
  const ARR_KEYS = ["royaltyFees","marketing","foodWastageCooked","foodWastageRaw","other"];
  ARR_KEYS.forEach(k => { (ex[k] || []).forEach(item => { out += itemCreditOutstanding(item); }); });

  return out;
};

const calcExpCreditRaised = e => {
  let raised = 0;
  (e.purchaseCost || []).forEach(p => { raised += itemCreditRaised(p); });
  const ex = e.expenses || {};
  const SINGLE_KEYS = ["commissionOnSales","foodRefreshment","rent","electricity",
    "travelFuel","mobileInternet","maintenance","incentive","gasStaff","gasStore"];
  SINGLE_KEYS.forEach(k => { if (ex[k]) raised += itemCreditRaised(ex[k]); });
  const ARR_KEYS = ["royaltyFees","marketing","foodWastageCooked","foodWastageRaw","other"];
  ARR_KEYS.forEach(k => { (ex[k] || []).forEach(item => { raised += itemCreditRaised(item); }); });
  return raised;
};

// ── Tooltip ───────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0D0D0D", borderRadius:10, padding:"10px 14px", fontSize:12, boxShadow:"0 8px 24px rgba(0,0,0,.22)" }}>
      <p style={{ color:"#888", marginBottom:6, fontSize:11 }}>
        {typeof label === "string" ? label : new Date(label).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:"#fff", margin:"2px 0" }}>
          <span style={{ color:"#888" }}>{p.name}: </span>{fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Drill modal ───────────────────────────────────────────────
function DrillModal({ title, rows, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.35)", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, minWidth:320, maxWidth:460,
        width:"100%", boxShadow:"0 24px 64px rgba(0,0,0,.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#0D0D0D" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22,
            color:"#aaa", cursor:"pointer", lineHeight:1, padding:"0 4px" }}>×</button>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <tbody>
            {rows.map(([label, val, color], i) => (
              <tr key={i} style={{ borderBottom: i < rows.length-1 ? "1px solid #F5F3EF" : "none" }}>
                <td style={{ padding:"11px 0", color:"#555" }}>{label}</td>
                <td style={{ padding:"11px 0", textAlign:"right", fontWeight:700,
                  color:color||"#0D0D0D", fontFamily:"'DM Mono',monospace" }}>{fmt(val)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Dashboard({ onLogout }) {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [filter,    setFilter]    = useState("lifetime");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [dialog,    setDialog]    = useState({ open:false, action:null, requestId:null });
  const [drill,     setDrill]     = useState(null);

  // ── Queries ───────────────────────────────────────────────
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn:  async () => (await client.get("/auth/me")).data.user,
  });

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
    queryFn:  async () => (await client.get("/roi/edit-requests")).data.requests,
  });

  // Staff advances — for salary settlement tracking
  const { data: advances = [] } = useQuery({
    queryKey: ["staff-advances"],
    queryFn:  async () => (await client.get("/staff/advances")).data,
  });

  // Staff list — to compute salary credit
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn:  async () => (await client.get("/staff")).data,
  });

  // Stock
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: stockToday   = {} } = useQuery({ queryKey:["stock-today-dash", todayStr],  queryFn: async () => (await client.get(`/stock/today?date=${todayStr}`)).data });
  const { data: stockSummary = {} } = useQuery({ queryKey:["stock-summary-dash"],           queryFn: async () => (await client.get("/stock/summary")).data });

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

  // ── Expense credit (vendor/supplier credit on purchases & expenses) ──
  const totalExpCreditRaised      = entries.reduce((s, e) => s + calcExpCreditRaised(e), 0);
  const totalExpCreditOutstanding = entries.reduce((s, e) => s + calcExpCreditOutstanding(e), 0);
  const totalExpCreditSettled     = totalExpCreditRaised - totalExpCreditOutstanding;

  // ── Salary credit (what you owe staff) ───────────────────
  // Credit = total monthly salary of all staff
  // Settled = sum of all "settled" advance transactions
  const totalSalaryCredit   = staff.reduce((s, m) => s + (m.salary || 0), 0);
  const totalSalarySettled  = advances.reduce((s, a) => s + (a.totalSettled || 0), 0);
  const totalSalaryOutstanding = Math.max(0, totalSalaryCredit - totalSalarySettled);

  // ── Combined total credit outstanding ────────────────────
  // = expense vendor credit + salary owed to staff
  const totalCreditOutstanding = totalExpCreditOutstanding + totalSalaryOutstanding;

  // ── Staff advance (given to staff, to be deducted from salary) ──
  const totalAdvGiven       = advances.reduce((s, a) => s + (a.totalCredit  || 0), 0);
  const totalAdvSettled     = advances.reduce((s, a) => s + (a.totalSettled || 0), 0);
  const totalAdvOutstanding = Math.max(0, totalAdvGiven - totalAdvSettled);
  // Note: In doc 17, there are no "credit" type transactions; totalSettled covers salary payments.
  // For advance-only model: outstanding = totalCredit - totalSettled from StaffAdvance virtuals.

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
  });

  // ── Pie data ──────────────────────────────────────────────
  const expBreakdown = {};
  entries.forEach(e => {
    Object.entries(e.expenses || {}).forEach(([k, v]) => {
      let amt = 0;
      if (Array.isArray(v))                              amt = v.reduce((s, i) => s + safeAmt(i), 0);
      else if (v && typeof v === "object" && "amount" in v) amt = v.amount || 0;
      if (amt > 0) expBreakdown[k] = (expBreakdown[k] || 0) + amt;
    });
    const pc = calcPurchaseCost(e);
    if (pc > 0) expBreakdown["Purchase Cost"] = (expBreakdown["Purchase Cost"] || 0) + pc;
  });
  const pieData = Object.entries(expBreakdown).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  // ── Trend ─────────────────────────────────────────────────
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const trend  = [...sorted].reverse().map(e => ({
    date:    e.date,
    Revenue: e.totalRevenue || 0,
    Exp:     calcPurchaseCost(e) + calcIndirectExpenses(e),
    Profit:  (e.totalRevenue || 0) - calcPurchaseCost(e) - calcIndirectExpenses(e),
  }));

  // ── Drill helpers ─────────────────────────────────────────
  const revDrill = () => {
    const r = entries.reduce((acc, e) => {
      const rs = e.revenueSplit || {};
      ACCOUNTS.forEach(a => { acc[a.key] = (acc[a.key] || 0) + (rs[a.key] || 0); });
      return acc;
    }, {});
    return ACCOUNTS.map(a => [a.label, r[a.key] || 0, a.color]);
  };

  const expDrill = () => [
    ["Purchase Cost",         totalPurchaseCost, "#f43f5e"],
    ["Indirect / Operations", totalIndirect,     "#f59e0b"],
  ];

  // Combined credit drill: both expense credit and salary
  const creditDrill = () => [
    ["── Expense Credit (Vendor) ──", 0, "#888"],
    ["  Credit Raised",              totalExpCreditRaised,      "#f59e0b"],
    ["  Settled",                    totalExpCreditSettled,     "#10b981"],
    ["  Outstanding",                totalExpCreditOutstanding, totalExpCreditOutstanding > 0 ? "#ef4444" : "#10b981"],
    ["── Salary Credit (Staff) ──",  0, "#888"],
    ["  Monthly Salary Bill",        totalSalaryCredit,         "#6366f1"],
    ["  Salary Settled",             totalSalarySettled,        "#10b981"],
    ["  Salary Outstanding",         totalSalaryOutstanding,    totalSalaryOutstanding > 0 ? "#ef4444" : "#10b981"],
  ];

  const advDrill = () => {
    const wb = advances.filter(a => (a.outstanding || 0) > 0);
    if (!wb.length) return [["No outstanding advances", 0, "#10b981"]];
    return wb.map(a => [a.staffName || a.staffId?.name || "Staff", a.outstanding, "#f43f5e"]);
  };

  const filterLabels = { lifetime:"All time", today:"Today", thisMonth:"This month", thisYear:"This year", custom:"Custom" };

  return (
    <div style={{ minHeight:"100vh", background:"#F7F6F3", fontFamily:"'Plus Jakarta Sans','DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .card{background:#fff;border:1px solid #ECEAE4;border-radius:18px;box-shadow:0 1px 4px rgba(0,0,0,.05);transition:box-shadow .2s,transform .15s;}
        .card:hover{box-shadow:0 6px 28px rgba(0,0,0,.09);transform:translateY(-1px);}
        .clabel{font-size:10px;font-weight:600;color:#A8A49C;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;}
        .btn-ink{background:#0D0D0D;color:#fff;border:none;border-radius:11px;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18);transition:background .12s,transform .1s;}
        .btn-ink:hover{background:#222;transform:translateY(-1px);}
        .btn-ghost{background:#fff;color:#333;border:1px solid #ECEAE4;border-radius:11px;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:all .12s;}
        .btn-ghost:hover{border-color:#bbb;}
        .btn-sm{background:#0D0D0D;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:background .1s;}
        .btn-sm:hover{background:#222;}
        .btn-sm-red{background:#fff;color:#E11D48;border:1px solid #FCA5A5;border-radius:8px;padding:6px 14px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:all .1s;}
        .btn-sm-red:hover{background:#FFF1F2;}
        .fpill{padding:6px 16px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid #ECEAE4;background:#fff;color:#888;transition:all .12s;font-family:inherit;}
        .fpill.on{background:#0D0D0D;color:#fff;border-color:#0D0D0D;box-shadow:0 2px 8px rgba(0,0,0,.16);}
        .fpill:hover:not(.on){border-color:#bbb;color:#333;}
        input[type="date"]{background:#fff;border:1px solid #ECEAE4;color:#333;padding:6px 11px;border-radius:8px;font-family:inherit;font-size:12px;outline:none;}
        .tap{cursor:pointer;}
        .req-row{background:#FAFAF8;border:1px solid #ECEAE4;border-radius:12px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;transition:all .12s;}
        .req-row:hover{background:#F5F3EF;}
        .rtr:hover td{background:#FAFAF8;}
        .num{font-family:'DM Mono',monospace;}
        @keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .fu{animation:fu .3s ease both;}
      `}</style>

      <div style={{ maxWidth:1300, margin:"0 auto", padding:"36px 24px" }}>

        {/* ── Header ── */}
        <div className="fu" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:26 }}>
          <div>
            <p style={{ fontSize:10, color:"#A8A49C", letterSpacing:".14em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", marginBottom:5 }}>ROI Tracker</p>
            <h1 style={{ fontSize:30, fontWeight:800, color:"#0D0D0D", letterSpacing:"-.03em" }}>Dashboard</h1>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:6 }}>
            {pendingRequests.length > 0 && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#92400E", fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#F59E0B", display:"inline-block" }}/>
                {pendingRequests.length} pending
              </div>
            )}
            {totalCreditOutstanding > 0 && (
              <div style={{ background:"#FFF1F2", border:"1px solid #FCA5A5", borderRadius:20, padding:"6px 14px", fontSize:12, color:"#be123c", fontWeight:500, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}
                onClick={() => setDrill({ title:"Total Credit Outstanding", rows:creditDrill() })}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", display:"inline-block" }}/>
                Credit: {fmt(totalCreditOutstanding)}
              </div>
            )}
            <button className="btn-ink" onClick={() => navigate("/add")}>+ Add entry</button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="fu" style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24, alignItems:"center", animationDelay:".04s" }}>
          {Object.entries(filterLabels).map(([f, label]) => (
            <button key={f} className={`fpill${filter===f?" on":""}`}
              onClick={() => { setFilter(f); setStartDate(""); setEndDate(""); }}>{label}</button>
          ))}
          {filter === "custom" && (
            <div style={{ display:"flex", gap:8, alignItems:"center", marginLeft:4 }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
              <span style={{ color:"#C8C4BB", fontSize:13 }}>→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
            </div>
          )}
        </div>

        {/* ── 5 Stat Cards ── */}
        <div className="fu" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))", gap:14, marginBottom:16, animationDelay:".08s" }}>

          {/* 1. Revenue */}
          <div className="card tap" style={{ padding:"22px 22px 18px", borderTop:"3px solid #6366f1" }}
            onClick={() => setDrill({ title:"Revenue by Account", rows:revDrill() })}>
            <div className="clabel">Total Revenue ↗</div>
            <div className="num" style={{ fontSize:26, fontWeight:700, color:"#6366f1", marginBottom:5 }}>{fmt(totalRevenue)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>{entries.length} entries · tap to split</div>
          </div>

          {/* 2. Expenses */}
          <div className="card tap" style={{ padding:"22px 22px 18px", borderTop:"3px solid #f43f5e" }}
            onClick={() => setDrill({ title:"Expense Breakdown", rows:expDrill() })}>
            <div className="clabel">Total Expenses ↗</div>
            <div className="num" style={{ fontSize:26, fontWeight:700, color:"#f43f5e", marginBottom:5 }}>{fmt(totalExpenses)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>PC {fmt(totalPurchaseCost)} · Ind {fmt(totalIndirect)}</div>
          </div>

          {/* 3. Profit */}
          <div className="card" style={{ padding:"22px 22px 18px", borderTop:`3px solid ${profit>=0?"#10b981":"#ef4444"}` }}>
            <div className="clabel">Net Profit</div>
            <div className="num" style={{ fontSize:26, fontWeight:700, color:profit>=0?"#10b981":"#ef4444", marginBottom:5 }}>{fmt(profit)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>{profitMargin.toFixed(1)}% margin</div>
          </div>

          {/* 4. Total Credit Outstanding (expense vendor + salary) */}
          <div className="card tap" style={{ padding:"22px 22px 18px", borderTop:`3px solid ${totalCreditOutstanding>0?"#ef4444":"#10b981"}` }}
            onClick={() => setDrill({ title:"Total Credit Outstanding", rows:creditDrill() })}>
            <div className="clabel">Total Credit ↗</div>
            <div className="num" style={{ fontSize:26, fontWeight:700, color:totalCreditOutstanding>0?"#ef4444":"#10b981", marginBottom:5 }}>{fmt(totalCreditOutstanding)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>
              Exp: {fmt(totalExpCreditOutstanding)} · Sal: {fmt(totalSalaryOutstanding)}
            </div>
          </div>

          {/* 5. Staff Advance (advance given vs deducted) */}
          <div className="card tap" style={{ padding:"22px 22px 18px", borderTop:"3px solid #8b5cf6" }}
            onClick={() => setDrill({ title:"Staff Advance Outstanding", rows:advDrill() })}>
            <div className="clabel">Staff Advance ↗</div>
            <div className="num" style={{ fontSize:26, fontWeight:700, color:totalAdvOutstanding>0?"#8b5cf6":"#10b981", marginBottom:5 }}>{fmt(totalAdvOutstanding)}</div>
            <div style={{ fontSize:11, color:"#A8A49C" }}>Given {fmt(totalAdvGiven)} · tap detail</div>
          </div>
        </div>

        {/* ── Credit breakdown strip ── */}
        {totalCreditOutstanding > 0 && (
          <div className="fu card" style={{ padding:"16px 22px", marginBottom:16, background:"#FFF8F8", border:"1px solid #FECACA", animationDelay:".1s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }}>💳</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#be123c" }}>Credit Outstanding — {fmt(totalCreditOutstanding)}</div>
                  <div style={{ fontSize:11, color:"#f43f5e", marginTop:2 }}>Vendor expense credit + unpaid salary</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                {[
                  ["Exp Credit",    totalExpCreditOutstanding, "#f59e0b"],
                  ["Salary Due",    totalSalaryOutstanding,    "#ef4444"],
                  ["Exp Settled",   totalExpCreditSettled,     "#10b981"],
                  ["Salary Settled",totalSalarySettled,        "#10b981"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#A8A49C", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em" }}>{label}</div>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:"'DM Mono',monospace", color }}>{fmt(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Account Balances ── */}
        <div className="fu card" style={{ padding:"20px 22px", marginBottom:18, animationDelay:".12s" }}>
          <div className="clabel">Account Balances</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {ACCOUNTS.map(a => (
              <div key={a.key} style={{ background:"#FAFAF8", borderRadius:14, padding:"16px 18px", border:"1px solid #ECEAE4", borderLeft:`3px solid ${a.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:a.color, display:"inline-block" }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{a.label}</span>
                </div>
                <div className="num" style={{ fontSize:20, fontWeight:700, color:accountBalance[a.key]>=0?"#0D0D0D":"#ef4444" }}>
                  {fmt(accountBalance[a.key])}
                </div>
                <div style={{ fontSize:10, color:"#A8A49C", marginTop:3 }}>inflow − outflow</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stock Widget ── */}
        <div className="fu card" style={{ padding:"20px 22px", marginBottom:18, animationDelay:".14s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div className="clabel" style={{ marginBottom:0, display:"flex", alignItems:"center", gap:6 }}>
              <FiPackage size={12}/> Today's Stock
            </div>
            <button onClick={() => navigate("/stock")} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              Manage →
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12 }}>
            {[
              { label:"Opening", val:fmt(stockToday?.opening?.totalValue||0), items:stockToday?.opening?.items?.length||0, color:"#6366f1", bg:"#EEF2FF", border:"#C7D2FE", icon:<FiTrendingUp size={13} color="#6366f1"/>, status:stockToday?.opening?"saved":"pending" },
              { label:"Closing", val:fmt(stockToday?.closing?.totalValue||0), items:stockToday?.closing?.items?.length||0, color:"#10b981", bg:"#ECFDF5", border:"#A7F3D0", icon:<FiTrendingDown size={13} color="#10b981"/>, status:stockToday?.closing?"saved":"pending" },
              { label:"Mo. Opening", val:fmt(stockSummary?.totalOpeningValue||0), items:null, color:"#6366f1", bg:"#F5F3FF", border:"#DDD6FE", icon:<FiPackage size={13} color="#6366f1"/>, status:null },
              { label:"Mo. Closing",  val:fmt(stockSummary?.totalClosingValue||0), items:null, color:"#10b981", bg:"#ECFDF5", border:"#A7F3D0", icon:<FiPackage size={13} color="#10b981"/>, status:null },
            ].map(({ label, val, items, color, bg, border, icon, status }) => (
              <div key={label} style={{ background:bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${border}`, cursor:"pointer" }} onClick={() => navigate("/stock")}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {icon}
                    <span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{label}</span>
                  </div>
                  {status==="saved"   && <span style={{ fontSize:9, fontWeight:700, background:"#fff", color, border:`1px solid ${border}`, borderRadius:4, padding:"1px 6px" }}>✓</span>}
                  {status==="pending" && <span style={{ fontSize:9, fontWeight:700, background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A", borderRadius:4, padding:"1px 6px" }}>Pending</span>}
                </div>
                <div className="num" style={{ fontSize:20, fontWeight:700, color }}>{val}</div>
                {items !== null && <div style={{ fontSize:10, color:"#A8A49C", marginTop:3 }}>{items>0?`${items} items`:"No items yet"}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="fu" style={{ display:"grid", gridTemplateColumns:"1.65fr 1fr", gap:14, marginBottom:18, animationDelay:".16s" }}>
          <div className="card" style={{ padding:"22px 24px" }}>
            <div className="clabel">Performance Trend</div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={trend}>
                <defs>
                  {[["gR","#6366f1"],["gE","#f43f5e"],["gP","#10b981"]].map(([id,c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 5" stroke="#F0EEE9" vertical={false}/>
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})} tick={{ fill:"#B0AEA8", fontSize:10, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill:"#B0AEA8", fontSize:10, fontFamily:"'DM Mono',monospace" }} axisLine={false} tickLine={false} width={48}/>
                <Tooltip content={<DarkTooltip/>}/>
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gR)" dot={false}/>
                <Area type="monotone" dataKey="Exp"     stroke="#f43f5e" strokeWidth={2}   fill="url(#gE)" dot={false} name="Expenses"/>
                <Area type="monotone" dataKey="Profit"  stroke="#10b981" strokeWidth={2}   fill="url(#gP)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", gap:18, marginTop:10 }}>
              {[["#6366f1","Revenue"],["#f43f5e","Expenses"],["#10b981","Profit"]].map(([c,l]) => (
                <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#A8A49C" }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:c }}/> {l}
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding:"22px 24px" }}>
            <div className="clabel">Expense Split</div>
            {pieData.length === 0 ? <p style={{ color:"#C8C4BB", fontSize:13 }}>No data</p> : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={68} innerRadius={38} paddingAngle={2} strokeWidth={0}>
                      {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip content={<DarkTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
                  {pieData.slice(0,5).map((d,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}/>
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

        {/* ── Bottom: Staff quick actions + Pending requests ── */}
        <div className="fu" style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:14, marginBottom:18, animationDelay:".2s" }}>
          <div className="card" style={{ padding:"22px", display:"flex", flexDirection:"column", gap:9 }}>
            <div className="clabel">Staff</div>
            <button className="btn-ink"   style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/users")}>View staff</button>
            <button className="btn-ghost" style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/register")}>Add staff</button>
            <button className="btn-ghost" style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/attendance")}>Attendance</button>
            <button className="btn-ghost" style={{ width:"100%", textAlign:"left" }} onClick={() => navigate("/staff")}>Salary Settlements</button>
          </div>
          <div className="card" style={{ padding:"22px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div className="clabel" style={{ marginBottom:0 }}>Pending Requests</div>
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
        <div className="fu card" style={{ overflow:"hidden", animationDelay:".24s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 22px", borderBottom:"1px solid #ECEAE4" }}>
            <div className="clabel" style={{ marginBottom:0 }}>Recent Entries</div>
            <button onClick={() => navigate("/entries")} style={{ background:"none", border:"none", color:"#A8A49C", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>View all →</button>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #F5F3EF" }}>
                  {["Date","Revenue","Purchase","Indirect","Profit","Exp Credit",""].map((h,i) => (
                    <th key={i} style={{ padding:"11px 20px", textAlign:i>0&&i<6?"right":"left", color:"#B0AEA8", fontWeight:500, fontSize:10, letterSpacing:".1em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0,5).map(e => {
                  const pc      = calcPurchaseCost(e);
                  const ind     = calcIndirectExpenses(e);
                  const p       = (e.totalRevenue||0) - pc - ind;
                  const expCr   = calcExpCreditOutstanding(e);
                  return (
                    <tr key={e._id} className="rtr" style={{ borderBottom:"1px solid #F7F6F3" }}>
                      <td style={{ padding:"14px 20px" }}><span className="num" style={{ fontSize:12, color:"#666" }}>{new Date(e.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ fontWeight:600, color:"#6366f1" }}>{fmt(e.totalRevenue)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ color:"#f43f5e" }}>{fmt(pc)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ color:"#888" }}>{fmt(ind)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}><span className="num" style={{ fontWeight:700, color:p>=0?"#10b981":"#ef4444" }}>{fmt(p)}</span></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}>
                        {expCr > 0
                          ? <span style={{ fontSize:11, background:"#FFF1F2", color:"#be123c", border:"1px solid #FCA5A5", borderRadius:20, padding:"2px 8px" }}>{fmt(expCr)}</span>
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

      {drill && <DrillModal title={drill.title} rows={drill.rows} onClose={() => setDrill(null)}/>}

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