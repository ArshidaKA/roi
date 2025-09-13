// src/pages/Requests.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import LoadingSpinner from "./compoents/LoadingSpinner";
import ConfirmDialog from "./compoents/ConfirmDialog";

export default function Requests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState({ open: false, action: null, id: null });

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  const status = searchParams.get("status") || "ALL";
  const page = Number(searchParams.get("page")) || 1;
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["editRequests", { status, page, startDate, endDate }],
    queryFn: async () => {
      const res = await client.get("/roi/edit-requests", {
        params: { status, page, startDate, endDate, limit: 5 },
      });
      return res.data;
    },
    keepPreviousData: true,
  });
  console.log(data,"fgsfwsyuik")

  const mutation = useMutation({
    mutationFn: async ({ id, action }) =>
      (await client.patch(`/roi/edit-request/${id}`, { status: action })).data,
    onSuccess: () => {
      queryClient.invalidateQueries(["editRequests"]);
    },
  });

  function updateFilters(newFilters) {
    setSearchParams({
      status,
      page,
      startDate,
      endDate,
      ...newFilters,
    });
  }

  function confirmAction() {
    if (dialog.id && dialog.action) {
      mutation.mutate({ id: dialog.id, action: dialog.action });
    }
    setDialog({ open: false, action: null, id: null });
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Requests</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <select
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
          className="px-4 py-2 rounded-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 bg-white text-gray-700 transition"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => updateFilters({ startDate: e.target.value, page: 1 })}
          className="px-4 py-2 rounded-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 bg-white text-gray-700 transition"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => updateFilters({ endDate: e.target.value, page: 1 })}
          className="px-4 py-2 rounded-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 bg-white text-gray-700 transition"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl shadow border border-gray-200 bg-white">
          <table className="w-full text-sm text-left text-gray-700 border-collapse">
            <thead className="bg-gray-100 text-blue-700 text-xs font-semibold uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th className="p-4 border-r border-gray-200">Date</th>
                <th className="p-4 border-r border-gray-200">Field</th>
                <th className="p-4 border-r border-gray-200">New Value</th>
                <th className="p-4 border-r border-gray-200">Reason</th>
                <th className="p-4 border-r border-gray-200">Requested By</th>
                <th className="p-4 border-r border-gray-200">Status</th>
                {userData?.role === "OWNER" && <th className="p-4">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {data?.requests?.map((r, i) => (
                <tr
                  key={r._id}
                  className={`transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100`}
                >
                  <td className="p-4 border-t border-gray-200">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 border-t border-gray-200 font-medium text-gray-900">{r.fieldPath}</td>
                  <td className="p-4 border-t border-gray-200 text-blue-600 font-semibold">{String(r.newValue)}</td>
                  <td className="p-4 border-t border-gray-200 text-gray-600">{r.reason}</td>
                  <td className="p-4 border-t border-gray-200">{r.requestedBy?.name}</td>
                  <td className="p-4 border-t border-gray-200">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium
                        ${
                          r.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : r.status === "APPROVED"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                    >
                      {r.status}
                      {r.consumed ? " (used)" : ""}
                    </span>
                  </td>

                  {userData?.role === "OWNER" && (
                    <td className="p-4 border-t border-gray-200">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDialog({ open: true, action: "APPROVED", id: r._id })}
                            className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setDialog({ open: true, action: "REJECTED", id: r._id })}
                            className="px-4 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {(!data?.requests || data.requests.length === 0) && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500 italic">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <button
          disabled={page === 1}
          onClick={() => updateFilters({ page: page - 1 })}
          className="px-5 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          Prev
        </button>
        <span className="text-gray-600 font-medium">
          Page {data?.page} of {data?.pages}
        </span>
        <button
          disabled={page === data?.pages}
          onClick={() => updateFilters({ page: page + 1 })}
          className="px-5 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          Next
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.action === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
        message={
          dialog.action === "APPROVED"
            ? "Are you sure you want to approve this request?"
            : "Are you sure you want to reject this request?"
        }
        onConfirm={confirmAction}
        onCancel={() => setDialog({ open: false, action: null, id: null })}
      />
    </div>
  );
}
