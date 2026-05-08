// src/pages/EntryDetails.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiChevronLeft, FiPlus, FiTrash2, FiEdit2, FiCreditCard, FiCheck } from "react-icons/fi";
import client from "../api/client";

// ── Constants ─────────────────────────────────────────────────
const ACCOUNTS = [
  { key: "cash",        label: "Cash",         color: "#10b981" },
  { key: "federalBank", label: "Federal Bank", color: "#6366f1" },
  { key: "vibgyorBank", label: "Vibgyor Bank", color: "#f59e0b" },
  { key: "asifAccount", label: "Asif Account", color: "#f43f5e" },
];

const EXPENSE_LABELS = {
  commissionOnSales:  "Commission on Sales",
  foodRefreshment:    "Food & Refreshment",
  rent:               "Rent",
  electricity:        "Electricity",
  travelFuel:         "Travel & Fuel",
  mobileInternet:     "Mobile & Internet",
  maintenance:        "Maintenance",
  incentive:          "Incentive",
  gasStaff:           "Gas (Staff)",
  gasStore:           "Gas (Store)",
  staffSalary:        "Staff Salary",
  staffAccommodation: "Staff Accommodation",
};

const fmt   = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const toNum = v => Number(v || 0);

const safeAmt = v =>
  v && typeof v === "object" && "amount" in v ? toNum(v.amount)
  : typeof v === "number" ? v : 0;

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  .ed-wrap  { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; padding-bottom:60px; }
  .ed-inner { max-width:820px; margin:0 auto; padding:32px 24px; }

  .section { background:#fff; border:1px solid #ECEAE4; border-radius:18px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); margin-bottom:14px; }
  .sec-header { padding:14px 20px; border-bottom:1px solid #ECEAE4; display:flex; justify-content:space-between; align-items:center; background:#FAFAF8; }
  .sec-title { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.12em; text-transform:uppercase; }

  /* main detail table */
  table.detail { width:100%; border-collapse:collapse; font-size:13px; }
  table.detail td { padding:11px 20px; border-bottom:1px solid #F7F6F3; vertical-align:middle; }
  table.detail tr:last-child td { border-bottom:none; }
  table.detail tr.header-row td { background:#FAFAF8; font-weight:600; color:#0D0D0D; font-size:12px; }
  table.detail tr.sub-row td:first-child { padding-left:32px; color:#666; }
  table.detail tr.total-row td { background:#F0FDF4; font-weight:700; }
  .td-right  { text-align:right; font-family:'DM Mono',monospace; }
  .td-label  { color:#555; }
  .source-badge { font-size:10px; font-weight:600; padding:2px 7px; border-radius:5px; margin-left:6px; display:inline-block; }

  /* credit pill inline */
  .credit-pill {
    display:inline-flex; align-items:center; gap:3px;
    font-size:10px; font-weight:600; padding:2px 7px; border-radius:20px;
    background:#FEF3C7; color:#92400E; border:1px solid #FDE68A;
    margin-left:6px; white-space:nowrap;
  }
  .settled-pill {
    display:inline-flex; align-items:center; gap:3px;
    font-size:10px; font-weight:600; padding:2px 7px; border-radius:20px;
    background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0;
    margin-left:4px; white-space:nowrap;
  }
  .outstanding-pill {
    display:inline-flex; align-items:center; gap:3px;
    font-size:10px; font-weight:600; padding:2px 7px; border-radius:20px;
    margin-left:4px; white-space:nowrap;
  }

  /* revenue split */
  .rev-split-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:16px 20px; }
  .rev-card { background:#FAFAF8; border-radius:10px; padding:12px 14px; border:1px solid #ECEAE4; }
  .rev-card-label { font-size:10px; font-weight:600; color:#666; margin-bottom:6px; display:flex; align-items:center; gap:5px; }
  .rev-card-val { font-size:16px; font-weight:700; font-family:'DM Mono',monospace; }
  .rev-card-pct { font-size:10px; color:#A8A49C; margin-top:2px; }
  .split-bar { display:flex; border-radius:4px; overflow:hidden; height:5px; background:#ECEAE4; margin:0 20px 16px; }

  /* expense credit summary */
  .exp-credit-summary { padding:14px 20px; background:#FFFBEB; border-top:1px solid #FDE68A; }
  .exp-credit-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:10px; }
  .ecc { border-radius:10px; padding:11px 14px; text-align:center; }
  .ecc-label { font-size:9px; font-weight:700; color:#A8A49C; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
  .ecc-val   { font-size:15px; font-weight:700; font-family:'DM Mono',monospace; }

  /* settle expense form */
  .settle-exp-form { padding:16px 20px; display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; border-top:1px solid #F0EEE9; background:#FAFAF8; }
  .settle-field { display:flex; flex-direction:column; gap:3px; }
  .settle-field label { font-size:10px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.06em; }
  .settle-field input, .settle-field select {
    background:#fff; border:1px solid #ECEAE4; border-radius:8px;
    padding:7px 10px; font-size:12px; font-family:inherit; outline:none; color:#0D0D0D;
    transition:border-color .1s;
  }
  .settle-field input:focus, .settle-field select:focus { border-color:#0D0D0D; }

  /* settle history */
  .settle-hist { padding:0 20px 14px; display:flex; flex-direction:column; gap:6px; }
  .sh-row { display:flex; justify-content:space-between; align-items:center; background:#FAFAF8; border:1px solid #ECEAE4; border-radius:8px; padding:8px 12px; font-size:12px; }
  .sh-date { color:#A8A49C; font-size:11px; }
  .sh-amt  { font-family:'DM Mono',monospace; font-weight:700; color:#10b981; }
  .sh-del  { background:none; border:none; color:#E5E2DB; cursor:pointer; padding:2px 4px; border-radius:4px; transition:color .1s; }
  .sh-del:hover { color:#E11D48; }

  /* buttons */
  .btn-ink   { background:#0D0D0D; color:#fff; border:none; border-radius:10px; padding:9px 18px; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.15); transition:background .12s,transform .1s; }
  .btn-ink:hover { background:#222; transform:translateY(-1px); }
  .btn-ink:active { transform:scale(.98); }
  .btn-ink:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .btn-ghost { background:#fff; color:#333; border:1px solid #ECEAE4; border-radius:10px; padding:9px 18px; font-family:inherit; font-size:12px; font-weight:500; cursor:pointer; transition:all .12s; }
  .btn-ghost:hover { border-color:#bbb; }
  .btn-edit  { background:linear-gradient(135deg,#f59e0b,#fbbf24); color:#fff; border:none; border-radius:10px; padding:8px 18px; font-family:inherit; font-size:12px; font-weight:600; cursor:pointer; box-shadow:0 2px 8px rgba(245,158,11,.3); transition:all .12s; }
  .btn-edit:hover { filter:brightness(1.05); transform:translateY(-1px); }
  .btn-back  { display:flex; align-items:center; gap:5px; background:none; border:none; color:#888; font-size:13px; cursor:pointer; font-family:inherit; transition:color .1s; }
  .btn-back:hover { color:#0D0D0D; }
  .btn-settle-quick { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:600; padding:3px 9px; border-radius:6px; border:1px solid #A7F3D0; background:#F0FDF4; color:#15803D; cursor:pointer; font-family:inherit; transition:all .1s; white-space:nowrap; margin-left:6px; }
  .btn-settle-quick:hover { background:#D1FAE5; }

  /* staff edit form */
  .req-form { padding:20px; display:flex; flex-direction:column; gap:14px; }
  .req-field { display:flex; flex-direction:column; gap:4px; }
  .req-field label { font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.06em; }
  .req-field select, .req-field input, .req-field textarea {
    background:#F7F6F3; border:1px solid #ECEAE4; border-radius:10px;
    padding:10px 12px; font-size:13px; font-family:inherit; outline:none; color:#0D0D0D;
    transition:border-color .1s;
  }
  .req-field select:focus, .req-field input:focus, .req-field textarea:focus { border-color:#0D0D0D; }
  .staff-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; background:#FEF9EC; color:#92400E; border:1px solid #FDE68A; border-radius:8px; padding:3px 10px; }

  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-thumb { background:#D5D2CA; border-radius:2px; }
`;

// ── helpers ───────────────────────────────────────────────────
const creditOutstanding = item =>
  item?.isCredit ? Math.max(0, toNum(item.amount) - toNum(item.creditSettled)) : 0;

// ── Main ──────────────────────────────────────────────────────
export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // settle-expense modal state
  const [settlingItem, setSettlingItem] = useState(null); // { path, label, amount, settled }
  const [settleVal,    setSettleVal]    = useState("");
  const [settleNote,   setSettleNote]   = useState("");

  // staff edit-request state
  const [fieldPath, setFieldPath] = useState("");
  const [newValue,  setNewValue]  = useState("");
  const [reason,    setReason]    = useState("");

  // ── Queries ────────────────────────────────────────────────
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  const { data: entry, isLoading, isError, error } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => (await client.get(`/roi/${id}`)).data,
    enabled: !!id,
  });

  const { data: myApproved = { requests: [] } } = useQuery({
    queryKey: ["myApprovedForEntry", id],
    queryFn: async () =>
      (await client.get("/roi/edit-requests", { params: { status: "APPROVED", entryId: id, mine: true, limit: 100 } })).data,
    enabled: !!id && !!me && me.role === "STAFF",
  });

  // ── Mutations ──────────────────────────────────────────────
  // Settle a single expense item credit
  const settleExpenseMutation = useMutation({
    mutationFn: payload => client.post(`/roi/${id}/settle-expense`, payload),
    onSuccess: () => {
      setSettlingItem(null); setSettleVal(""); setSettleNote("");
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
    },
  });

  const reqEdit = useMutation({
    mutationFn: payload => client.post("/roi/edit-request", payload),
    onSuccess: () => {
      setFieldPath(""); setNewValue(""); setReason("");
      alert("Edit request sent ✅");
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
    },
  });

  if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: "#A8A49C", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Loading…</div>;
  if (isError)   return <div style={{ padding: 40, color: "#ef4444" }}>Error: {error.message}</div>;
  if (!entry)    return <div style={{ padding: 40, color: "#A8A49C" }}>Entry not found.</div>;

  // ── Calculations ───────────────────────────────────────────
  const purchaseCostTotal = (entry.purchaseCost || []).reduce((s, p) => s + safeAmt(p), 0);
  const ex = entry.expenses || {};

  // Build expense rows for the table
  // Each row: { key, label, amt, source, isCredit, creditSettled, creditOutstanding, path, isSub, isGroup, isStaff }
  const expRows = [];

  const addSingleExp = (key, label) => {
    const v = ex[key];
    if (!v) return;
    const amt = safeAmt(v);
    if (amt <= 0) return;
    expRows.push({
      key, label, amt,
      source:           v.source || "",
      isCredit:         !!v.isCredit,
      creditSettled:    toNum(v.creditSettled),
      creditOutstanding: creditOutstanding(v),
      path:             `expenses.${key}`,
    });
  };

  // Commission
  addSingleExp("commissionOnSales", "Commission on Sales");

  // Staff (no credit)
  if (ex.staffSalary?.length) {
    const total = ex.staffSalary.reduce((s, i) => s + safeAmt(i), 0);
    if (total > 0) expRows.push({ key: "staffSalary", label: "Staff Salary", amt: total, source: "", isStaff: true });
  }
  if (ex.staffAccommodation?.length) {
    const total = ex.staffAccommodation.reduce((s, i) => s + safeAmt(i), 0);
    if (total > 0) expRows.push({ key: "staffAccommodation", label: "Staff Accommodation", amt: total, source: "", isStaff: true });
  }

  // Royalty fees
  if (ex.royaltyFees?.length) {
    ex.royaltyFees.forEach((r, i) => {
      if ((r.amount || 0) <= 0) return;
      expRows.push({
        key: `royaltyFees.${i}`, label: r.label || "Royalty / Mgt. Fee", amt: r.amount || 0,
        source: r.source || "",
        isCredit: !!r.isCredit, creditSettled: toNum(r.creditSettled),
        creditOutstanding: creditOutstanding(r),
        path: `expenses.royaltyFees[${i}]`,
      });
    });
  }

  // Single ops
  ["foodRefreshment","rent","electricity","travelFuel","mobileInternet","maintenance","incentive","gasStaff","gasStore"].forEach(k => {
    addSingleExp(k, EXPENSE_LABELS[k] || k);
  });

  // Marketing
  if (ex.marketing?.length) {
    const total = ex.marketing.reduce((s, m) => s + (m.amount || 0), 0);
    if (total > 0) {
      expRows.push({ key: "marketing", label: "Marketing", amt: total, source: "", isGroup: true });
      ex.marketing.forEach((m, i) => {
        if ((m.amount || 0) <= 0) return;
        expRows.push({
          key: `marketing.${i}`, label: m.remark || `Item ${i + 1}`, amt: m.amount || 0,
          source: m.source || "", isSub: true,
          isCredit: !!m.isCredit, creditSettled: toNum(m.creditSettled),
          creditOutstanding: creditOutstanding(m),
          path: `expenses.marketing[${i}]`,
        });
      });
    }
  }

  // Food wastage cooked
  if (ex.foodWastageCooked?.length) {
    const total = ex.foodWastageCooked.reduce((s, f) => s + (f.amount || 0), 0);
    if (total > 0) {
      expRows.push({ key: "foodWastageCooked", label: "Food Wastage — Cooked", amt: total, source: "", isGroup: true });
      ex.foodWastageCooked.forEach((f, i) => {
        if ((f.amount || 0) <= 0) return;
        expRows.push({
          key: `fwc.${i}`, label: f.item || `Item ${i + 1}`, amt: f.amount || 0, source: "", isSub: true,
          isCredit: !!f.isCredit, creditSettled: toNum(f.creditSettled),
          creditOutstanding: creditOutstanding(f),
          path: `expenses.foodWastageCooked[${i}]`,
        });
      });
    }
  }

  // Food wastage raw
  if (ex.foodWastageRaw?.length) {
    const total = ex.foodWastageRaw.reduce((s, f) => s + (f.amount || 0), 0);
    if (total > 0) {
      expRows.push({ key: "foodWastageRaw", label: "Food Wastage — Raw", amt: total, source: "", isGroup: true });
      ex.foodWastageRaw.forEach((f, i) => {
        if ((f.amount || 0) <= 0) return;
        expRows.push({
          key: `fwr.${i}`, label: f.item || `Item ${i + 1}`, amt: f.amount || 0, source: "", isSub: true,
          isCredit: !!f.isCredit, creditSettled: toNum(f.creditSettled),
          creditOutstanding: creditOutstanding(f),
          path: `expenses.foodWastageRaw[${i}]`,
        });
      });
    }
  }

  // Other
  if (ex.other?.length) {
    ex.other.forEach((o, i) => {
      if ((o.amount || 0) <= 0) return;
      expRows.push({
        key: `other.${i}`, label: `Other — ${o.reason || ""}`, amt: o.amount || 0,
        source: o.source || "",
        isCredit: !!o.isCredit, creditSettled: toNum(o.creditSettled),
        creditOutstanding: creditOutstanding(o),
        path: `expenses.other[${i}]`,
      });
    });
  }

  // Purchase cost credit rows
  const purchaseCreditRows = (entry.purchaseCost || [])
    .map((p, i) => ({ ...p, path: `purchaseCost[${i}]`, label: p.item || `Item ${i + 1}` }))
    .filter(p => p.isCredit);

  const totalExpenses = expRows.reduce((s, r) => r.isSub ? s : s + r.amt, 0);
  const grossIncome   = (entry.totalRevenue || 0) - purchaseCostTotal;
  const netProfit     = grossIncome - totalExpenses;

  // ── Expense credit totals ──────────────────────────────────
  const allCreditItems = [
    ...purchaseCreditRows,
    ...expRows.filter(r => r.isCredit && !r.isGroup),
  ];
  const totalExpCreditRaised      = allCreditItems.reduce((s, r) => s + toNum(r.amount ?? r.amt), 0);
  const totalExpCreditSettled     = allCreditItems.reduce((s, r) => s + toNum(r.creditSettled), 0);
  const totalExpCreditOutstanding = allCreditItems.reduce((s, r) => s + toNum(r.creditOutstanding), 0);

  // Revenue split
  const rs      = entry.revenueSplit || {};
  const totalRev = entry.totalRevenue || 0;

  // Staff approved paths
  const approvedPaths = new Set(
    (myApproved?.requests || []).filter(r => !r.consumed).map(r => r.fieldPath)
  );
  const staffHasApproved = approvedPaths.size > 0;

  // ── sub-components ────────────────────────────────────────
  const SourceBadge = ({ src }) => {
    if (!src) return null;
    const a = ACCOUNTS.find(x => x.key === src);
    if (!a) return null;
    return <span className="source-badge" style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}44` }}>{a.label}</span>;
  };

  const CreditCells = ({ row }) => {
    if (!row.isCredit) return null;
    const outstanding = toNum(row.creditOutstanding);
    return (
      <>
        <span className="credit-pill"><FiCreditCard size={9}/> {fmt(row.amount ?? row.amt)}</span>
        {toNum(row.creditSettled) > 0 && <span className="settled-pill"><FiCheck size={9}/> {fmt(row.creditSettled)}</span>}
        <span className="outstanding-pill" style={{
          background: outstanding > 0 ? "#FEF2F2" : "#F0FDF4",
          color: outstanding > 0 ? "#ef4444" : "#10b981",
          border: `1px solid ${outstanding > 0 ? "#FECACA" : "#BBF7D0"}`,
        }}>
          {outstanding > 0 ? `${fmt(outstanding)} due` : "✓ settled"}
        </span>
        {me?.role === "OWNER" && outstanding > 0 && (
          <button className="btn-settle-quick"
            onClick={() => {
              setSettlingItem({ path: row.path, label: row.label, amount: row.amount ?? row.amt, settled: toNum(row.creditSettled) });
              setSettleVal("");
              setSettleNote("");
            }}>
            <FiPlus size={9}/> Settle
          </button>
        )}
      </>
    );
  };

  return (
    <div className="ed-wrap">
      <style>{CSS}</style>
      <div className="ed-inner">

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button className="btn-back" onClick={() => navigate(-1)}><FiChevronLeft size={15} /> Back</button>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#A8A49C", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>Entry</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0D0D0D", letterSpacing: "-.02em" }}>
              {new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </h1>
          </div>
          {(me?.role === "OWNER" || (me?.role === "STAFF" && staffHasApproved)) && (
            <button className="btn-edit" onClick={() => navigate(`/entries/${id}/edit`)}>
              <FiEdit2 size={13} style={{ marginRight: 5 }} /> Edit entry
            </button>
          )}
        </div>

        {/* ── Revenue Split ── */}
        <div className="section">
          <div className="sec-header">
            <span className="sec-title">Revenue Breakdown</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: "#6366f1" }}>{fmt(totalRev)}</span>
          </div>
          <div className="rev-split-grid">
            {ACCOUNTS.map(a => {
              const v = rs[a.key] || 0;
              const pct = totalRev > 0 ? ((v / totalRev) * 100).toFixed(1) : 0;
              return (
                <div key={a.key} className="rev-card" style={{ borderLeft: `3px solid ${a.color}` }}>
                  <div className="rev-card-label">
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, display: "inline-block" }} />
                    {a.label}
                  </div>
                  <div className="rev-card-val" style={{ color: v > 0 ? a.color : "#C8C4BB" }}>{fmt(v)}</div>
                  {v > 0 && <div className="rev-card-pct">{pct}%</div>}
                </div>
              );
            })}
          </div>
          {totalRev > 0 && (
            <div className="split-bar">
              {ACCOUNTS.map(a => { const pct = ((rs[a.key] || 0) / totalRev) * 100; return pct > 0 ? <div key={a.key} style={{ width: `${pct}%`, background: a.color }} /> : null; })}
            </div>
          )}
        </div>

        {/* ── Financial Breakdown ── */}
        <div className="section">
          <div className="sec-header"><span className="sec-title">Financial Breakdown</span></div>
          <table className="detail">
            <tbody>
              <tr>
                <td className="td-label">Daily Revenue</td>
                <td className="td-right" style={{ color: "#6366f1", fontWeight: 700 }}>{fmt(entry.totalRevenue)}</td>
              </tr>

              {/* Purchase Cost */}
              <tr>
                <td className="td-label">Purchase Cost</td>
                <td className="td-right" style={{ color: "#f43f5e" }}>− {fmt(purchaseCostTotal)}</td>
              </tr>
              {(entry.purchaseCost || []).filter(p => (p.amount || 0) > 0).map((p, i) => (
                <tr key={i} className="sub-row">
                  <td>
                    {p.item || `Item ${i + 1}`}
                    <SourceBadge src={p.source} />
                    <CreditCells row={{ ...p, path: `purchaseCost[${i}]`, label: p.item || `Item ${i + 1}` }} />
                  </td>
                  <td className="td-right" style={{ color: "#888" }}>{fmt(p.amount)}</td>
                </tr>
              ))}

              <tr className="header-row">
                <td>Gross Income</td>
                <td className="td-right">{fmt(grossIncome)}</td>
              </tr>

              {/* Expenses header */}
              <tr>
                <td colSpan={2} style={{ padding: "10px 20px 6px", background: "#FAFAF8", fontSize: 10, fontWeight: 700, color: "#A8A49C", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Expenses
                </td>
              </tr>

              {expRows.map(r => (
                <tr key={r.key}
                  className={r.isSub ? "sub-row" : ""}
                  style={
                    r.key === "commissionOnSales" ? { background: "#FFF7ED" } :
                    r.isStaff ? { background: "#F0FDF4" } : {}
                  }>
                  <td style={r.isGroup ? { fontWeight: 600, color: "#333" } : {}}>
                    {r.label}
                    <SourceBadge src={r.source} />
                    {!r.isGroup && !r.isStaff && <CreditCells row={r} />}
                  </td>
                  <td className="td-right" style={{ color: r.isSub ? "#888" : "#333" }}>{fmt(r.amt)}</td>
                </tr>
              ))}

              <tr className="header-row">
                <td>Total Expenses</td>
                <td className="td-right" style={{ color: "#f43f5e" }}>{fmt(totalExpenses)}</td>
              </tr>
              <tr className="total-row">
                <td style={{ color: "#15803D", fontWeight: 700 }}>Net Profit</td>
                <td className="td-right" style={{ color: netProfit >= 0 ? "#15803D" : "#ef4444", fontSize: 15 }}>{fmt(netProfit)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Expense Credit Summary ── */}
          {totalExpCreditRaised > 0 && (
            <div className="exp-credit-summary">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>💳 Expense Credit Summary</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: totalExpCreditOutstanding > 0 ? "#FEF3C7" : "#F0FDF4", color: totalExpCreditOutstanding > 0 ? "#92400E" : "#15803D", border: `1px solid ${totalExpCreditOutstanding > 0 ? "#FDE68A" : "#BBF7D0"}` }}>
                  {totalExpCreditOutstanding > 0 ? `${fmt(totalExpCreditOutstanding)} outstanding` : "All settled ✓"}
                </span>
              </div>
              <div className="exp-credit-grid">
                <div className="ecc" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <div className="ecc-label">Credit Raised</div>
                  <div className="ecc-val" style={{ color: "#f59e0b" }}>{fmt(totalExpCreditRaised)}</div>
                </div>
                <div className="ecc" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div className="ecc-label">Settled</div>
                  <div className="ecc-val" style={{ color: "#10b981" }}>{fmt(totalExpCreditSettled)}</div>
                </div>
                <div className="ecc" style={{ background: totalExpCreditOutstanding > 0 ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${totalExpCreditOutstanding > 0 ? "#FECACA" : "#BBF7D0"}` }}>
                  <div className="ecc-label">Outstanding</div>
                  <div className="ecc-val" style={{ color: totalExpCreditOutstanding > 0 ? "#ef4444" : "#10b981" }}>{fmt(totalExpCreditOutstanding)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Settle Expense Modal ── */}
        {settlingItem && me?.role === "OWNER" && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setSettlingItem(null)}>
            <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 420, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0D0D0D", marginBottom: 4 }}>Settle Expense Credit</h3>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 18 }}>{settlingItem.label}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[
                  ["Total", toNum(settlingItem.amount), "#f59e0b", "#FFFBEB", "#FDE68A"],
                  ["Already Settled", settlingItem.settled, "#10b981", "#F0FDF4", "#BBF7D0"],
                  ["Still Outstanding", toNum(settlingItem.amount) - settlingItem.settled, "#ef4444", "#FEF2F2", "#FECACA"],
                ].map(([l, v, c, bg, border]) => (
                  <div key={l} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#A8A49C", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: c }}>{fmt(v)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="settle-field">
                  <label>Amount to settle now</label>
                  <input type="number" value={settleVal} onChange={e => setSettleVal(e.target.value)}
                    placeholder={`max ${fmt(toNum(settlingItem.amount) - settlingItem.settled)}`}
                    onWheel={e => e.target.blur()} style={{ width: "100%" }} />
                </div>
                <div className="settle-field">
                  <label>Note (optional)</label>
                  <input type="text" value={settleNote} onChange={e => setSettleNote(e.target.value)}
                    placeholder="e.g. Paid by cash" style={{ width: "100%" }} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button className="btn-ink"
                    disabled={!settleVal || toNum(settleVal) <= 0 || settleExpenseMutation.isPending}
                    onClick={() => settleExpenseMutation.mutate({
                      path: settlingItem.path,
                      amount: toNum(settleVal),
                      note: settleNote,
                    })}>
                    {settleExpenseMutation.isPending ? "Saving…" : "Record Settlement"}
                  </button>
                  <button className="btn-ghost" onClick={() => setSettlingItem(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STAFF: Edit Request Form ── */}
        {me?.role === "STAFF" && (
          <div className="section">
            <div className="sec-header">
              <span className="sec-title">📌 Request an Edit</span>
              {staffHasApproved && <span className="staff-badge">✏️ {approvedPaths.size} field{approvedPaths.size !== 1 ? "s" : ""} approved</span>}
            </div>
            <div className="req-form">
              <div className="req-field">
                <label>Category</label>
                <select value={fieldPath.split(".")[0]?.split("[")[0] || ""} onChange={e => { setFieldPath(""); setNewValue(""); setReason(""); setFieldPath(e.target.value); }}>
                  <option value="">— Choose category —</option>
                  <option value="revenue">Revenue</option>
                  {(entry.purchaseCost || []).length > 0 && <option value="purchaseCost">Purchase Cost</option>}
                  <option value="expenses">Expenses</option>
                </select>
              </div>

              {fieldPath === "revenue" && (
                <div className="req-field">
                  <label>Field</label>
                  <select onChange={e => setFieldPath(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="totalRevenue">Total Revenue ({fmt(entry.totalRevenue)})</option>
                    {ACCOUNTS.map(a => (rs[a.key] || 0) > 0 && (
                      <option key={a.key} value={`revenueSplit.${a.key}`}>{a.label} ({fmt(rs[a.key])})</option>
                    ))}
                  </select>
                </div>
              )}

              {fieldPath === "purchaseCost" && (
                <div className="req-field">
                  <label>Item</label>
                  <select onChange={e => setFieldPath(e.target.value)}>
                    <option value="">— Select —</option>
                    {(entry.purchaseCost || []).filter(p => (p.amount || 0) > 0).map((p, i) => (
                      <optgroup key={i} label={`Item ${i + 1}`}>
                        <option value={`purchaseCost[${i}].item`}>Name ({p.item})</option>
                        <option value={`purchaseCost[${i}].amount`}>Amount ({fmt(p.amount)})</option>
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {fieldPath === "expenses" && (
                <div className="req-field">
                  <label>Expense</label>
                  <select onChange={e => setFieldPath(e.target.value)}>
                    <option value="">— Select —</option>
                    {Object.entries(ex).map(([key, val]) => {
                      if (key === "staffSalary" || key === "staffAccommodation") return null;
                      if (key === "marketing" && Array.isArray(val)) {
                        return val.map((m, i) => (
                          <option key={`mkt-${i}`} value={`expenses.marketing[${i}].amount`}>
                            Marketing — {m.remark || `Item ${i + 1}`} ({fmt(m.amount)})
                          </option>
                        ));
                      }
                      if (key === "royaltyFees" && Array.isArray(val)) {
                        return val.map((r, i) => (
                          <option key={`rf-${i}`} value={`expenses.royaltyFees[${i}].amount`}>
                            {r.label || "Royalty"} ({fmt(r.amount)})
                          </option>
                        ));
                      }
                      if (key === "other" && Array.isArray(val)) {
                        return val.map((o, i) => (
                          <option key={`oth-${i}`} value={`expenses.other[${i}].amount`}>
                            Other — {o.reason || `Item ${i + 1}`} ({fmt(o.amount)})
                          </option>
                        ));
                      }
                      if (Array.isArray(val)) return null;
                      const amt = safeAmt(val);
                      if (amt <= 0) return null;
                      const label = EXPENSE_LABELS[key] || key.replace(/([A-Z])/g, " $1");
                      return (
                        <option key={key} value={`expenses.${key}.amount`}>
                          {label} ({fmt(amt)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="req-field">
                <label>New Value</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Enter new value" />
              </div>
              <div className="req-field">
                <label>Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why should this be updated?" rows={3} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ink" disabled={!fieldPath || !newValue || !reason || reqEdit.isPending}
                  onClick={() => reqEdit.mutate({ entryId: id, fieldPath, newValue, reason })}>
                  {reqEdit.isPending ? "Sending…" : "Send Request"}
                </button>
                <button className="btn-ghost" onClick={() => { setFieldPath(""); setNewValue(""); setReason(""); }}>Clear</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}