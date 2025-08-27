// src/pages/EntryDetails.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../utils/client";

export default function EntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch entry
  const { data: entry, isLoading, isError, error } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      const res = await client.get(`/roi`, { params: { id } });
      return Array.isArray(res.data)
        ? res.data.find((x) => x._id === id)
        : res.data;
    },
    enabled: !!id,
  });

  // Edit request state
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

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!entry) return <div className="p-4">No entry found.</div>;

  // Helpers
  const fmt = (val) => (val ? Number(val).toLocaleString() : 0);

  // ---- Calculations ----
  const purchaseCostTotal = entry.purchaseCost?.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  ) || 0;

  // Flatten expenses (some are arrays, some are numbers, some null)
  const expenseTotals = Object.entries(entry.expenses || {}).map(([key, val]) => {
    let total = 0;
    if (Array.isArray(val)) {
      total = val.reduce((s, i) => s + (i.amount || 0), 0);
    } else if (typeof val === "number") {
      total = val;
    }
    return [key, total];
  });

  const totalExpenses = expenseTotals.reduce((s, [, val]) => s + val, 0);

  const grossIncome = (entry.totalRevenue || 0) - purchaseCostTotal;
  const commissionPercent = 9; // example fixed
  const commission = (grossIncome * commissionPercent) / 100;
  const totalOperationsCost = totalExpenses;
  const netProfit = grossIncome - (commission + totalOperationsCost);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 border px-3 py-1 rounded"
      >
        Back
      </button>

      <h1 className="text-xl font-semibold mb-6">
        Entry on {new Date(entry.date).toLocaleDateString()}
      </h1>

      {/* Table-like layout */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <tbody>
            <tr className="bg-gray-50 font-bold">
              <td className="p-2">Daily Revenue</td>
              <td className="p-2 text-right">{fmt(entry.totalRevenue)}</td>
            </tr>
            <tr>
              <td className="p-2">Purchase cost</td>
              <td className="p-2 text-right">{fmt(purchaseCostTotal)}</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="p-2">Gross Income</td>
              <td className="p-2 text-right">{fmt(grossIncome)}</td>
            </tr>
            <tr>
              <td className="p-2">Commission on Sales</td>
              <td className="p-2 text-right">{fmt(commission)}</td>
            </tr>

            <tr className="bg-gray-100 font-medium">
              <td className="p-2" colSpan={2}>
                Expenses
              </td>
            </tr>
            {expenseTotals.map(([key, val]) => (
              <tr key={key}>
                <td className="p-2 capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </td>
                <td className="p-2 text-right">{fmt(val)}</td>
              </tr>
            ))}

            <tr className="bg-gray-50 font-bold">
              <td className="p-2">Total Cost of Operations</td>
              <td className="p-2 text-right">{fmt(totalOperationsCost)}</td>
            </tr>
            <tr className="bg-green-50 font-bold">
              <td className="p-2">Net Profit</td>
              <td className="p-2 text-right text-green-600">{fmt(netProfit)}</td>
            </tr>
            <tr className="bg-yellow-50 font-bold">
              <td className="p-2">Commission %</td>
              <td className="p-2 text-right">{commissionPercent}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Request edit form */}
      <div className="mt-6 rounded-xl border p-4">
        <div className="font-semibold mb-2">Request an Edit (Staff)</div>

        <label className="text-sm">Field path</label>
        <input
          value={fieldPath}
          onChange={(e) => setFieldPath(e.target.value)}
          className="border p-2 w-full mb-2"
          placeholder="expenses.rent"
        />

        <label className="text-sm">New value</label>
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="border p-2 w-full mb-2"
          placeholder="12000"
        />

        <label className="text-sm">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border p-2 w-full mb-3"
          placeholder="Correcting data entry mistake"
        />

        <div className="flex gap-2">
          <button
            onClick={() =>
              reqEdit.mutate({ entryId: id, fieldPath, newValue, reason })
            }
            className="px-4 py-2 bg-black text-white rounded"
          >
            Send Request
          </button>
          <button
            onClick={() => {
              setFieldPath("");
              setNewValue("");
              setReason("");
            }}
            className="px-4 py-2 border rounded"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
