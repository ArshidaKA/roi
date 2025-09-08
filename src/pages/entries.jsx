// Entries.jsx
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./compoents/LoadingSpinner";

export default function Entries() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch ROI entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", filter, startDate, endDate],
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

  // ✅ Currency formatter
  const formatCurrency = (num) => `₹${num.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 🔹 Header + Add Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">📑 ROI Entries</h1>
          <button
            onClick={() => navigate("/add")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            ➕ Add Entry
          </button>
        </div>

        {/* 🔹 Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
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
            <option value="thisMonth">This Month</option>
            <option value="thisYear">This Year</option>
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

        {/* 🔹 Entries Table */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-4">Entries List</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-screen">
                 <LoadingSpinner />
               </div>
          ) : entries.length === 0 ? (
            <p className="text-gray-500">No entries found</p>
          ) : (
            <table className="w-full border text-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
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
                {entries.map((e) => {
                  const expenses = (e.purchaseCost || []).reduce(
                    (a, c) => a + c.amount,
                    0
                  );
                  const profit = (e.totalRevenue || 0) - expenses;
                  const roi = expenses > 0 ? (profit / expenses) * 100 : 0;

                  return (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="p-2 border">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">
                        {formatCurrency(e.totalRevenue)}
                      </td>
                      <td className="p-2 border">
                        {formatCurrency(expenses)}
                      </td>
                      <td className="p-2 border">
                        {formatCurrency(profit)}
                      </td>
                      <td className="p-2 border">{roi.toFixed(1)}%</td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => navigate(`/entries/${e._id}`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
