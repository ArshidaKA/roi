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

  const formatCurrency = (num) =>
    `₹${Number(num || 0).toLocaleString("en-IN")}`;
const calcExpenses = (entry) => {
  const purchaseCostSum = (entry.purchaseCost || []).reduce(
    (a, c) => a + (c?.amount || 0),
    0
  );

  const expensesObj = entry.expenses || {};

  const otherExpensesSum = Object.values(expensesObj).reduce((sum, val) => {
    if (Array.isArray(val)) {
      return (
        sum +
        val.reduce((x, y) => x + (y?.amount || 0), 0) // ✅ SAFE ACCESS
      );
    } else if (typeof val === "number") {
      return sum + val;
    }
    return sum;
  }, 0);

  return purchaseCostSum + otherExpensesSum;
};

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="max-w-7xl mx-auto p-6 space-y-10">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-semibold text-zinc-900 tracking-tight">
              ROI Entries
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Financial tracking overview
            </p>
          </div>

          <button
            onClick={() => navigate("/add")}
            className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-zinc-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            + Add Entry
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setStartDate("");
                setEndDate("");
              }}
              className="px-4 py-2 rounded-xl border border-zinc-200 bg-white focus:ring-2 focus:ring-black/10"
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
                  className="px-4 py-2 rounded-xl border border-zinc-200"
                />
                <span className="text-zinc-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-zinc-200"
                />
              </div>
            )}
          </div>

          <button
            onClick={() =>
              navigate(
                `/entries/summary?filter=${filter}&startDate=${startDate}&endDate=${endDate}`
              )
            }
            className="px-5 py-2 bg-black text-white rounded-xl hover:bg-zinc-800 transition-all shadow-sm"
          >
            View →
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200">
          {entries.length > 20 && (
            <h2 className="font-medium text-lg mb-4 text-zinc-700">
              Entries List (Last 20)
            </h2>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
              <LoadingSpinner />
              <p className="mt-2 text-sm">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              No entries found
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <table className="w-full text-sm text-left">
                
                {/* Header */}
                <thead className="bg-zinc-100 text-zinc-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Revenue</th>
                    <th className="p-4">Expenses</th>
                    <th className="p-4">Profit</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {[...entries]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 20)
                    .map((e, i) => {
                      const expenses = calcExpenses(e);
                      const profit = (e.totalRevenue || 0) - expenses;

                      return (
                        <tr
                          key={e._id}
                          className="border-t border-zinc-100 hover:bg-zinc-50 transition"
                        >
                          <td className="p-4 text-zinc-700 font-medium">
                            {new Date(e.date).toLocaleDateString()}
                          </td>

                          <td className="p-4 font-medium text-emerald-600">
                            {formatCurrency(e.totalRevenue)}
                          </td>

                          <td className="p-4 text-red-500">
                            {formatCurrency(expenses)}
                          </td>

                          <td
                            className={`p-4 font-semibold ${
                              profit >= 0
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                          >
                            {formatCurrency(profit)}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              
                              <button
                                onClick={() =>
                                  navigate(`/entries/${e._id}`)
                                }
                                className="px-4 py-1.5 bg-black text-white rounded-lg hover:bg-zinc-800 transition"
                              >
                                View
                              </button>

                              {me?.role === "OWNER" && (
                                <button
                                  onClick={() =>
                                    navigate(`/entries/${e._id}/edit`)
                                  }
                                  className="px-4 py-1.5 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
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