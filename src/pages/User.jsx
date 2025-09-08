import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import {
  UserGroupIcon,
  ShieldCheckIcon,
  EyeIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import LoadingSpinner from "./compoents/LoadingSpinner";

export default function Users() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await client.get("/auth/users");
      return res.data.users;
    },
  });

  if (isLoading)
    return  <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
  if (error)
    return (
      <div className="p-6 text-red-500 text-center">
        Failed to load users. Try again later.
      </div>
    );

  const totalUsers = data.length;
  const admins = data.filter((u) => u.role === "OWNER").length;
  const staff = data.filter((u) => u.role === "STAFF").length;

  const roleColor = (role) => {
    switch (role) {
      case "OWNER":
        return "bg-blue-100 text-blue-800";
      case "STAFF":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <UserGroupIcon className="w-8 h-8 text-blue-600" /> Staff Management
        </h1>
        <button
          onClick={() => navigate("/register")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" /> Register New Staff
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500">Administrators</p>
            <p className="text-2xl font-bold">{admins}</p>
          </div>
          <ShieldCheckIcon className="w-10 h-10 text-blue-500" />
        </div>

        <div className="bg-white shadow rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500">Staff Members</p>
            <p className="text-2xl font-bold">{staff}</p>
          </div>
          <UserGroupIcon className="w-10 h-10 text-green-500" />
        </div>

        <div className="bg-white shadow rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </div>
          <EyeIcon className="w-10 h-10 text-gray-700" />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6 text-gray-600" /> Registered Staff
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.filter((u) => u.role === "STAFF").length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500 italic">
                    No staff members registered yet. Click "Register New Staff" to get
                    started.
                  </td>
                </tr>
              ) : (
                data
                  .filter((u) => u.role === "STAFF")
                  .map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="p-4 font-medium">{user.name}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
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
