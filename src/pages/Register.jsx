import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../utils/client";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function RegisterStaff() {
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
      await client.post("/auth/staff", form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // ✅ Small success alert
      await MySwal.fire({
        title: "Success!",
        text: "Staff Registered ✅",
        icon: "success",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "OK",
        width: "300px",       // small width
        padding: "1rem",      // reduce padding
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: "small-swal"
        }
      });

      setForm({ name: "", email: "", password: "" });
      navigate("/dashboard");

    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      setError(message);

      // ❌ Small error alert
      MySwal.fire({
        title: "Error!",
        text: message,
        icon: "error",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "OK",
        width: "300px",
        padding: "1rem",
        customClass: {
          popup: "small-swal"
        }
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Register Staff 👨‍💼
        </h1>
        <p className="text-center text-gray-500 text-sm">
          Owners can add new staff members here
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            required
          />
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
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium shadow hover:bg-blue-700 transition"
          >
            Register Staff
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:underline"
            
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
