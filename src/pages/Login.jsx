// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../utils/client";

export default function Auth() {
  const [mode, setMode] = useState("login");
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
      } else {
        res = await client.post("/auth/register", form);
      }

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // const userRole = res.data.user?.role;
      // navigate(userRole === "owner" ? "/dashboard" : "/entries");
       navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f7f8]">
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-2xl p-8 space-y-6">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login"
              ? "Login to continue"
              : "Start managing your business"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === "register" && (
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black/80"
              required
            />
          )}

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black/80"
            required
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black/80"
            required
          />

          {/* Premium Black Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-black text-white font-medium tracking-wide 
                       hover:bg-gray-900 transition duration-200 
                       shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-gray-500">
          {mode === "login"
            ? "Don’t have an account?"
            : "Already have an account?"}
          <button
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
            className="ml-1 text-black font-medium hover:underline"
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>

      </div>
    </div>
  );
}