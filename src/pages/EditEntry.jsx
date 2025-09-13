// src/pages/EditEntry.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { FiChevronLeft, FiSave } from "react-icons/fi";

export default function EditEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // User
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  // Entry (prefill)
  const { data: entry, isLoading } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => (await client.get(`/roi/${id}`)).data,
    enabled: !!id,
  });

  // STAFF: their approved fields for this entry
  const { data: approved = { requests: [] } } = useQuery({
    queryKey: ["approvedFields", id],
    queryFn: async () =>
      (await client.get("/roi/edit-requests", {
        params: { status: "APPROVED", entryId: id, mine: true, limit: 200 },
      })).data,
    enabled: !!id && me?.role === "STAFF",
  });

  // Build a Set of approved field paths for quick lookup
  const approvedPaths = useMemo(() => {
    const set = new Set();
    (approved?.requests || []).forEach((r) => {
      if (r.consumed) return; // already used
      set.add(r.fieldPath);
    });
    return set;
  }, [approved]);

  console.log(approvedPaths,"..Approved Paths");

  // Local form state
  const [date, setDate] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [purchaseCost, setPurchaseCost] = useState([{ item: "", amount: "" }]);
  const [expenses, setExpenses] = useState({
    staffSalary: [{ name: "", amount: "" }],
    staffAccommodation: [{ name: "", amount: "" }],
    food: "",
    rent: "",
    electricity: "",
    travelFuel: "",
    mobInternet: "",
    maintenance: "",
    transport: "",
    marketing: "",
    consulting: "",
    software: "",
    incentive: "",
    stockClearance: "",
    other: [{ reason: "", amount: "" }],
  });

  // On load, prefill
  useEffect(() => {
    if (!entry) return;
    setDate(entry.date?.split("T")[0] || "");
    setTotalRevenue(entry.totalRevenue ?? "");
    setPurchaseCost(
      (entry.purchaseCost || []).map((p) => ({ item: p.item || "", amount: p.amount ?? "" }))
    );
    const ex = entry.expenses || {};
    setExpenses({
      staffSalary: (ex.staffSalary || [{ name: "", amount: "" }]).map((s) => ({
        name: s.name || "",
        amount: s.amount ?? "",
      })),
      staffAccommodation: (ex.staffAccommodation || [{ name: "", amount: "" }]).map((s) => ({
        name: s.name || "",
        amount: s.amount ?? "",
      })),
      food: ex.food ?? "",
      rent: ex.rent ?? "",
      electricity: ex.electricity ?? "",
      travelFuel: ex.travelFuel ?? "",
      mobInternet: ex.mobInternet ?? "",
      maintenance: ex.maintenance ?? "",
      transport: ex.transport ?? "",
      marketing: ex.marketing ?? "",
      consulting: ex.consulting ?? "",
      software: ex.software ?? "",
      incentive: ex.incentive ?? "",
      stockClearance: ex.stockClearance ?? "",
      other: (ex.other || [{ reason: "", amount: "" }]).map((o) => ({
        reason: o.reason || "",
        amount: o.amount ?? "",
      })),
    });
  }, [entry]);

  // Helpers to map each input to a fieldPath (for STAFF gating & staff-update payload)
  const pcPath = (i, key) => `purchaseCost[${i}].${key}`;
  const expSinglePath = (key) => `expenses.${key}`;
  const expArrPath = (field, i, key) => `expenses.${field}[${i}].${key}`;

  // OWNER save
  const putMutation = useMutation({
    mutationFn: (payload) => client.put(`/roi/${id}`, payload),
    onSuccess: () => {
      alert("Entry updated ✅");
      qc.invalidateQueries(["entry", id]);
      navigate(`/entries/${id}`);
    },
  });

  // STAFF save (only approved fields)
  const staffPatchMutation = useMutation({
    mutationFn: (updates) => client.patch(`/roi/${id}/staff-update`, { updates }),
    onSuccess: () => {
      alert("Changes submitted ✅");
      qc.invalidateQueries(["entry", id]);
      navigate(`/entries/${id}`);
    },
  });

  const handleArrayChange = (stateSetter) => (field, index, key, value) => {
    stateSetter((prev) => {
      const arr = [...prev[field]];
      arr[index][key] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (stateSetter) => (field, emptyObj) => {
    stateSetter((prev) => ({ ...prev, [field]: [...prev[field], emptyObj] }));
  };

  // Disable logic for STAFF
  const isDisabled = (path) => {
    if (me?.role === "OWNER") return false;
    if (me?.role === "STAFF") return !approvedPaths.has(path);
    return true;
  };

  // Build OWNER payload
  const buildOwnerPayload = () => ({
    date,
    totalRevenue: Number(totalRevenue),
    purchaseCost: purchaseCost.map((p) => ({ item: p.item, amount: Number(p.amount || 0) })),
    expenses: {
      ...expenses,
      staffSalary: expenses.staffSalary.map((s) => ({ name: s.name, amount: Number(s.amount || 0) })),
      staffAccommodation: expenses.staffAccommodation.map((s) => ({
        name: s.name,
        amount: Number(s.amount || 0),
      })),
      other: expenses.other.map((o) => ({ reason: o.reason, amount: Number(o.amount || 0) })),
      food: Number(expenses.food || 0),
      rent: Number(expenses.rent || 0),
      electricity: Number(expenses.electricity || 0),
      travelFuel: Number(expenses.travelFuel || 0),
      mobInternet: Number(expenses.mobInternet || 0),
      maintenance: Number(expenses.maintenance || 0),
      transport: Number(expenses.transport || 0),
      marketing: Number(expenses.marketing || 0),
      consulting: Number(expenses.consulting || 0),
      software: Number(expenses.software || 0),
      incentive: Number(expenses.incentive || 0),
      stockClearance: Number(expenses.stockClearance || 0),
    },
  });

  // Build STAFF updates[] based on approved paths (send only changed)
  const buildStaffUpdates = () => {
    const updates = [];

    // totalRevenue
    const trPath = "totalRevenue";
    if (!isDisabled(trPath) && Number(totalRevenue) !== Number(entry.totalRevenue || 0)) {
      updates.push({ path: trPath, value: Number(totalRevenue) });
    }

    // date
    const dPath = "date";
    if (!isDisabled(dPath) && date !== (entry.date?.split("T")[0] || "")) {
      // store as ISO (server expects a Date or valid string)
      updates.push({ path: dPath, value: date });
    }

    // purchaseCost
    (purchaseCost || []).forEach((p, i) => {
      const base = entry.purchaseCost?.[i] || {};
      const itemPath = pcPath(i, "item");
      const amtPath = pcPath(i, "amount");

      if (!isDisabled(itemPath) && (p.item || "") !== (base.item || "")) {
        updates.push({ path: itemPath, value: p.item });
      }
      if (!isDisabled(amtPath) && Number(p.amount || 0) !== Number(base.amount || 0)) {
        updates.push({ path: amtPath, value: Number(p.amount || 0) });
      }
    });

    // expenses singles
    [
      "food",
      "rent",
      "electricity",
      "travelFuel",
      "mobInternet",
      "maintenance",
      "transport",
      "marketing",
      "consulting",
      "software",
      "incentive",
      "stockClearance",
    ].forEach((k) => {
      const p = expSinglePath(k);
      const current = Number(expenses[k] || 0);
      const prev = Number((entry.expenses || {})[k] || 0);
      if (!isDisabled(p) && current !== prev) {
        updates.push({ path: p, value: current });
      }
    });

    // expenses arrays
    (expenses.staffSalary || []).forEach((s, i) => {
      const base = entry.expenses?.staffSalary?.[i] || {};
      const namePath = expArrPath("staffSalary", i, "name");
      const amtPath = expArrPath("staffSalary", i, "amount");
      if (!isDisabled(namePath) && (s.name || "") !== (base.name || "")) {
        updates.push({ path: namePath, value: s.name });
      }
      if (!isDisabled(amtPath) && Number(s.amount || 0) !== Number(base.amount || 0)) {
        updates.push({ path: amtPath, value: Number(s.amount || 0) });
      }
    });

    (expenses.staffAccommodation || []).forEach((s, i) => {
      const base = entry.expenses?.staffAccommodation?.[i] || {};
      const namePath = expArrPath("staffAccommodation", i, "name");
      const amtPath = expArrPath("staffAccommodation", i, "amount");
      if (!isDisabled(namePath) && (s.name || "") !== (base.name || "")) {
        updates.push({ path: namePath, value: s.name });
      }
      if (!isDisabled(amtPath) && Number(s.amount || 0) !== Number(base.amount || 0)) {
        updates.push({ path: amtPath, value: Number(s.amount || 0) });
      }
    });

    (expenses.other || []).forEach((o, i) => {
      const base = entry.expenses?.other?.[i] || {};
      const reasonPath = expArrPath("other", i, "reason");
      const amtPath = expArrPath("other", i, "amount");
      if (!isDisabled(reasonPath) && (o.reason || "") !== (base.reason || "")) {
        updates.push({ path: reasonPath, value: o.reason });
      }
      if (!isDisabled(amtPath) && Number(o.amount || 0) !== Number(base.amount || 0)) {
        updates.push({ path: amtPath, value: Number(o.amount || 0) });
      }
    });

    return updates;
  };

  const handleSave = () => {
    if (me?.role === "OWNER") {
      const payload = buildOwnerPayload();
      putMutation.mutate(payload);
    } else if (me?.role === "STAFF") {
      const updates = buildStaffUpdates();
      if (updates.length === 0) {
        alert("No changes or no approved fields to update.");
        return;
      }
      staffPatchMutation.mutate(updates);
    } else {
      alert("Not authorized.");
    }
  };

  if (isLoading || !entry) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
        >
          <FiChevronLeft /> Back
        </button>

        <div className="flex items-center gap-3">
          {me?.role === "STAFF" && (
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
              You can edit only approved fields ({approvedPaths.size} approved)
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiSave /> Save
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-gray-800">✏️ Edit ROI Entry</h1>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldInput
          label="Date"
          type="date"
          value={date}
          onChange={setDate}
          disabled={isDisabled("date")}
        />
        <FieldInput
          label="Total Revenue"
          type="number"
          value={totalRevenue}
          onChange={setTotalRevenue}
          disabled={isDisabled("totalRevenue")}
          placeholder="₹"
        />
      </div>

      {/* Purchase Cost */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700">Purchase Cost</h2>
        {purchaseCost.map((p, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldInput
              label="Item"
              value={p.item}
              onChange={(val) => {
                const arr = [...purchaseCost];
                arr[i].item = val;
                setPurchaseCost(arr);
              }}
              disabled={isDisabled(pcPath(i, "item"))}
            />
            <FieldInput
              label="Amount"
              type="number"
              value={p.amount}
              onChange={(val) => {
                const arr = [...purchaseCost];
                arr[i].amount = val;
                setPurchaseCost(arr);
              }}
              disabled={isDisabled(pcPath(i, "amount"))}
              placeholder="₹"
            />
          </div>
        ))}
      </div>

      {/* Expenses */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-700">Expenses</h2>

        {/* Arrays */}
        <ArrayEditor
          title="Staff Salary"
          field="staffSalary"
          data={expenses.staffSalary}
          onChange={handleArrayChange(setExpenses)}
          addArrayItem={addArrayItem(setExpenses)}
          pathFn={(i, key) => expArrPath("staffSalary", i, key)}
          isDisabled={isDisabled}
        />
        <ArrayEditor
          title="Staff Accommodation"
          field="staffAccommodation"
          data={expenses.staffAccommodation}
          onChange={handleArrayChange(setExpenses)}
          addArrayItem={addArrayItem(setExpenses)}
          pathFn={(i, key) => expArrPath("staffAccommodation", i, key)}
          isDisabled={isDisabled}
        />

        {/* Singles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["food", "Food & Refreshment"],
            ["rent", "Rent"],
            ["electricity", "Electricity"],
            ["travelFuel", "Travel & Fuel"],
            ["mobInternet", "Mob & Internet"],
            ["maintenance", "Maintenance"],
            ["transport", "Transport"],
            ["marketing", "Marketing"],
            ["consulting", "Consulting"],
            ["software", "Software"],
            ["incentive", "Incentive"],
            ["stockClearance", "Stock Clearance Sale"],
          ].map(([key, label]) => (
            <FieldInput
              key={key}
              label={label}
              type="number"
              value={expenses[key]}
              onChange={(val) => setExpenses((prev) => ({ ...prev, [key]: val }))}
              disabled={isDisabled(expSinglePath(key))}
              placeholder="₹"
            />
          ))}
        </div>

        {/* Other */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Other</h3>
          {(expenses.other || []).map((o, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Reason"
                value={o.reason}
                onChange={(val) => {
                  const arr = [...expenses.other];
                  arr[i].reason = val;
                  setExpenses((prev) => ({ ...prev, other: arr }));
                }}
                disabled={isDisabled(expArrPath("other", i, "reason"))}
              />
              <FieldInput
                label="Amount"
                type="number"
                value={o.amount}
                onChange={(val) => {
                  const arr = [...expenses.other];
                  arr[i].amount = val;
                  setExpenses((prev) => ({ ...prev, other: arr }));
                }}
                disabled={isDisabled(expArrPath("other", i, "amount"))}
                placeholder="₹"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = "text", disabled }) {
  const handleWheel = (e) => {
    if (type === "number") {
      e.preventDefault();   // stop number change
      e.target.blur();      // remove focus to prevent wheel
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onWheel={handleWheel}
        className={`w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 text-sm ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}


function ArrayEditor({ title, field, data, onChange, addArrayItem, pathFn, isDisabled }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      {(data || []).map((item, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(item).map((key) => (
            <FieldInput
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              type={key === "amount" ? "number" : "text"}
              value={item[key]}
              onChange={(val) => onChange(field, i, key, val)}
              disabled={isDisabled(pathFn(i, key))}
              placeholder={key === "amount" ? "₹" : ""}
            />
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayItem(field, Object.fromEntries(Object.keys(data?.[0] || { name: "", amount: "" }).map((k) => [k, ""])))}
        className="text-blue-600 text-sm hover:underline"
      >
        + Add {title}
      </button>
    </div>
  );
}
