// src/pages/EntryDetails.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiChevronLeft, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import client from "../api/client";

// ── Constants ─────────────────────────────────────────────────
const ACCOUNTS = [
  { key: "cash",        label: "Cash",         color: "#10b981" },
  { key: "federalBank", label: "Federal Bank", color: "#6366f1" },
  { key: "vibgyorBank", label: "Vibgyor Bank", color: "#f59e0b" },
  { key: "asifAccount", label: "Asif Account", color: "#f43f5e" },
];

const EXPENSE_LABELS = {
  commissionOnSales: "Commission on Sales",
  foodRefreshment:   "Food & Refreshment",
  rent:              "Rent",
  electricity:       "Electricity",
  travelFuel:        "Travel & Fuel",
  mobileInternet:    "Mobile & Internet",
  maintenance:       "Maintenance",
  incentive:         "Incentive",
  gasStaff:          "Gas (Staff)",
  gasStore:          "Gas (Store)",
  staffSalary:       "Staff Salary",
  staffAccommodation:"Staff Accommodation",
};

const fmt = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const safeAmt = v =>
  v && typeof v === "object" && "amount" in v ? Number(v.amount || 0)
  : typeof v === "number" ? v : 0;

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  .ed-wrap { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; padding-bottom:60px; }
  .ed-inner { max-width:820px; margin:0 auto; padding:32px 24px; }

  .section { background:#fff; border:1px solid #ECEAE4; border-radius:18px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); margin-bottom:14px; }
  .sec-header { padding:14px 20px; border-bottom:1px solid #ECEAE4; display:flex; justify-content:space-between; align-items:center; background:#FAFAF8; }
  .sec-title { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.12em; text-transform:uppercase; }

  table.detail { width:100%; border-collapse:collapse; font-size:13px; }
  table.detail td { padding:12px 20px; border-bottom:1px solid #F7F6F3; }
  table.detail tr:last-child td { border-bottom:none; }
  table.detail tr.header-row td { background:#FAFAF8; font-weight:600; color:#0D0D0D; font-size:12px; }
  table.detail tr.sub-row td:first-child { padding-left:32px; color:#666; }
  table.detail tr.total-row td { background:#F0FDF4; font-weight:700; }
  table.detail tr.highlight td { background:#FFFBEB; }
  .td-right { text-align:right; font-family:'DM Mono',monospace; }
  .td-label { color:#555; }
  .source-badge { font-size:10px; font-weight:600; padding:2px 7px; border-radius:5px; margin-left:6px; display:inline-block; }

  .rev-split-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:16px 20px; }
  .rev-card { background:#FAFAF8; border-radius:10px; padding:12px 14px; border:1px solid #ECEAE4; }
  .rev-card-label { font-size:10px; font-weight:600; color:#666; margin-bottom:6px; display:flex; align-items:center; gap:5px; }
  .rev-card-val { font-size:16px; font-weight:700; font-family:'DM Mono',monospace; }
  .rev-card-pct { font-size:10px; color:#A8A49C; margin-top:2px; }

  .split-bar { display:flex; border-radius:4px; overflow:hidden; height:5px; background:#ECEAE4; margin:0 20px 16px; }

  .credit-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; padding:16px 20px; }
  .cr-card { border-radius:10px; padding:12px 14px; text-align:center; }
  .cr-label { font-size:10px; font-weight:600; color:#A8A49C; text-transform:uppercase; letter-spacing:.08em; margin-bottom:5px; }
  .cr-val { font-size:17px; font-weight:700; font-family:'DM Mono',monospace; }

  /* Settlement form */
  .settle-form { padding:16px 20px; display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; border-top:1px solid #F0EEE9; }
  .settle-field { display:flex; flex-direction:column; gap:3px; }
  .settle-field label { font-size:10px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.06em; }
  .settle-field input, .settle-field select {
    background:#F7F6F3; border:1px solid #ECEAE4; border-radius:8px;
    padding:7px 10px; font-size:12px; font-family:inherit; outline:none; color:#0D0D0D;
  }
  .settle-field input:focus, .settle-field select:focus { border-color:#0D0D0D; }
  .settle-hist { padding:0 20px 16px; display:flex; flex-direction:column; gap:6px; }
  .sh-row { display:flex; justify-content:space-between; align-items:center; background:#FAFAF8; border:1px solid #ECEAE4; border-radius:8px; padding:8px 12px; font-size:12px; }
  .sh-date { color:#A8A49C; font-size:11px; }
  .sh-amt  { font-family:'DM Mono',monospace; font-weight:700; color:#10b981; }
  .sh-del  { background:none; border:none; color:#E5E2DB; cursor:pointer; padding:2px 4px; border-radius:4px; transition:color .1s; }
  .sh-del:hover { color:#E11D48; }

  /* Buttons */
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

  /* Staff edit form */
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

// ── Main ──────────────────────────────────────────────────────
export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [settleAmt,  setSettleAmt]  = useState("");
  const [settleAcct, setSettleAcct] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [fieldPath,  setFieldPath]  = useState("");
  const [newValue,   setNewValue]   = useState("");
  const [reason,     setReason]     = useState("");

  // ── Queries ────────────────────────────────────────────────
  const { data: me } = useQuery({ queryKey:["me"], queryFn: async () => (await client.get("/auth/me")).data.user });

  const { data: entry, isLoading, isError, error } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => (await client.get(`/roi/${id}`)).data,
    enabled: !!id,
  });

  const { data: myApproved = { requests: [] } } = useQuery({
    queryKey: ["myApprovedForEntry", id],
    queryFn: async () =>
      (await client.get("/roi/edit-requests", { params:{ status:"APPROVED", entryId:id, mine:true, limit:100 } })).data,
    enabled: !!id && !!me && me.role === "STAFF",
  });

  // ── Mutations ──────────────────────────────────────────────
  const addSettlement = useMutation({
    mutationFn: payload => client.post(`/roi/${id}/settle`, payload),
    onSuccess: () => {
      setSettleAmt(""); setSettleAcct(""); setSettleNote("");
      queryClient.invalidateQueries({ queryKey:["entry", id] });
    },
  });

  const delSettlement = useMutation({
    mutationFn: sxId => client.delete(`/roi/${id}/settle/${sxId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey:["entry", id] }),
  });

  const reqEdit = useMutation({
    mutationFn: payload => client.post("/roi/edit-request", payload),
    onSuccess: () => {
      setFieldPath(""); setNewValue(""); setReason("");
      alert("Edit request sent ✅");
      queryClient.invalidateQueries({ queryKey:["entry", id] });
    },
  });

  if (isLoading) return <div style={{ padding:40, textAlign:"center", color:"#A8A49C", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>;
  if (isError)   return <div style={{ padding:40, color:"#ef4444" }}>Error: {error.message}</div>;
  if (!entry)    return <div style={{ padding:40, color:"#A8A49C" }}>Entry not found.</div>;

  // ── Calculations ───────────────────────────────────────────
  const purchaseCostTotal = (entry.purchaseCost || []).reduce((s, p) => s + safeAmt(p), 0);

  // Flatten all expenses into [label, amount, source] rows
  const ex = entry.expenses || {};
  const expRows = [];

  // Commission on Sales first
  if (ex.commissionOnSales) {
    expRows.push({ key:"commissionOnSales", label:"Commission on Sales", amt:safeAmt(ex.commissionOnSales), source:ex.commissionOnSales.source||"", isFirst:true });
  }

  // Staff
  if (ex.staffSalary?.length) {
    const total = ex.staffSalary.reduce((s, i) => s + safeAmt(i), 0);
    expRows.push({ key:"staffSalary", label:"Staff Salary", amt:total, source:"", isStaff:true });
  }
  if (ex.staffAccommodation?.length) {
    const total = ex.staffAccommodation.reduce((s, i) => s + safeAmt(i), 0);
    expRows.push({ key:"staffAccommodation", label:"Staff Accommodation", amt:total, source:"", isStaff:true });
  }

  // Royalty fees array
  if (ex.royaltyFees?.length) {
    ex.royaltyFees.forEach((r, i) => {
      if ((r.amount || 0) > 0) expRows.push({ key:`royaltyFees.${i}`, label:r.label||"Royalty / Mgt. Fee", amt:r.amount||0, source:r.source||"" });
    });
  }

  // Single expense fields
  ["foodRefreshment","rent","electricity","travelFuel","mobileInternet","maintenance","incentive","gasStaff","gasStore"].forEach(k => {
    if (ex[k]) {
      const amt = safeAmt(ex[k]);
      if (amt > 0) expRows.push({ key:k, label:EXPENSE_LABELS[k]||k, amt, source:ex[k].source||"" });
    }
  });

  // Marketing
  if (ex.marketing?.length) {
    const total = ex.marketing.reduce((s, m) => s + (m.amount||0), 0);
    if (total > 0) {
      expRows.push({ key:"marketing", label:"Marketing", amt:total, source:"", isGroup:true });
      ex.marketing.forEach((m, i) => {
        if ((m.amount||0) > 0) expRows.push({ key:`marketing.${i}`, label:m.remark||`Item ${i+1}`, amt:m.amount||0, source:m.source||"", isSub:true });
      });
    }
  }

  // Food Wastage Cooked
  if (ex.foodWastageCooked?.length) {
    const total = ex.foodWastageCooked.reduce((s, f) => s + (f.amount||0), 0);
    if (total > 0) {
      expRows.push({ key:"foodWastageCooked", label:"Food Wastage — Cooked", amt:total, source:"", isGroup:true });
      ex.foodWastageCooked.forEach((f, i) => {
        if ((f.amount||0) > 0) expRows.push({ key:`fwc.${i}`, label:f.item||`Item ${i+1}`, amt:f.amount||0, source:"", isSub:true });
      });
    }
  }

  // Food Wastage Raw
  if (ex.foodWastageRaw?.length) {
    const total = ex.foodWastageRaw.reduce((s, f) => s + (f.amount||0), 0);
    if (total > 0) {
      expRows.push({ key:"foodWastageRaw", label:"Food Wastage — Raw", amt:total, source:"", isGroup:true });
      ex.foodWastageRaw.forEach((f, i) => {
        if ((f.amount||0) > 0) expRows.push({ key:`fwr.${i}`, label:f.item||`Item ${i+1}`, amt:f.amount||0, source:"", isSub:true });
      });
    }
  }

  // Other
  if (ex.other?.length) {
    ex.other.forEach((o, i) => {
      if ((o.amount||0) > 0) expRows.push({ key:`other.${i}`, label:`Other — ${o.reason||""}`, amt:o.amount||0, source:o.source||"" });
    });
  }

  const totalExpenses = expRows.reduce((s, r) => r.isSub ? s : s + r.amt, 0);
  const grossIncome   = (entry.totalRevenue || 0) - purchaseCostTotal;
  const netProfit     = grossIncome - totalExpenses;

  // Revenue split
  const rs = entry.revenueSplit || {};
  const totalRev = entry.totalRevenue || 0;

  // Credit
  const creditAmt    = entry.creditAmount  || 0;
  const settledAmt   = entry.settledAmount || 0;
  const outstanding  = creditAmt - settledAmt;

  // STAFF approved paths
  const approvedPaths = new Set(
    (myApproved?.requests || []).filter(r => !r.consumed).map(r => r.fieldPath)
  );
  const staffHasApproved = approvedPaths.size > 0;

  // source badge
  const SourceBadge = ({ src }) => {
    if (!src) return null;
    const a = ACCOUNTS.find(x => x.key === src);
    if (!a) return null;
    return <span className="source-badge" style={{ background:`${a.color}18`, color:a.color, border:`1px solid ${a.color}44` }}>{a.label}</span>;
  };

  return (
    <div className="ed-wrap">
      <style>{CSS}</style>
      <div className="ed-inner">

        {/* ── Header ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <button className="btn-back" onClick={() => navigate(-1)}><FiChevronLeft size={15}/> Back</button>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:10, color:"#A8A49C", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Entry</p>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#0D0D0D", letterSpacing:"-.02em" }}>
              {new Date(entry.date).toLocaleDateString("en-IN",{ day:"2-digit", month:"long", year:"numeric" })}
            </h1>
          </div>
          {(me?.role === "OWNER" || (me?.role === "STAFF" && staffHasApproved)) && (
            <button className="btn-edit" onClick={() => navigate(`/entries/${id}/edit`)}>
              <FiEdit2 size={13} style={{ marginRight:5 }}/> Edit entry
            </button>
          )}
        </div>

        {/* ── Revenue Split ── */}
        <div className="section">
          <div className="sec-header">
            <span className="sec-title">Revenue Breakdown</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:16, fontWeight:700, color:"#6366f1" }}>{fmt(totalRev)}</span>
          </div>
          <div className="rev-split-grid">
            {ACCOUNTS.map(a => {
              const v = rs[a.key] || 0;
              const pct = totalRev > 0 ? ((v / totalRev) * 100).toFixed(1) : 0;
              return (
                <div key={a.key} className="rev-card" style={{ borderLeft:`3px solid ${a.color}` }}>
                  <div className="rev-card-label">
                    <span style={{ width:7, height:7, borderRadius:"50%", background:a.color, display:"inline-block" }}/>
                    {a.label}
                  </div>
                  <div className="rev-card-val" style={{ color:v>0?a.color:"#C8C4BB" }}>{fmt(v)}</div>
                  {v > 0 && <div className="rev-card-pct">{pct}%</div>}
                </div>
              );
            })}
          </div>
          {totalRev > 0 && (
            <div className="split-bar">
              {ACCOUNTS.map(a => { const pct = ((rs[a.key]||0)/totalRev)*100; return pct>0?<div key={a.key} style={{ width:`${pct}%`, background:a.color }}/>:null; })}
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
                <td className="td-right" style={{ color:"#6366f1", fontWeight:700 }}>{fmt(entry.totalRevenue)}</td>
              </tr>
              <tr>
                <td className="td-label">Purchase Cost</td>
                <td className="td-right" style={{ color:"#f43f5e" }}>− {fmt(purchaseCostTotal)}</td>
              </tr>
              {/* Purchase cost sub-items */}
              {(entry.purchaseCost || []).filter(p => (p.amount||0) > 0).map((p, i) => (
                <tr key={i} className="sub-row">
                  <td>{p.item || `Item ${i+1}`}<SourceBadge src={p.source}/></td>
                  <td className="td-right" style={{ color:"#888" }}>{fmt(p.amount)}</td>
                </tr>
              ))}
              <tr className="header-row">
                <td>Gross Income</td>
                <td className="td-right">{fmt(grossIncome)}</td>
              </tr>

              {/* Expenses header */}
              <tr>
                <td colSpan={2} style={{ padding:"10px 20px 6px", background:"#FAFAF8", fontSize:10, fontWeight:700, color:"#A8A49C", letterSpacing:".1em", textTransform:"uppercase" }}>
                  Expenses
                </td>
              </tr>

              {expRows.map(r => (
                <tr key={r.key} className={r.isSub ? "sub-row" : r.isFirst ? "" : ""} style={r.isFirst ? { background:"#FFF7ED" } : {}}>
                  <td className={r.isSub ? "" : "td-label"} style={r.isGroup ? { fontWeight:600, color:"#333" } : {}}>
                    {r.label}
                    {r.source && <SourceBadge src={r.source}/>}
                  </td>
                  <td className="td-right" style={{ color:r.isSub?"#888":"#333" }}>{fmt(r.amt)}</td>
                </tr>
              ))}

              <tr className="header-row">
                <td>Total Expenses</td>
                <td className="td-right" style={{ color:"#f43f5e" }}>{fmt(totalExpenses)}</td>
              </tr>
              <tr className="total-row">
                <td style={{ color:"#15803D", fontWeight:700 }}>Net Profit</td>
                <td className="td-right" style={{ color:netProfit>=0?"#15803D":"#ef4444", fontSize:15 }}>{fmt(netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Credit & Settlement ── */}
        {creditAmt > 0 && (
          <div className="section">
            <div className="sec-header">
              <span className="sec-title">Credit & Settlement</span>
              <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:outstanding>0?"#FEF3C7":"#F0FDF4", color:outstanding>0?"#92400E":"#15803D", border:`1px solid ${outstanding>0?"#FDE68A":"#BBF7D0"}` }}>
                {outstanding > 0 ? `₹${outstanding.toLocaleString()} outstanding` : "Fully settled ✓"}
              </span>
            </div>
            <div className="credit-row">
              <div className="cr-card" style={{ background:"#FFF7ED", border:"1px solid #FED7AA" }}>
                <div className="cr-label">Credit Raised</div>
                <div className="cr-val" style={{ color:"#f59e0b" }}>{fmt(creditAmt)}</div>
              </div>
              <div className="cr-card" style={{ background:"#F0FDF4", border:"1px solid #BBF7D0" }}>
                <div className="cr-label">Settled</div>
                <div className="cr-val" style={{ color:"#10b981" }}>{fmt(settledAmt)}</div>
              </div>
              <div className="cr-card" style={{ background:outstanding>0?"#FEF2F2":"#F0FDF4", border:`1px solid ${outstanding>0?"#FECACA":"#BBF7D0"}` }}>
                <div className="cr-label">Outstanding</div>
                <div className="cr-val" style={{ color:outstanding>0?"#ef4444":"#10b981" }}>{fmt(outstanding)}</div>
              </div>
            </div>

            {/* Settlement history */}
            {(entry.settlements || []).length > 0 && (
              <div className="settle-hist">
                <div style={{ fontSize:10, fontWeight:700, color:"#A8A49C", textTransform:"uppercase", letterSpacing:".08em", marginBottom:4 }}>Settlement History</div>
                {[...entry.settlements].sort((a,b) => new Date(b.date)-new Date(a.date)).map((sx, i) => {
                  const acct = ACCOUNTS.find(a => a.key === sx.account);
                  return (
                    <div key={sx._id||i} className="sh-row">
                      <div>
                        <span className="sh-amt">{fmt(sx.amount)}</span>
                        {acct && <span style={{ fontSize:11, marginLeft:8, color:acct.color, fontWeight:600 }}>{acct.label}</span>}
                        {sx.note && <span style={{ fontSize:11, color:"#A8A49C", marginLeft:8 }}>· {sx.note}</span>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span className="sh-date">{new Date(sx.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</span>
                        {me?.role === "OWNER" && (
                          <button className="sh-del" onClick={() => { if(window.confirm("Delete this settlement?")) delSettlement.mutate(sx._id); }}>
                            <FiTrash2 size={12}/>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add settlement form — OWNER only, only if outstanding > 0 */}
            {me?.role === "OWNER" && outstanding > 0 && (
              <div className="settle-form">
                <div style={{ fontSize:11, fontWeight:700, color:"#0D0D0D", alignSelf:"center" }}>+ Add Settlement</div>
                <div className="settle-field">
                  <label>Amount</label>
                  <input type="number" value={settleAmt} onChange={e => setSettleAmt(e.target.value)} onWheel={e => e.target.blur()} placeholder="₹ 0" style={{ width:110 }}/>
                </div>
                <div className="settle-field">
                  <label>Account</label>
                  <select value={settleAcct} onChange={e => setSettleAcct(e.target.value)} style={{ width:140 }}>
                    <option value="">— account —</option>
                    {ACCOUNTS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </div>
                <div className="settle-field">
                  <label>Note</label>
                  <input type="text" value={settleNote} onChange={e => setSettleNote(e.target.value)} placeholder="Optional" style={{ width:140 }}/>
                </div>
                <button
                  className="btn-ink"
                  disabled={!settleAmt || Number(settleAmt) <= 0 || addSettlement.isPending}
                  onClick={() => addSettlement.mutate({ amount:Number(settleAmt), account:settleAcct, note:settleNote })}
                >
                  {addSettlement.isPending ? "Saving…" : "Record"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STAFF: Edit Request Form ── */}
        {me?.role === "STAFF" && (
          <div className="section">
            <div className="sec-header">
              <span className="sec-title">📌 Request an Edit</span>
              {staffHasApproved && <span className="staff-badge">✏️ {approvedPaths.size} field{approvedPaths.size!==1?"s":""} approved</span>}
            </div>
            <div className="req-form">

              {/* Category */}
              <div className="req-field">
                <label>Category</label>
                <select value={fieldPath.split(".")[0]?.split("[")[0]||""} onChange={e => { setFieldPath(""); setNewValue(""); setReason(""); setFieldPath(e.target.value); }}>
                  <option value="">— Choose category —</option>
                  <option value="revenue">Revenue</option>
                  {(entry.purchaseCost||[]).length > 0 && <option value="purchaseCost">Purchase Cost</option>}
                  <option value="expenses">Expenses</option>
                </select>
              </div>

              {/* Revenue fields */}
              {fieldPath === "revenue" && (
                <div className="req-field">
                  <label>Field</label>
                  <select onChange={e => setFieldPath(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="totalRevenue">Total Revenue ({fmt(entry.totalRevenue)})</option>
                    {ACCOUNTS.map(a => (rs[a.key]||0) > 0 && (
                      <option key={a.key} value={`revenueSplit.${a.key}`}>{a.label} ({fmt(rs[a.key])})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Purchase cost fields */}
              {fieldPath === "purchaseCost" && (
                <div className="req-field">
                  <label>Item</label>
                  <select onChange={e => setFieldPath(e.target.value)}>
                    <option value="">— Select —</option>
                    {(entry.purchaseCost||[]).filter(p => (p.amount||0) > 0).map((p,i) => (
                      <optgroup key={i} label={`Item ${i+1}`}>
                        <option value={`purchaseCost[${i}].item`}>Name ({p.item})</option>
                        <option value={`purchaseCost[${i}].amount`}>Amount ({fmt(p.amount)})</option>
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* Expense fields */}
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
                            Marketing — {m.remark||`Item ${i+1}`} ({fmt(m.amount)})
                          </option>
                        ));
                      }
                      if (key === "royaltyFees" && Array.isArray(val)) {
                        return val.map((r, i) => (
                          <option key={`rf-${i}`} value={`expenses.royaltyFees[${i}].amount`}>
                            {r.label||"Royalty"} ({fmt(r.amount)})
                          </option>
                        ));
                      }
                      if (key === "other" && Array.isArray(val)) {
                        return val.map((o, i) => (
                          <option key={`oth-${i}`} value={`expenses.other[${i}].amount`}>
                            Other — {o.reason||`Item ${i+1}`} ({fmt(o.amount)})
                          </option>
                        ));
                      }
                      if (Array.isArray(val)) return null;

                      const amt = safeAmt(val);
                      if (amt <= 0) return null;
                      const label = EXPENSE_LABELS[key] || key.replace(/([A-Z])/g," $1");
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
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Enter new value"/>
              </div>

              <div className="req-field">
                <label>Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why should this be updated?" rows={3}/>
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button className="btn-ink" disabled={!fieldPath||!newValue||!reason||reqEdit.isPending}
                  onClick={() => reqEdit.mutate({ entryId:id, fieldPath, newValue, reason })}>
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