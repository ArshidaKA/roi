// src/pages/StockManagement.jsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiSave, FiChevronLeft, FiChevronRight,
         FiPackage, FiTrendingUp, FiTrendingDown, FiCalendar, FiInfo } from "react-icons/fi";
import client from "../api/client";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const fmt    = n  => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const toDay  = d  => new Date(d + "T00:00:00").toISOString().split("T")[0];
const today  = () => new Date().toISOString().split("T")[0];

// ── CSS ──────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing:border-box; }
  .stk-wrap  { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; padding-bottom:80px; }
  .stk-inner { max-width:1060px; margin:0 auto; padding:36px 24px; }

  .page-eyebrow { font-size:10px; color:#A8A49C; letter-spacing:.14em; text-transform:uppercase; margin-bottom:5px; font-family:'DM Mono',monospace; }
  .page-title   { font-size:26px; font-weight:800; color:#0D0D0D; letter-spacing:-.03em; margin-bottom:24px; }

  /* Date nav */
  .date-nav { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #ECEAE4; border-radius:14px; padding:10px 16px; box-shadow:0 1px 4px rgba(0,0,0,.05); margin-bottom:22px; flex-wrap:wrap; }
  .date-nav-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.1em; text-transform:uppercase; }
  .dn-btn { background:#F7F6F3; border:1px solid #ECEAE4; border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#666; transition:all .1s; }
  .dn-btn:hover { background:#ECEAE4; color:#0D0D0D; }
  .dn-btn:disabled { opacity:.35; cursor:not-allowed; }
  .dn-date-input { background:#F7F6F3; border:1px solid #ECEAE4; border-radius:8px; padding:5px 10px; font-size:12px; font-family:'DM Mono',monospace; color:#0D0D0D; outline:none; }
  .dn-date-input:focus { border-color:#0D0D0D; }
  .dn-today-btn { font-size:11px; font-weight:600; background:#0D0D0D; color:#fff; border:none; border-radius:7px; padding:4px 10px; cursor:pointer; font-family:inherit; }
  .dn-today-btn:hover { background:#333; }

  /* Summary strip */
  .stock-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:22px; }
  .ss-card { background:#fff; border:1px solid #ECEAE4; border-radius:14px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
  .ss-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
  .ss-label { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px; }
  .ss-val   { font-size:22px; font-weight:700; font-family:'DM Mono',monospace; }
  .ss-hint  { font-size:10px; color:#A8A49C; margin-top:3px; }

  /* Two-panel grid */
  .panels-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media(max-width:720px) { .panels-grid { grid-template-columns:1fr; } }

  /* Panel card */
  .panel { background:#fff; border:1px solid #ECEAE4; border-radius:18px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); }
  .panel-header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #ECEAE4; }
  .panel-title { font-size:13px; font-weight:700; color:#0D0D0D; display:flex; align-items:center; gap:7px; }
  .panel-title-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .panel-total { font-family:'DM Mono',monospace; font-size:15px; font-weight:700; }
  .panel-body { padding:18px 20px; }

  /* Item rows */
  .col-header { display:flex; gap:8px; align-items:center; margin-bottom:8px; font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.06em; text-transform:uppercase; }
  .ch-item   { flex:1; }
  .ch-unit   { flex:0 0 72px; }
  .ch-amount { flex:0 0 96px; text-align:right; }
  .ch-del    { width:24px; }

  .item-row { display:flex; align-items:flex-end; gap:8px; margin-bottom:9px; }
  .ir-field { display:flex; flex-direction:column; gap:3px; }
  .ir-field.f-item   { flex:1; }
  .ir-field.f-unit   { flex:0 0 72px; }
  .ir-field.f-amount { flex:0 0 96px; }
  .ir-field label { font-size:10px; color:#A8A49C; font-weight:500; }
  .ir-field input {
    background:transparent; border:none; border-bottom:1.5px solid #E5E2DB;
    padding:5px 0; font-size:13px; color:#0D0D0D; font-family:inherit; outline:none;
    width:100%; transition:border-color .15s;
  }
  .ir-field input:focus { border-color:#0D0D0D; }
  .ir-field input[type="number"] { font-family:'DM Mono',monospace; text-align:right; }
  .ir-field input[type="number"]::-webkit-outer-spin-button,
  .ir-field input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; }
  .ir-field input::placeholder { color:#C8C4BB; }

  .del-btn { padding:3px; color:#C8C4BB; cursor:pointer; background:none; border:none; transition:color .1s; flex-shrink:0; align-self:flex-end; padding-bottom:7px; }
  .del-btn:hover { color:#E11D48; }

  .add-row-btn { display:flex; align-items:center; gap:5px; font-size:12px; color:#A8A49C; font-weight:500; cursor:pointer; background:none; border:none; font-family:inherit; padding:4px 0; margin-top:6px; transition:color .1s; }
  .add-row-btn:hover { color:#0D0D0D; }

  /* Total strip */
  .total-strip { display:flex; justify-content:space-between; align-items:center; padding:12px 0 0; border-top:1.5px solid #ECEAE4; margin-top:10px; }
  .total-strip-label { font-size:12px; font-weight:600; color:#666; }
  .total-strip-val   { font-size:17px; font-weight:700; font-family:'DM Mono',monospace; }

  /* Notes */
  .notes-area { width:100%; background:#F7F6F3; border:1px solid #ECEAE4; border-radius:10px; padding:10px 12px; font-size:12px; font-family:inherit; color:#0D0D0D; outline:none; resize:vertical; min-height:60px; margin-top:14px; transition:border-color .1s; }
  .notes-area:focus { border-color:#0D0D0D; }

  /* Save button */
  .save-btn { width:100%; margin-top:16px; background:#0D0D0D; color:#fff; border:none; border-radius:12px; padding:12px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; box-shadow:0 2px 10px rgba(0,0,0,.18); transition:background .12s,transform .1s; }
  .save-btn:hover { background:#222; transform:translateY(-1px); }
  .save-btn:active { transform:scale(.98); }
  .save-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .save-btn.opening { background:#6366f1; }
  .save-btn.opening:hover { background:#4f46e5; }
  .save-btn.closing { background:#10b981; }
  .save-btn.closing:hover { background:#059669; }

  /* Saved badge */
  .saved-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:5px; margin-left:8px; }
  .saved-badge.opening { background:#EEF2FF; color:#4f46e5; border:1px solid #C7D2FE; }
  .saved-badge.closing { background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }

  /* History panel */
  .hist-section { margin-top:22px; }
  .hist-title { font-size:11px; font-weight:700; color:#A8A49C; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; }
  .hist-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:10px; }
  .hist-card  { background:#fff; border:1px solid #ECEAE4; border-radius:14px; padding:14px 16px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
  .hist-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  .hist-card-date  { font-size:12px; font-weight:700; color:#0D0D0D; font-family:'DM Mono',monospace; }
  .hist-card-type  { font-size:10px; font-weight:700; padding:2px 8px; border-radius:5px; }
  .hist-card-type.opening { background:#EEF2FF; color:#4f46e5; }
  .hist-card-type.closing { background:#ECFDF5; color:#059669; }
  .hist-item-row { display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid #F5F3EF; }
  .hist-item-row:last-child { border-bottom:none; }
  .hist-total { display:flex; justify-content:space-between; font-size:13px; font-weight:700; padding-top:8px; margin-top:4px; border-top:1.5px solid #ECEAE4; font-family:'DM Mono',monospace; }

  /* Diff badge */
  .diff-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
  .diff-badge.up   { background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }
  .diff-badge.down { background:#FEF2F2; color:#ef4444; border:1px solid #FECACA; }
  .diff-badge.flat { background:#F5F3EF; color:#888; border:1px solid #ECEAE4; }

  .btn-ghost { background:#fff; color:#333; border:1px solid #ECEAE4; border-radius:11px; padding:9px 18px; font-family:inherit; font-size:13px; font-weight:500; cursor:pointer; transition:all .12s; }
  .btn-ghost:hover { border-color:#bbb; }
`;

// ── Empty item ────────────────────────────────────────────────
const mkItem = () => ({ item:"", unit:"", amount:"" });

// ── Panel component ───────────────────────────────────────────
function StockPanel({ type, color, accent, existing, date, onSaved }) {
  const qc = useQueryClient();
  const label    = type === "opening" ? "Opening Stock" : "Closing Stock";
  const icon     = type === "opening" ? <FiTrendingUp size={14} color={accent} /> : <FiTrendingDown size={14} color={accent} />;

  const [items, setItems] = useState([mkItem()]);
  const [notes, setNotes] = useState("");

  // Pre-fill when existing data loads
  useEffect(() => {
    if (existing) {
      setItems(existing.items?.length ? existing.items.map(i => ({ item:i.item||"", unit:i.unit||"", amount:i.amount??""  })) : [mkItem()]);
      setNotes(existing.notes || "");
    } else {
      setItems([mkItem()]);
      setNotes("");
    }
  }, [existing?._id, date]);

  const total = items.reduce((s, i) => s + Number(i.amount || 0), 0);

  const setRow = (idx, field, val) => {
    setItems(p => p.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };
  const addRow = () => setItems(p => [...p, mkItem()]);
  const delRow = idx => setItems(p => p.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: payload => client.post("/stock", payload),
    onSuccess: () => {
      qc.invalidateQueries(["stock-today"]);
      qc.invalidateQueries(["stock-history"]);
      qc.invalidateQueries(["stock-summary"]);
      if (onSaved) onSaved(type);
    },
    onError: err => {
      MySwal.fire({ icon:"error", title:"Error", text:err?.response?.data?.message || "Failed to save.", confirmButtonColor:"#0D0D0D" });
    },
  });

  const handleSave = () => {
    const validItems = items.filter(i => i.item && Number(i.amount) > 0);
    if (!validItems.length) {
      MySwal.fire({ icon:"warning", title:"No items", text:"Please add at least one item with an amount.", confirmButtonColor:"#0D0D0D" }); return;
    }
    MySwal.fire({
      title: `Save ${label}?`,
      html: `<b>Date:</b> ${date}<br/><b>Total value:</b> ₹${total.toLocaleString("en-IN")}<br/><b>Items:</b> ${validItems.length}`,
      icon: "question", showCancelButton: true,
      confirmButtonText: "Save", confirmButtonColor: accent, cancelButtonColor: "#E5E2DB",
    }).then(r => {
      if (!r.isConfirmed) return;
      mutation.mutate({ date, type, items: validItems.map(i => ({ item:i.item, unit:i.unit||"", amount:Number(i.amount||0) })), notes });
    });
  };

  return (
    <div className="panel">
      <div className="panel-header" style={{ borderTop:`3px solid ${accent}` }}>
        <div className="panel-title">
          <span className="panel-title-dot" style={{ background:accent }} />
          {icon} {label}
          {existing && <span className={`saved-badge ${type}`}>Saved ✓</span>}
        </div>
        <div className="panel-total" style={{ color: total > 0 ? accent : "#C8C4BB" }}>
          {fmt(total)}
        </div>
      </div>
      <div className="panel-body">

        {/* Column headers */}
        <div className="col-header">
          <div className="ch-item">Item</div>
          <div className="ch-unit">Unit</div>
          <div className="ch-amount">Value (₹)</div>
          <div className="ch-del" />
        </div>

        {/* Item rows */}
        {items.map((row, i) => (
          <div key={i} className="item-row">
            <div className="ir-field f-item">
              <input
                placeholder="e.g. Rice, Oil, Chicken…"
                value={row.item}
                onChange={e => setRow(i, "item", e.target.value)}
              />
            </div>
            <div className="ir-field f-unit">
              <input
                placeholder="kg / L / pcs"
                value={row.unit}
                onChange={e => setRow(i, "unit", e.target.value)}
              />
            </div>
            <div className="ir-field f-amount">
              <input
                type="number" placeholder="0"
                value={row.amount}
                onChange={e => setRow(i, "amount", e.target.value)}
                onWheel={e => e.target.blur()}
              />
            </div>
            {items.length > 1
              ? <button className="del-btn" onClick={() => delRow(i)}><FiTrash2 size={13}/></button>
              : <div style={{ width:24 }}/>}
          </div>
        ))}

        <button className="add-row-btn" onClick={addRow}>
          <FiPlus size={13}/> Add item
        </button>

        {/* Total */}
        <div className="total-strip">
          <span className="total-strip-label">Total Stock Value</span>
          <span className="total-strip-val" style={{ color: accent }}>{fmt(total)}</span>
        </div>

        {/* Notes */}
        <textarea
          className="notes-area"
          placeholder="Notes (optional)…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Save */}
        <button
          className={`save-btn ${type}`}
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          <FiSave size={14}/>
          {mutation.isPending ? "Saving…" : existing ? `Update ${label}` : `Save ${label}`}
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function StockManagement() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(today());
  const todayStr = today();
  const isPast   = selectedDate < todayStr;

  const shiftDate = delta => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // ── Queries ─────────────────────────────────────────────────
  const { data: todayData = {} } = useQuery({
    queryKey: ["stock-today", selectedDate],
    queryFn:  async () => (await client.get(`/stock/today?date=${selectedDate}`)).data,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["stock-history"],
    queryFn:  async () => (await client.get("/stock?limit=20")).data,
  });

  const { data: summary = {} } = useQuery({
    queryKey: ["stock-summary"],
    queryFn:  async () => (await client.get("/stock/summary")).data,
  });

  const { opening, closing } = todayData;

  // Diff for today
  const todayDiff    = (closing?.totalValue || 0) - (opening?.totalValue || 0);
  const hasBoth      = opening && closing;

  // Recent history (last 10 entries, excluding current date)
  const recentHistory = history
    .filter(h => h.date?.split("T")[0] !== selectedDate)
    .slice(0, 10);

  return (
    <div className="stk-wrap">
      <style>{CSS}</style>
      <div className="stk-inner">

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <p className="page-eyebrow">Inventory</p>
            <h1 className="page-title">Stock Management</h1>
          </div>
          <button className="btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        </div>

        {/* ── Date nav ── */}
        <div className="date-nav">
          <span className="date-nav-label"><FiCalendar size={11} style={{ marginRight:4 }}/>Date</span>
          <button className="dn-btn" onClick={() => shiftDate(-1)}><FiChevronLeft size={14}/></button>
          <input type="date" className="dn-date-input" value={selectedDate} max={todayStr} onChange={e => e.target.value && setSelectedDate(e.target.value)} />
          <button className="dn-btn" onClick={() => shiftDate(1)} disabled={selectedDate >= todayStr}><FiChevronRight size={14}/></button>
          {selectedDate !== todayStr && (
            <button className="dn-today-btn" onClick={() => setSelectedDate(todayStr)}>Today</button>
          )}
          {isPast && <span style={{ fontSize:10, fontWeight:600, background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A", borderRadius:6, padding:"2px 8px" }}>✏️ Past date</span>}
          {hasBoth && (
            <span className={`diff-badge ${todayDiff > 0 ? "up" : todayDiff < 0 ? "down" : "flat"}`}>
              {todayDiff > 0 ? <FiTrendingUp size={11}/> : todayDiff < 0 ? <FiTrendingDown size={11}/> : null}
              {todayDiff >= 0 ? "+" : ""}{fmt(todayDiff)} today
            </span>
          )}
        </div>

        {/* ── Summary cards ── */}
        <div className="stock-summary">
          {[
            {
              label: "Opening (Today)",
              val:   fmt(opening?.totalValue || 0),
              hint:  opening ? `${opening.items?.length || 0} items` : "Not entered yet",
              color: "#6366f1",
              bg:    "#EEF2FF",
              icon:  <FiTrendingUp size={16} color="#6366f1"/>,
            },
            {
              label: "Closing (Today)",
              val:   fmt(closing?.totalValue || 0),
              hint:  closing ? `${closing.items?.length || 0} items` : "Not entered yet",
              color: "#10b981",
              bg:    "#ECFDF5",
              icon:  <FiTrendingDown size={16} color="#10b981"/>,
            },
            {
              label: "Difference",
              val:   hasBoth ? (todayDiff >= 0 ? "+" : "") + fmt(todayDiff) : "—",
              hint:  hasBoth ? (todayDiff >= 0 ? "Stock gained" : "Stock reduced") : "Need both entries",
              color: hasBoth ? (todayDiff >= 0 ? "#10b981" : "#ef4444") : "#A8A49C",
              bg:    hasBoth ? (todayDiff >= 0 ? "#ECFDF5" : "#FEF2F2") : "#F7F6F3",
              icon:  <FiPackage size={16} color={hasBoth ? (todayDiff >= 0 ? "#10b981" : "#ef4444") : "#A8A49C"}/>,
            },
            {
              label: "Monthly Opening",
              val:   fmt(summary.totalOpeningValue || 0),
              hint:  "This month total",
              color: "#6366f1",
              bg:    "#F5F3FF",
              icon:  <FiPackage size={16} color="#6366f1"/>,
            },
            {
              label: "Monthly Closing",
              val:   fmt(summary.totalClosingValue || 0),
              hint:  "This month total",
              color: "#10b981",
              bg:    "#ECFDF5",
              icon:  <FiPackage size={16} color="#10b981"/>,
            },
          ].map(({ label, val, hint, color, bg, icon }) => (
            <div key={label} className="ss-card">
              <div className="ss-icon" style={{ background:bg }}>{icon}</div>
              <div className="ss-label">{label}</div>
              <div className="ss-val" style={{ color }}>{val}</div>
              <div className="ss-hint">{hint}</div>
            </div>
          ))}
        </div>

        {/* ── Two-panel: Opening + Closing ── */}
        <div className="panels-grid">
          <StockPanel
            type="opening"
            color="#6366f1"
            accent="#6366f1"
            existing={opening}
            date={selectedDate}
          />
          <StockPanel
            type="closing"
            color="#10b981"
            accent="#10b981"
            existing={closing}
            date={selectedDate}
          />
        </div>

        {/* ── Recent History ── */}
        {recentHistory.length > 0 && (
          <div className="hist-section">
            <div className="hist-title">Recent Stock Entries</div>
            <div className="hist-grid">
              {recentHistory.map(entry => (
                <div key={entry._id} className="hist-card">
                  <div className="hist-card-header">
                    <span className="hist-card-date">
                      {new Date(entry.date).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"2-digit" })}
                    </span>
                    <span className={`hist-card-type ${entry.type}`}>
                      {entry.type === "opening" ? "Opening" : "Closing"}
                    </span>
                  </div>
                  {(entry.items || []).slice(0, 5).map((item, i) => (
                    <div key={i} className="hist-item-row">
                      <span style={{ color:"#555" }}>
                        {item.item}{item.unit ? ` (${item.unit})` : ""}
                      </span>
                      <span style={{ fontFamily:"'DM Mono',monospace", color:"#0D0D0D", fontWeight:600 }}>
                        {fmt(item.amount)}
                      </span>
                    </div>
                  ))}
                  {(entry.items || []).length > 5 && (
                    <div style={{ fontSize:11, color:"#A8A49C", marginTop:4 }}>
                      +{entry.items.length - 5} more items
                    </div>
                  )}
                  <div className="hist-total">
                    <span>Total</span>
                    <span style={{ color: entry.type === "opening" ? "#6366f1" : "#10b981" }}>
                      {fmt(entry.totalValue)}
                    </span>
                  </div>
                  {entry.notes && (
                    <div style={{ fontSize:11, color:"#A8A49C", marginTop:6, borderTop:"1px solid #F5F3EF", paddingTop:6 }}>
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}