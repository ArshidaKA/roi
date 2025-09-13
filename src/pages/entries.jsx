// src/pages/Entries.jsx
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./compoents/LoadingSpinner";

export default function Entries() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("lifetime");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", filter, startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (filter !== "lifetime") params.filter = filter;
      if (filter === "custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      return (await client.get("/roi", { params })).data;
    },
    enabled: !(filter === "custom" && (!startDate || !endDate)),
  });

  const formatCurrency = (num) => `₹${Number(num || 0).toLocaleString("en-IN")}`;

  // 🔹 Calculate total expenses (purchaseCost + expenses object)
  const calcExpenses = (entry) => {
    const purchaseCostSum = (entry.purchaseCost || []).reduce(
      (a, c) => a + (c.amount || 0),
      0
    );

    const expensesObj = entry.expenses || {};
    const otherExpensesSum = Object.values(expensesObj).reduce((sum, val) => {
      if (Array.isArray(val)) {
        return sum + val.reduce((x, y) => x + (y.amount || 0), 0);
      } else if (typeof val === "number") {
        return sum + val;
      }
      return sum;
    }, 0);

    return purchaseCostSum + otherExpensesSum;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 🔹 Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📑 ROI Entries</h1>
          <button
            onClick={() => navigate("/add")}
            className="px-4 py-1 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
          >
            + Add Entry
          </button>
        </div>

        {/* 🔹 Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-md justify-between">
          <div className="flex gap-4 items-center">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setStartDate("");
                setEndDate("");
              }}
              className="border border-gray-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="lifetime">Lifetime</option>
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
                  className="border border-gray-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 🔹 Main View Button */}
          <button
            onClick={() =>
              navigate(
                `/entries/summary?filter=${filter}&startDate=${startDate}&endDate=${endDate}`
              )
            }
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow"
          >
            View  →
          </button>
        </div>

        {/* 🔹 Entries Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
           {entries.length>20&&<h2 className="font-semibold text-lg mb-4 text-gray-700">
            Entries List (Last 20)
          </h2>}

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No entries found</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3 border-b">Date</th>
                    <th className="p-3 border-b">Revenue</th>
                    <th className="p-3 border-b">Expenses</th>
                    <th className="p-3 border-b">Profit</th>
                    <th className="p-3 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries]
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // 🔹 Latest first
                    .slice(0, 20) // 🔹 Show only last 20
                    .map((e, i) => {
                      const expenses = calcExpenses(e);
                      const profit = (e.totalRevenue || 0) - expenses;

                      return (
                        <tr
                          key={e._id}
                          className={`transition ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50`}
                        >
                          <td className="p-3 border-b font-medium text-gray-700">
                            {new Date(e.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 border-b font-semibold text-green-600">
                            {formatCurrency(e.totalRevenue)}
                          </td>
                          <td className="p-3 border-b text-red-600">
                            {formatCurrency(expenses)}
                          </td>
                          <td
                            className={`p-3 border-b font-semibold ${
                              profit >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {formatCurrency(profit)}
                          </td>
                          <td className="p-3 border-b text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => navigate(`/entries/${e._id}`)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                View
                              </button>

                              {me?.role === "OWNER" && (
                                <button
                                  onClick={() =>
                                    navigate(`/entries/${e._id}/edit`)
                                  }
                                  className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
