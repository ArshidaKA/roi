// src/pages/EntrySummary.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

export default function EntrySummary() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const filter = searchParams.get("filter") || "lifetime";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entriesSummary", filter, startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (filter !== "lifetime") params.filter = filter;
      if (filter === "custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      return (await client.get("/roi", { params })).data;
    },
  });

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // ✅ Same calcExpenses as Entries.jsx
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

  // ✅ Calculate totals correctly
  const totals = entries.reduce(
    (acc, e) => {
      const expenses = calcExpenses(e);
      const profit = (e.totalRevenue || 0) - expenses;
      acc.revenue += e.totalRevenue || 0;
      acc.expenses += expenses;
      acc.profit += profit;
      return acc;
    },
    { revenue: 0, expenses: 0, profit: 0 }
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 transition"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">📊 Summary View</h1>
      </div>

      {isLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500">No entries found for this filter.</p>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-md space-y-4">
          <h2 className="font-semibold text-lg">Filter: {filter}</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-gray-50 font-semibold">
                <td className="p-3">Total Revenue</td>
                <td className="p-3 text-right text-blue-600">
                  {fmt(totals.revenue)}
                </td>
              </tr>
              <tr>
                <td className="p-3">Total Expenses</td>
                <td className="p-3 text-right">{fmt(totals.expenses)}</td>
              </tr>
              <tr className="bg-green-50 font-bold">
                <td className="p-3">Net Profit</td>
                <td className="p-3 text-right text-green-600">
                  {fmt(totals.profit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
