import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "./compoents/LoadingSpinner";

export default function Requests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // ✅ Get logged-in user
  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await client.get("/me");
      return res.data.user;
    },
  });

  // ✅ Initialize filters from URL
  const status = searchParams.get("status") || "ALL";
  const page = Number(searchParams.get("page")) || 1;
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  // ✅ Fetch requests
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

  // ✅ Approve/Reject mutation
  const mutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await client.patch(`/roi/edit-request/${id}`, {
        status: action,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["editRequests"]);
    },
  });

  // ✅ Update URL when filters change (auto apply)
  function updateFilters(newFilters) {
    setSearchParams({
      status,
      page,
      startDate,
      endDate,
      ...newFilters,
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Requests</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 rounded-lg shadow">
        <select
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
          className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
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
          className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => updateFilters({ endDate: e.target.value, page: 1 })}
          className="border px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <p> <LoadingSpinner/> </p>
      ) : (
        <div className="overflow-hidden rounded-xl shadow border border-gray-200 bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Field</th>
                <th className="p-4">New Value</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Requested By</th>
                <th className="p-4">Status</th>
                {userData?.role === "OWNER" && <th className="p-4">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {data?.requests?.map((r) => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">{r.fieldPath}</td>
                  <td className="p-4">{r.newValue}</td>
                  <td className="p-4">{r.reason}</td>
                  <td className="p-4">{r.requestedBy?.name}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                        ${
                          r.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : r.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Admin actions */}
                  {userData?.role === "OWNER" && (
                    <td className="p-4">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              mutation.mutate({ id: r._id, action: "APPROVED" })
                            }
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              mutation.mutate({ id: r._id, action: "REJECTED" })
                            }
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => updateFilters({ page: page - 1 })}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
        >
          Prev
        </button>
        <span className="text-gray-600">
          Page {data?.page} of {data?.pages}
        </span>
        <button
          disabled={page === data?.pages}
          onClick={() => updateFilters({ page: page + 1 })}
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
