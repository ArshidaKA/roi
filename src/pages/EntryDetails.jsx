// src/pages/EntryDetails.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../utils/client"; // adjust path to your axios client

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

  // Local state for edit request form
  const [fieldPath, setFieldPath] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");

  // Mutation for edit requests
  const reqEdit = useMutation({
    mutationFn: (payload) => client.post("/roi/edit-request", payload),
    onSuccess: () => {
      setFieldPath("");
      setNewValue("");
      setReason("");
      alert("Edit request sent ✅");
      queryClient.invalidateQueries({ queryKey: ["entry", id] }); // ✅ v5 syntax
    },
  });

  // UI states
  if (isLoading) return <div className="p-4">Loading...</div>;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!entry) return <div className="p-4">No entry found.</div>;

  // Main render
  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 border px-3 py-1 rounded"
      >
        Back
      </button>

      <h1 className="text-xl font-semibold mb-4">
        Entry on {new Date(entry.date).toLocaleDateString()}
      </h1>

      {/* Simple key info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-2">Revenue & Purchase</div>
          <div>Total Revenue: {entry.totalRevenue}</div>
          <div>
            Purchase Total:{" "}
            {entry.purchaseCost?.reduce((a, c) => a + c.amount, 0) || 0}
          </div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="font-medium mb-2">Quick Expenses</div>
          <div>Rent: {entry.expenses?.rent || 0}</div>
          <div>Electricity: {entry.expenses?.electricity || 0}</div>
        </div>
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
