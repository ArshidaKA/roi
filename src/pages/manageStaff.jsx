// src/pages/ManageStaff.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import client from "../api/client";

export default function ManageStaff() {
  const queryClient = useQueryClient();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    salary: "",
    accommodation: "",
  });

  // Queries
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await client.get("/staff")).data,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => client.post("/staff", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["staff"]);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.put(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["staff"]);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries(["staff"]),
  });

  
  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      salary: Number(formData.salary),
      accommodation: Number(formData.accommodation || 0),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openModal = (staffMember = null) => {
    if (staffMember) {
      setEditingId(staffMember._id);
      setFormData({
        name: staffMember.name,
        role: staffMember.role,
        salary: staffMember.salary,
        accommodation: staffMember.accommodation,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", role: "", salary: "", accommodation: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", role: "", salary: "", accommodation: "" });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
        >
          <FiPlus /> Add Staff
        </button>
      </div>

      

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-right">Salary</th>
              <th className="px-6 py-3 text-right">Accommodation (per day)</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {staff.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3">{s.name}</td>
                <td className="px-6 py-3">{s.role}</td>
                <td className="px-6 py-3 text-right">₹{s.salary?.toLocaleString()}</td>
                <td className="px-6 py-3 text-right">₹{s.accommodation?.toLocaleString()}</td>
                <td className="px-6 py-3 text-center space-x-3">
                  <button
                    onClick={() => openModal(s)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiEdit size={18} />
                  </button>
                  <button
                    onClick={() =>
                      window.confirm("Delete this staff member?") &&
                      deleteMutation.mutate(s._id)
                    }
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">
      {/* Close button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
      >
        ✕
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editingId ? "Edit Staff" : "Add New Staff"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Name
          </label>
          <input
            type="text"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Role
          </label>
          <input
            type="text"
            placeholder="Job title"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Salary
            </label>
            <input
              type="number"
              placeholder="₹ Salary"
              value={formData.salary}
              onChange={(e) =>
                setFormData({ ...formData, salary: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Accommodation (per day)
            </label>
            <input
              type="number"
              placeholder="₹ Amount"
              value={formData.accommodation}
              onChange={(e) =>
                setFormData({ ...formData, accommodation: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition"
          >
            {editingId ? "Update" : "Add"} Staff
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
}
