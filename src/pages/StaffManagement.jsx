// src/pages/StaffManagement.jsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function StaffManagement() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const today = new Date().toISOString().split("T")[0];
  const [attendanceData, setAttendanceData] = useState({});

  // Queries
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await client.get("/staff")).data,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", today],
    queryFn: async () =>
      (await client.get(`/attendance?date=${today}`)).data,
  });

  // Mutations
  const markAttendanceMutation = useMutation({
    mutationFn: (data) => client.post("/attendance", data),
    onSuccess: () => queryClient.invalidateQueries(["attendance", today]),
  });

  // Initialize attendance data
  useEffect(() => {
    const initialData = {};
    staff.forEach((staffMember) => {
      const existing = attendance.find(
        (a) => a.staffId._id === staffMember._id
      );
      initialData[staffMember._id] = existing?.status || "present";
    });
    setAttendanceData(initialData);
  }, [staff, attendance]);

  const handleAttendanceChange = (staffId, status) => {
    setAttendanceData((prev) => ({ ...prev, [staffId]: status }));
    markAttendanceMutation.mutate({
      staffId,
      date: today,
      status,
    });
  };

  const statusOptions = [
    { value: "present", label: "P", color: "bg-green-500" },
    { value: "half-day", label: "H", color: "bg-yellow-400" },
    { value: "leave", label: "L", color: "bg-blue-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Attendance - Today
        </h1>
        <button
          onClick={() => navigate("/manage-staff")}
          className="px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-gray-700 transition"
        >
          Manage Staff
        </button>
      </div>

      {/* Today Date */}
      <div className="mb-6 text-gray-500 text-sm">
        <span>Today's Date: </span>
        <span className="font-medium">{today}</span>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Staff Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">
                Daily Salary
              </th>
              <th className="px-4 py-3 font-medium text-center">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((staffMember) => (
              <tr key={staffMember._id} className="border-t border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {staffMember.name}
                </td>
                <td className="px-4 py-3 text-gray-600">{staffMember.role}</td>
                <td className="px-4 py-3 text-right text-gray-800">
                  ₹{((staffMember.salary || 0) / 30).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-4">
                    {statusOptions.map((option) => {
                      const isActive =
                        attendanceData[staffMember._id] === option.value;
                      return (
                        <div
                          key={option.value}
                          onClick={() =>
                            handleAttendanceChange(staffMember._id, option.value)
                          }
                          className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition ${
                            isActive
                              ? `${option.color} text-white shadow-md`
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          <span className="font-semibold">{option.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
