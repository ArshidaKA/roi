// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../utils/client";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // ✅ Start loading

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

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          {mode === "login" ? "Welcome Back 👋" : "Create an Account"}
        </h1>
        <p className="text-center text-gray-500 text-sm">
          {mode === "login"
            ? "Login to access your dashboard"
            : "Sign up to get started"}
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading} // ✅ prevent multiple clicks
            className={`w-full py-3 rounded-lg font-medium shadow transition ${
              loading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 100 16v-4l-3.5 3.5L12 24v-4a8 8 0 01-8-8z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : mode === "login" ? (
              "Login"
            ) : (
              "Register"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
