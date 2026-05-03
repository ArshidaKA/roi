// src/pages/AddEntry.jsx
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiChevronLeft, FiInfo } from "react-icons/fi";
import client from "../api/client";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// ── Constants ─────────────────────────────────────────────────
const ACCOUNTS = [
  { key: "cash",        label: "Cash",         color: "#10b981" },
  { key: "federalBank", label: "Federal Bank", color: "#6366f1" },
  { key: "vibgyorBank", label: "Vibgyor Bank", color: "#f59e0b" },
  { key: "asifAccount", label: "Asif Account", color: "#f43f5e" },
];

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing:border-box; }
  body { font-family:'Plus Jakarta Sans',sans-serif; }
  .add-wrap  { min-height:100vh; background:#F7F6F3; font-family:'Plus Jakarta Sans',sans-serif; }
  .add-inner { max-width:860px; margin:0 auto; padding:32px 24px 120px; }

  .page-eyebrow { font-size:10px; color:#A8A49C; letter-spacing:.14em; text-transform:uppercase; margin-bottom:5px; font-family:'DM Mono',monospace; }
  .page-title   { font-size:26px; font-weight:700; color:#0D0D0D; letter-spacing:-.03em; margin-bottom:28px; }

  .section       { background:#fff; border:1px solid #ECEAE4; border-radius:18px; padding:22px; margin-bottom:14px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
  .section-title { font-size:10px; font-weight:600; color:#A8A49C; letter-spacing:.14em; text-transform:uppercase; margin-bottom:18px; }
  .sub-title     { font-size:11px; font-weight:600; color:#666; letter-spacing:.06em; text-transform:uppercase; margin:14px 0 10px; }
  .sub-box       { background:#FAFAF8; border:1px solid #ECEAE4; border-radius:12px; padding:14px; }

  .field { display:flex; flex-direction:column; gap:4px; }
  .field label { font-size:11px; font-weight:500; color:#888; letter-spacing:.04em; }
  .field input, .field select { background:transparent; border:none; border-bottom:1.5px solid #E5E2DB; padding:6px 0; font-size:13px; color:#0D0D0D; font-family:inherit; outline:none; transition:border-color .15s; width:100%; }
  .field input:focus, .field select:focus { border-color:#0D0D0D; }
  .field input[type="number"]::-webkit-outer-spin-button,
  .field input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; }
  .field input::placeholder { color:#C8C4BB; }

  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
  .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }

  .row-flex { display:flex; align-items:flex-end; gap:10px; }
  .row-flex .field { flex:1; }
  .row-flex .field.w-source { flex:0 0 130px; }
  .row-flex .field.w-amount { flex:0 0 120px; }
  .row-flex .field.w-label  { flex:0 0 160px; }

  .del-btn { padding:4px; color:#C8C4BB; cursor:pointer; background:none; border:none; transition:color .1s; flex-shrink:0; align-self:flex-end; padding-bottom:8px; }
  .del-btn:hover { color:#E11D48; }
  .add-row-btn { display:flex; align-items:center; gap:5px; font-size:12px; color:#A8A49C; font-weight:500; cursor:pointer; background:none; border:none; font-family:inherit; padding:4px 0; margin-top:4px; transition:color .1s; }
  .add-row-btn:hover { color:#0D0D0D; }

  .split-bar { display:flex; border-radius:6px; overflow:hidden; height:6px; background:#ECEAE4; margin-top:10px; }
  .split-labels { display:flex; gap:14px; margin-top:6px; flex-wrap:wrap; }
  .split-label { display:flex; align-items:center; gap:5px; font-size:11px; color:#888; }

  .auto-field { display:flex; flex-direction:column; gap:4px; }
  .auto-field label { font-size:11px; font-weight:500; color:#888; }
  .auto-value { font-size:15px; font-weight:700; color:#0D0D0D; font-family:'DM Mono',monospace; border-bottom:1.5px solid #ECEAE4; padding:6px 0; }
  .auto-hint  { font-size:10px; color:#B8B4AC; margin-top:2px; }

  .staff-readonly { display:flex; justify-content:space-between; align-items:center; background:#F7F6F3; border-radius:10px; padding:12px 14px; }
  .staff-label { font-size:12px; color:#888; }
  .staff-val   { font-size:14px; font-weight:600; color:#0D0D0D; font-family:'DM Mono',monospace; }
  .staff-hint  { font-size:10px; color:#B8B4AC; margin-top:2px; }

  .footer-bar { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid #ECEAE4; padding:14px 28px; display:flex; justify-content:flex-end; gap:10px; z-index:50; box-shadow:0 -4px 20px rgba(0,0,0,.06); }
  .btn-cancel { background:none; border:none; font-family:inherit; font-size:13px; color:#888; cursor:pointer; padding:9px 16px; border-radius:10px; font-weight:500; }
  .btn-cancel:hover { color:#0D0D0D; }
  .btn-save { background:#0D0D0D; color:#fff; border:none; border-radius:12px; padding:10px 26px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,.18); transition:background .1s,transform .1s; }
  .btn-save:hover { background:#222; transform:translateY(-1px); }
  .btn-save:active { transform:scale(.98); }
  .btn-save:disabled { opacity:.5; cursor:not-allowed; transform:none; }

  .credit-box { background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:18px; }
  .credit-note { font-size:11px; color:#92400E; margin-top:10px; line-height:1.6; display:flex; gap:6px; }

  .credit-cards { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:14px; }
  .cc-card { background:#fff; border:1px solid #ECEAE4; border-radius:10px; padding:12px; text-align:center; }
  .cc-label { font-size:10px; font-weight:600; color:#A8A49C; text-transform:uppercase; letter-spacing:.08em; margin-bottom:5px; }
  .cc-val   { font-size:16px; font-weight:700; font-family:'DM Mono',monospace; }
`;

// ── Sub-components ────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, prefix }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
        {prefix && <span style={{ color:"#A8A49C", fontSize:13 }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder || (type==="number"?"0":"")}
          onWheel={e => type==="number" && e.target.blur()} />
      </div>
    </div>
  );
}

function SourceSelect({ value, onChange, label="From account" }) {
  return (
    <div className="field w-source">
      {label && <label>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background:"transparent", border:"none", borderBottom:"1.5px solid #E5E2DB", padding:"6px 0", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", color:"#0D0D0D" }}>
        <option value="">— account —</option>
        {ACCOUNTS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
    </div>
  );
}

function SplitBar({ split, total }) {
  if (!total) return null;
  return (
    <>
      <div className="split-bar">
        {ACCOUNTS.map(a => { const pct=((split[a.key]||0)/total)*100; return pct>0?<div key={a.key} style={{ width:`${pct}%`, background:a.color, transition:"width .3s" }}/>:null; })}
      </div>
      <div className="split-labels">
        {ACCOUNTS.map(a => {
          if (!split[a.key]) return null;
          const pct = ((split[a.key]/total)*100).toFixed(1);
          return <span key={a.key} className="split-label"><span style={{ width:8,height:8,borderRadius:"50%",background:a.color,display:"inline-block" }}/>{a.label}: {pct}%</span>;
        })}
      </div>
    </>
  );
}

const mkSingle   = () => ({ amount:"", source:"" });
const mkMarketing= () => ({ remark:"", amount:"", source:"" });
const mkFoodItem = () => ({ item:"", amount:"", source:"" });
const mkOther    = () => ({ reason:"", amount:"", source:"" });
const mkPurchase = () => ({ item:"", amount:"", source:"" });
const mkRoyalty  = () => ({ label:"Royalty / Mgt. Fee", amount:"", source:"" });

// ── Main ──────────────────────────────────────────────────────
export default function AddEntry() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const navigate = useNavigate();

  const { data: entries = [] } = useQuery({ queryKey:["entries"], queryFn: async () => (await client.get("/roi")).data });
  const { data: staff = [] }   = useQuery({ queryKey:["staff"],   queryFn: async () => (await client.get("/staff")).data });
  const { data: salarySummary } = useQuery({
    queryKey: ["salary-summary", date],
    queryFn: async () => (await client.get(`/attendance/salary-summary?date=${date}`)).data,
    enabled: !!date,
  });
  // Staff advances — to calculate credit (remaining salary)
  const { data: advances = [] } = useQuery({
    queryKey: ["staff-advances"],
    queryFn: async () => (await client.get("/staff/advances")).data,
  });

  // Revenue split
  const [revSplit, setRevSplit] = useState({ cash:"", federalBank:"", vibgyorBank:"", asifAccount:"" });
  const totalRevenue = ACCOUNTS.reduce((s, a) => s + Number(revSplit[a.key] || 0), 0);

  // Purchase cost
  const [purchaseCost, setPurchaseCost] = useState([mkPurchase()]);
  const totalPurchase = purchaseCost.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Staff salary from credit (earned − advance outstanding)
  const totalStaffSalaryFromAttendance = salarySummary?.totalSalary || 0;
  const totalStaffAccommodation        = staff.reduce((s, m) => s + (m.accommodation || 0), 0);

  // Staff salary to use = credit due per staff (earned - advance outstanding)
  // We use salary from attendance but note the advance outstanding deduction
  const totalAdvanceOutstanding = advances.reduce((s, a) => s + (a.outstanding || 0), 0);
  // Credit due = what we still owe staff = earned - advance outstanding
  const staffCreditDue = Math.max(0, totalStaffSalaryFromAttendance - totalAdvanceOutstanding);

  // Revenue credit/settled
  // CREDIT = revenue amount NOT collected today (customer owes us)
  // SETTLED = how much of that credit was actually collected/given today
  const [creditAmount,  setCreditAmount]  = useState(""); // amount customer hasn't paid yet
  const [settledAmount, setSettledAmount] = useState(""); // amount collected from credit today

  const creditNum  = Number(creditAmount  || 0);
  const settledNum = Number(settledAmount || 0);
  // Can't settle more than credit
  const validSettled   = Math.min(settledNum, creditNum);
  const outstanding    = creditNum - validSettled;

  // Expenses
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

  const setSingle = (key, field, val) => setExp(p => ({ ...p, [key]:{ ...p[key],[field]:val } }));
  const setArrRow = (key, idx, field, val) => setExp(p => { const a=[...p[key]]; a[idx]={...a[idx],[field]:val}; return { ...p,[key]:a }; });
  const addRow    = (key, mk) => setExp(p => ({ ...p,[key]:[...p[key],mk()] }));
  const delRow    = (key, idx) => setExp(p => ({ ...p,[key]:p[key].filter((_,i)=>i!==idx) }));

  const setPF = (idx, field, val) => { const a=[...purchaseCost]; a[idx]={...a[idx],[field]:val}; setPurchaseCost(a); };

  const mutation = useMutation({
    mutationFn: payload => client.post("/roi", payload),
    onSuccess: () => MySwal.fire({ icon:"success", title:"Entry saved!", confirmButtonColor:"#0D0D0D" }).then(() => navigate("/dashboard")),
  });

  const handleSubmit = () => {
    if (entries.some(e => e.date?.split("T")[0] === date)) {
      MySwal.fire({ icon:"error", title:"Duplicate Entry", text:"An entry for this date already exists.", confirmButtonColor:"#0D0D0D" }); return;
    }
    if (totalRevenue === 0) {
      MySwal.fire({ icon:"warning", title:"No Revenue", text:"Enter at least one revenue amount.", confirmButtonColor:"#0D0D0D" }); return;
    }
    const toNum = v => Number(v || 0);
    const buildSingle = obj => ({ amount:toNum(obj.amount), source:obj.source||"" });

    MySwal.fire({
      title: "Save Entry?",
      html: `<b>Date:</b> ${date}<br/><b>Revenue:</b> ₹${totalRevenue.toLocaleString("en-IN")}${creditNum>0?`<br/><b>Credit (uncollected):</b> ₹${creditNum.toLocaleString()}<br/><b>Settled today:</b> ₹${validSettled.toLocaleString()}<br/><b>Outstanding:</b> ₹${outstanding.toLocaleString()}`:""}`,
      icon:"question", showCancelButton:true, confirmButtonText:"Save",
      confirmButtonColor:"#0D0D0D", cancelButtonColor:"#E5E2DB",
    }).then(r => {
      if (!r.isConfirmed) return;
      mutation.mutate({
        date, totalRevenue,
        revenueSplit: { cash:toNum(revSplit.cash), federalBank:toNum(revSplit.federalBank), vibgyorBank:toNum(revSplit.vibgyorBank), asifAccount:toNum(revSplit.asifAccount) },
        purchaseCost: purchaseCost.map(p => ({ item:p.item, amount:toNum(p.amount), source:p.source||"" })),
        creditAmount:  creditNum,
        settledAmount: validSettled,
        settlements: validSettled > 0 ? [{ amount:validSettled, account:"", date:new Date(), note:"Collected on entry date" }] : [],
        expenses: {
          commissionOnSales:  buildSingle(exp.commissionOnSales),
          staffSalary:        [{ item:"Total Staff Salary",        amount:staffCreditDue,           source:"" }],
          staffAccommodation: [{ item:"Total Staff Accommodation", amount:totalStaffAccommodation,  source:"" }],
          foodRefreshment:    buildSingle(exp.foodRefreshment),
          rent:               buildSingle(exp.rent),
          electricity:        buildSingle(exp.electricity),
          travelFuel:         buildSingle(exp.travelFuel),
          mobileInternet:     buildSingle(exp.mobileInternet),
          maintenance:        buildSingle(exp.maintenance),
          incentive:          buildSingle(exp.incentive),
          gasStaff:           buildSingle(exp.gasStaff),
          gasStore:           buildSingle(exp.gasStore),
          royaltyFees:        exp.royaltyFees.map(r => ({ label:r.label||"Royalty/Mgt.Fee", amount:toNum(r.amount), source:r.source||"" })),
          marketing:          exp.marketing.map(m => ({ remark:m.remark, amount:toNum(m.amount), source:m.source||"" })),
          foodWastageCooked:  exp.foodWastageCooked.map(f => ({ item:f.item, amount:toNum(f.amount), source:f.source||"" })),
          foodWastageRaw:     exp.foodWastageRaw.map(f => ({ item:f.item, amount:toNum(f.amount), source:f.source||"" })),
          other:              exp.other.map(o => ({ reason:o.reason, amount:toNum(o.amount), source:o.source||"" })),
        },
      });
    });
  };

  const inlineInput = (value, onChange, placeholder="0") => (
    <input type="number" value={value} onWheel={e=>e.target.blur()} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ background:"transparent", border:"none", borderBottom:"1.5px solid #E5E2DB", padding:"6px 0", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" }}/>
  );

  return (
    <div className="add-wrap">
      <style>{CSS}</style>
      <div className="add-inner">

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p className="page-eyebrow">New Entry</p>
            <h1 className="page-title">Add ROI Entry</h1>
          </div>
          <button onClick={() => navigate(-1)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#888", fontSize:13, cursor:"pointer", fontFamily:"inherit", marginTop:8 }}>
            <FiChevronLeft size={15}/> Back
          </button>
        </div>

        {/* ── Date ── */}
        <div className="section">
          <p className="section-title">Basic Info</p>
          <div className="grid2">
            <Field label="Date" type="date" value={date} onChange={setDate} />
            <div className="auto-field">
              <label>Total Revenue</label>
              <div className="auto-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
              <div className="auto-hint">Auto-sum of account inputs below</div>
            </div>
          </div>
        </div>

        {/* ── Revenue Split ── */}
        <div className="section">
          <p className="section-title">Revenue — By Account</p>
          <div className="grid4">
            {ACCOUNTS.map(a => (
              <div key={a.key} style={{ background:"#FAFAF8", borderRadius:10, padding:12, border:"1px solid #ECEAE4" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                  <span style={{ width:8,height:8,borderRadius:"50%",background:a.color,display:"inline-block" }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:"#666" }}>{a.label}</span>
                </div>
                <Field type="number" prefix="₹" value={revSplit[a.key]} onChange={v => setRevSplit(p => ({ ...p,[a.key]:v }))}/>
              </div>
            ))}
          </div>
          <SplitBar split={{ cash:Number(revSplit.cash||0), federalBank:Number(revSplit.federalBank||0), vibgyorBank:Number(revSplit.vibgyorBank||0), asifAccount:Number(revSplit.asifAccount||0) }} total={totalRevenue}/>
        </div>

        {/* ── Revenue Credit & Settlement ── */}
        <div className="section">
          <p className="section-title">Revenue Credit & Settlement</p>
          <div className="credit-box">
            <div className="grid2">
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"#92400E", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>💳 Credit Amount</div>
                <div style={{ fontSize:11, color:"#92400E", marginBottom:10 }}>Revenue NOT collected today (customer owes you)</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>
                  {inlineInput(creditAmount, setCreditAmount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"#15803D", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>✓ Settled Today</div>
                <div style={{ fontSize:11, color:"#15803D", marginBottom:10 }}>Amount actually collected / given today</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>
                  {inlineInput(settledAmount, setSettledAmount)}
                </div>
              </div>
            </div>
            {creditNum > 0 && (
              <div className="credit-cards">
                <div className="cc-card">
                  <div className="cc-label">Credit Raised</div>
                  <div className="cc-val" style={{ color:"#f59e0b" }}>₹{creditNum.toLocaleString("en-IN")}</div>
                </div>
                <div className="cc-card">
                  <div className="cc-label">Settled Today</div>
                  <div className="cc-val" style={{ color:"#10b981" }}>₹{validSettled.toLocaleString("en-IN")}</div>
                </div>
                <div className="cc-card">
                  <div className="cc-label">Outstanding</div>
                  <div className="cc-val" style={{ color:outstanding>0?"#ef4444":"#10b981" }}>₹{outstanding.toLocaleString("en-IN")}</div>
                </div>
              </div>
            )}
            <div className="credit-note">
              <FiInfo size={12} style={{ flexShrink:0, marginTop:2 }}/>
              <span><b>Credit</b> = revenue the customer hasn't paid yet. <b>Settled</b> = how much of that was collected today. Outstanding balance can be settled later from the entry detail page. Leave both 0 if fully collected.</span>
            </div>
          </div>
        </div>

        {/* ── Purchase Cost ── */}
        <div className="section">
          <p className="section-title">Purchase Cost</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {purchaseCost.map((p, i) => (
              <div key={i} className="row-flex">
                <Field label={i===0?"Item":""} placeholder="Item name" value={p.item} onChange={v=>setPF(i,"item",v)}/>
                <div className="field w-amount">
                  {i===0&&<label>Amount</label>}
                  <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>
                    {inlineInput(p.amount, v=>setPF(i,"amount",v))}
                  </div>
                </div>
                <SourceSelect label={i===0?"From account":""} value={p.source} onChange={v=>setPF(i,"source",v)}/>
                {purchaseCost.length>1&&<button className="del-btn" onClick={()=>setPurchaseCost(purchaseCost.filter((_,j)=>j!==i))}><FiTrash2 size={14}/></button>}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
            <button className="add-row-btn" onClick={()=>setPurchaseCost([...purchaseCost,mkPurchase()])}><FiPlus size={13}/> Add item</button>
            {totalPurchase>0&&<span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:"#f43f5e", fontWeight:600 }}>Total: ₹{totalPurchase.toLocaleString("en-IN")}</span>}
          </div>
        </div>

        {/* ── Expenses ── */}
        <div className="section">
          <p className="section-title">Expenses</p>

          {/* Commission */}
          <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:12, padding:14, marginBottom:18 }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#C2410C", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>Commission on Sales</p>
            <div className="row-flex">
              <Field label="Amount" type="number" prefix="₹" value={exp.commissionOnSales.amount} onChange={v=>setSingle("commissionOnSales","amount",v)}/>
              <SourceSelect value={exp.commissionOnSales.source} onChange={v=>setSingle("commissionOnSales","source",v)}/>
            </div>
          </div>

          {/* Royalty Fees */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Royalty / Management Fees</p>
            <div className="sub-box" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {exp.royaltyFees.map((r,i) => (
                <div key={i} className="row-flex">
                  <Field label={i===0?"Fee Label":""} placeholder="e.g. Royalty / Mgt. Fee" value={r.label} onChange={v=>setArrRow("royaltyFees",i,"label",v)}/>
                  <div className="field w-amount">
                    {i===0&&<label>Amount</label>}
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}><span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>{inlineInput(r.amount,v=>setArrRow("royaltyFees",i,"amount",v))}</div>
                  </div>
                  <SourceSelect label={i===0?"From account":""} value={r.source} onChange={v=>setArrRow("royaltyFees",i,"source",v)}/>
                  {exp.royaltyFees.length>1&&<button className="del-btn" onClick={()=>delRow("royaltyFees",i)}><FiTrash2 size={13}/></button>}
                </div>
              ))}
              <button className="add-row-btn" onClick={()=>addRow("royaltyFees",mkRoyalty)}><FiPlus size={13}/> Add royalty fee</button>
            </div>
          </div>

          {/* Staff — shows credit due (earned − advance outstanding) */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Staff</p>
            <div className="grid2">
              <div className="staff-readonly">
                <div>
                  <div className="staff-label">Staff Salary (Credit Due)</div>
                  <div className="staff-hint">Earned − advance outstanding</div>
                </div>
                <div>
                  <div className="staff-val" style={{ color:"#10b981" }}>₹{staffCreditDue.toLocaleString()}</div>
                  {totalAdvanceOutstanding > 0 && (
                    <div style={{ fontSize:10, color:"#f59e0b", marginTop:2 }}>Adv deducted: ₹{totalAdvanceOutstanding.toLocaleString()}</div>
                  )}
                </div>
              </div>
              <div className="staff-readonly">
                <div>
                  <div className="staff-label">Staff Accommodation</div>
                  <div className="staff-hint">From staff profiles</div>
                </div>
                <div className="staff-val">₹{totalStaffAccommodation.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Operations */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Operations</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["foodRefreshment","Food & Refreshment"],["rent","Rent"],["electricity","Electricity"],["travelFuel","Travel & Fuel"],["mobileInternet","Mobile & Internet"],["maintenance","Maintenance"],["incentive","Incentive"]].map(([key,label]) => (
                <div key={key} className="row-flex">
                  <div className="field w-label"><label>{label}</label></div>
                  <Field type="number" prefix="₹" value={exp[key].amount} onChange={v=>setSingle(key,"amount",v)}/>
                  <SourceSelect value={exp[key].source} onChange={v=>setSingle(key,"source",v)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Gas */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Gas</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[["gasStaff","Gas — Staff"],["gasStore","Gas — Store"]].map(([key,label]) => (
                <div key={key} className="row-flex">
                  <div className="field w-label"><label>{label}</label></div>
                  <Field type="number" prefix="₹" value={exp[key].amount} onChange={v=>setSingle(key,"amount",v)}/>
                  <SourceSelect value={exp[key].source} onChange={v=>setSingle(key,"source",v)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Marketing */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Marketing</p>
            <div className="sub-box" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {exp.marketing.map((m,i) => (
                <div key={i} className="row-flex">
                  <Field label={i===0?"Remark":""} placeholder="Campaign / description" value={m.remark} onChange={v=>setArrRow("marketing",i,"remark",v)}/>
                  <div className="field w-amount">
                    {i===0&&<label>Amount</label>}
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}><span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>{inlineInput(m.amount,v=>setArrRow("marketing",i,"amount",v))}</div>
                  </div>
                  <SourceSelect value={m.source} onChange={v=>setArrRow("marketing",i,"source",v)}/>
                  {exp.marketing.length>1&&<button className="del-btn" onClick={()=>delRow("marketing",i)}><FiTrash2 size={13}/></button>}
                </div>
              ))}
              <button className="add-row-btn" onClick={()=>addRow("marketing",mkMarketing)}><FiPlus size={13}/> Add marketing item</button>
            </div>
          </div>

          {/* Food Wastage */}
          <div style={{ marginBottom:18 }}>
            <p className="sub-title">Food Wastage</p>
            <div className="grid2">
              {[["foodWastageCooked","Cooked Food","#FFF7ED","#FED7AA","#EA580C"],["foodWastageRaw","Raw Food","#F0FDF4","#BBF7D0","#15803D"]].map(([key,title,bg,border,color]) => (
                <div key={key} className="sub-box" style={{ background:bg, borderColor:border, display:"flex", flexDirection:"column", gap:10 }}>
                  <p style={{ fontSize:10, fontWeight:700, color, textTransform:"uppercase", letterSpacing:".08em" }}>{title}</p>
                  {exp[key].map((f,i) => (
                    <div key={i} className="row-flex">
                      <Field label={i===0?"Item":""} placeholder="Food item" value={f.item} onChange={v=>setArrRow(key,i,"item",v)}/>
                      <div className="field w-amount">
                        {i===0&&<label>Amount</label>}
                        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}><span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>{inlineInput(f.amount,v=>setArrRow(key,i,"amount",v))}</div>
                      </div>
                      {exp[key].length>1&&<button className="del-btn" onClick={()=>delRow(key,i)}><FiTrash2 size={13}/></button>}
                    </div>
                  ))}
                  <button className="add-row-btn" onClick={()=>addRow(key,mkFoodItem)}><FiPlus size={13}/> Add item</button>
                </div>
              ))}
            </div>
          </div>

          {/* Other */}
          <div>
            <p className="sub-title">Other</p>
            <div className="sub-box" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {exp.other.map((o,i) => (
                <div key={i} className="row-flex">
                  <Field label={i===0?"Reason":""} placeholder="Description" value={o.reason} onChange={v=>setArrRow("other",i,"reason",v)}/>
                  <div className="field w-amount">
                    {i===0&&<label>Amount</label>}
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}><span style={{ color:"#A8A49C", fontSize:13 }}>₹</span>{inlineInput(o.amount,v=>setArrRow("other",i,"amount",v))}</div>
                  </div>
                  <SourceSelect value={o.source} onChange={v=>setArrRow("other",i,"source",v)}/>
                  {exp.other.length>1&&<button className="del-btn" onClick={()=>delRow("other",i)}><FiTrash2 size={13}/></button>}
                </div>
              ))}
              <button className="add-row-btn" onClick={()=>addRow("other",mkOther)}><FiPlus size={13}/> Add other</button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="footer-bar">
        <button className="btn-cancel" onClick={()=>navigate(-1)}>Cancel</button>
        <button className="btn-save" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending?"Saving…":"Save Entry"}
        </button>
      </div>
    </div>
  );
}