// src/pages/StaffManagement.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiTrash2, FiCheck } from "react-icons/fi";
import client from "../api/client";

const fmt = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const ACCOUNTS = [
  { key: "cash",        label: "Cash" },
  { key: "federalBank", label: "Federal Bank" },
  { key: "vibgyorBank", label: "Vibgyor Bank" },
  { key: "asifAccount", label: "Asif Account" },
  { key: "other",       label: "Other / Hand Cash" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing:border-box; }
  .wrap  { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; padding-bottom:80px; }
  .inner { max-width:880px; margin:0 auto; padding:36px 24px; }
  .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
  .eyebrow { font-size:10px; color:#A8A49C; letter-spacing:.14em; text-transform:uppercase; margin-bottom:4px; font-family:'DM Mono',monospace; }
  .page-title { font-size:26px; font-weight:800; color:#0D0D0D; letter-spacing:-.03em; }
  .btn-ghost { background:#fff; color:#333; border:1px solid #ECEAE4; border-radius:11px; padding:9px 18px; font-family:inherit; font-size:13px; font-weight:500; cursor:pointer; }
  .strip { display:grid; grid-template-columns:repeat(auto-fit,minmax(155px,1fr)); gap:12px; margin-bottom:24px; }
  .scard { background:#fff; border:1px solid #ECEAE4; border-radius:16px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,.04); position:relative; overflow:hidden; }
  .scard::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
  .scard.c1::before { background:linear-gradient(90deg,#6366f1,#818cf8); }
  .scard.c2::before { background:linear-gradient(90deg,#f59e0b,#fbbf24); }
  .scard.c3::before { background:linear-gradient(90deg,#10b981,#34d399); }
  .scard.c4::before { background:linear-gradient(90deg,#ef4444,#f87171); }
  .scard-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.1em; text-transform:uppercase; margin-bottom:8px; }
  .scard-val   { font-size:22px; font-weight:700; font-family:'DM Mono',monospace; }
  .scard-hint  { font-size:10px; color:#B8B4AC; margin-top:4px; }
  .staff-list { display:flex; flex-direction:column; gap:12px; }
  .sc { background:#fff; border:1px solid #ECEAE4; border-radius:18px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); }
  .sc-row { display:grid; grid-template-columns:1fr 110px 110px 110px auto; gap:12px; align-items:center; padding:18px 20px; }
  .sc-name { font-size:14px; font-weight:700; color:#0D0D0D; }
  .sc-sub  { font-size:11px; color:#A8A49C; margin-top:2px; }
  .sc-col { display:flex; flex-direction:column; align-items:flex-end; }
  .sc-col-label { font-size:9px; font-weight:700; color:#A8A49C; text-transform:uppercase; letter-spacing:.08em; margin-bottom:3px; }
  .sc-col-val   { font-size:15px; font-weight:700; font-family:'DM Mono',monospace; }
  .sc-btns { display:flex; gap:6px; align-items:center; }
  .btn-settle { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:7px 13px; border-radius:8px; border:1px solid #BBF7D0; background:#F0FDF4; color:#15803D; cursor:pointer; font-family:inherit; white-space:nowrap; }
  .btn-settle:hover { background:#DCFCE7; }
  .btn-settle:disabled { opacity:.4; cursor:not-allowed; }
  .btn-expand { background:none; border:none; color:#C8C4BB; cursor:pointer; padding:5px; border-radius:7px; display:flex; align-items:center; }
  .btn-expand:hover { color:#0D0D0D; background:#F0EEE9; }
  .settle-form { border-top:1px solid #F0EEE9; background:#F7F6F3; padding:16px 20px; display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; }
  .sf-field { display:flex; flex-direction:column; gap:3px; }
  .sf-field label { font-size:10px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.06em; }
  .sf-field input, .sf-field select { background:#fff; border:1px solid #ECEAE4; border-radius:8px; padding:7px 10px; font-size:12px; font-family:inherit; outline:none; color:#0D0D0D; }
  .sf-field input:focus, .sf-field select:focus { border-color:#0D0D0D; }
  .btn-record { background:#0D0D0D; color:#fff; border:none; border-radius:9px; padding:8px 18px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
  .btn-record:hover { background:#222; }
  .btn-record:disabled { opacity:.45; cursor:not-allowed; }
  .btn-cancel-sm { background:none; border:none; color:#A8A49C; font-size:12px; cursor:pointer; font-family:inherit; }
  .settle-hint { font-size:11px; color:#ef4444; padding:6px 20px 0; background:#F7F6F3; }
  .hist-panel { border-top:1px solid #F0EEE9; padding:14px 20px 18px; }
  .hist-label { font-size:10px; font-weight:700; color:#A8A49C; text-transform:uppercase; letter-spacing:.1em; margin-bottom:12px; display:block; }
  .chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
  .chip  { font-size:11px; font-weight:600; font-family:'DM Mono',monospace; padding:3px 9px; border-radius:6px; }
  .chip-green { background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0; }
  .chip-amber { background:#FFFBEB; color:#92400E; border:1px solid #FDE68A; }
  .chip-red   { background:#FEF2F2; color:#B91C1C; border:1px solid #FECACA; }
  .chip-gray  { background:#F5F3EF; color:#A8A49C; border:1px solid #ECEAE4; }
  .progress-wrap { margin-bottom:14px; }
  .progress-track { height:6px; background:#F0EEE9; border-radius:99px; overflow:hidden; }
  .progress-fill  { height:100%; border-radius:99px; transition:width .4s ease; }
  .progress-label { display:flex; justify-content:space-between; font-size:10px; color:#A8A49C; margin-top:4px; }
  table.htbl { width:100%; border-collapse:collapse; font-size:12px; }
  .htbl th { padding:6px 10px; color:#A8A49C; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; text-align:left; border-bottom:1px solid #ECEAE4; }
  .htbl th.r { text-align:right; }
  .htbl td { padding:10px; border-bottom:1px solid #F7F6F3; vertical-align:middle; }
  .htbl tr:last-child td { border-bottom:none; }
  .tx-amt  { font-family:'DM Mono',monospace; font-weight:700; color:#10b981; text-align:right; display:block; }
  .tx-date { color:#888; white-space:nowrap; }
  .btn-del { background:none; border:none; color:#E5E2DB; cursor:pointer; padding:3px 5px; border-radius:4px; }
  .btn-del:hover { color:#E11D48; }
  .empty { font-size:12px; color:#C8C4BB; padding:4px 0; }
  .debug-box { background:#1e1e2e; color:#a6e3a1; font-family:'DM Mono',monospace; font-size:11px; padding:12px 16px; border-radius:10px; margin-bottom:16px; white-space:pre-wrap; word-break:break-all; }
`;

export default function StaffManagement() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const [settleOpen, setSettleOpen] = useState({});
  const [histOpen,   setHistOpen]   = useState({});
  const [formState,  setFormState]  = useState({});
  const [debugLog,   setDebugLog]   = useState("");

  const log = msg => {
    console.log(msg);
    setDebugLog(prev => `${new Date().toLocaleTimeString()} — ${msg}\n` + prev);
  };

  // ── Queries ──────────────────────────────────────────────────
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn:  async () => (await client.get("/staff")).data,
  });

  const { data: advances = [] } = useQuery({
    queryKey: ["staff-advances"],
    queryFn:  async () => {
      const res = await client.get("/staff/advances");
      log(`GET /staff/advances → ${res.data.length} records. First: ${JSON.stringify(res.data[0])}`);
      return res.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // ── Mutation ──────────────────────────────────────────────────
  const addSettleMutation = useMutation({
    mutationFn: async ({ staffId, amount, note, paidBy }) => {
      log(`POST /staff/advances/${staffId} amount=${amount}`);
      const res = await client.post(`/staff/advances/${staffId}`, {
        type: "settled", amount: Number(amount), note: note || "", paidBy: paidBy || "",
      });
      log(`POST response: ${JSON.stringify(res.data)}`);
      return res.data;
    },
    onSuccess: (data, { staffId }) => {
      log(`onSuccess staffId=${staffId} totalSettled=${data?.totalSettled}`);
      // Force refetch — do NOT rely on cache update
      queryClient.invalidateQueries({ queryKey: ["staff-advances"], refetchType: "all" });
      setSettleOpen(p => ({ ...p, [staffId]: false }));
      setFormState(p  => ({ ...p, [staffId]: { amount: "", note: "", paidBy: "" } }));
    },
    onError: err => {
      log(`ERROR: ${err?.response?.data?.message || err.message}`);
      alert(err?.response?.data?.message || "Failed to record settlement.");
    },
  });

  const delTxMutation = useMutation({
    mutationFn: ({ staffId, txId }) =>
      client.delete(`/staff/advances/${staffId}/transaction/${txId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-advances"], refetchType: "all" }),
  });

  // ── Lookup ────────────────────────────────────────────────────
  // staffId in advances is always a plain string after our controller fix
  const getAdv = id => {
    const idStr = id?.toString();
    return advances.find(a => {
      // handle all possible shapes
      const s1 = a.staffId?.toString();
      const s2 = a.staffId?._id?.toString();
      return s1 === idStr || s2 === idStr;
    });
  };
const getInfo = s => {
  const salary       = s.salary || 0;
  const adv          = getAdv(s._id);
  const transactions = adv?.transactions || [];
  
  // Only count "settled" type (salary payments)
  const totalSettled = transactions
    .filter(t => t.type === "settled")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // outstanding = how much of this month's salary is still unpaid
  // clamp to 0 (don't show negative if overpaid)
  const outstanding = Math.max(0, salary - totalSettled);
  const paidPct     = salary > 0 ? Math.min(100, (totalSettled / salary) * 100) : 0;
  
  return { salary, totalSettled, outstanding, paidPct, transactions };
};
  const form    = id => formState[id] || { amount: "", note: "", paidBy: "" };
  const setForm = (id, field, val) =>
    setFormState(p => ({ ...p, [id]: { ...(p[id] || { amount:"", note:"", paidBy:"" }), [field]: val } }));

  // ── Totals ────────────────────────────────────────────────────
  const totalSalaryBill  = staff.reduce((s, m) => s + (m.salary || 0), 0);
  const totalSettledAll  = staff.reduce((s, m) => s + getInfo(m).totalSettled, 0);
  const totalOutstanding = staff.reduce((s, m) => s + getInfo(m).outstanding, 0);

  return (
    <div className="wrap">
      <style>{CSS}</style>
      <div className="inner">

        {/* Header */}
        <div className="topbar">
          <div>
            <p className="eyebrow">Staff Management</p>
            <h1 className="page-title">Salary Credit & Settlements</h1>
          </div>
          <button className="btn-ghost" onClick={() => navigate("/manage-staff")}>Manage Staff →</button>
        </div>

      

        {/* Summary strip */}
        <div className="strip">
          <div className="scard c1">
            <div className="scard-label">Monthly Salary Bill</div>
            <div className="scard-val" style={{ color:"#6366f1" }}>{fmt(totalSalaryBill)}</div>
            <div className="scard-hint">{staff.length} staff members</div>
          </div>
          <div className="scard c2">
            <div className="scard-label">Total Credit (Owed)</div>
            <div className="scard-val" style={{ color:"#f59e0b" }}>{fmt(totalSalaryBill)}</div>
            <div className="scard-hint">= Monthly salary bill</div>
          </div>
          <div className="scard c3">
            <div className="scard-label">Total Settled</div>
            <div className="scard-val" style={{ color:"#10b981" }}>{fmt(totalSettledAll)}</div>
            <div className="scard-hint">Payments recorded</div>
          </div>
          <div className="scard c4">
            <div className="scard-label">Outstanding</div>
            <div className="scard-val" style={{ color: totalOutstanding > 0 ? "#ef4444" : "#10b981" }}>
              {fmt(totalOutstanding)}
            </div>
            <div className="scard-hint">Still to be paid</div>
          </div>
        </div>

        {/* Staff cards */}
        <div className="staff-list">
          {staff.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#C8C4BB", fontSize:13 }}>
              No staff found.
            </div>
          )}

          {staff.map(s => {
            const { salary, totalSettled, outstanding, paidPct, transactions } = getInfo(s);
            const isSetOpen = !!settleOpen[s._id];
            const isHisOpen = !!histOpen[s._id];
            const f         = form(s._id);
            const settleNum    = Number(f.amount || 0);
            const overSettling = settleNum > outstanding;
            const canSubmit    = settleNum > 0 && !overSettling;

            const settlements = [...transactions]
              .filter(t => t.type === "settled")
              .sort((a, b) => new Date(b.date) - new Date(a.date));

            return (
              <div key={s._id} className="sc">

                <div className="sc-row">
                  <div>
                    <div className="sc-name">{s.name}</div>
                    <div className="sc-sub">{s.role}</div>
                  </div>

                  <div className="sc-col">
                    <span className="sc-col-label">Credit (Salary)</span>
                    <span className="sc-col-val" style={{ color:"#f59e0b" }}>{fmt(salary)}</span>
                  </div>

                  <div className="sc-col">
                    <span className="sc-col-label">Settled</span>
                    <span className="sc-col-val" style={{ color:"#10b981" }}>{fmt(totalSettled)}</span>
                  </div>

                  <div className="sc-col">
                    <span className="sc-col-label">Outstanding</span>
                    <span className="sc-col-val" style={{ color: outstanding > 0 ? "#ef4444" : "#10b981" }}>
                      {fmt(outstanding)}
                    </span>
                  </div>

                  <div className="sc-btns">
                    <button className="btn-settle" disabled={outstanding <= 0}
                      onClick={() => setSettleOpen(p => ({ ...p, [s._id]: !isSetOpen }))}>
                      <FiCheck size={12}/> Settle
                    </button>
                    <button className="btn-expand"
                      onClick={() => setHistOpen(p => ({ ...p, [s._id]: !isHisOpen }))}>
                      {isHisOpen ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
                    </button>
                  </div>
                </div>

                {/* Settle form */}
                {isSetOpen && (
                  <>
                    <div className="settle-form">
                      <div style={{ fontSize:12, fontWeight:700, color:"#0D0D0D", alignSelf:"center", marginRight:4 }}>Record Payment</div>
                      <div className="sf-field">
                        <label>Amount (max {fmt(outstanding)})</label>
                        <input type="number" value={f.amount} onWheel={e => e.target.blur()}
                          onChange={e => setForm(s._id, "amount", e.target.value)}
                          placeholder="0" style={{ width:140, borderColor: overSettling ? "#ef4444" : undefined }}/>
                      </div>
                      <div className="sf-field">
                        <label>Paid from account</label>
                        <select value={f.paidBy} onChange={e => setForm(s._id, "paidBy", e.target.value)} style={{ width:165 }}>
                          <option value="">— select —</option>
                          {ACCOUNTS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                        </select>
                      </div>
                      <div className="sf-field">
                        <label>Note (optional)</label>
                        <input type="text" value={f.note} onChange={e => setForm(s._id, "note", e.target.value)}
                          placeholder="e.g. May salary" style={{ width:170 }}/>
                      </div>
                      <button className="btn-record"
                        disabled={!canSubmit || addSettleMutation.isPending}
                        onClick={() => addSettleMutation.mutate({ staffId: s._id.toString(), amount: settleNum, note: f.note, paidBy: f.paidBy })}>
                        {addSettleMutation.isPending ? "Saving…" : "✓ Record"}
                      </button>
                      <button className="btn-cancel-sm"
                        onClick={() => setSettleOpen(p => ({ ...p, [s._id]: false }))}>Cancel</button>
                    </div>
                    {overSettling && (
                      <div className="settle-hint">⚠️ Amount exceeds outstanding ({fmt(outstanding)}). Reduce the amount.</div>
                    )}
                  </>
                )}

                {/* History */}
                {isHisOpen && (
                  <div className="hist-panel">
                    <span className="hist-label">Payment History — {s.name}</span>
                    <div className="chips">
                      <span style={{ fontSize:10, color:"#A8A49C" }}>Salary:</span>
                      <span className="chip chip-amber">{fmt(salary)}</span>
                      <span style={{ fontSize:10, color:"#A8A49C", marginLeft:4 }}>Paid:</span>
                      <span className="chip chip-green">{fmt(totalSettled)}</span>
                      <span style={{ fontSize:10, color:"#A8A49C", marginLeft:4 }}>Outstanding:</span>
                      <span className={`chip ${outstanding > 0 ? "chip-red" : "chip-green"}`}>{fmt(outstanding)}</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-track">
                        <div className="progress-fill" style={{
                          width:`${paidPct}%`,
                          background: paidPct >= 100 ? "#10b981" : paidPct >= 50 ? "#f59e0b" : "#ef4444",
                        }}/>
                      </div>
                      <div className="progress-label">
                        <span>{paidPct.toFixed(0)}% settled</span>
                        <span>{fmt(totalSettled)} of {fmt(salary)}</span>
                      </div>
                    </div>
                    {settlements.length === 0 ? (
                      <p className="empty">No payments recorded yet.</p>
                    ) : (
                      <table className="htbl">
                        <thead>
                          <tr>
                            <th>Date</th><th>Paid From</th><th>Note</th><th className="r">Amount</th><th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {settlements.map((tx, i) => {
                            const acct = ACCOUNTS.find(a => a.key === tx.paidBy);
                            return (
                              <tr key={tx._id || i}>
                                <td className="tx-date">{new Date(tx.date).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"2-digit" })}</td>
                                <td>{acct ? <span className="chip chip-green" style={{ fontSize:10 }}>{acct.label}</span> : tx.paidBy ? <span className="chip chip-gray" style={{ fontSize:10 }}>{tx.paidBy}</span> : <span style={{ color:"#C8C4BB" }}>—</span>}</td>
                                <td style={{ color:"#888" }}>{tx.note || "—"}</td>
                                <td><span className="tx-amt">{fmt(tx.amount)}</span></td>
                                <td>
                                  <button className="btn-del" onClick={() => { if (window.confirm("Delete this payment?")) delTxMutation.mutate({ staffId: s._id.toString(), txId: tx._id }); }}>
                                    <FiTrash2 size={12}/>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}