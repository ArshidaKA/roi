import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

export default function Requests() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });
  // Fetch requests
  const { data } = useQuery({
    queryKey: ["editRequests"],
    queryFn: async () => {
      const res = await client.get("/roi/edit-requests");
      return res.data;
    },
  });
  console.log(data,"edit requests");

  // Mutation to approve/reject
  const mutation = useMutation({
    mutationFn: ({ id, status }) =>
      client.patch(`/roi/edit-request/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries(["editRequests"]),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Requests</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Field</th>
            <th className="p-2 border">New Value</th>
            <th className="p-2 border">Reason</th>
            <th className="p-2 border">Requested By</th>
            <th className="p-2 border">Status</th>
            {/* 👇 Show Actions column only for owner */}
            {me?.role === "OWNER" && <th className="p-2 border">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data?.map((r) => (
            <tr key={r._id}>
              <td className="p-2 border">{r.fieldPath}</td>
              <td className="p-2 border">{r.newValue}</td>
              <td className="p-2 border">{r.reason}</td>
              <td className="p-2 border">{r.requestedBy?.name}</td>
              <td className="p-2 border">{r.status}</td>
              {/* 👇 Render Actions cell only for owner */}
              {me?.role === "OWNER" && (
                <td className="p-2 border">
                  {r.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          mutation.mutate({ id: r._id, status: "APPROVED" })
                        }
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          mutation.mutate({ id: r._id, status: "REJECTED" })
                        }
                        className="px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-600">{r.status}</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
