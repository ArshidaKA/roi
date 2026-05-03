// src/pages/EditEntry.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { FiChevronLeft, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";

// ── Constants (mirrors AddEntry) ──────────────────────────────
const ACCOUNTS = [
  { key: "cash",        label: "Cash",         color: "#10b981" },
  { key: "federalBank", label: "Federal Bank", color: "#6366f1" },
  { key: "vibgyorBank", label: "Vibgyor Bank", color: "#f59e0b" },
  { key: "asifAccount", label: "Asif Account", color: "#f43f5e" },
];

const SINGLE_EXP_FIELDS = [
  ["foodRefreshment", "Food & Refreshment"],
  ["rent",            "Rent"],
  ["electricity",     "Electricity"],
  ["travelFuel",      "Travel & Fuel"],
  ["mobileInternet",  "Mobile & Internet"],
  ["maintenance",     "Maintenance"],
  ["incentive",       "Incentive"],
  ["gasStaff",        "Gas (Staff)"],
  ["gasStore",        "Gas (Store)"],
];

// ── Shared CSS (same design language as AddEntry) ──────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  .edit-wrap  { min-height: 100vh; background: #F7F6F3; font-family: 'Plus Jakarta Sans', sans-serif; }
  .edit-inner { max-width: 860px; margin: 0 auto; padding: 32px 24px 120px; }

  .page-eyebrow { font-size: 10px; color: #A8A49C; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 5px; font-family: 'DM Mono', monospace; }
  .page-title   { font-size: 26px; font-weight: 700; color: #0D0D0D; letter-spacing: -.03em; }

  .section       { background: #fff; border: 1px solid #ECEAE4; border-radius: 18px; padding: 22px; margin-bottom: 14px; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
  .section-title { font-size: 10px; font-weight: 600; color: #A8A49C; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 18px; }
  .sub-title     { font-size: 11px; font-weight: 600; color: #666; letter-spacing: .06em; text-transform: uppercase; margin: 14px 0 10px; }
  .sub-box       { background: #FAFAF8; border: 1px solid #ECEAE4; border-radius: 12px; padding: 14px; }

  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-size: 11px; font-weight: 500; color: #888; letter-spacing: .04em; }
  .field input, .field select {
    background: transparent; border: none;
    border-bottom: 1.5px solid #E5E2DB;
    padding: 6px 0; font-size: 13px; color: #0D0D0D;
    font-family: inherit; outline: none;
    transition: border-color .15s; width: 100%;
  }
  .field input:focus, .field select:focus { border-color: #0D0D0D; }
  .field input:disabled { opacity: .45; cursor: not-allowed; }
  .field input[type="number"]::-webkit-outer-spin-button,
  .field input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
  .field input::placeholder { color: #C8C4BB; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

  .row-flex { display: flex; align-items: flex-end; gap: 10px; }
  .row-flex .field { flex: 1; }
  .row-flex .field.w-amount { flex: 0 0 120px; }
  .row-flex .field.w-source { flex: 0 0 140px; }

  .del-btn { padding: 4px; color: #C8C4BB; cursor: pointer; background: none; border: none; transition: color .1s; flex-shrink: 0; align-self: flex-end; padding-bottom: 8px; }
  .del-btn:hover { color: #E11D48; }
  .add-row-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #A8A49C; font-weight: 500; cursor: pointer; background: none; border: none; font-family: inherit; padding: 4px 0; margin-top: 4px; transition: color .1s; }
  .add-row-btn:hover { color: #0D0D0D; }

  .auto-field { display: flex; flex-direction: column; gap: 4px; }
  .auto-field label { font-size: 11px; font-weight: 500; color: #888; }
  .auto-value { font-size: 15px; font-weight: 700; color: #0D0D0D; font-family: 'DM Mono', monospace; border-bottom: 1.5px solid #ECEAE4; padding: 6px 0; }
  .auto-hint  { font-size: 10px; color: #B8B4AC; margin-top: 2px; }

  .staff-readonly { display: flex; justify-content: space-between; align-items: center; background: #F7F6F3; border-radius: 10px; padding: 12px 14px; }
  .staff-label { font-size: 12px; color: #888; }
  .staff-val   { font-size: 14px; font-weight: 600; color: #0D0D0D; font-family: 'DM Mono', monospace; }
  .staff-hint  { font-size: 10px; color: #B8B4AC; margin-top: 2px; }

  .split-bar-wrap { margin-top: 10px; }
  .split-bar  { display: flex; border-radius: 6px; overflow: hidden; height: 6px; background: #ECEAE4; }
  .split-labels { display: flex; gap: 14px; margin-top: 6px; flex-wrap: wrap; }
  .split-label  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #888; }

  .staff-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; background: #FEF9EC; color: #92400E; border: 1px solid #FDE68A; border-radius: 8px; padding: 3px 10px; }

  .credit-box   { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px; }
  .credit-note  { font-size: 11px; color: #92400E; margin-top: 4px; }

  .footer-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #ECEAE4; padding: 14px 28px; display: flex; justify-content: flex-end; gap: 10px; z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,.06); }
  .btn-cancel { background: none; border: none; font-family: inherit; font-size: 13px; color: #888; cursor: pointer; padding: 9px 16px; border-radius: 10px; font-weight: 500; transition: color .1s; }
  .btn-cancel:hover { color: #0D0D0D; }
  .btn-save { background: #0D0D0D; color: #fff; border: none; border-radius: 12px; padding: 10px 26px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.18); transition: background .1s, transform .1s; }
  .btn-save:hover { background: #222; transform: translateY(-1px); }
  .btn-save:active { transform: scale(.98); }
  .btn-back { display: flex; align-items: center; gap: 6px; background: none; border: none; color: #888; font-size: 13px; cursor: pointer; font-family: inherit; }
  .btn-back:hover { color: #0D0D0D; }
`;

// ── Helpers ──────────────────────────────────────────────────
const mkSingle  = (amount = "", source = "") => ({ amount, source });
const mkArr     = (obj = {}) => obj;

function Field({ label, type = "text", value, onChange, placeholder, prefix, disabled }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        {prefix && <span style={{ color: "#A8A49C", fontSize: 13 }}>{prefix}</span>}
        <input
          type={type}
          value={value ?? ""}
          onChange={e => !disabled && onChange(e.target.value)}
          placeholder={placeholder || (type === "number" ? "0" : "")}
          disabled={disabled}
          onWheel={e => type === "number" && e.target.blur()}
          style={disabled ? { opacity: .45, cursor: "not-allowed" } : {}}
        />
      </div>
    </div>
  );
}

function SourceSelect({ value, onChange, disabled }) {
  return (
    <div className="field w-source">
      <label>From account</label>
      <select
        value={value || ""}
        onChange={e => !disabled && onChange(e.target.value)}
        disabled={disabled}
        style={disabled ? { opacity: .45, cursor: "not-allowed", background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", color: "#0D0D0D" }
          : { background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", color: "#0D0D0D" }}
      >
        <option value="">— account —</option>
        {ACCOUNTS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
    </div>
  );
}

function SplitBar({ split, total }) {
  if (!total) return null;
  return (
    <div className="split-bar-wrap">
      <div className="split-bar">
        {ACCOUNTS.map(a => {
          const pct = ((split[a.key] || 0) / total) * 100;
          return pct > 0 ? <div key={a.key} style={{ width: `${pct}%`, background: a.color, transition: "width .3s" }} /> : null;
        })}
      </div>
      <div className="split-labels">
        {ACCOUNTS.map(a => {
          if (!split[a.key]) return null;
          const pct = ((split[a.key] / total) * 100).toFixed(1);
          return (
            <span key={a.key} className="split-label">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, display: "inline-block" }} />
              {a.label}: {pct}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────
export default function EditEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  const { data: entry, isLoading } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => (await client.get(`/roi/${id}`)).data,
    enabled: !!id,
  });

  const { data: approved = { requests: [] } } = useQuery({
    queryKey: ["approvedFields", id],
    queryFn: async () =>
      (await client.get("/roi/edit-requests", { params: { status: "APPROVED", entryId: id, mine: true, limit: 200 } })).data,
    enabled: !!id && me?.role === "STAFF",
  });

  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: async () => (await client.get("/staff")).data });

  const { data: salarySummary } = useQuery({
    queryKey: ["salary-summary", entry?.date],
    queryFn: async () => (await client.get(`/attendance/salary-summary?date=${entry?.date?.split("T")[0]}`)).data,
    enabled: !!entry?.date,
  });

  const totalStaffSalary       = salarySummary?.totalSalary || 0;
  const totalStaffAccommodation = staff.reduce((s, m) => s + (m.accommodation || 0), 0);

  const approvedPaths = useMemo(() => {
    const set = new Set();
    (approved?.requests || []).forEach(r => { if (!r.consumed) set.add(r.fieldPath); });
    return set;
  }, [approved]);

  // ── Form state ───────────────────────────────────────────
  const [date, setDate]               = useState("");
  const [revSplit, setRevSplit]       = useState({ cash: "", federalBank: "", vibgyorBank: "", asifAccount: "" });
  const [purchaseCost, setPurchaseCost] = useState([{ item: "", amount: "" }]);
  const [creditAmount, setCreditAmount] = useState("");

  const [exp, setExp] = useState({
    commissionOnSales: mkSingle(),
    foodRefreshment:   mkSingle(),
    rent:              mkSingle(),
    electricity:       mkSingle(),
    travelFuel:        mkSingle(),
    mobileInternet:    mkSingle(),
    maintenance:       mkSingle(),
    incentive:         mkSingle(),
    gasStaff:          mkSingle(),
    gasStore:          mkSingle(),
    marketing:         [{ remark: "", amount: "", source: "" }],
    foodWastageCooked: [{ item: "", amount: "", source: "" }],
    foodWastageRaw:    [{ item: "", amount: "", source: "" }],
    other:             [{ reason: "", amount: "", source: "" }],
  });

  // totalRevenue auto-computed
  const totalRevenue = ACCOUNTS.reduce((s, a) => s + Number(revSplit[a.key] || 0), 0);

  // ── Prefill on load ──────────────────────────────────────
  useEffect(() => {
    if (!entry) return;
    setDate(entry.date?.split("T")[0] || "");
    setCreditAmount(entry.creditAmount ?? "");

    // Revenue split
    const rs = entry.revenueSplit || {};
    setRevSplit({
      cash:        rs.cash        ?? "",
      federalBank: rs.federalBank ?? "",
      vibgyorBank: rs.vibgyorBank ?? "",
      asifAccount: rs.asifAccount ?? "",
    });

    // Purchase cost
    setPurchaseCost(
      (entry.purchaseCost || []).map(p => ({ item: p.item || "", amount: p.amount ?? "" }))
    );

    // Expenses
    const ex = entry.expenses || {};
    const getSingle = key => ({
      amount: ex[key]?.amount ?? ex[key] ?? "",
      source: ex[key]?.source ?? "",
    });
    const getArr = (key, fields) =>
      (ex[key] || [{ ...fields }]).map(row => {
        const out = {};
        Object.keys(fields).forEach(f => { out[f] = row[f] ?? ""; });
        return out;
      });

    setExp({
      commissionOnSales: getSingle("commissionOnSales"),
      foodRefreshment:   getSingle("foodRefreshment"),
      rent:              getSingle("rent"),
      electricity:       getSingle("electricity"),
      travelFuel:        getSingle("travelFuel"),
      mobileInternet:    getSingle("mobileInternet"),
      maintenance:       getSingle("maintenance"),
      incentive:         getSingle("incentive"),
      gasStaff:          getSingle("gasStaff"),
      gasStore:          getSingle("gasStore"),
      marketing:         getArr("marketing",         { remark: "", amount: "", source: "" }),
      foodWastageCooked: getArr("foodWastageCooked", { item: "", amount: "", source: "" }),
      foodWastageRaw:    getArr("foodWastageRaw",    { item: "", amount: "", source: "" }),
      other:             getArr("other",             { reason: "", amount: "", source: "" }),
    });
  }, [entry]);

  // ── Path helpers ─────────────────────────────────────────
  const pcPath        = (i, key)         => `purchaseCost[${i}].${key}`;
  const expSingPath   = key              => `expenses.${key}`;
  const expSingSubPath= (key, sub)       => `expenses.${key}.${sub}`;
  const expArrPath    = (field, i, key)  => `expenses.${field}[${i}].${key}`;
  const splitPath     = key              => `revenueSplit.${key}`;

  const isDisabled = path => {
    if (me?.role === "OWNER") return false;
    if (me?.role === "STAFF") return !approvedPaths.has(path);
    return true;
  };

  // ── State helpers ─────────────────────────────────────────
  const setSingle = (key, field, val) =>
    setExp(p => ({ ...p, [key]: { ...p[key], [field]: val } }));

  const setArrRow = (key, idx, field, val) =>
    setExp(p => { const a = [...p[key]]; a[idx] = { ...a[idx], [field]: val }; return { ...p, [key]: a }; });

  const addRow = (key, empty) =>
    setExp(p => ({ ...p, [key]: [...p[key], { ...empty }] }));

  const delRow = (key, idx) =>
    setExp(p => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));

  // ── Mutations ─────────────────────────────────────────────
  const putMutation = useMutation({
    mutationFn: payload => client.put(`/roi/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries(["entry", id]); navigate(`/entries/${id}`); },
  });

  const staffPatchMutation = useMutation({
    mutationFn: updates => client.patch(`/roi/${id}/staff-update`, { updates }),
    onSuccess: () => { qc.invalidateQueries(["entry", id]); navigate(`/entries/${id}`); },
  });

  // ── Build payloads ────────────────────────────────────────
  const toNum = v => Number(v || 0);

  const buildOwnerPayload = () => ({
    date,
    totalRevenue,
    revenueSplit: {
      cash:        toNum(revSplit.cash),
      federalBank: toNum(revSplit.federalBank),
      vibgyorBank: toNum(revSplit.vibgyorBank),
      asifAccount: toNum(revSplit.asifAccount),
    },
    purchaseCost: purchaseCost.map(p => ({ item: p.item, amount: toNum(p.amount) })),
    creditAmount: toNum(creditAmount),
    expenses: {
      commissionOnSales: { amount: toNum(exp.commissionOnSales.amount), source: exp.commissionOnSales.source || "" },
      staffSalary:        [{ name: "Total Staff Salary",        amount: totalStaffSalary,       source: "" }],
      staffAccommodation: [{ name: "Total Staff Accommodation", amount: totalStaffAccommodation, source: "" }],
      foodRefreshment:   { amount: toNum(exp.foodRefreshment.amount),  source: exp.foodRefreshment.source  || "" },
      rent:              { amount: toNum(exp.rent.amount),             source: exp.rent.source             || "" },
      electricity:       { amount: toNum(exp.electricity.amount),      source: exp.electricity.source      || "" },
      travelFuel:        { amount: toNum(exp.travelFuel.amount),       source: exp.travelFuel.source       || "" },
      mobileInternet:    { amount: toNum(exp.mobileInternet.amount),   source: exp.mobileInternet.source   || "" },
      maintenance:       { amount: toNum(exp.maintenance.amount),      source: exp.maintenance.source      || "" },
      incentive:         { amount: toNum(exp.incentive.amount),        source: exp.incentive.source        || "" },
      gasStaff:          { amount: toNum(exp.gasStaff.amount),         source: exp.gasStaff.source         || "" },
      gasStore:          { amount: toNum(exp.gasStore.amount),         source: exp.gasStore.source         || "" },
      marketing:         exp.marketing.map(m => ({ remark: m.remark, amount: toNum(m.amount), source: m.source || "" })),
      foodWastageCooked: exp.foodWastageCooked.map(f => ({ item: f.item, amount: toNum(f.amount), source: f.source || "" })),
      foodWastageRaw:    exp.foodWastageRaw.map(f => ({ item: f.item, amount: toNum(f.amount), source: f.source || "" })),
      other:             exp.other.map(o => ({ reason: o.reason, amount: toNum(o.amount), source: o.source || "" })),
    },
  });

  const buildStaffUpdates = () => {
    const updates = [];
    if (!entry) return updates;

    // Revenue split
    ACCOUNTS.forEach(a => {
      const path = splitPath(a.key);
      const cur  = toNum(revSplit[a.key]);
      const prev = toNum((entry.revenueSplit || {})[a.key]);
      if (!isDisabled(path) && cur !== prev) updates.push({ path, value: cur });
    });

    // totalRevenue sync
    if (!isDisabled("totalRevenue") && totalRevenue !== (entry.totalRevenue || 0))
      updates.push({ path: "totalRevenue", value: totalRevenue });

    // Date
    if (!isDisabled("date") && date !== (entry.date?.split("T")[0] || ""))
      updates.push({ path: "date", value: date });

    // Credit
    if (!isDisabled("creditAmount") && toNum(creditAmount) !== toNum(entry.creditAmount))
      updates.push({ path: "creditAmount", value: toNum(creditAmount) });

    // Purchase cost
    purchaseCost.forEach((p, i) => {
      const base = entry.purchaseCost?.[i] || {};
      const ip = pcPath(i, "item"), ap = pcPath(i, "amount");
      if (!isDisabled(ip) && (p.item || "") !== (base.item || "")) updates.push({ path: ip, value: p.item });
      if (!isDisabled(ap) && toNum(p.amount) !== toNum(base.amount))  updates.push({ path: ap, value: toNum(p.amount) });
    });

    // Single expenses: amount + source
    ["commissionOnSales", "foodRefreshment", "rent", "electricity", "travelFuel",
     "mobileInternet", "maintenance", "incentive", "gasStaff", "gasStore"].forEach(key => {
      const curAmt = toNum(exp[key].amount);
      const curSrc = exp[key].source || "";
      const prevObj = entry.expenses?.[key] || {};
      const prevAmt = toNum(typeof prevObj === "object" ? prevObj.amount : prevObj);
      const prevSrc = prevObj.source || "";
      const amtPath = expSingSubPath(key, "amount");
      const srcPath = expSingSubPath(key, "source");
      if (!isDisabled(amtPath) && curAmt !== prevAmt) updates.push({ path: amtPath, value: curAmt });
      if (!isDisabled(srcPath) && curSrc !== prevSrc) updates.push({ path: srcPath, value: curSrc });
    });

    // Array expenses
    const arrFields = [
      { key: "marketing",         fields: ["remark", "amount", "source"] },
      { key: "foodWastageCooked", fields: ["item", "amount", "source"]   },
      { key: "foodWastageRaw",    fields: ["item", "amount", "source"]   },
      { key: "other",             fields: ["reason", "amount", "source"] },
    ];
    arrFields.forEach(({ key, fields }) => {
      exp[key].forEach((row, i) => {
        const base = (entry.expenses?.[key] || [])[i] || {};
        fields.forEach(f => {
          const p = expArrPath(key, i, f);
          const cur  = f === "amount" ? toNum(row[f]) : (row[f] || "");
          const prev = f === "amount" ? toNum(base[f]) : (base[f] || "");
          if (!isDisabled(p) && cur !== prev) updates.push({ path: p, value: cur });
        });
      });
    });

    return updates;
  };

  const handleSave = () => {
    if (me?.role === "OWNER") {
      putMutation.mutate(buildOwnerPayload());
    } else if (me?.role === "STAFF") {
      const updates = buildStaffUpdates();
      if (!updates.length) { alert("No approved changes to submit."); return; }
      staffPatchMutation.mutate(updates);
    } else {
      alert("Not authorized.");
    }
  };

  if (isLoading || !entry) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#A8A49C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      Loading…
    </div>
  );

  const revSplitNums = { cash: Number(revSplit.cash||0), federalBank: Number(revSplit.federalBank||0), vibgyorBank: Number(revSplit.vibgyorBank||0), asifAccount: Number(revSplit.asifAccount||0) };

  return (
    <div className="edit-wrap">
      <style>{CSS}</style>

      <div className="edit-inner">

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <p className="page-eyebrow">Edit Entry</p>
            <h1 className="page-title">
              {new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {me?.role === "STAFF" && (
              <span className="staff-badge">✏️ {approvedPaths.size} field{approvedPaths.size !== 1 ? "s" : ""} approved</span>
            )}
            <button onClick={() => navigate(-1)} className="btn-back"><FiChevronLeft size={15} /> Back</button>
          </div>
        </div>

        {/* ── Date ── */}
        <div className="section">
          <p className="section-title">Basic Info</p>
          <div className="grid2">
            <Field label="Date" type="date" value={date} onChange={setDate} disabled={isDisabled("date")} />
            <div className="auto-field">
              <label>Total Revenue</label>
              <div className="auto-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
              <div className="auto-hint">Auto-sum of all account inputs</div>
            </div>
          </div>
        </div>

        {/* ── Revenue Split ── */}
        <div className="section">
          <p className="section-title">Revenue — By Account</p>
          <div className="grid4">
            {ACCOUNTS.map(a => (
              <div key={a.key} style={{ background: "#FAFAF8", borderRadius: 10, padding: 12, border: "1px solid #ECEAE4" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>{a.label}</span>
                </div>
                <Field
                  type="number" prefix="₹"
                  value={revSplit[a.key]}
                  onChange={v => setRevSplit(p => ({ ...p, [a.key]: v }))}
                  disabled={isDisabled(splitPath(a.key))}
                />
              </div>
            ))}
          </div>
          <SplitBar split={revSplitNums} total={totalRevenue} />
        </div>

        {/* ── Purchase Cost ── */}
        <div className="section">
          <p className="section-title">Purchase Cost</p>
          {purchaseCost.map((p, i) => (
            <div key={i} className="row-flex" style={{ marginBottom: 10 }}>
              <Field label={i === 0 ? "Item" : ""} placeholder="Item name" value={p.item}
                onChange={v => { const a = [...purchaseCost]; a[i].item = v; setPurchaseCost(a); }}
                disabled={isDisabled(pcPath(i, "item"))} />
              <div className="field w-amount">
                {i === 0 && <label>Amount</label>}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ color: "#A8A49C", fontSize: 13 }}>₹</span>
                  <input type="number" value={p.amount ?? ""} onWheel={e => e.target.blur()}
                    onChange={e => { const a = [...purchaseCost]; a[i].amount = e.target.value; setPurchaseCost(a); }}
                    disabled={isDisabled(pcPath(i, "amount"))}
                    placeholder="0"
                    style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", opacity: isDisabled(pcPath(i,"amount")) ? .45 : 1 }} />
                </div>
              </div>
              {me?.role === "OWNER" && purchaseCost.length > 1 &&
                <button className="del-btn" onClick={() => setPurchaseCost(purchaseCost.filter((_, j) => j !== i))}><FiTrash2 size={14} /></button>}
            </div>
          ))}
          {me?.role === "OWNER" && (
            <button className="add-row-btn" onClick={() => setPurchaseCost([...purchaseCost, { item: "", amount: "" }])}><FiPlus size={13} /> Add item</button>
          )}
        </div>

        {/* ── Expenses ── */}
        <div className="section">
          <p className="section-title">Expenses</p>

          {/* Commission on Sales */}
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#C2410C", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Commission on Sales</p>
            <div className="row-flex">
              <Field label="Amount" type="number" prefix="₹"
                value={exp.commissionOnSales.amount}
                onChange={v => setSingle("commissionOnSales", "amount", v)}
                disabled={isDisabled(expSingSubPath("commissionOnSales", "amount"))} />
              <SourceSelect value={exp.commissionOnSales.source} onChange={v => setSingle("commissionOnSales", "source", v)}
                disabled={isDisabled(expSingSubPath("commissionOnSales", "source"))} />
            </div>
          </div>

          {/* Staff — readonly */}
          <div style={{ marginBottom: 18 }}>
            <p className="sub-title">Staff</p>
            <div className="grid2">
              <div className="staff-readonly">
                <div><div className="staff-label">Staff Salary</div><div className="staff-hint">From attendance</div></div>
                <div className="staff-val">₹{totalStaffSalary.toLocaleString()}</div>
              </div>
              <div className="staff-readonly">
                <div><div className="staff-label">Staff Accommodation</div><div className="staff-hint">From staff profiles</div></div>
                <div className="staff-val">₹{totalStaffAccommodation.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Single operation fields */}
          <div style={{ marginBottom: 18 }}>
            <p className="sub-title">Operations</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["foodRefreshment", "Food & Refreshment"],
                ["rent",            "Rent"],
                ["electricity",     "Electricity"],
                ["travelFuel",      "Travel & Fuel"],
                ["mobileInternet",  "Mobile & Internet"],
                ["maintenance",     "Maintenance"],
                ["incentive",       "Incentive"],
              ].map(([key, label]) => (
                <div key={key} className="row-flex">
                  <div className="field" style={{ flex: "0 0 160px" }}><label>{label}</label></div>
                  <Field type="number" prefix="₹" value={exp[key].amount}
                    onChange={v => setSingle(key, "amount", v)}
                    disabled={isDisabled(expSingSubPath(key, "amount"))} />
                  <SourceSelect value={exp[key].source} onChange={v => setSingle(key, "source", v)}
                    disabled={isDisabled(expSingSubPath(key, "source"))} />
                </div>
              ))}
            </div>
          </div>

          {/* Gas */}
          <div style={{ marginBottom: 18 }}>
            <p className="sub-title">Gas</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["gasStaff", "Gas — Staff"], ["gasStore", "Gas — Store"]].map(([key, label]) => (
                <div key={key} className="row-flex">
                  <div className="field" style={{ flex: "0 0 160px" }}><label>{label}</label></div>
                  <Field type="number" prefix="₹" value={exp[key].amount}
                    onChange={v => setSingle(key, "amount", v)}
                    disabled={isDisabled(expSingSubPath(key, "amount"))} />
                  <SourceSelect value={exp[key].source} onChange={v => setSingle(key, "source", v)}
                    disabled={isDisabled(expSingSubPath(key, "source"))} />
                </div>
              ))}
            </div>
          </div>

          {/* Marketing */}
          <div style={{ marginBottom: 18 }}>
            <p className="sub-title">Marketing</p>
            <div className="sub-box" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exp.marketing.map((m, i) => (
                <div key={i} className="row-flex">
                  <Field label={i === 0 ? "Remark" : ""} placeholder="Campaign / description" value={m.remark}
                    onChange={v => setArrRow("marketing", i, "remark", v)}
                    disabled={isDisabled(expArrPath("marketing", i, "remark"))} />
                  <div className="field w-amount">
                    {i === 0 && <label>Amount</label>}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ color: "#A8A49C", fontSize: 13 }}>₹</span>
                      <input type="number" value={m.amount ?? ""} onWheel={e => e.target.blur()}
                        onChange={e => setArrRow("marketing", i, "amount", e.target.value)}
                        disabled={isDisabled(expArrPath("marketing", i, "amount"))}
                        placeholder="0"
                        style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", opacity: isDisabled(expArrPath("marketing",i,"amount")) ? .45 : 1 }} />
                    </div>
                  </div>
                  <SourceSelect value={m.source} onChange={v => setArrRow("marketing", i, "source", v)}
                    disabled={isDisabled(expArrPath("marketing", i, "source"))} />
                  {me?.role === "OWNER" && exp.marketing.length > 1 &&
                    <button className="del-btn" onClick={() => delRow("marketing", i)}><FiTrash2 size={13} /></button>}
                </div>
              ))}
              {me?.role === "OWNER" && (
                <button className="add-row-btn" onClick={() => addRow("marketing", { remark: "", amount: "", source: "" })}><FiPlus size={13} /> Add marketing item</button>
              )}
            </div>
          </div>

          {/* Food Wastage */}
          <div style={{ marginBottom: 18 }}>
            <p className="sub-title">Food Wastage</p>
            <div className="grid2">
              {/* Cooked */}
              <div className="sub-box" style={{ background: "#FFF7ED", borderColor: "#FED7AA", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: ".08em" }}>Cooked Food</p>
                {exp.foodWastageCooked.map((f, i) => (
                  <div key={i} className="row-flex">
                    <Field label={i === 0 ? "Item" : ""} placeholder="Food item" value={f.item}
                      onChange={v => setArrRow("foodWastageCooked", i, "item", v)}
                      disabled={isDisabled(expArrPath("foodWastageCooked", i, "item"))} />
                    <div className="field w-amount">
                      {i === 0 && <label>Amount</label>}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ color: "#A8A49C", fontSize: 13 }}>₹</span>
                        <input type="number" value={f.amount ?? ""} onWheel={e => e.target.blur()}
                          onChange={e => setArrRow("foodWastageCooked", i, "amount", e.target.value)}
                          disabled={isDisabled(expArrPath("foodWastageCooked", i, "amount"))}
                          placeholder="0"
                          style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", opacity: isDisabled(expArrPath("foodWastageCooked",i,"amount")) ? .45 : 1 }} />
                      </div>
                    </div>
                    {me?.role === "OWNER" && exp.foodWastageCooked.length > 1 &&
                      <button className="del-btn" onClick={() => delRow("foodWastageCooked", i)}><FiTrash2 size={13} /></button>}
                  </div>
                ))}
                {me?.role === "OWNER" && (
                  <button className="add-row-btn" onClick={() => addRow("foodWastageCooked", { item: "", amount: "", source: "" })}><FiPlus size={13} /> Add item</button>
                )}
              </div>
              {/* Raw */}
              <div className="sub-box" style={{ background: "#F0FDF4", borderColor: "#BBF7D0", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: ".08em" }}>Raw Food</p>
                {exp.foodWastageRaw.map((f, i) => (
                  <div key={i} className="row-flex">
                    <Field label={i === 0 ? "Item" : ""} placeholder="Food item" value={f.item}
                      onChange={v => setArrRow("foodWastageRaw", i, "item", v)}
                      disabled={isDisabled(expArrPath("foodWastageRaw", i, "item"))} />
                    <div className="field w-amount">
                      {i === 0 && <label>Amount</label>}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ color: "#A8A49C", fontSize: 13 }}>₹</span>
                        <input type="number" value={f.amount ?? ""} onWheel={e => e.target.blur()}
                          onChange={e => setArrRow("foodWastageRaw", i, "amount", e.target.value)}
                          disabled={isDisabled(expArrPath("foodWastageRaw", i, "amount"))}
                          placeholder="0"
                          style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", opacity: isDisabled(expArrPath("foodWastageRaw",i,"amount")) ? .45 : 1 }} />
                      </div>
                    </div>
                    {me?.role === "OWNER" && exp.foodWastageRaw.length > 1 &&
                      <button className="del-btn" onClick={() => delRow("foodWastageRaw", i)}><FiTrash2 size={13} /></button>}
                  </div>
                ))}
                {me?.role === "OWNER" && (
                  <button className="add-row-btn" onClick={() => addRow("foodWastageRaw", { item: "", amount: "", source: "" })}><FiPlus size={13} /> Add item</button>
                )}
              </div>
            </div>
          </div>

          {/* Other */}
          <div>
            <p className="sub-title">Other</p>
            <div className="sub-box" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exp.other.map((o, i) => (
                <div key={i} className="row-flex">
                  <Field label={i === 0 ? "Reason" : ""} placeholder="Description" value={o.reason}
                    onChange={v => setArrRow("other", i, "reason", v)}
                    disabled={isDisabled(expArrPath("other", i, "reason"))} />
                  <div className="field w-amount">
                    {i === 0 && <label>Amount</label>}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ color: "#A8A49C", fontSize: 13 }}>₹</span>
                      <input type="number" value={o.amount ?? ""} onWheel={e => e.target.blur()}
                        onChange={e => setArrRow("other", i, "amount", e.target.value)}
                        disabled={isDisabled(expArrPath("other", i, "amount"))}
                        placeholder="0"
                        style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #E5E2DB", padding: "6px 0", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", opacity: isDisabled(expArrPath("other",i,"amount")) ? .45 : 1 }} />
                    </div>
                  </div>
                  <SourceSelect value={o.source} onChange={v => setArrRow("other", i, "source", v)}
                    disabled={isDisabled(expArrPath("other", i, "source"))} />
                  {me?.role === "OWNER" && exp.other.length > 1 &&
                    <button className="del-btn" onClick={() => delRow("other", i)}><FiTrash2 size={13} /></button>}
                </div>
              ))}
              {me?.role === "OWNER" && (
                <button className="add-row-btn" onClick={() => addRow("other", { reason: "", amount: "", source: "" })}><FiPlus size={13} /> Add other</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Credit ── */}
        <div className="section">
          <p className="section-title">Credit / Pending Settlement</p>
          <div className="credit-box">
            <div className="row-flex">
              <Field label="Credit Amount" type="number" prefix="₹" value={creditAmount}
                onChange={setCreditAmount} disabled={isDisabled("creditAmount")} />
            </div>
            {entry.settledAmount > 0 && (
              <p style={{ fontSize: 12, color: "#15803D", marginTop: 8 }}>
                ✓ ₹{Number(entry.settledAmount).toLocaleString("en-IN")} already settled
                · Outstanding: ₹{Math.max(0, (entry.creditAmount || 0) - (entry.settledAmount || 0)).toLocaleString("en-IN")}
              </p>
            )}
            <p className="credit-note">Update credit if the amount has changed. Settlements are recorded separately from the entry details page.</p>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="footer-bar">
        <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
        <button className="btn-save" onClick={handleSave}>
          <FiSave size={14} style={{ marginRight: 6 }} />
          Save Changes
        </button>
      </div>
    </div>
  );
}