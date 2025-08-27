// src/pages/AddEntry.jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function AddEntry() {
  const navigate = useNavigate();

  // main state
  const [date, setDate] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [purchaseCost, setPurchaseCost] = useState([{ item: "", amount: "" }]);

  // expenses
  const [expenses, setExpenses] = useState({
    staffSalary: [{ name: "", amount: "" }],
    staffAccommodation: [{ name: "", amount: "" }],
    food: "",
    rent: "",
    electricity: "",
    travelFuel: "",
    mobInternet: "",
    maintenance: "",
    transport: "",
    marketing: "",
    consulting: "",
    software: "",
    incentive: "",
    stockClearance: "",
    other: [{ reason: "", amount: "" }],
  });

  // mutation
  const mutation = useMutation({
    mutationFn: (payload) => client.post("/roi", payload),
    onSuccess: () => {
      alert("Entry saved ✅");
      navigate("/dashboard");
    },
  });

  // helper to handle dynamic arrays
  const handleArrayChange = (field, index, key, value) => {
    const arr = [...expenses[field]];
    arr[index][key] = value;
    setExpenses({ ...expenses, [field]: arr });
  };

  const addArrayItem = (field, emptyObj) => {
    setExpenses({ ...expenses, [field]: [...expenses[field], emptyObj] });
  };

  const handleSubmit = () => {
    mutation.mutate({
      date,
      totalRevenue: Number(totalRevenue),
      purchaseCost: purchaseCost.map((p) => ({
        item: p.item,
        amount: Number(p.amount),
      })),
      expenses: {
        ...expenses,
        staffSalary: expenses.staffSalary.map((s) => ({
          name: s.name,
          amount: Number(s.amount),
        })),
        staffAccommodation: expenses.staffAccommodation.map((s) => ({
          name: s.name,
          amount: Number(s.amount),
        })),
        other: expenses.other.map((o) => ({
          reason: o.reason,
          amount: Number(o.amount),
        })),
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add ROI Entry</h1>

      {/* Date */}
      <div className="mb-3">
        <label className="block text-sm">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      {/* Total Revenue */}
      <div className="mb-3">
        <label className="block text-sm">Total Revenue</label>
        <input
          type="number"
          value={totalRevenue}
          onChange={(e) => setTotalRevenue(e.target.value)}
          className="border p-2 w-full rounded"
        />
      </div>

      {/* Purchase Cost */}
      <div className="mb-4">
        <div className="font-semibold mb-2">Purchase Cost</div>
        {purchaseCost.map((p, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Item"
              value={p.item}
              onChange={(e) => {
                const arr = [...purchaseCost];
                arr[i].item = e.target.value;
                setPurchaseCost(arr);
              }}
              className="border p-2 flex-1 rounded"
            />
            <input
              placeholder="Amount"
              type="number"
              value={p.amount}
              onChange={(e) => {
                const arr = [...purchaseCost];
                arr[i].amount = e.target.value;
                setPurchaseCost(arr);
              }}
              className="border p-2 w-32 rounded"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPurchaseCost([...purchaseCost, { item: "", amount: "" }])}
          className="px-3 py-1 border rounded"
        >
          + Add Item
        </button>
      </div>

      {/* Expenses */}
      <div className="mt-6">
        <h2 className="font-semibold mb-3">Expenses</h2>

        {/* Staff Salary */}
        <div className="mb-4">
          <div className="font-medium">Staff Salary</div>
          {expenses.staffSalary.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Name"
                value={s.name}
                onChange={(e) => handleArrayChange("staffSalary", i, "name", e.target.value)}
                className="border p-2 flex-1 rounded"
              />
              <input
                placeholder="Amount"
                type="number"
                value={s.amount}
                onChange={(e) => handleArrayChange("staffSalary", i, "amount", e.target.value)}
                className="border p-2 w-32 rounded"
              />
            </div>
          ))}
          <button
            onClick={() => addArrayItem("staffSalary", { name: "", amount: "" })}
            className="px-3 py-1 border rounded"
          >
            + Add Staff
          </button>
        </div>

        {/* Staff Accommodation */}
        <div className="mb-4">
          <div className="font-medium">Staff Accommodation</div>
          {expenses.staffAccommodation.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Name"
                value={s.name}
                onChange={(e) => handleArrayChange("staffAccommodation", i, "name", e.target.value)}
                className="border p-2 flex-1 rounded"
              />
              <input
                placeholder="Amount"
                type="number"
                value={s.amount}
                onChange={(e) => handleArrayChange("staffAccommodation", i, "amount", e.target.value)}
                className="border p-2 w-32 rounded"
              />
            </div>
          ))}
          <button
            onClick={() => addArrayItem("staffAccommodation", { name: "", amount: "" })}
            className="px-3 py-1 border rounded"
          >
            + Add Accommodation
          </button>
        </div>

        {/* Simple single-value fields */}
        {[
          ["food", "Food & Refreshment"],
          ["rent", "Rent"],
          ["electricity", "Electricity"],
          ["travelFuel", "Travel & Fuel"],
          ["mobInternet", "Mob & Internet"],
          ["maintenance", "Maintenance"],
          ["transport", "Transport"],
          ["marketing", "Marketing"],
          ["consulting", "Consulting"],
          ["software", "Software"],
          ["incentive", "Incentive"],
          ["stockClearance", "Stock Clearance Sale"],
        ].map(([key, label]) => (
          <div key={key} className="mb-3">
            <label className="block text-sm">{label}</label>
            <input
              type="number"
              value={expenses[key]}
              onChange={(e) =>
                setExpenses({ ...expenses, [key]: e.target.value })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        ))}

        {/* Other */}
        <div className="mb-4">
          <div className="font-medium">Other</div>
          {expenses.other.map((o, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Reason"
                value={o.reason}
                onChange={(e) => handleArrayChange("other", i, "reason", e.target.value)}
                className="border p-2 flex-1 rounded"
              />
              <input
                placeholder="Amount"
                type="number"
                value={o.amount}
                onChange={(e) => handleArrayChange("other", i, "amount", e.target.value)}
                className="border p-2 w-32 rounded"
              />
            </div>
          ))}
          <button
            onClick={() => addArrayItem("other", { reason: "", amount: "" })}
            className="px-3 py-1 border rounded"
          >
            + Add Other
          </button>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t py-3 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}
