import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch ROI entries
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
    enabled: !(filter === "custom" && (!startDate || !endDate)), // don’t run until both dates chosen
  });

  // ✅ Calculations
  const totalRevenue = entries.reduce((a, c) => a + (c.totalRevenue || 0), 0);
  const totalExpenses = entries.reduce(
    (a, c) => a + (c.purchaseCost || []).reduce((x, y) => x + y.amount, 0),
    0
  );
  const profit = totalRevenue - totalExpenses;
  const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="font-bold text-lg mb-4">Staff Dashboard</h1>

        {/* 🔹 Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setStartDate("");
              setEndDate("");
            }}
            className="border p-2 rounded"
          >
            <option value="today">Today</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {filter === "custom" && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 rounded"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
          )}
        </div>

        {/* 🔹 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-500 text-white rounded-xl p-4 shadow">
            <div>Total Revenue</div>
            <div className="text-2xl font-bold">${totalRevenue}</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow">
            <div>Total Expenses</div>
            <div className="text-2xl font-bold">${totalExpenses}</div>
          </div>
          <div className="bg-blue-100 rounded-xl p-4 shadow">
            <div>ROI</div>
            <div className="text-2xl font-bold">{roi.toFixed(1)}%</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow">
            <div>Profit Margin</div>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* 🔹 ROI Performance Trend */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-4">ROI Performance Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={entries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="totalRevenue" stroke="#2563eb" />
              <Line
                type="monotone"
                dataKey={(e) =>
                  (e.purchaseCost || []).reduce((a, c) => a + c.amount, 0)
                }
                stroke="#ef4444"
                name="Total Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 Recent Entries Table */}
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Recent ROI Entries</h2>
            <button
              onClick={() => navigate("/add")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              ➕ Add Entry
            </button>
          </div>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Revenue</th>
                <th className="p-2 border">Expenses</th>
                <th className="p-2 border">Profit</th>
                <th className="p-2 border">ROI %</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-3">
                    No entries found
                  </td>
                </tr>
              ) : (
                entries.map((e) => {
                  const expenses = (e.purchaseCost || []).reduce(
                    (a, c) => a + c.amount,
                    0
                  );
                  const profit = (e.totalRevenue || 0) - expenses;
                  const roi = expenses > 0 ? (profit / expenses) * 100 : 0;

                  return (
                    <tr key={e._id}>
                      <td className="p-2 border">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">${e.totalRevenue}</td>
                      <td className="p-2 border">${expenses}</td>
                      <td className="p-2 border">${profit}</td>
                      <td className="p-2 border">{roi.toFixed(1)}%</td>
                      <td className="p-2 border">
                        <button
                          onClick={() => navigate(`/entries/${e._id}`)}
                          className="px-2 py-1 border rounded"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
