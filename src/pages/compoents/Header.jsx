// NavbarWithLogout.jsx
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import client from "../../api/client";
import {
  FiUsers, FiGrid, FiFileText, FiInbox, FiLogOut,
  FiUser, FiPackage,
} from "react-icons/fi";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .nav-root {
    position: sticky; top: 0; z-index: 50;
    background: #FFFFFF;
    border-bottom: 1px solid #ECEAE4;
    box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
    font-family: 'Outfit', 'Helvetica Neue', sans-serif;
  }
  .nav-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 0 28px; height: 80px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 24px;
  }

  /* Brand */
  .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; }
  .nav-brand-icon {
    ; background:#0D0D0D; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,.18);
  }
  .nav-brand-icon svg { width:16px; height:16px; stroke:#fff; }
  .nav-brand-eyebrow { font-family:'JetBrains Mono',monospace; font-size:9px; color:#B0AEA8; letter-spacing:.14em; text-transform:uppercase; line-height:1; margin-bottom:2px; }
  .nav-brand-name    { font-family:'Instrument Serif',Georgia,serif; font-size:17px; font-weight:400; color:#0D0D0D; line-height:1; letter-spacing:-.01em; }

  /* Nav links */
  .nav-links { display:flex; align-items:center; gap:2px; flex:1; justify-content:center; }
  .nav-link  {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:9px;
    font-size:13px; font-weight:500; color:#6B6A66;
    text-decoration:none; position:relative;
    transition:background .15s,color .15s; white-space:nowrap;
  }
  .nav-link:hover         { background:#F5F4F1; color:#0D0D0D; }
  .nav-link.active        { background:#F0EEEA; color:#0D0D0D; }
  .nav-link svg           { width:14px; height:14px; flex-shrink:0; }
  .nav-link-badge {
    position:absolute; top:4px; right:4px;
    background:#E11D48; color:#fff;
    font-size:9px; font-weight:600;
    min-width:16px; height:16px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    padding:0 4px; font-family:'JetBrains Mono',monospace;
    box-shadow:0 1px 4px rgba(225,29,72,.35);
    border:1.5px solid #fff;
  }

  /* Right */
  .nav-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .nav-user  {
    display:flex; align-items:center; gap:8px;
    padding:6px 12px; background:#F8F7F4;
    border:1px solid #ECEAE4; border-radius:9px;
  }
  .nav-user-avatar {
    width:26px; height:26px; background:#0D0D0D; border-radius:50%;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .nav-user-avatar svg { width:13px; height:13px; stroke:#fff; }
  .nav-user-name {
    font-size:12px; font-weight:500; color:#0D0D0D;
    max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  .nav-user-role {
    font-family:'JetBrains Mono',monospace; font-size:9px; color:#B0AEA8;
    letter-spacing:.08em; text-transform:uppercase;
    background:#ECEAE4; border-radius:4px; padding:2px 6px;
  }
  .nav-logout-btn {
    display:flex; align-items:center; gap:6px;
    padding:7px 14px; background:#0D0D0D; color:#fff;
    border:none; border-radius:9px;
    font-family:'Outfit',sans-serif; font-size:13px; font-weight:500;
    cursor:pointer; letter-spacing:.01em;
    box-shadow:0 2px 8px rgba(0,0,0,.18),0 1px 2px rgba(0,0,0,.12);
    transition:transform .12s,box-shadow .12s,background .1s;
  }

  .nav-logo {
  height: 64px;
  width: auto;
  object-fit: contain;
  display: block;
}
  .nav-logout-btn:hover  { background:#222; transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.22); }
  .nav-logout-btn:active { transform:scale(.98); }
  .nav-logout-btn svg    { width:13px; height:13px; stroke:#fff; }
`;

export default function NavbarWithLogout({ user }) {
  const location = useLocation();

  const { data: pendingCount } = useQuery({
    queryKey: ["pendingRequestsCount"],
    queryFn: async () => {
      const res = await client.get("/roi/edit-requests/pending/count");
      return res.data.count;
    },
    enabled: !!user,
  });

  async function handleLogout() {
    const result = await Swal.fire({
      title: "Log out?",
      text: "You will be signed out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      confirmButtonColor: "#0D0D0D",
      cancelButtonColor: "#6B6A66",
    });
    if (result.isConfirmed) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  }

  const isActive = path => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="nav-root">
      <style>{CSS}</style>
      <div className="nav-inner">

        {/* Brand */}
      <a href="/dashboard" className="nav-brand">
  <img 
    src="/logo.png"   // 👈 put your logo in public folder
    alt="KBC Logo"
    className="nav-logo"
  />
</a>

        {/* Nav Links */}
        <div className="nav-links">

          {user?.role === "OWNER" && (
            <Link to="/dashboard" className={`nav-link${isActive("/dashboard") ? " active" : ""}`}>
              <FiGrid /> Dashboard
            </Link>
          )}

          <Link to="/entries" className={`nav-link${isActive("/entries") ? " active" : ""}`}>
            <FiFileText /> Entries
          </Link>

          {user?.role === "OWNER" && (
            <Link to="/users" className={`nav-link${isActive("/users") ? " active" : ""}`}>
              <FiUsers /> Users
            </Link>
          )}

          <Link to="/requests" className={`nav-link${isActive("/requests") ? " active" : ""}`}>
            <FiInbox /> Requests
            {pendingCount > 0 && (
              <span className="nav-link-badge">{pendingCount}</span>
            )}
          </Link>

          <Link to="/staff" className={`nav-link${isActive("/staff") ? " active" : ""}`}>
            <FiUsers /> Staff
          </Link>

          {/* ── Stock Management ── */}
          <Link to="/stock" className={`nav-link${isActive("/stock") ? " active" : ""}`}>
            <FiPackage /> Stock
          </Link>

        </div>

        {/* Right: user chip + logout */}
        <div className="nav-right">
          {user && (
            <div className="nav-user">
              <div className="nav-user-avatar"><FiUser /></div>
              <span className="nav-user-name">{user.name}</span>
              <span className="nav-user-role">{user.role}</span>
            </div>
          )}
          <button className="nav-logout-btn" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>

      </div>
    </nav>
  );
}