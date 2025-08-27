import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./compoents/Header";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("today");

  // ✅ current user
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  // ✅ ROI entries
  const { data: entries = [] } = useQuery({
    queryKey: ["roi", filter],
    queryFn: async () => (await client.get("/roi", { params: { filter } })).data,
  });

  // --- calculations
  const totalRevenue = entries.reduce((a,c)=>a+c.totalRevenue,0);
  const totalExpenses = entries.reduce((a,c)=>a+c.purchaseCost.reduce((x,y)=>x+y.amount,0),0);
  const profit = totalRevenue - totalExpenses;
  const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <h1>{me?.role} <span>{me?.name}</span></h1>

        {/* Filters */}
        <div className="flex gap-2">
          {["today","thisMonth","thisYear","date","month"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded ${filter===f ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              {f==="today"?"Today":f==="thisMonth"?"This Month":f==="thisYear"?"This Year":f==="date"?"Specific Date":"Specific Month"}
            </button>
          ))}
        </div>

        {/* Stats cards */}
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

        {/* ROI Performance Trend */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-4">ROI Performance Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={entries}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="date" tickFormatter={d=>new Date(d).toLocaleDateString()}/>
              <YAxis/>
              <Tooltip/>
              <Line type="monotone" dataKey="totalRevenue" stroke="#2563eb"/>
              <Line type="monotone" dataKey="totalExpenses" stroke="#ef4444"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent entries */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-4">Recent ROI Entries</h2>
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
                <tr><td colSpan={6} className="text-center p-3">No entries found</td></tr>
              ) : entries.map(e=>(
                <tr key={e._id}>
                  <td className="p-2 border">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="p-2 border">${e.totalRevenue}</td>
                  <td className="p-2 border">${e.purchaseCost.reduce((a,c)=>a+c.amount,0)}</td>
                  <td className="p-2 border">${e.totalRevenue - e.purchaseCost.reduce((a,c)=>a+c.amount,0)}</td>
                  <td className="p-2 border">{((e.totalRevenue - e.purchaseCost.reduce((a,c)=>a+c.amount,0)) / e.purchaseCost.reduce((a,c)=>a+c.amount,0) * 100).toFixed(1)}%</td>
                  <td className="p-2 border">
                    <button onClick={()=>navigate(`/entries/${e._id}`)} className="px-2 py-1 border rounded">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
