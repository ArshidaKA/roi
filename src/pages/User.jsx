// src/pages/Users.jsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import client from "../api/client"; // axios instance

export default function Users() {
  const navigate = useNavigate();

  // ✅ Fetch users from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await client.get("/auth/users"); // backend route
      return res.data.users;
    },
  });

  if (isLoading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load users</div>;

  // ✅ Counters
  const totalUsers = data.length;
  const admins = data.filter((u) => u.role === "OWNER").length;
  const staff = data.filter((u) => u.role === "STAFF").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span>👥</span> Staff Management
        </h1>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2"
        >
          <span>➕</span> Register New Staff
        </button>
      </div>

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Administrators</p>
            <p className="text-2xl font-bold">{admins}</p>
          </div>
          <span className="text-blue-500 text-3xl">🛡️</span>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Staff Members</p>
            <p className="text-2xl font-bold">{staff}</p>
          </div>
          <span className="text-green-500 text-3xl">👤</span>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </div>
          <span className="text-gray-700 text-3xl">👁️</span>
        </div>
      </div>

      {/* ✅ Registered Staff Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">👥 Registered Staff</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600 font-medium">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {data.filter((u) => u.role === "STAFF").length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No staff members registered yet. Click "Register New Staff" to get started.
                  </td>
                </tr>
              ) : (
                data
                  .filter((u) => u.role === "STAFF")
                  .map((user) => (
                    <tr key={user._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.role}</td>
                      <td className="p-3">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
