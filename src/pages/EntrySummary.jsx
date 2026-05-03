// src/pages/EntrySummary.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import client from "../api/client";

// ── Helpers ──────────────────────────────────────────────────
const fmt  = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const toN  = v => Number(v || 0);

// Safely read .amount from either an object or a plain number
const safeAmt    = v => v && typeof v === "object" && "amount" in v ? toN(v.amount) : (typeof v === "number" ? v : 0);
const safeCredit = v => v && typeof v === "object" ? toN(v.credit)  : 0;
const safeSettled= v => v && typeof v === "object" ? toN(v.settled) : 0;

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
  royaltyFees:       "Royalty / Mgt. Fees",
  marketing:         "Marketing",
  foodWastageCooked: "Food Wastage — Cooked",
  foodWastageRaw:    "Food Wastage — Raw",
  other:             "Other Expenses",
};

const humanLabel = key =>
  EXPENSE_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());

export default function EntrySummary() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [expandedExpenses,  setExpandedExpenses]  = useState(false);
  const [expandedPurchase,  setExpandedPurchase]  = useState(false);
  const [expandedCredit,    setExpandedCredit]    = useState(false);
  const [expandedEntries,   setExpandedEntries]   = useState(false);

  const filter    = searchParams.get("filter")    || "lifetime";
  const startDate = searchParams.get("startDate") || "";
  const endDate   = searchParams.get("endDate")   || "";

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entriesSummary", filter, startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (filter !== "lifetime") params.filter = filter;
      if (filter === "custom" && startDate && endDate) { params.startDate = startDate; params.endDate = endDate; }
      return (await client.get("/roi", { params })).data;
    },
  });

  const filterLabel = {
    lifetime:  "Lifetime",
    today:     "Today",
    thisMonth: "This Month",
    thisYear:  "This Year",
    custom:    startDate && endDate ? `${startDate} → ${endDate}` : "Custom",
  }[filter] || filter;

  // ── Aggregate ─────────────────────────────────────────────
  const agg = entries.reduce((acc, e) => {
    acc.totalRevenue += toN(e.totalRevenue);

    // Revenue credit / settled
    acc.revCredit  += toN(e.creditAmount);
    acc.revSettled += toN(e.settledAmount);

    // Purchase cost
    (e.purchaseCost || []).forEach(p => {
      if (!p) return;
      const amt  = safeAmt(p);
      const cr   = safeCredit(p);
      const st   = safeSettled(p);
      acc.purchaseCostTotal   += amt;
      acc.purchaseCreditTotal += cr;
      acc.purchaseSettledTotal+= st;
      const key = p.item || "Other";
      acc.purchaseCostItems[key] = (acc.purchaseCostItems[key] || 0) + amt;
    });

    // Expenses
    const ex = e.expenses || {};
    Object.entries(ex).forEach(([key, val]) => {
      if (!acc.expenseBreakdown[key]) acc.expenseBreakdown[key] = { amt:0, credit:0, settled:0 };

      if (Array.isArray(val)) {
        val.forEach(item => {
          if (!item) return;
          acc.expenseBreakdown[key].amt    += safeAmt(item);
          acc.expenseBreakdown[key].credit += safeCredit(item);
          acc.expenseBreakdown[key].settled+= safeSettled(item);
        });
      } else if (val && typeof val === "object" && "amount" in val) {
        acc.expenseBreakdown[key].amt    += safeAmt(val);
        acc.expenseBreakdown[key].credit += safeCredit(val);
        acc.expenseBreakdown[key].settled+= safeSettled(val);
      } else if (typeof val === "number") {
        acc.expenseBreakdown[key].amt += val;
      }
    });

    return acc;
  }, {
    totalRevenue:         0,
    revCredit:            0,
    revSettled:           0,
    purchaseCostTotal:    0,
    purchaseCreditTotal:  0,
    purchaseSettledTotal: 0,
    purchaseCostItems:    {},
    expenseBreakdown:     {},
  });

  const totalExpenses    = Object.values(agg.expenseBreakdown).reduce((s, v) => s + v.amt, 0);
  const totalExpCredit   = Object.values(agg.expenseBreakdown).reduce((s, v) => s + v.credit, 0);
  const totalExpSettled  = Object.values(agg.expenseBreakdown).reduce((s, v) => s + v.settled, 0);

  // Total credit outstanding (expense + purchase + revenue)
  const totalCreditRaised     = agg.revCredit + agg.purchaseCreditTotal + totalExpCredit;
  const totalCreditSettled    = agg.revSettled + agg.purchaseSettledTotal + totalExpSettled;
  const totalCreditOutstanding = totalCreditRaised - totalCreditSettled;

  const grossIncome       = agg.totalRevenue - agg.purchaseCostTotal;
  const netProfit         = grossIncome - totalExpenses;

  // ── Per-entry calc (null-safe) ────────────────────────────
  const calcEntryExpenses = e => {
    const pc = (e.purchaseCost || []).reduce((s, p) => s + safeAmt(p), 0);
    const ex = Object.entries(e.expenses || {}).reduce((s, [, val]) => {
      if (Array.isArray(val)) return s + val.reduce((x, i) => x + safeAmt(i), 0);
      if (val && typeof val === "object" && "amount" in val) return s + safeAmt(val);
      if (typeof val === "number") return s + val;
      return s;
    }, 0);
    return pc + ex;
  };

  // ── CSS ───────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    * { box-sizing:border-box; }
    .sum-wrap  { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; }
    .sum-inner { max-width:860px; margin:0 auto; padding:32px 24px 60px; }

    .card { background:#fff; border:1px solid #ECEAE4; border-radius:18px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); margin-bottom:14px; }
    .card-header { padding:14px 20px; border-bottom:1px solid #ECEAE4; display:flex; justify-content:space-between; align-items:center; background:#FAFAF8; cursor:pointer; transition:background .1s; }
    .card-header:hover { background:#F0EEE9; }
    .card-header.static { cursor:default; }
    .card-header.static:hover { background:#FAFAF8; }
    .card-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.12em; text-transform:uppercase; }
    .card-val   { font-family:'DM Mono',monospace; font-size:15px; font-weight:700; }

    .metric-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:14px; }
    .metric-card { background:#fff; border:1px solid #ECEAE4; border-radius:14px; padding:16px 18px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .metric-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.1em; text-transform:uppercase; margin-bottom:8px; }
    .metric-val   { font-size:22px; font-weight:700; font-family:'DM Mono',monospace; }

    table.bk { width:100%; border-collapse:collapse; font-size:13px; }
    table.bk td { padding:11px 20px; border-bottom:1px solid #F7F6F3; }
    table.bk tr:last-child td { border-bottom:none; }
    table.bk tr.sub-row td:first-child { padding-left:36px; color:#777; font-size:12px; }
    table.bk tr.sub-row td:last-child  { color:#999; font-size:12px; font-family:'DM Mono',monospace; }
    table.bk tr.group-row td { font-weight:600; background:#FAFAF8; color:#333; }
    table.bk tr.total-row td { background:#F0FDF4; font-weight:700; }
    table.bk tr.highlight td { background:#FFFBEB; }
    .td-right { text-align:right; font-family:'DM Mono',monospace; }
    .td-cr { text-align:right; font-family:'DM Mono',monospace; color:#f59e0b; font-size:12px; }
    .td-st { text-align:right; font-family:'DM Mono',monospace; color:#10b981; font-size:12px; }
    .td-muted { color:#888; }

    .collapse-btn { font-size:10px; color:#A8A49C; font-weight:600; }

    .credit-summary { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; padding:16px 20px; }
    .cs-card { border-radius:10px; padding:12px; text-align:center; }
    .cs-label { font-size:9px; font-weight:700; color:#A8A49C; text-transform:uppercase; letter-spacing:.08em; margin-bottom:5px; }
    .cs-val   { font-size:15px; font-weight:700; font-family:'DM Mono',monospace; }

    .back-btn { display:flex; align-items:center; gap:5px; background:#fff; border:1px solid #ECEAE4; border-radius:10px; padding:8px 14px; font-family:inherit; font-size:13px; color:#555; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:all .12s; }
    .back-btn:hover { border-color:#bbb; color:#0D0D0D; }

    .entry-table { width:100%; border-collapse:collapse; font-size:12px; }
    .entry-table th { padding:10px 16px; background:#F7F6F3; color:#A8A49C; font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; border-bottom:1px solid #ECEAE4; }
    .entry-table th.right { text-align:right; }
    .entry-table td { padding:11px 16px; border-bottom:1px solid #F7F6F3; }
    .entry-table tr:last-child td { border-bottom:none; }
    .entry-table tr:hover td { background:#FAFAF8; }
    .num { font-family:'DM Mono',monospace; }
  `;

  return (
    <div className="sum-wrap">
      <style>{CSS}</style>
      <div className="sum-inner">

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontSize:10, color:"#A8A49C", letterSpacing:".12em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Summary</p>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#0D0D0D", letterSpacing:"-.02em" }}>{filterLabel}</h1>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#A8A49C" }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#C8C4BB", fontSize:14 }}>No entries found for this period.</div>
        ) : (
          <>
            {/* ── Top metric cards ── */}
            <div className="metric-grid">
              {[
                { label:"Total Revenue",    val:fmt(agg.totalRevenue),   color:"#6366f1" },
                { label:"Purchase Cost",    val:fmt(agg.purchaseCostTotal), color:"#f43f5e" },
                { label:"Total Expenses",   val:fmt(totalExpenses),      color:"#f59e0b" },
                { label:"Gross Income",     val:fmt(grossIncome),        color:"#0D0D0D" },
                { label:"Net Profit",       val:fmt(netProfit),          color:netProfit>=0?"#10b981":"#ef4444" },
                { label:"Entries",          val:entries.length,          color:"#6366f1" },
              ].map(({ label, val, color }) => (
                <div key={label} className="metric-card">
                  <div className="metric-label">{label}</div>
                  <div className="metric-val" style={{ color }}>{val}</div>
                </div>
              ))}
            </div>

            {/* ── Credit summary card ── */}
            {totalCreditRaised > 0 && (
              <div className="card">
                <div className="card-header static" style={{ cursor:"default" }}>
                  <span className="card-label">Credit & Settlement Summary</span>
                  <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:20, background:totalCreditOutstanding>0?"#FEF3C7":"#F0FDF4", color:totalCreditOutstanding>0?"#92400E":"#15803D", border:`1px solid ${totalCreditOutstanding>0?"#FDE68A":"#BBF7D0"}` }}>
                    {totalCreditOutstanding > 0 ? `₹${totalCreditOutstanding.toLocaleString("en-IN")} outstanding` : "All settled ✓"}
                  </span>
                </div>
                <div className="credit-summary">
                  {[
                    ["Revenue Credit",   agg.revCredit,            "#f59e0b", "#FFFBEB", "#FDE68A"],
                    ["Expense Credit",   totalExpCredit + agg.purchaseCreditTotal, "#C2410C", "#FFF7ED", "#FED7AA"],
                    ["Total Settled",    totalCreditSettled,        "#10b981", "#F0FDF4", "#BBF7D0"],
                    ["Outstanding",      totalCreditOutstanding,    totalCreditOutstanding>0?"#ef4444":"#10b981", totalCreditOutstanding>0?"#FEF2F2":"#F0FDF4", totalCreditOutstanding>0?"#FECACA":"#BBF7D0"],
                  ].map(([label, val, color, bg, border]) => (
                    <div key={label} className="cs-card" style={{ background:bg, border:`1px solid ${border}` }}>
                      <div className="cs-label">{label}</div>
                      <div className="cs-val" style={{ color }}>{fmt(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Full Breakdown Table ── */}
            <div className="card">
              <div className="card-header static">
                <span className="card-label">Full Breakdown</span>
                <span style={{ fontSize:11, color:"#A8A49C" }}>{entries.length} entries</span>
              </div>

              <table className="bk">
                <thead>
                  <tr>
                    <td style={{ padding:"8px 20px 6px", fontSize:10, fontWeight:600, color:"#A8A49C", letterSpacing:".08em", textTransform:"uppercase", background:"#FAFAF8" }}>Category</td>
                    <td style={{ padding:"8px 20px 6px", fontSize:10, fontWeight:600, color:"#A8A49C", letterSpacing:".08em", textTransform:"uppercase", textAlign:"right", background:"#FAFAF8" }}>Amount</td>
                    <td style={{ padding:"8px 20px 6px", fontSize:10, fontWeight:600, color:"#92400E", letterSpacing:".08em", textTransform:"uppercase", textAlign:"right", background:"#FAFAF8" }}>Credit</td>
                    <td style={{ padding:"8px 20px 6px", fontSize:10, fontWeight:600, color:"#15803D", letterSpacing:".08em", textTransform:"uppercase", textAlign:"right", background:"#FAFAF8" }}>Settled</td>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue */}
                  <tr>
                    <td className="td-muted">Total Revenue</td>
                    <td className="td-right" style={{ color:"#6366f1", fontWeight:700 }}>{fmt(agg.totalRevenue)}</td>
                    <td className="td-cr">{agg.revCredit > 0 ? fmt(agg.revCredit) : "—"}</td>
                    <td className="td-st">{agg.revSettled > 0 ? fmt(agg.revSettled) : "—"}</td>
                  </tr>

                  {/* Purchase Cost */}
                  <tr className="group-row" style={{ cursor:"pointer" }} onClick={() => setExpandedPurchase(v => !v)}>
                    <td>
                      Purchase Cost
                      <span style={{ fontSize:10, color:"#A8A49C", fontWeight:400, marginLeft:8 }}>
                        {expandedPurchase ? "▲ hide" : "▼ split-up"}
                      </span>
                    </td>
                    <td className="td-right">{fmt(agg.purchaseCostTotal)}</td>
                    <td className="td-cr">{agg.purchaseCreditTotal > 0 ? fmt(agg.purchaseCreditTotal) : "—"}</td>
                    <td className="td-st">{agg.purchaseSettledTotal > 0 ? fmt(agg.purchaseSettledTotal) : "—"}</td>
                  </tr>
                  {expandedPurchase && Object.entries(agg.purchaseCostItems).map(([item, amount]) => (
                    <tr key={item} className="sub-row">
                      <td>{item}</td>
                      <td className="td-right">{fmt(amount)}</td>
                      <td>—</td><td>—</td>
                    </tr>
                  ))}

                  {/* Gross Income */}
                  <tr className="highlight">
                    <td style={{ fontWeight:700 }}>Gross Income</td>
                    <td className="td-right" style={{ fontWeight:700 }}>{fmt(grossIncome)}</td>
                    <td></td><td></td>
                  </tr>

                  {/* Expenses header */}
                  <tr style={{ background:"#FAFAF8" }}>
                    <td colSpan={4} style={{ padding:"8px 20px 4px", fontSize:10, fontWeight:700, color:"#A8A49C", letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer" }}
                      onClick={() => setExpandedExpenses(v => !v)}>
                      Expenses {expandedExpenses ? "▲" : "▼"}
                    </td>
                  </tr>

                  {/* Either collapsed total or expanded breakdown */}
                  {!expandedExpenses ? (
                    <tr>
                      <td className="td-muted">All Expenses</td>
                      <td className="td-right" style={{ color:"#f43f5e" }}>{fmt(totalExpenses)}</td>
                      <td className="td-cr">{totalExpCredit > 0 ? fmt(totalExpCredit) : "—"}</td>
                      <td className="td-st">{totalExpSettled > 0 ? fmt(totalExpSettled) : "—"}</td>
                    </tr>
                  ) : (
                    Object.entries(agg.expenseBreakdown)
                      .filter(([, v]) => v.amt > 0)
                      .map(([key, v]) => (
                        <tr key={key}>
                          <td className="td-muted" style={{ paddingLeft:32 }}>{humanLabel(key)}</td>
                          <td className="td-right" style={{ color:"#f43f5e" }}>{fmt(v.amt)}</td>
                          <td className="td-cr">{v.credit > 0 ? fmt(v.credit) : "—"}</td>
                          <td className="td-st">{v.settled > 0 ? fmt(v.settled) : "—"}</td>
                        </tr>
                      ))
                  )}

                  {/* Net Profit */}
                  <tr className="total-row">
                    <td style={{ color:"#15803D" }}>Net Profit</td>
                    <td className="td-right" style={{ color:netProfit>=0?"#15803D":"#ef4444", fontSize:15 }}>{fmt(netProfit)}</td>
                    <td></td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Individual Entries ── */}
            <div className="card">
              <div className="card-header" onClick={() => setExpandedEntries(v => !v)}>
                <span className="card-label">Individual Entries ({entries.length})</span>
                <span className="collapse-btn">{expandedEntries ? "▲ hide" : "▼ show"}</span>
              </div>
              {expandedEntries && (
                <div style={{ overflowX:"auto" }}>
                  <table className="entry-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="right">Revenue</th>
                        <th className="right">Purchase</th>
                        <th className="right">Expenses</th>
                        <th className="right">Profit</th>
                        <th className="right">Credit</th>
                        <th style={{ textAlign:"center" }}>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...entries]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((e) => {
                          const pc     = (e.purchaseCost || []).reduce((s, p) => s + safeAmt(p), 0);
                          const exAmt  = calcEntryExpenses(e) - pc;
                          const total  = pc + exAmt;
                          const profit = toN(e.totalRevenue) - total;
                          const credit = toN(e.creditAmount) - toN(e.settledAmount);

                          return (
                            <tr key={e._id}>
                              <td><span className="num" style={{ color:"#666", fontSize:12 }}>
                                {new Date(e.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"})}
                              </span></td>
                              <td style={{ textAlign:"right" }}><span className="num" style={{ fontWeight:600, color:"#6366f1" }}>{fmt(e.totalRevenue)}</span></td>
                              <td style={{ textAlign:"right" }}><span className="num" style={{ color:"#f43f5e" }}>{fmt(pc)}</span></td>
                              <td style={{ textAlign:"right" }}><span className="num" style={{ color:"#888" }}>{fmt(exAmt)}</span></td>
                              <td style={{ textAlign:"right" }}><span className="num" style={{ fontWeight:700, color:profit>=0?"#10b981":"#ef4444" }}>{fmt(profit)}</span></td>
                              <td style={{ textAlign:"right" }}>
                                {credit > 0
                                  ? <span style={{ fontSize:11, background:"#FFFBEB", color:"#92400E", border:"1px solid #FDE68A", borderRadius:20, padding:"2px 8px" }}>{fmt(credit)}</span>
                                  : <span style={{ color:"#C8C4BB", fontSize:11 }}>—</span>}
                              </td>
                              <td style={{ textAlign:"center" }}>
                                <button onClick={() => navigate(`/entries/${e._id}`)}
                                  style={{ background:"#0D0D0D", color:"#fff", border:"none", borderRadius:8, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}