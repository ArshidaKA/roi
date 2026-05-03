// src/pages/StaffManagement.jsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiTrash2, FiCalendar } from "react-icons/fi";
import client from "../api/client";

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  .sm-wrap  { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; padding-bottom:60px; }
  .sm-inner { max-width:1280px; margin:0 auto; padding:36px 24px; }

  .page-eyebrow { font-size:10px; color:#A8A49C; letter-spacing:.14em; text-transform:uppercase; margin-bottom:5px; font-family:'DM Mono',monospace; }
  .page-title   { font-size:26px; font-weight:800; color:#0D0D0D; letter-spacing:-.03em; }
  .topbar       { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }

  /* Buttons */
  .btn-ink   { background:#0D0D0D; color:#fff; border:none; border-radius:11px; padding:10px 20px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.18); transition:background .12s,transform .1s; }
  .btn-ink:hover { background:#222; transform:translateY(-1px); }
  .btn-ghost { background:#fff; color:#333; border:1px solid #ECEAE4; border-radius:11px; padding:10px 20px; font-family:inherit; font-size:13px; font-weight:500; cursor:pointer; transition:all .12s; }
  .btn-ghost:hover { border-color:#bbb; }

  /* Date bar */
  .date-bar { display:flex; gap:12px; align-items:center; margin-bottom:20px; flex-wrap:wrap; background:#fff; border:1px solid #ECEAE4; border-radius:14px; padding:14px 18px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
  .date-bar label { font-size:11px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
  .date-input { background:#F7F6F3; border:1px solid #ECEAE4; border-radius:8px; padding:6px 12px; font-family:inherit; font-size:12px; outline:none; color:#333; transition:border-color .1s; }
  .date-input:focus { border-color:#0D0D0D; }
  .date-sep { font-size:11px; color:#C8C4BB; }

  /* Summary strip */
  .summary-strip { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:20px; }
  .sum-card { background:#fff; border:1px solid #ECEAE4; border-radius:16px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,.04); position:relative; overflow:hidden; transition:box-shadow .15s; }
  .sum-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }
  .sum-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
  .sum-card.purple::before { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
  .sum-card.amber::before  { background:linear-gradient(90deg,#f59e0b,#fbbf24); }
  .sum-card.green::before  { background:linear-gradient(90deg,#10b981,#34d399); }
  .sum-card.red::before    { background:linear-gradient(90deg,#ef4444,#f87171); }
  .sum-card.blue::before   { background:linear-gradient(90deg,#6366f1,#818cf8); }
  .sum-card-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.1em; text-transform:uppercase; margin-bottom:8px; }
  .sum-card-val   { font-size:22px; font-weight:700; font-family:'DM Mono',monospace; }
  .sum-card-hint  { font-size:10px; color:#B8B4AC; margin-top:4px; }

  /* Table */
  .tbl-card { background:#fff; border:1px solid #ECEAE4; border-radius:18px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); }
  .tbl-header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #ECEAE4; }
  .tbl-wrap   { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  thead th { padding:11px 14px; background:#FAFAF8; color:#A8A49C; font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; text-align:left; border-bottom:1px solid #ECEAE4; white-space:nowrap; }
  thead th.right  { text-align:right; }
  thead th.center { text-align:center; }
  tbody tr { border-bottom:1px solid #F5F3EF; transition:background .1s; }
  tbody tr:last-child { border-bottom:none; }
  tbody tr:hover { background:#FAFAF8; }
  td { padding:13px 14px; vertical-align:middle; }
  td.right  { text-align:right; }
  td.center { text-align:center; }
  .num { font-family:'DM Mono',monospace; }
  .staff-name { font-weight:700; color:#0D0D0D; font-size:13px; }
  .staff-role { font-size:11px; color:#A8A49C; margin-top:2px; }

  /* Attendance badges */
  .att-badge { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; font-weight:700; font-size:12px; cursor:pointer; transition:all .12s; user-select:none; }
  .att-badge.active-P { background:#10b981; color:#fff; box-shadow:0 2px 8px rgba(16,185,129,.3); }
  .att-badge.active-H { background:#f59e0b; color:#fff; box-shadow:0 2px 8px rgba(245,158,11,.3); }
  .att-badge.active-L { background:#6366f1; color:#fff; box-shadow:0 2px 8px rgba(99,102,241,.3); }
  .att-badge.inactive { background:#F0EEE9; color:#999; }
  .att-badge.inactive:hover { background:#E5E2DB; }

  /* Chips */
  .chip { font-size:11px; font-weight:600; font-family:'DM Mono',monospace; padding:3px 8px; border-radius:6px; display:inline-block; }
  .chip.amber  { background:#FFFBEB; color:#92400E; border:1px solid #FDE68A; }
  .chip.green  { background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0; }
  .chip.blue   { background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; }
  .chip.red    { background:#FEF2F2; color:#B91C1C; border:1px solid #FECACA; }
  .chip.gray   { background:#F5F3EF; color:#A8A49C; border:1px solid #ECEAE4; }

  /* Advance action buttons */
  .adv-btn     { font-size:11px; font-weight:600; border:none; border-radius:7px; padding:5px 11px; cursor:pointer; font-family:inherit; transition:all .1s; }
  .adv-btn.cr  { background:#FFF7ED; color:#C2410C; border:1px solid #FED7AA; }
  .adv-btn.cr:hover  { background:#FFEDD5; }
  .adv-btn.st  { background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0; }
  .adv-btn.st:hover  { background:#DCFCE7; }

  .adv-input-row { display:flex; gap:6px; align-items:center; margin-top:8px; flex-wrap:wrap; justify-content:center; }
  .adv-input     { background:#F7F6F3; border:1px solid #ECEAE4; border-radius:7px; padding:5px 10px; font-size:12px; font-family:'DM Mono',monospace; color:#0D0D0D; outline:none; width:100px; }
  .adv-input:focus { border-color:#0D0D0D; }
  .adv-note  { background:#F7F6F3; border:1px solid #ECEAE4; border-radius:7px; padding:5px 10px; font-size:12px; font-family:inherit; color:#0D0D0D; outline:none; width:140px; }
  .adv-ok    { background:#0D0D0D; color:#fff; border:none; border-radius:7px; padding:5px 12px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; }
  .adv-cancel { background:none; border:1px solid #ECEAE4; border-radius:7px; padding:5px 10px; font-size:12px; color:#888; cursor:pointer; font-family:inherit; }

  /* History */
  .history-row td { padding:0 !important; background:#FAFAF8; }
  .history-inner  { padding:14px 16px 16px 54px; }
  .hist-table { width:100%; border-collapse:collapse; font-size:12px; }
  .hist-table td { padding:7px 10px; border-bottom:1px solid #ECEAE4; }
  .hist-table tr:last-child td { border-bottom:none; }
  .tx-cr { color:#C2410C; font-weight:600; }
  .tx-st { color:#15803D; font-weight:600; }
  .del-tx { background:none; border:none; color:#E5E2DB; cursor:pointer; padding:2px 4px; border-radius:4px; transition:color .1s; }
  .del-tx:hover { color:#E11D48; }
`;

const fmt = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const todayStr  = () => new Date().toISOString().split("T")[0];
const thisMonth = () => new Date().toISOString().slice(0, 7);

const STATUS_OPT = [
  { value: "present",  label: "P", cls: "active-P" },
  { value: "half-day", label: "H", cls: "active-H" },
  { value: "leave",    label: "L", cls: "active-L" },
];

export default function StaffManagement() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  // ── Date state: selected date for attendance + month for salary ──
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [month, setMonth]               = useState(thisMonth());

  const [attendanceData, setAttendanceData] = useState({});
  const [advanceOpen,    setAdvanceOpen]    = useState({});
  const [advanceInput,   setAdvanceInput]   = useState({});
  const [historyOpen,    setHistoryOpen]    = useState({});

  // ── Queries ──────────────────────────────────────────────────
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await client.get("/staff")).data,
  });

  // Attendance for SELECTED DATE
  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", selectedDate],
    queryFn: async () => (await client.get(`/attendance?date=${selectedDate}`)).data,
    enabled: !!selectedDate,
  });

  // Monthly salary summary
  const { data: salarySummary = {} } = useQuery({
    queryKey: ["salary-summary-month", month],
    queryFn: async () => (await client.get(`/attendance/salary-summary?month=${month}`)).data,
    enabled: !!month,
  });

  // Staff advances
  const { data: advances = [] } = useQuery({
    queryKey: ["staff-advances"],
    queryFn: async () => (await client.get("/staff/advances")).data,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const markAttendanceMutation = useMutation({
    mutationFn: data => client.post("/attendance", data),
    onSuccess: () => queryClient.invalidateQueries(["attendance", selectedDate]),
  });

  const addAdvanceMutation = useMutation({
    mutationFn: ({ staffId, type, amount, note }) =>
      client.post(`/staff/advances/${staffId}`, { type, amount: Number(amount), note }),
    onSuccess: () => {
      queryClient.invalidateQueries(["staff-advances"]);
      setAdvanceOpen({});
      setAdvanceInput({});
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: ({ staffId, txId }) =>
      client.delete(`/staff/advances/${staffId}/transaction/${txId}`),
    onSuccess: () => queryClient.invalidateQueries(["staff-advances"]),
  });

  // ── Sync attendance state when date or data changes ──────────
  useEffect(() => {
    const init = {};
    staff.forEach(s => {
      const found = attendance.find(a => {
        const sid = a.staffId?._id || a.staffId;
        return sid?.toString() === s._id?.toString();
      });
      if (found) init[s._id] = found.status;
      // No default — only mark if a record exists
    });
    setAttendanceData(init);
  }, [staff, attendance]);

  const handleAttendance = (staffId, status) => {
    setAttendanceData(p => ({ ...p, [staffId]: status }));
    markAttendanceMutation.mutate({ staffId, date: selectedDate, status });
  };

  // ── Advance helpers ───────────────────────────────────────────
  const getAdvance = staffId =>
    advances.find(a => (a.staffId?._id || a.staffId)?.toString() === staffId?.toString());

  const openAdvance = (staffId, type) => {
    setAdvanceOpen(p => ({ ...p, [staffId]: p[staffId] === type ? null : type }));
    setAdvanceInput(p => ({ ...p, [staffId]: { amount: "", note: "" } }));
  };

  const submitAdvance = staffId => {
    const input  = advanceInput[staffId] || {};
    const type   = advanceOpen[staffId];
    const amount = Number(input.amount || 0);
    if (!type || !amount || amount <= 0) return;
    addAdvanceMutation.mutate({ staffId, type, amount, note: input.note || "" });
  };

  // ── Per-staff calculations ────────────────────────────────────
  // Credit = how much still needs to be paid = earned − advances given (outstanding)
  const getStaffInfo = s => {
    const monthlySalary       = s.salary || 0;
    const dailyRate           = s.dailySalary || monthlySalary / 30;
    const perStaff            = salarySummary?.perStaff?.[s._id];
    const earned              = perStaff?.earned ?? 0;
    const days                = perStaff?.days ?? 0;

    const adv                 = getAdvance(s._id);
    const advanceGiven        = adv?.totalCredit    || 0;   // total advance money given
    const advanceSettled      = adv?.totalSettled   || 0;   // amount deducted / settled from salary
    const advanceOutstanding  = adv?.outstanding    || 0;   // advance still to be deducted

    // Credit = salary still owed to staff = earned this month − advance outstanding
    // If positive: we still owe staff this much
    // If negative: we overpaid via advance
    const creditDue = earned - advanceOutstanding;

    return { monthlySalary, dailyRate, earned, days, advanceGiven, advanceSettled, advanceOutstanding, creditDue };
  };

  // ── Top-level totals ─────────────────────────────────────────
  // Total monthly salary bill = sum of all staff monthly salaries
  const totalMonthlySalaryBill = staff.reduce((s, m) => s + (m.salary || 0), 0);

  // Total advance given = sum of all outstanding advances
  const totalAdvanceGiven       = advances.reduce((s, a) => s + (a.totalCredit    || 0), 0);
  const totalAdvanceSettled     = advances.reduce((s, a) => s + (a.totalSettled   || 0), 0);
  const totalAdvanceOutstanding = advances.reduce((s, a) => s + (a.outstanding    || 0), 0);

  // Total earned this month across all staff
  const totalEarned = Object.values(salarySummary?.perStaff || {}).reduce((s, v) => s + (v?.earned || 0), 0);

  // Total credit (remaining salary to give) = earned − advance outstanding
  const totalCreditDue = totalEarned - totalAdvanceOutstanding;

  // Is this a past date?
  const isPastDate = selectedDate < todayStr();
  const isToday    = selectedDate === todayStr();

  return (
    <div className="sm-wrap">
      <style>{CSS}</style>
      <div className="sm-inner">

        {/* ── Header ── */}
        <div className="topbar">
          <div>
            <p className="page-eyebrow">Staff Management</p>
            <h1 className="page-title">Attendance & Advances</h1>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={() => navigate("/manage-staff")}>Manage Staff</button>
          </div>
        </div>

        {/* ── Date Controls ── */}
        <div className="date-bar">
          <FiCalendar size={15} style={{ color:"#A8A49C" }} />
          <label>Attendance date:</label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            max={todayStr()}
            onChange={e => setSelectedDate(e.target.value)}
          />
          {isPastDate && (
            <span style={{ fontSize:11, background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A", borderRadius:20, padding:"3px 10px", fontWeight:600 }}>
              📅 Past date — editing historical attendance
            </span>
          )}
          {isToday && (
            <span style={{ fontSize:11, background:"#F0FDF4", color:"#15803D", border:"1px solid #BBF7D0", borderRadius:20, padding:"3px 10px", fontWeight:600 }}>
              ✓ Today
            </span>
          )}
          <div className="date-sep" style={{ marginLeft:"auto" }} />
          <label>Salary month:</label>
          <input
            type="month"
            className="date-input"
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
        </div>

        {/* ── Summary Strip ─────────────────────────────────────────────
             1. Monthly Salary Bill  2. Total Advance Given  3. Credit (remaining to pay)
             4. Advance Settled      5. Advance Outstanding
        ── */}
        <div className="summary-strip">
          <div className="sum-card purple">
            <div className="sum-card-label">Monthly Salary Bill</div>
            <div className="sum-card-val" style={{ color:"#7c3aed" }}>{fmt(totalMonthlySalaryBill)}</div>
            <div className="sum-card-hint">Full month ({staff.length} staff)</div>
          </div>
          <div className="sum-card blue">
            <div className="sum-card-label">Earned This Month</div>
            <div className="sum-card-val" style={{ color:"#6366f1" }}>{fmt(totalEarned)}</div>
            <div className="sum-card-hint">Based on attendance — {month}</div>
          </div>
          <div className="sum-card amber">
            <div className="sum-card-label">Total Advance Given</div>
            <div className="sum-card-val" style={{ color:"#f59e0b" }}>{fmt(totalAdvanceGiven)}</div>
            <div className="sum-card-hint">All advances credited</div>
          </div>
          <div className="sum-card green">
            <div className="sum-card-label">Credit (Remaining to Pay)</div>
            <div className="sum-card-val" style={{ color: totalCreditDue >= 0 ? "#10b981" : "#ef4444" }}>{fmt(Math.abs(totalCreditDue))}</div>
            <div className="sum-card-hint">{totalCreditDue < 0 ? "Overpaid via advance" : "Earned − advance outstanding"}</div>
          </div>
          <div className="sum-card red">
            <div className="sum-card-label">Advance Outstanding</div>
            <div className="sum-card-val" style={{ color:"#ef4444" }}>{fmt(totalAdvanceOutstanding)}</div>
            <div className="sum-card-hint">Not yet deducted from salary</div>
          </div>
        </div>

        {/* ── Main Table ── */}
        <div className="tbl-card">
          <div className="tbl-header">
            <div style={{ fontSize:13, fontWeight:700, color:"#0D0D0D" }}>
              Staff — {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th className="right">Monthly / Daily</th>
                  <th className="center">Attendance</th>
                  <th className="right">Earned ({month})</th>
                  <th className="right">Advance Given</th>
                  <th className="right">Credit (Remaining)</th>
                  <th className="center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => {
                  const info       = getStaffInfo(s);
                  const adv        = getAdvance(s._id);
                  const isHistOpen = historyOpen[s._id];
                  const activeMode = advanceOpen[s._id];
                  const input      = advanceInput[s._id] || { amount: "", note: "" };

                  return (
                    <>
                      <tr key={s._id}>
                        {/* Name */}
                        <td>
                          <div className="staff-name">{s.name}</div>
                          <div className="staff-role">{s.role}</div>
                        </td>

                        {/* Salary rates */}
                        <td className="right">
                          <span className="num" style={{ fontWeight:700, color:"#0D0D0D" }}>{fmt(info.monthlySalary)}</span>
                          <div style={{ fontSize:10, color:"#A8A49C", marginTop:1 }}>{fmt(Math.round(info.dailyRate))}/day</div>
                        </td>

                        {/* Attendance badges for selected date */}
                        <td className="center">
                          <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                            {STATUS_OPT.map(opt => {
                              const isActive = attendanceData[s._id] === opt.value;
                              return (
                                <div
                                  key={opt.value}
                                  className={`att-badge ${isActive ? opt.cls : "inactive"}`}
                                  onClick={() => handleAttendance(s._id, opt.value)}
                                  title={opt.value}
                                >
                                  {opt.label}
                                </div>
                              );
                            })}
                          </div>
                          {!attendanceData[s._id] && (
                            <div style={{ fontSize:10, color:"#C8C4BB", marginTop:4 }}>Not marked</div>
                          )}
                        </td>

                        {/* Earned this month */}
                        <td className="right">
                          <span className="num" style={{ fontWeight:700, color:"#6366f1" }}>{fmt(info.earned)}</span>
                          {info.days > 0 && <div style={{ fontSize:10, color:"#A8A49C" }}>{info.days}d</div>}
                        </td>

                        {/* Advance Given — total credit (money given as advance) */}
                        <td className="right">
                          <span className={`chip ${info.advanceGiven > 0 ? "amber" : "gray"}`}>{fmt(info.advanceGiven)}</span>
                          {info.advanceSettled > 0 && (
                            <div style={{ fontSize:10, color:"#10b981", marginTop:2 }}>₹{Number(info.advanceSettled).toLocaleString()} settled</div>
                          )}
                        </td>

                        {/* Credit (remaining salary to pay) = earned − advance outstanding
                            This is what we still owe the staff member */}
                        <td className="right">
                          <span className={`chip ${info.creditDue > 0 ? "green" : info.creditDue < 0 ? "red" : "gray"}`}>
                            {fmt(Math.abs(info.creditDue))}
                          </span>
                          {info.creditDue < 0 && <div style={{ fontSize:10, color:"#ef4444", marginTop:2 }}>overpaid</div>}
                          {info.creditDue > 0 && <div style={{ fontSize:10, color:"#10b981", marginTop:2 }}>to pay</div>}
                        </td>

                        {/* Actions */}
                        <td className="center">
                          <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap" }}>
                            <button className="adv-btn cr" onClick={() => openAdvance(s._id, "credit")}>+ Advance</button>
                            <button className="adv-btn st" onClick={() => openAdvance(s._id, "settled")}>Settle</button>
                            <button
                              onClick={() => setHistoryOpen(p => ({ ...p, [s._id]: !p[s._id] }))}
                              style={{ background:"none", border:"none", color:"#A8A49C", cursor:"pointer", padding:"5px 4px", display:"flex", alignItems:"center" }}
                            >
                              {isHistOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                            </button>
                          </div>

                          {/* Inline advance input */}
                          {activeMode && (
                            <div className="adv-input-row">
                              <span style={{ fontSize:11, fontWeight:700, color:activeMode==="credit"?"#C2410C":"#15803D" }}>
                                {activeMode === "credit" ? "₹ Give Advance:" : "₹ Settle:"}
                              </span>
                              <input
                                className="adv-input"
                                type="number" min="0"
                                placeholder="Amount"
                                value={input.amount}
                                onChange={e => setAdvanceInput(p => ({ ...p, [s._id]: { ...p[s._id], amount:e.target.value } }))}
                                onWheel={e => e.target.blur()}
                              />
                              <input
                                className="adv-note"
                                type="text"
                                placeholder="Note (optional)"
                                value={input.note}
                                onChange={e => setAdvanceInput(p => ({ ...p, [s._id]: { ...p[s._id], note:e.target.value } }))}
                              />
                              <button className="adv-ok" onClick={() => submitAdvance(s._id)} disabled={addAdvanceMutation.isPending}>✓</button>
                              <button className="adv-cancel" onClick={() => setAdvanceOpen(p => ({ ...p, [s._id]: null }))}>✕</button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* History drawer */}
                      {isHistOpen && (
                        <tr key={`${s._id}-hist`} className="history-row">
                          <td colSpan={7}>
                            <div className="history-inner">
                              <div style={{ fontSize:11, fontWeight:700, color:"#888", letterSpacing:".08em", textTransform:"uppercase", marginBottom:10 }}>
                                Advance History — {s.name}
                              </div>
                              {(!adv || !adv.transactions?.length) ? (
                                <p style={{ fontSize:12, color:"#C8C4BB" }}>No advance transactions yet.</p>
                              ) : (
                                <>
                                  <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
                                    {[["Given",fmt(adv.totalCredit),"amber"],["Settled",fmt(adv.totalSettled),"green"],["Outstanding",fmt(adv.outstanding),"red"]].map(([l,v,c]) => (
                                      <div key={l} style={{ display:"flex", gap:5, alignItems:"center" }}>
                                        <span style={{ fontSize:10, color:"#A8A49C" }}>{l}:</span>
                                        <span className={`chip ${c}`}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <table className="hist-table">
                                    <thead>
                                      <tr>
                                        {["Date","Type","Amount","Note",""].map((h,i) => (
                                          <td key={i} style={{ color:"#A8A49C", fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:".08em", textAlign:i>=2&&i<4?"right":"left" }}>{h}</td>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...adv.transactions].sort((a,b) => new Date(b.date)-new Date(a.date)).map((tx,i) => (
                                        <tr key={tx._id||i}>
                                          <td style={{ color:"#666" }}>{new Date(tx.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                                          <td><span className={tx.type==="credit"?"tx-cr":"tx-st"}>{tx.type==="credit"?"Advance Given":"Settled"}</span></td>
                                          <td style={{ textAlign:"right" }}><span className={`num ${tx.type==="credit"?"tx-cr":"tx-st"}`}>{fmt(tx.amount)}</span></td>
                                          <td style={{ color:"#888", textAlign:"right" }}>{tx.note||"—"}</td>
                                          <td style={{ textAlign:"right" }}>
                                            <button className="del-tx" title="Delete"
                                              onClick={() => { if(window.confirm("Delete this transaction?")) deleteTransactionMutation.mutate({ staffId:s._id, txId:tx._id }); }}>
                                              <FiTrash2 size={12} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign:"center", padding:"40px 20px", color:"#C8C4BB", fontSize:13 }}>
                      No staff found.{" "}
                      <button style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontFamily:"inherit", fontSize:13 }} onClick={() => navigate("/register")}>Add staff →</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}