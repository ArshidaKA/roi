import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EntryDetails from "./pages/EntryDetails";
import Login from "./pages/Login";
import AddEntry from "./pages/AddEntry";
import Requests from "./pages/Requests";
import StaffDashboard from "./pages/staffDashboard";
import { useQuery } from "@tanstack/react-query";
import client from "./api/client";
import PrivateLayout from "./layout/mainLayout";
import Users from "./pages/User";

export default function App() {
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />

      {/* Private with common Navbar */}
      <Route element={<PrivateLayout user={me} />}>
        <Route
          path="/dashboard"
          element={me?.role === "OWNER" ? <Dashboard /> : <StaffDashboard />}
        />
        <Route path="/entries/:id" element={<EntryDetails />} />
        <Route path="/add" element={<AddEntry />} />
        <Route path="/requests" element={<Requests />} />
        {me?.role === "OWNER" && <Route path="/users" element={<Users />} />}
      </Route>
    </Routes>
  );
}
