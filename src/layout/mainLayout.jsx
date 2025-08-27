// layouts/PrivateLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarWithLogout from "../pages/compoents/Header";

export default function PrivateLayout({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      localStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div>
      <NavbarWithLogout user={user} onLogout={handleLogout} />
      <main className="p-4">
        <Outlet /> {/* ✅ renders the child page here */}
      </main>
    </div>
  );
}
