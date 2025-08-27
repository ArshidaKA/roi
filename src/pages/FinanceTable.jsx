import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { saveAs } from "file-saver";

export default function FinanceTable() {
  const { data: entries = [] } = useQuery(["roi"], () =>
    api.get("/roi/monthly?month=2025-08").then(res => res.data)
  );

  const exportCSV = async () => {
    const res = await api.get("/reports/export", { responseType: "blob" });
    saveAs(res.data, "finance_report.csv");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Finance Report</h1>
        <button onClick={exportCSV} className="bg-green-500 text-white px-4 py-2 rounded">
          Export CSV
        </button>
      </div>
      <table className="w-full border-collapse bg-white shadow-md rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Purchase</th>
            <th className="p-2 border">Revenue</th>
            <th className="p-2 border">Commission %</th>
            <th className="p-2 border">Commission</th>
            <th className="p-2 border">Gross Income</th>
            <th className="p-2 border">Expenses</th>
            <th className="p-2 border">Net</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const commission = (e.revenue * e.commissionPercent) / 100;
            const gross = e.revenue - commission;
            const totalExpenses = e.subItems.reduce((a, s) => a + s.amount, 0);
            const net = gross - e.purchase - totalExpenses;

            return (
              <tr key={i} className="text-center">
                <td className="p-2 border">{new Date(e.date).toLocaleDateString()}</td>
                <td className="p-2 border">₹{e.purchase}</td>
                <td className="p-2 border">₹{e.revenue}</td>
                <td className="p-2 border">{e.commissionPercent}%</td>
                <td className="p-2 border">₹{commission}</td>
                <td className="p-2 border">₹{gross}</td>
                <td className="p-2 border">₹{totalExpenses}</td>
                <td className="p-2 border font-bold">{net}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
