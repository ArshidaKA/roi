// src/pages/EntryDetails.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Current user
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  // Fetch entry
  const { data: entry, isLoading, isError, error } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => (await client.get(`/roi/${id}`)).data,
    enabled: !!id,
  });

  // STAFF: approved requests for this entry
  const { data: myApproved = { requests: [] } } = useQuery({
    queryKey: ["myApprovedForEntry", id],
    queryFn: async () =>
      (await client.get("/roi/edit-requests", {
        params: { status: "APPROVED", entryId: id, mine: true, limit: 100 },
      })).data,
    enabled: !!id && !!me && me.role === "STAFF",
  });

  const [fieldPath, setFieldPath] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");

  const reqEdit = useMutation({
    mutationFn: (payload) => client.post("/roi/edit-request", payload),
    onSuccess: () => {
      setFieldPath("");
      setNewValue("");
      setReason("");
      alert("Edit request sent ✅");
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
    },
  });

  if (isLoading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (isError) return <div className="p-6 text-red-500">Error: {error.message}</div>;
  if (!entry) return <div className="p-6 text-gray-500">No entry found.</div>;

  const fmt = (val) => (val ? Number(val).toLocaleString() : 0);

  // ---- Calculations ----
  const purchaseCostTotal =
    entry.purchaseCost?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  const expenseTotals = Object.entries(entry.expenses || {}).map(([key, val]) => {
    let total = 0;
    if (Array.isArray(val)) total = val.reduce((s, i) => s + (i.amount || 0), 0);
    else if (typeof val === "number") total = val;
    return [key, total];
  });

  const totalExpenses = expenseTotals.reduce((s, [, val]) => s + val, 0);

  const grossIncome = (entry.totalRevenue || 0) - purchaseCostTotal;
  const commissionPercent = 9;
  const commission = (grossIncome * commissionPercent) / 100;
  const totalOperationsCost = totalExpenses;
  const netProfit = grossIncome - (commission + totalOperationsCost);

// Build a set of approved field paths for this entry (like in EditEntry)
const approvedPaths = new Set(
  (myApproved?.requests || [])
    .filter((r) => !r.consumed) // ignore already used requests
    .map((r) => r.fieldPath)
);

const staffHasApproved = approvedPaths.size > 0;
  console.log("staffHasApproved", staffHasApproved);

  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
        >
          ← Back
        </button>

       {/* Edit Button */}
{(me?.role === "OWNER" ||
  (me?.role === "STAFF" && staffHasApproved)) ? (
  <button
    onClick={() => navigate(`/entries/${id}/edit`)}
    className={`px-4 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 transition shadow-md
      ${me?.role === "STAFF" && !staffHasApproved ? "opacity-50 cursor-not-allowed hover:from-yellow-400 hover:to-yellow-500" : ""}
    `}
    disabled={me?.role === "STAFF" && !staffHasApproved}
  >
     Edit entry
  </button>
) : null}

      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800">
        Entry on {new Date(entry.date).toLocaleDateString()}
      </h1>

      {/* Details Card */}
      <div className="rounded-xl border bg-white shadow-md overflow-hidden">
        <table className="min-w-full text-sm">
          <tbody>
            <tr className="bg-gray-50 font-semibold">
              <td className="p-3">Daily Revenue</td>
              <td className="p-3 text-right text-blue-600">{fmt(entry.totalRevenue)}</td>
            </tr>
            <tr>
              <td className="p-3">Purchase Cost</td>
              <td className="p-3 text-right">{fmt(purchaseCostTotal)}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="p-3">Gross Income</td>
              <td className="p-3 text-right">{fmt(grossIncome)}</td>
            </tr>
            <tr>
              <td className="p-3">Commission on Sales</td>
              <td className="p-3 text-right">{fmt(commission)}</td>
            </tr>

            {/* Expenses */}
            <tr className="bg-gray-100 font-medium">
              <td className="p-3" colSpan={2}>
                Expenses
              </td>
            </tr>
            {expenseTotals.map(([key, val]) => (
              <tr key={key}>
                <td className="p-3 capitalize text-gray-700">
                  {key.replace(/([A-Z])/g, " $1")}
                </td>
                <td className="p-3 text-right">{fmt(val)}</td>
              </tr>
            ))}

            <tr className="bg-gray-50 font-semibold">
              <td className="p-3">Total Cost of Operations</td>
              <td className="p-3 text-right">{fmt(totalOperationsCost)}</td>
            </tr>
            <tr className="bg-green-50 font-bold">
              <td className="p-3">Net Profit</td>
              <td className="p-3 text-right text-green-600">{fmt(netProfit)}</td>
            </tr>
            <tr className="bg-yellow-50 font-semibold">
              <td className="p-3">Commission %</td>
              <td className="p-3 text-right">{commissionPercent}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* STAFF: Edit request form */}
     {me?.role === "STAFF" && (
  <div className="rounded-2xl border border-gray-200 p-8 shadow-lg bg-gradient-to-br from-white to-gray-50 space-y-6">
    {/* Header */}
    <h2 className="font-semibold text-xl text-gray-800 flex items-center gap-2">
      <span className="text-blue-600">📌</span> Request an Edit
    </h2>

    {/* Category */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Select Category</label>
      <select
        value={fieldPath.split(".")[0] || ""}
        onChange={(e) => {
          setFieldPath("");
          setNewValue("");
          setReason("");
          setFieldPath(e.target.value);
        }}
        className="mt-1 border border-gray-300 rounded-xl p-3 w-full text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      >
        <option value="">-- Choose a category --</option>
        <option value="revenue">Revenue</option>
        {entry.purchaseCost?.length > 0 && (
          <option value="purchaseCost">Purchase Cost</option>
        )}
        <option value="expenses">Expenses</option>
      </select>
    </div>

    {/* Revenue */}
    {fieldPath === "revenue" && (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select Field</label>
        <select
          onChange={(e) => setFieldPath(e.target.value)}
          className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">-- Select field --</option>
          <option value="totalRevenue">
            Total Revenue ({entry.totalRevenue})
          </option>
          <option value="date">
            Date ({new Date(entry.date).toLocaleDateString()})
          </option>
        </select>
      </div>
    )}

    {/* Purchase Cost */}
    {fieldPath === "purchaseCost" && (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select Item</label>
        <select
          onChange={(e) => setFieldPath(e.target.value)}
          className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">-- Select item --</option>
          {entry.purchaseCost
            .filter((p) => p.amount > 0)
            .map((p, i) => (
              <optgroup key={i} label={`Item ${i + 1}`}>
                <option value={`purchaseCost[${i}].item`}>
                  Name ({p.item})
                </option>
                <option value={`purchaseCost[${i}].amount`}>
                  Amount ({p.amount})
                </option>
              </optgroup>
            ))}
        </select>
      </div>
    )}

    {/* Expenses */}
    {fieldPath === "expenses" && (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select Expense</label>
        <select
          onChange={(e) => setFieldPath(e.target.value)}
          className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">-- Select expense --</option>
          {Object.entries(entry.expenses || {}).map(([key, val]) => {
            let displayVal = "";
            if (Array.isArray(val)) {
              displayVal = val.reduce((s, i) => s + (i.amount || 0), 0);
            } else if (typeof val === "object" && val !== null) {
              displayVal = val.amount || 0;
            } else {
              displayVal = val;
            }
            return (
              <option key={key} value={`expenses.${key}`}>
                {key.replace(/([A-Z])/g, " $1")} ({displayVal})
              </option>
            );
          })}
          <option value="expenses.other">Other</option>
        </select>
      </div>
    )}

    {/* Staff */}
    {fieldPath === "staff" && (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select Staff</label>
        <select
          onChange={(e) => setFieldPath(e.target.value)}
          className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">-- Select staff field --</option>
          {entry.expenses?.staffSalary?.map((s, i) => (
            <optgroup key={`ss-${i}`} label={`Salary - Staff ${i + 1}`}>
              {s.name && (
                <option value={`expenses.staffSalary[${i}].name`}>
                  Name ({s.name})
                </option>
              )}
              {s.amount > 0 && (
                <option value={`expenses.staffSalary[${i}].amount`}>
                  Amount ({s.amount})
                </option>
              )}
            </optgroup>
          ))}
          {entry.expenses?.staffAccommodation?.map((s, i) => (
            <optgroup key={`sa-${i}`} label={`Accommodation - Staff ${i + 1}`}>
              {s.name && (
                <option value={`expenses.staffAccommodation[${i}].name`}>
                  Name ({s.name})
                </option>
              )}
              {s.amount > 0 && (
                <option value={`expenses.staffAccommodation[${i}].amount`}>
                  Amount ({s.amount})
                </option>
              )}
            </optgroup>
          ))}
        </select>
      </div>
    )}

    {/* New Value */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">New Value</label>
      <input
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        placeholder="Enter new value"
      />
    </div>

    {/* Reason */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Reason</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border border-gray-300 rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        placeholder="Why should this be updated?"
        rows={3}
      />
    </div>

    {/* Actions */}
    <div className="flex gap-4 pt-3">
      <button
        onClick={() =>
          reqEdit.mutate({ entryId: id, fieldPath, newValue, reason })
        }
        disabled={!fieldPath || !newValue || !reason}
        className="px-6 py-2 rounded-xl text-white font-medium shadow-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition"
      >
        Send Request
      </button>
      <button
        onClick={() => {
          setFieldPath("");
          setNewValue("");
          setReason("");
        }}
        className="px-6 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
      >
        Clear
      </button>
    </div>
  </div>
)}

    </div>
  );
}
