// src/pages/EditEntry.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { FiChevronLeft, FiSave, FiPlus, FiTrash2, FiInfo } from "react-icons/fi";

const ACCOUNTS = [
  { key: "cash",        label: "Cash",         color: "#10b981" },
  { key: "federalBank", label: "Federal Bank", color: "#6366f1" },
  { key: "vibgyorBank", label: "Vibgyor Bank", color: "#f59e0b" },
  { key: "asifAccount", label: "Asif Account", color: "#f43f5e" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  .edit-wrap  { min-height: 100vh; background: #F7F6F3; font-family: 'Plus Jakarta Sans', sans-serif; }
  .edit-inner { max-width: 920px; margin: 0 auto; padding: 32px 24px 120px; }

  .page-eyebrow { font-size: 10px; color: #A8A49C; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 5px; font-family: 'DM Mono', monospace; }
  .page-title   { font-size: 26px; font-weight: 700; color: #0D0D0D; letter-spacing: -.03em; }

  .section       { background: #fff; border: 1px solid #ECEAE4; border-radius: 18px; padding: 22px; margin-bottom: 14px; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
  .section-title { font-size: 10px; font-weight: 600; color: #A8A49C; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 18px; }
  .sub-title     { font-size: 11px; font-weight: 600; color: #666; letter-spacing: .06em; text-transform: uppercase; margin: 14px 0 10px; }
  .sub-box       { background: #FAFAF8; border: 1px solid #ECEAE4; border-radius: 12px; padding: 14px; }

  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-size: 11px; font-weight: 500; color: #888; letter-spacing: .04em; }
  .field input, .field select {
    background: transparent; border: none; border-bottom: 1.5px solid #E5E2DB;
    padding: 6px 0; font-size: 13px; color: #0D0D0D; font-family: inherit;
    outline: none; transition: border-color .15s; width: 100%;
  }
  .field input:focus, .field select:focus { border-color: #0D0D0D; }
  .field input:disabled, .field select:disabled { opacity: .4; cursor: not-allowed; }
  .field input[type="number"]::-webkit-outer-spin-button,
  .field input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
  .field input::placeholder { color: #C8C4BB; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
  .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }

  .row-flex { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
  .row-flex .field { flex: 1; min-width: 80px; }
  .row-flex .field.w-amount { flex: 0 0 110px; }
  .row-flex .field.w-source { flex: 0 0 128px; }
  .row-flex .field.w-label  { flex: 0 0 155px; }

  .credit-toggle {
    display: flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600;
    cursor: pointer; border: 1.5px solid #E5E2DB; background: #fff;
    color: #A8A49C; font-family: inherit; white-space: nowrap;
    transition: all .15s; flex-shrink: 0; align-self: flex-end; margin-bottom: 2px;
  }
  .credit-toggle:hover:not(:disabled) { border-color: #f59e0b; color: #92400E; background: #FFFBEB; }
  .credit-toggle.is-credit { background: #FEF3C7; border-color: #FCD34D; color: #92400E; }
  .credit-toggle:disabled { opacity: .4; cursor: not-allowed; }

  .settled-wrap { display: flex; flex-direction: column; gap: 4px; flex: 0 0 100px; }
  .settled-wrap label { font-size: 11px; font-weight: 500; color: #15803D; letter-spacing: .04em; }
  .settled-wrap input { background: transparent; border: none; border-bottom: 1.5px solid #A7F3D0; padding: 6px 0; font-size: 13px; color: #15803D; font-family: 'DM Mono', monospace; outline: none; width: 100%; }
  .settled-wrap input:focus { border-color: #10b981; }
  .settled-wrap input:disabled { opacity: .4; cursor: not-allowed; }
  .settled-wrap input[type="number"]::-webkit-outer-spin-button,
  .settled-wrap input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }

  .del-btn { padding: 4px; color: #C8C4BB; cursor: pointer; background: none; border: none; transition: color .1s; flex-shrink: 0; align-self: flex-end; padding-bottom: 8px; }
  .del-btn:hover { color: #E11D48; }
  .add-row-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #A8A49C; font-weight: 500; cursor: pointer; background: none; border: none; font-family: inherit; padding: 4px 0; margin-top: 4px; transition: color .1s; }
  .add-row-btn:hover { color: #0D0D0D; }

  .split-bar { display: flex; border-radius: 6px; overflow: hidden; height: 6px; background: #ECEAE4; margin-top: 10px; }
  .split-labels { display: flex; gap: 14px; margin-top: 6px; flex-wrap: wrap; }
  .split-label  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #888; }

  .auto-field { display: flex; flex-direction: column; gap: 4px; }
  .auto-field label { font-size: 11px; font-weight: 500; color: #888; }
  .auto-value { font-size: 15px; font-weight: 700; color: #0D0D0D; font-family: 'DM Mono', monospace; border-bottom: 1.5px solid #ECEAE4; padding: 6px 0; }
  .auto-hint  { font-size: 10px; color: #B8B4AC; margin-top: 2px; }

  .staff-readonly { display: flex; justify-content: space-between; align-items: center; background: #F7F6F3; border-radius: 10px; padding: 12px 14px; }
  .staff-label { font-size: 12px; color: #888; }
  .staff-val   { font-size: 14px; font-weight: 600; color: #0D0D0D; font-family: 'DM Mono', monospace; }
  .staff-hint  { font-size: 10px; color: #B8B4AC; margin-top: 2px; }

  .staff-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; background: #FEF9EC; color: #92400E; border: 1px solid #FDE68A; border-radius: 8px; padding: 3px 10px; }

  .exp-credit-bar { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px 16px; margin-top: 18px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
  .exp-credit-chip .chip-label { font-size: 10px; font-weight: 600; color: #A8A49C; text-transform: uppercase; letter-spacing: .08em; display: block; margin-bottom: 2px; }
  .exp-credit-chip .chip-val   { font-size: 16px; font-weight: 700; font-family: 'DM Mono', monospace; }

  .footer-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #ECEAE4; padding: 14px 28px; display: flex; justify-content: flex-end; gap: 10px; z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,.06); }
  .btn-cancel { background: none; border: none; font-family: inherit; font-size: 13px; color: #888; cursor: pointer; padding: 9px 16px; border-radius: 10px; font-weight: 500; }
  .btn-cancel:hover { color: #0D0D0D; }
  .btn-save { background: #0D0D0D; color: #fff; border: none; border-radius: 12px; padding: 10px 26px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,.18); transition: background .1s, transform .1s; display: flex; align-items: center; gap: 6px; }
  .btn-save:hover { background: #222; transform: translateY(-1px); }
  .btn-back { display: flex; align-items: center; gap: 6px; background: none; border: none; color: #888; font-size: 13px; cursor: pointer; font-family: inherit; }
  .btn-back:hover { color: #0D0D0D; }
`;

// ── Helpers ───────────────────────────────────────────────────
const toNum = v => Number(v || 0);
const mkSingle  = (amount="", source="", isCredit=false, creditSettled="") => ({ amount, source, isCredit, creditSettled });
const mkRoyalty = (label="Royalty / Mgt. Fee", amount="", source="", isCredit=false, creditSettled="") => ({ label, amount, source, isCredit, creditSettled });
const mkMarketing = (remark="", amount="", source="", isCredit=false, creditSettled="") => ({ remark, amount, source, isCredit, creditSettled });
const mkFoodItem  = (item="", amount="") => ({ item, amount }); // no source/credit
const mkOther     = (reason="", amount="", source="", isCredit=false, creditSettled="") => ({ reason, amount, source, isCredit, creditSettled });
const mkPurchase  = (item="", amount="", source="", isCredit=false, creditSettled="") => ({ item, amount, source, isCredit, creditSettled });

const sumOutstanding = items =>
  (items || []).reduce((s, r) => {
    if (!r.isCredit) return s;
    return s + Math.max(0, toNum(r.amount) - toNum(r.creditSettled));
  }, 0);
const singleOutstanding = r => (!r?.isCredit ? 0 : Math.max(0, toNum(r.amount) - toNum(r.creditSettled)));

// ── Sub-components ────────────────────────────────────────────
function Field({ label, type="text", value, onChange, placeholder, prefix, disabled }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
        {prefix && <span style={{ color:"#A8A49C", fontSize:13 }}>{prefix}</span>}
        <input type={type} value={value ?? ""} placeholder={placeholder||(type==="number"?"0":"")}
          disabled={disabled} onChange={e => !disabled && onChange(e.target.value)}
          onWheel={e => type==="number" && e.target.blur()} />
      </div>
    </div>
  );
}

function SourceSelect({ value, onChange, label="From account", disabled }) {
  return (
    <div className="field w-source">
      {label && <label>{label}</label>}
      <select value={value||""} disabled={disabled} onChange={e => !disabled && onChange(e.target.value)}
        style={{ background:"transparent", border:"none", borderBottom:"1.5px solid #E5E2DB", padding:"6px 0", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", color:"#0D0D0D", opacity:disabled?.4:1 }}>
        <option value="">— account —</option>
        {ACCOUNTS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
    </div>
  );
}

function CreditToggle({ isCredit, onToggle, disabled }) {
  return (
    <button type="button" className={`credit-toggle${isCredit?" is-credit":""}`}
      onClick={() => !disabled && onToggle()} disabled={disabled}
      title={isCredit?"Marked as credit":"Mark as credit (not paid yet)"}>
      {isCredit ? "💳 Credit" : "+ Credit"}
    </button>
  );
}

function SettledInput({ value, onChange, disabled }) {
  return (
    <div className="settled-wrap">
      <label>Settled ₹</label>
      <input type="number" value={value} placeholder="0" disabled={disabled}
        onChange={e => !disabled && onChange(e.target.value)} onWheel={e => e.target.blur()} />
    </div>
  );
}

function CreditMini({ amount, settled }) {
  const out = Math.max(0, toNum(amount) - toNum(settled));
  if (!toNum(amount)) return null;
  return (
    <div style={{ marginTop:4, marginLeft:4, display:"flex", gap:12, fontSize:11 }}>
      <span style={{ color:"#92400E" }}>Credit: ₹{toNum(amount).toLocaleString("en-IN")}</span>
      <span style={{ color:"#15803D" }}>Settled: ₹{toNum(settled).toLocaleString("en-IN")}</span>
      <span style={{ color:out>0?"#ef4444":"#10b981", fontWeight:600 }}>Outstanding: ₹{out.toLocaleString("en-IN")}</span>
    </div>
  );
}

function SplitBar({ split, total }) {
  if (!total) return null;
  return (
    <>
      <div className="split-bar">
        {ACCOUNTS.map(a => { const pct=((split[a.key]||0)/total)*100; return pct>0?<div key={a.key} style={{ width:`${pct}%`,background:a.color }}/>:null; })}
      </div>
      <div className="split-labels">
        {ACCOUNTS.map(a => { if (!split[a.key]) return null; const pct=((split[a.key]/total)*100).toFixed(1);
          return <span key={a.key} className="split-label"><span style={{ width:8,height:8,borderRadius:"50%",background:a.color,display:"inline-block" }}/>{a.label}: {pct}%</span>; })}
      </div>
    </>
  );
}

// ── ExpRow: full row with source + credit toggle ──────────────
function ExpRow({ idx, row, onChange, onDelete, showDelete, labelField, labelPlaceholder, firstLabel, disabled }) {
  const dis = disabled || false;
  return (
    <div>
      <div className="row-flex">
        {labelField && (
          <Field label={idx===0?firstLabel:""} placeholder={labelPlaceholder}
            value={row[labelField]} onChange={v=>onChange(idx,labelField,v)} disabled={dis} />
        )}
        <div className="field w-amount">
          {idx===0 && <label>Amount</label>}
          <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
            <span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>
            <input type="number" value={row.amount??""} placeholder="0" disabled={dis}
              onChange={e=>onChange(idx,"amount",e.target.value)} onWheel={e=>e.target.blur()}
              style={{ background:"transparent", border:"none", borderBottom:"1.5px solid #E5E2DB", padding:"6px 0", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", opacity:dis?.4:1 }}/>
          </div>
        </div>
        <SourceSelect label={idx===0?"From account":""} value={row.source} onChange={v=>onChange(idx,"source",v)} disabled={dis}/>
        <CreditToggle isCredit={row.isCredit} onToggle={()=>onChange(idx,"isCredit",!row.isCredit)} disabled={dis}/>
        {row.isCredit && <SettledInput value={row.creditSettled} onChange={v=>onChange(idx,"creditSettled",v)} disabled={dis}/>}
        {showDelete && <button className="del-btn" onClick={()=>onDelete(idx)}><FiTrash2 size={14}/></button>}
      </div>
      {row.isCredit && <CreditMini amount={row.amount} settled={row.creditSettled}/>}
    </div>
  );
}

// ── SingleExpRow: named label + amount + source + credit ──────
function SingleExpRow({ label, expKey, row, onChangeSingle, disabled }) {
  const dis = disabled || false;
  return (
    <div>
      <div className="row-flex">
        <div className="field w-label"><label>{label}</label></div>
        <Field type="number" prefix="₹" value={row.amount} onChange={v=>onChangeSingle(expKey,"amount",v)} disabled={dis}/>
        <SourceSelect value={row.source} onChange={v=>onChangeSingle(expKey,"source",v)} disabled={dis}/>
        <CreditToggle isCredit={row.isCredit} onToggle={()=>onChangeSingle(expKey,"isCredit",!row.isCredit)} disabled={dis}/>
        {row.isCredit && <SettledInput value={row.creditSettled} onChange={v=>onChangeSingle(expKey,"creditSettled",v)} disabled={dis}/>}
      </div>
      {row.isCredit && <CreditMini amount={row.amount} settled={row.creditSettled}/>}
    </div>
  );
}

// ── FoodRow: item + amount only, no source/credit ─────────────
function FoodRow({ idx, row, onChange, onDelete, showDelete, disabled }) {
  return (
    <div className="row-flex">
      <Field label={idx===0?"Item":""} placeholder="Food item" value={row.item}
        onChange={v=>onChange(idx,"item",v)} disabled={disabled}/>
      <div className="field w-amount">
        {idx===0 && <label>Amount</label>}
        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
          <span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>
          <input type="number" value={row.amount??""} placeholder="0" disabled={disabled}
            onChange={e=>onChange(idx,"amount",e.target.value)} onWheel={e=>e.target.blur()}
            style={{ background:"transparent", border:"none", borderBottom:"1.5px solid #E5E2DB", padding:"6px 0", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", opacity:disabled?.4:1 }}/>
        </div>
      </div>
      {showDelete && <button className="del-btn" onClick={()=>onDelete(idx)}><FiTrash2 size={13}/></button>}
    </div>
  );
}

// ── Build payload item ────────────────────────────────────────
const buildItem = obj => ({
  amount:            toNum(obj.amount),
  source:            obj.source || "",
  isCredit:          !!obj.isCredit,
  creditSettled:     toNum(obj.creditSettled),
  creditOutstanding: obj.isCredit ? Math.max(0, toNum(obj.amount) - toNum(obj.creditSettled)) : 0,
});

// ── Main ──────────────────────────────────────────────────────
export default function EditEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey:["me"], queryFn: async () => (await client.get("/auth/me")).data.user });
  const { data: entry, isLoading } = useQuery({ queryKey:["entry",id], queryFn: async () => (await client.get(`/roi/${id}`)).data, enabled:!!id });
  const { data: approved = { requests:[] } } = useQuery({
    queryKey: ["approvedFields", id],
    queryFn: async () => (await client.get("/roi/edit-requests", { params:{ status:"APPROVED", entryId:id, mine:true, limit:200 } })).data,
    enabled: !!id && me?.role === "STAFF",
  });
  const { data: staff = [] } = useQuery({ queryKey:["staff"], queryFn: async () => (await client.get("/staff")).data });
  const { data: salarySummary } = useQuery({
    queryKey: ["salary-summary", entry?.date],
    queryFn: async () => (await client.get(`/attendance/salary-summary?date=${entry?.date?.split("T")[0]}`)).data,
    enabled: !!entry?.date,
  });

  const totalStaffSalary        = salarySummary?.totalSalary || 0;
  const totalStaffAccommodation = staff.reduce((s,m) => s+(m.accommodation||0), 0);

  const approvedPaths = useMemo(() => {
    const set = new Set();
    (approved?.requests||[]).forEach(r => { if (!r.consumed) set.add(r.fieldPath); });
    return set;
  }, [approved]);

  // ── Form state ────────────────────────────────────────────
  const [date, setDate]           = useState("");
  const [revSplit, setRevSplit]   = useState({ cash:"", federalBank:"", vibgyorBank:"", asifAccount:"" });
  const [purchaseCost, setPurchaseCost] = useState([mkPurchase()]);
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
    royaltyFees:       [mkRoyalty()],
    marketing:         [mkMarketing()],
    foodWastageCooked: [mkFoodItem()],
    foodWastageRaw:    [mkFoodItem()],
    other:             [mkOther()],
  });

  const totalRevenue = ACCOUNTS.reduce((s,a) => s+toNum(revSplit[a.key]), 0);

  // ── Pre-fill on load ──────────────────────────────────────
  useEffect(() => {
    if (!entry) return;
    setDate(entry.date?.split("T")[0] || "");

    const rs = entry.revenueSplit || {};
    setRevSplit({ cash:rs.cash??"", federalBank:rs.federalBank??"", vibgyorBank:rs.vibgyorBank??"", asifAccount:rs.asifAccount??"" });

    // Purchase cost — may have source+credit fields now
    setPurchaseCost(
      (entry.purchaseCost||[]).map(p => mkPurchase(p.item||"", p.amount??"", p.source||"", !!p.isCredit, p.creditSettled??""))
    );

    const ex = entry.expenses || {};
    const gs = (key) => mkSingle(ex[key]?.amount??"", ex[key]?.source||"", !!ex[key]?.isCredit, ex[key]?.creditSettled??"");
    const ga = (key, mk) => (ex[key]||[mk()]).map(r => ({ ...mk(), ...r }));

    setExp({
      commissionOnSales: gs("commissionOnSales"),
      foodRefreshment:   gs("foodRefreshment"),
      rent:              gs("rent"),
      electricity:       gs("electricity"),
      travelFuel:        gs("travelFuel"),
      mobileInternet:    gs("mobileInternet"),
      maintenance:       gs("maintenance"),
      incentive:         gs("incentive"),
      gasStaff:          gs("gasStaff"),
      gasStore:          gs("gasStore"),
      royaltyFees:       ga("royaltyFees",  mkRoyalty).map(r  => mkRoyalty(r.label||"Royalty / Mgt. Fee", r.amount??"", r.source||"", !!r.isCredit, r.creditSettled??"")),
      marketing:         ga("marketing",    mkMarketing).map(r => mkMarketing(r.remark||"", r.amount??"", r.source||"", !!r.isCredit, r.creditSettled??"")),
      foodWastageCooked: ga("foodWastageCooked", mkFoodItem).map(r => mkFoodItem(r.item||"", r.amount??"")),
      foodWastageRaw:    ga("foodWastageRaw",    mkFoodItem).map(r => mkFoodItem(r.item||"", r.amount??"")),
      other:             ga("other",        mkOther).map(r => mkOther(r.reason||"", r.amount??"", r.source||"", !!r.isCredit, r.creditSettled??"")),
    });
  }, [entry]);

  // ── Path helpers ──────────────────────────────────────────
  const pcPath        = (i,k)     => `purchaseCost[${i}].${k}`;
  const expSub        = (k,s)     => `expenses.${k}.${s}`;
  const expArr        = (f,i,k)   => `expenses.${f}[${i}].${k}`;
  const splitPath     = k         => `revenueSplit.${k}`;

  const isDisabled = path => {
    if (me?.role === "OWNER") return false;
    if (me?.role === "STAFF") return !approvedPaths.has(path);
    return true;
  };

  // ── State helpers ─────────────────────────────────────────
  const setSingle = (key,field,val) => setExp(p => ({ ...p,[key]:{ ...p[key],[field]:val } }));
  const setArrRow = (key,idx,field,val) => setExp(p => { const a=[...p[key]]; a[idx]={...a[idx],[field]:val}; return { ...p,[key]:a }; });
  const addRow    = (key,mk) => setExp(p => ({ ...p,[key]:[...p[key],mk()] }));
  const delRow    = (key,idx) => setExp(p => ({ ...p,[key]:p[key].filter((_,i)=>i!==idx) }));
  const setPF     = (idx,field,val) => { const a=[...purchaseCost]; a[idx]={...a[idx],[field]:val}; setPurchaseCost(a); };

  // ── Credit totals (for summary bar) ──────────────────────
  const singleKeys = ["commissionOnSales","foodRefreshment","rent","electricity","travelFuel","mobileInternet","maintenance","incentive","gasStaff","gasStore"];
  const totalExpCreditRaised =
    purchaseCost.filter(p=>p.isCredit).reduce((s,p)=>s+toNum(p.amount),0) +
    singleKeys.filter(k=>exp[k].isCredit).reduce((s,k)=>s+toNum(exp[k].amount),0) +
    [...exp.royaltyFees,...exp.marketing,...exp.other].filter(r=>r.isCredit).reduce((s,r)=>s+toNum(r.amount),0);
  const totalExpCreditOutstanding =
    sumOutstanding(purchaseCost) +
    singleKeys.reduce((s,k)=>s+singleOutstanding(exp[k]),0) +
    sumOutstanding(exp.royaltyFees) + sumOutstanding(exp.marketing) + sumOutstanding(exp.other);
  const totalExpSettled = totalExpCreditRaised - totalExpCreditOutstanding;

  // ── Mutations ─────────────────────────────────────────────
  const putMutation = useMutation({
    mutationFn: payload => client.put(`/roi/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries(["entry",id]); navigate(`/entries/${id}`); },
  });
  const staffPatchMutation = useMutation({
    mutationFn: updates => client.post(`/roi/${id}/staff-update`, { updates }),
    onSuccess: () => { qc.invalidateQueries(["entry",id]); navigate(`/entries/${id}`); },
  });

  // ── Build owner payload ───────────────────────────────────
  const buildOwnerPayload = () => ({
    date, totalRevenue,
    revenueSplit: { cash:toNum(revSplit.cash), federalBank:toNum(revSplit.federalBank), vibgyorBank:toNum(revSplit.vibgyorBank), asifAccount:toNum(revSplit.asifAccount) },
    purchaseCost: purchaseCost.map(p => ({ item:p.item, ...buildItem(p) })),
    totalExpCreditOutstanding,
    totalExpCreditRaised,
    totalExpSettled,
    expenses: {
      commissionOnSales:  buildItem(exp.commissionOnSales),
      staffSalary:        [{ item:"Total Staff Salary",        amount:totalStaffSalary,        source:"", isCredit:false, creditSettled:0, creditOutstanding:0 }],
      staffAccommodation: [{ item:"Total Staff Accommodation", amount:totalStaffAccommodation, source:"", isCredit:false, creditSettled:0, creditOutstanding:0 }],
      foodRefreshment:    buildItem(exp.foodRefreshment),
      rent:               buildItem(exp.rent),
      electricity:        buildItem(exp.electricity),
      travelFuel:         buildItem(exp.travelFuel),
      mobileInternet:     buildItem(exp.mobileInternet),
      maintenance:        buildItem(exp.maintenance),
      incentive:          buildItem(exp.incentive),
      gasStaff:           buildItem(exp.gasStaff),
      gasStore:           buildItem(exp.gasStore),
      royaltyFees:        exp.royaltyFees.map(r => ({ label:r.label||"Royalty/Mgt.Fee", ...buildItem(r) })),
      marketing:          exp.marketing.map(m => ({ remark:m.remark, ...buildItem(m) })),
      foodWastageCooked:  exp.foodWastageCooked.map(f => ({ item:f.item, amount:toNum(f.amount) })),
      foodWastageRaw:     exp.foodWastageRaw.map(f => ({ item:f.item, amount:toNum(f.amount) })),
      other:              exp.other.map(o => ({ reason:o.reason, ...buildItem(o) })),
    },
  });

  // ── Build staff updates ───────────────────────────────────
  const buildStaffUpdates = () => {
    const updates = [];
    if (!entry) return updates;

    ACCOUNTS.forEach(a => {
      const path = splitPath(a.key);
      if (!isDisabled(path) && toNum(revSplit[a.key]) !== toNum((entry.revenueSplit||{})[a.key]))
        updates.push({ path, value: toNum(revSplit[a.key]) });
    });
    if (!isDisabled("date") && date !== (entry.date?.split("T")[0]||""))
      updates.push({ path:"date", value:date });

    purchaseCost.forEach((p,i) => {
      const base = entry.purchaseCost?.[i]||{};
      [["item","item"],["amount","amount"],["source","source"]].forEach(([f,_]) => {
        const path = pcPath(i,f); const cur = f==="amount"?toNum(p[f]):(p[f]||""); const prev = f==="amount"?toNum(base[f]):(base[f]||"");
        if (!isDisabled(path) && cur!==prev) updates.push({ path, value:cur });
      });
    });

    singleKeys.forEach(key => {
      const prev = entry.expenses?.[key]||{};
      [["amount",toNum],["source",v=>v||""],["isCredit",v=>!!v],["creditSettled",toNum]].forEach(([f,cast]) => {
        const path = expSub(key,f); const cur=cast(exp[key][f]); const p=cast(prev[f]);
        if (!isDisabled(path) && cur!==p) updates.push({ path, value:cur });
      });
    });

    [{ key:"royaltyFees", fields:["label","amount","source","isCredit","creditSettled"] },
     { key:"marketing",   fields:["remark","amount","source","isCredit","creditSettled"] },
     { key:"other",       fields:["reason","amount","source","isCredit","creditSettled"] },
     { key:"foodWastageCooked", fields:["item","amount"] },
     { key:"foodWastageRaw",    fields:["item","amount"] },
    ].forEach(({ key, fields }) => {
      exp[key].forEach((row,i) => {
        const base=(entry.expenses?.[key]||[])[i]||{};
        fields.forEach(f => {
          const path=expArr(key,i,f);
          const cur=f==="amount"||f==="creditSettled"?toNum(row[f]):f==="isCredit"?!!row[f]:(row[f]||"");
          const prev=f==="amount"||f==="creditSettled"?toNum(base[f]):f==="isCredit"?!!base[f]:(base[f]||"");
          if (!isDisabled(path) && cur!==prev) updates.push({ path, value:cur });
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
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#A8A49C", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading…</div>
  );

  const isOwner = me?.role === "OWNER";
  const revNums = { cash:toNum(revSplit.cash), federalBank:toNum(revSplit.federalBank), vibgyorBank:toNum(revSplit.vibgyorBank), asifAccount:toNum(revSplit.asifAccount) };

  return (
    <div className="edit-wrap">
      <style>{CSS}</style>
      <div className="edit-inner">

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
          <div>
            <p className="page-eyebrow">Edit Entry</p>
            <h1 className="page-title">{new Date(entry.date).toLocaleDateString("en-IN",{ day:"2-digit", month:"long", year:"numeric" })}</h1>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
            {me?.role==="STAFF" && <span className="staff-badge">✏️ {approvedPaths.size} field{approvedPaths.size!==1?"s":""} approved</span>}
            <button onClick={()=>navigate(-1)} className="btn-back"><FiChevronLeft size={15}/> Back</button>
          </div>
        </div>

        {/* Date + Revenue */}
        <div className="section">
          <p className="section-title">Basic Info</p>
          <div className="grid2">
            <Field label="Date" type="date" value={date} onChange={setDate} disabled={isDisabled("date")}/>
            <div className="auto-field">
              <label>Total Revenue</label>
              <div className="auto-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
              <div className="auto-hint">Auto-sum of account inputs</div>
            </div>
          </div>
        </div>

        {/* Revenue Split */}
        <div className="section">
          <p className="section-title">Revenue — By Account</p>
          <div className="grid4">
            {ACCOUNTS.map(a => (
              <div key={a.key} style={{ background:"#FAFAF8", borderRadius:10, padding:12, border:"1px solid #ECEAE4" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                  <span style={{ width:8,height:8,borderRadius:"50%",background:a.color,display:"inline-block" }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{a.label}</span>
                </div>
                <Field type="number" prefix="₹" value={revSplit[a.key]}
                  onChange={v=>setRevSplit(p=>({ ...p,[a.key]:v }))}
                  disabled={isDisabled(splitPath(a.key))}/>
              </div>
            ))}
          </div>
          <SplitBar split={revNums} total={totalRevenue}/>
        </div>

        {/* Purchase Cost — with source + credit */}
        <div className="section">
          <p className="section-title">Purchase Cost</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {purchaseCost.map((p,i) => (
              <ExpRow key={i} idx={i} row={p}
                onChange={(idx,field,val)=>setPF(idx,field,val)}
                onDelete={idx=>setPurchaseCost(purchaseCost.filter((_,j)=>j!==idx))}
                showDelete={isOwner && purchaseCost.length>1}
                labelField="item" labelPlaceholder="Item name" firstLabel="Item"
                disabled={isDisabled(pcPath(i,"amount"))}
              />
            ))}
          </div>
          {isOwner && (
            <button className="add-row-btn" style={{ marginTop:10 }} onClick={()=>setPurchaseCost([...purchaseCost,mkPurchase()])}><FiPlus size={13}/> Add item</button>
          )}
        </div>

        {/* Expenses */}
        <div className="section">
          <p className="section-title">Expenses</p>

          <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:10, padding:"10px 14px", marginBottom:18, display:"flex", gap:8, fontSize:11, color:"#0369A1" }}>
            <FiInfo size={13} style={{ flexShrink:0, marginTop:1 }}/>
            <span>Tap <b>+ Credit</b> on any expense to mark it as unpaid. Enter <b>Settled</b> if partially paid.</span>
          </div>

          {/* Commission */}
          <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:12, padding:14, marginBottom:18 }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#C2410C", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>Commission on Sales</p>
            <SingleExpRow label="Amount" expKey="commissionOnSales" row={exp.commissionOnSales} onChangeSingle={setSingle}
              disabled={isDisabled(expSub("commissionOnSales","amount"))}/>
          </div>

          {/* Royalty Fees */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Royalty / Management Fees</p>
            <div className="sub-box" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {exp.royaltyFees.map((r,i) => (
                <ExpRow key={i} idx={i} row={r}
                  onChange={(idx,field,val)=>setArrRow("royaltyFees",idx,field,val)}
                  onDelete={idx=>delRow("royaltyFees",idx)}
                  showDelete={isOwner && exp.royaltyFees.length>1}
                  labelField="label" labelPlaceholder="e.g. Royalty / Mgt. Fee" firstLabel="Fee Label"
                  disabled={isDisabled(expArr("royaltyFees",i,"amount"))}
                />
              ))}
              {isOwner && <button className="add-row-btn" onClick={()=>addRow("royaltyFees",mkRoyalty)}><FiPlus size={13}/> Add royalty fee</button>}
            </div>
          </div>

          {/* Staff readonly */}
          <div style={{ marginBottom:18 }}>
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

          {/* Operations */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Operations</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["foodRefreshment","Food & Refreshment"],["rent","Rent"],["electricity","Electricity"],["travelFuel","Travel & Fuel"],["mobileInternet","Mobile & Internet"],["maintenance","Maintenance"],["incentive","Incentive"]].map(([key,label]) => (
                <SingleExpRow key={key} label={label} expKey={key} row={exp[key]} onChangeSingle={setSingle}
                  disabled={isDisabled(expSub(key,"amount"))}/>
              ))}
            </div>
          </div>

          {/* Gas */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Gas</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["gasStaff","Gas — Staff"],["gasStore","Gas — Store"]].map(([key,label]) => (
                <SingleExpRow key={key} label={label} expKey={key} row={exp[key]} onChangeSingle={setSingle}
                  disabled={isDisabled(expSub(key,"amount"))}/>
              ))}
            </div>
          </div>

          {/* Marketing */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Marketing</p>
            <div className="sub-box" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {exp.marketing.map((m,i) => (
                <ExpRow key={i} idx={i} row={m}
                  onChange={(idx,field,val)=>setArrRow("marketing",idx,field,val)}
                  onDelete={idx=>delRow("marketing",idx)}
                  showDelete={isOwner && exp.marketing.length>1}
                  labelField="remark" labelPlaceholder="Campaign / description" firstLabel="Remark"
                  disabled={isDisabled(expArr("marketing",i,"amount"))}
                />
              ))}
              {isOwner && <button className="add-row-btn" onClick={()=>addRow("marketing",mkMarketing)}><FiPlus size={13}/> Add item</button>}
            </div>
          </div>

          {/* Food Wastage — simple, no source/credit */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Food Wastage</p>
            <div className="grid2">
              {[["foodWastageCooked","Cooked Food","#FFF7ED","#FED7AA","#EA580C"],["foodWastageRaw","Raw Food","#F0FDF4","#BBF7D0","#15803D"]].map(([key,title,bg,border,color]) => (
                <div key={key} className="sub-box" style={{ background:bg, borderColor:border, display:"flex", flexDirection:"column", gap:10 }}>
                  <p style={{ fontSize:10, fontWeight:700, color, textTransform:"uppercase", letterSpacing:".08em" }}>{title}</p>
                  {exp[key].map((f,i) => (
                    <FoodRow key={i} idx={i} row={f}
                      onChange={(idx,field,val)=>setArrRow(key,idx,field,val)}
                      onDelete={idx=>delRow(key,idx)}
                      showDelete={isOwner && exp[key].length>1}
                      disabled={isDisabled(expArr(key,i,"amount"))}
                    />
                  ))}
                  {isOwner && <button className="add-row-btn" onClick={()=>addRow(key,mkFoodItem)}><FiPlus size={13}/> Add item</button>}
                </div>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <p className="sub-title">Other</p>
            <div className="sub-box" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {exp.other.map((o,i) => (
                <ExpRow key={i} idx={i} row={o}
                  onChange={(idx,field,val)=>setArrRow("other",idx,field,val)}
                  onDelete={idx=>delRow("other",idx)}
                  showDelete={isOwner && exp.other.length>1}
                  labelField="reason" labelPlaceholder="Description" firstLabel="Reason"
                  disabled={isDisabled(expArr("other",i,"amount"))}
                />
              ))}
              {isOwner && <button className="add-row-btn" onClick={()=>addRow("other",mkOther)}><FiPlus size={13}/> Add other</button>}
            </div>
          </div>

          {/* Expense Credit Summary */}
          {totalExpCreditRaised > 0 && (
            <div className="exp-credit-bar">
              <div style={{ fontSize:11, fontWeight:700, color:"#92400E", marginRight:8 }}>💳 Expense Credit Summary</div>
              <div className="exp-credit-chip">
                <span className="chip-label">Total Credit</span>
                <span className="chip-val" style={{ color:"#f59e0b" }}>₹{totalExpCreditRaised.toLocaleString("en-IN")}</span>
              </div>
              <div className="exp-credit-chip">
                <span className="chip-label">Settled</span>
                <span className="chip-val" style={{ color:"#10b981" }}>₹{totalExpSettled.toLocaleString("en-IN")}</span>
              </div>
              <div className="exp-credit-chip">
                <span className="chip-label">Outstanding</span>
                <span className="chip-val" style={{ color:totalExpCreditOutstanding>0?"#ef4444":"#10b981" }}>₹{totalExpCreditOutstanding.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="footer-bar">
        <button className="btn-cancel" onClick={()=>navigate(-1)}>Cancel</button>
        <button className="btn-save" onClick={handleSave} disabled={putMutation.isPending||staffPatchMutation.isPending}>
          <FiSave size={14}/> {putMutation.isPending||staffPatchMutation.isPending?"Saving…":"Save Changes"}
        </button>
      </div>
    </div>
  );
}