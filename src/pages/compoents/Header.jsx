// NavbarWithLogout.jsx
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../../api/client";

export default function NavbarWithLogout({ user }) {
  const navigate = useNavigate();

  // ✅ Fetch pending requests count
  const { data: pendingCount } = useQuery({
    queryKey: ["pendingRequestsCount"],
    queryFn: async () => {
      const res = await client.get("/roi/edit-requests/pending/count");
      return res.data.count; // backend should return { count: number }
    },
    enabled: !!user, // only fetch if logged in
  });

  console.log(pendingCount,"hjjjjjjjjjj")
  // ✅ Logout handler
  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 bg-blue-600 text-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <span className="text-xl font-bold tracking-wide">ROI Admin</span>

        {/* Centered Nav Links */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-8 font-medium text-white">
            <Link
              to="/dashboard"
              className="hover:text-blue-200 transition-colors"
            >
              Dashboard
            </Link>

            <Link
              to="/entries"
              className="hover:text-blue-200 transition-colors"
            >
              Entries
            </Link>

            {user?.role === "OWNER" && (
              <Link
                to="/users"
                className="hover:text-blue-200 transition-colors"
              >
                Users
              </Link>
            )}

            <Link
              to="/requests"
              className="hover:text-blue-200 transition-colors relative"
            >
              Requests
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-4 bg-orange-500 text-xs px-1  rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-blue-100 font-medium">
              👤 {user.name} ({user.role})
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 font-semibold rounded-full px-4 py-2 shadow hover:bg-blue-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
