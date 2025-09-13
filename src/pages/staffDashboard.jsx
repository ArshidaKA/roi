// src/pages/Dashboard.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import ConfirmDialog from "./compoents/ConfirmDialog";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#A020F0", "#FF1493", "#32CD32", "#FF4500",
  "#FFD700", "#20B2AA", "#DC143C", "#6495ED"
];

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // state
  const [filter, setFilter] = useState("lifetime");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ current user
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  // ✅ ROI entries
  const { data: entries = [] } = useQuery({
    queryKey: ["roi", filter, startDate, endDate],
    queryFn: async () => {
      const params = { filter };
      if (filter === "custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      return (await client.get("/roi", { params })).data;
    },
    enabled: !(filter === "custom" && (!startDate || !endDate)),
  });

  // dialog state
  const [dialog, setDialog] = useState({ open: false, action: null, requestId: null });

  // handle confirm
  const confirmAction = () => {
    if (dialog.requestId && dialog.action) {
      mutation.mutate({ id: dialog.requestId, action: dialog.action });
    }
    setDialog({ open: false, action: null, requestId: null });
  };

  // ✅ edit requests
  const { data: requests = [] } = useQuery({
    queryKey: ["editRequests"],
    queryFn: async () => (await client.get("/roi/edit-requests")).data.requests,
  });

  // ✅ Approve/Reject mutations
  const mutation = useMutation({
    mutationFn: async ({ id, action }) =>
      (await client.patch(`/roi/edit-request/${id}`, { status: action })).data,
    onSuccess: () => {
      queryClient.invalidateQueries(["editRequests"]);
    },
  });

  const pendingRequests = requests?.filter(r => r.status === "PENDING") || [];
  const latestRequests = pendingRequests.slice(0, 3);

  // --- calculations
  const totalRevenue = entries.reduce((a, c) => a + (c.totalRevenue || 0), 0);

  // ✅ FIX: include purchaseCost + all expenses
  const totalExpenses = entries.reduce((a, c) => {
    // purchaseCost array sum
    const purchaseCostSum = (c.purchaseCost || []).reduce(
      (x, y) => x + (y.amount || 0),
      0
    );

    // expenses object sum
    const expensesObj = c.expenses || {};
    const otherExpensesSum = Object.values(expensesObj).reduce((sum, val) => {
      if (Array.isArray(val)) {
        return sum + val.reduce((x, y) => x + (y.amount || 0), 0);
      } else if (typeof val === "number") {
        return sum + val;
      }
      return sum;
    }, 0);

    return a + purchaseCostSum + otherExpensesSum;
  }, 0);

  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // 🔹 Aggregate Expenses by category
  const expenseBreakdown = {};
  entries.forEach(e => {
    const ex = e.expenses || {};
    Object.keys(ex).forEach(key => {
      const val = ex[key];
      if (Array.isArray(val)) {
        const sum = val.reduce((a, c) => a + (c.amount || 0), 0);
        expenseBreakdown[key] = (expenseBreakdown[key] || 0) + sum;
      } else if (typeof val === "number") {
        expenseBreakdown[key] = (expenseBreakdown[key] || 0) + val;
      }
    });

    // also include purchaseCost in breakdown
    const pcSum = (e.purchaseCost || []).reduce((a, c) => a + (c.amount || 0), 0);
    if (pcSum > 0) {
      expenseBreakdown["Purchase Cost"] = (expenseBreakdown["Purchase Cost"] || 0) + pcSum;
    }
  });

  const expenseData = Object.entries(expenseBreakdown)
    .map(([name, value]) => ({ name: name.toUpperCase(), value }))
    .filter(d => d.value > 0);

  // 🔹 Format currency
  const formatCurrency = (num) => `₹${num.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* 🔹 Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {["lifetime", "today", "thisMonth", "thisYear", "custom"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-1 rounded-3xl font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "lifetime"
                ? "Lifetime"
                : f === "today"
                ? "Today"
                : f === "thisMonth"
                ? "This Month"
                : f === "thisYear"
                ? "This Year"
                : "Custom"}
            </button>
          ))}

          {filter === "custom" && (
            <div className="flex gap-2 items-center ml-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-1 rounded-lg"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-3 py-1 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* 🔹 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl p-5 shadow-lg">
            <div className="text-sm font-medium">Total Revenue</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow">
            <div className="text-sm font-medium">Total Expenses</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="bg-gradient-to-r from-green-200 to-green-400 rounded-xl p-5 shadow">
            <div className="text-sm font-medium">Profit</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(profit)}</div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow">
            <div className="text-sm font-medium">Profit Margin</div>
            <div className="text-2xl font-bold mt-1">{profitMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* 🔹 Charts Row */}
        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Expenses Breakdown Chart */}
          <div className="bg-white rounded-xl p-6 shadow flex-1">
            <h2 className="font-semibold mb-4 text-gray-700 text-lg">Expenses Breakdown</h2>
            {expenseData.length === 0 ? (
              <p className="text-gray-500">No expense data available</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={false}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col gap-2">
                  {expenseData.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-700 font-medium">{d.name.toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ROI Performance Trend */}
          <div className="bg-white rounded-xl p-6 shadow flex-1">
            <h2 className="font-semibold mb-4 text-gray-700 text-lg">ROI Performance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={entries.map(e => {
                  const pcSum = (e.purchaseCost || []).reduce((a, c) => a + (c.amount || 0), 0);
                  const expensesObj = e.expenses || {};
                  const otherSum = Object.values(expensesObj).reduce((sum, val) => {
                    if (Array.isArray(val)) {
                      return sum + val.reduce((x, y) => x + (y.amount || 0), 0);
                    } else if (typeof val === "number") {
                      return sum + val;
                    }
                    return sum;
                  }, 0);

                  return {
                    ...e,
                    expenses: pcSum + otherSum,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString()} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="totalRevenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Total Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        

        {/* 🔹 Recent Entries (Last 5) */}
        <div className="bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md rounded-3xl p-6 shadow-xl mt-6 border border-gray-200">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Recent ROI Entries</h2>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead className="bg-gray-100 rounded-t-2xl">
                <tr>
                  {["Date", "Revenue", "Expenses", "Profit", "Actions"].map((h, idx) => (
                    <th key={idx} className="p-3 text-left text-gray-600 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  [...entries]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((e) => {
                      const pcSum = (e.purchaseCost || []).reduce((a, c) => a + (c.amount || 0), 0);
                      const expensesObj = e.expenses || {};
                      const otherSum = Object.values(expensesObj).reduce((sum, val) => {
                        if (Array.isArray(val)) {
                          return sum + val.reduce((x, y) => x + (y.amount || 0), 0);
                        } else if (typeof val === "number") {
                          return sum + val;
                        }
                        return sum;
                      }, 0);

                      const expenses = pcSum + otherSum;
                      const profit = (e.totalRevenue || 0) - expenses;

                      return (
                        <tr
                          key={e._id}
                          className="hover:bg-gray-50 transition-all duration-300 cursor-pointer"
                        >
                          <td className="p-3 border-b">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="p-3 border-b">{formatCurrency(e.totalRevenue)}</td>
                          <td className="p-3 border-b">{formatCurrency(expenses)}</td>
                          <td className="p-3 border-b">{formatCurrency(profit)}</td>
                          <td className="p-3 border-b">
                            <button
                              onClick={() => navigate(`/entries/${e._id}`)}
                              className="p-2 bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <ConfirmDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, action: null, requestId: null })}
        onConfirm={confirmAction}
        title={`${dialog.action === "APPROVED" ? "Approve" : "Reject"} Request`}
        description={`Are you sure you want to ${dialog.action === "APPROVED" ? "approve" : "reject"} this request?`}
      />
    </div>
  );
}
