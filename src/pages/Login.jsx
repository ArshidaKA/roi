// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../utils/client";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "owner" | "staff"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let res;
      if (mode === "login") {
        res = await client.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
      } else if (mode === "owner") {
        res = await client.post("/auth/register-owner", form);
      } else if (mode === "staff") {
        res = await client.post("/auth/staff", form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      alert("Success ✅");
      navigate("/dashboard"); // change this to your protected page
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow rounded-xl p-6">
        <h1 className="text-xl font-semibold mb-4">
          {mode === "login"
            ? "Login"
            : mode === "owner"
            ? "Register Owner"
            : "Register Staff"}
        </h1>

        {error && <div className="text-red-500 mb-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode !== "login" && (
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="border p-2 w-full rounded"
            />
          )}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 w-full rounded"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="border p-2 w-full rounded"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded"
          >
            {mode === "login"
              ? "Login"
              : mode === "owner"
              ? "Register Owner"
              : "Register Staff"}
          </button>
        </form>

        {/* Switch modes */}
        <div className="flex justify-between mt-4 text-sm">
          <button onClick={() => setMode("login")} className="text-blue-600">
            Login
          </button>
          <button onClick={() => setMode("owner")} className="text-blue-600">
            Owner Register
          </button>
          <button onClick={() => setMode("staff")} className="text-blue-600">
            Staff Register
          </button>
        </div>
      </div>
    </div>
  );
}
