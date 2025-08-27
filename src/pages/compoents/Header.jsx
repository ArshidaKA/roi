// NavbarWithLogout.jsx
import { Link, useNavigate } from "react-router-dom";

export default function NavbarWithLogout({ user }) {
  const navigate = useNavigate();

  // ✅ Logout handler
   function handleLogout() {

    // clear client storage
    localStorage.removeItem("token");
    window.location.href = "/";


}

  return (
    <nav className="sticky top-0 bg-white shadow-sm z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 font-semibold">
          <span className="text-lg">ROI Admin</span>

          <Link to="/dashboard">Dashboard</Link>
          <Link to="/requests">Requests</Link>
          {user?.role === "OWNER" && <Link to="/users">Users</Link>}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-gray-600 text-sm">
              👤 {user.name} ({user.role})
            </span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-xl px-4 py-2 border hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
