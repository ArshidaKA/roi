// src/pages/AddEntry.jsx
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiChevronLeft } from "react-icons/fi";
import client from "../api/client";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function AddEntry() {
  const navigate = useNavigate();

  // ✅ Fetch logged-in user
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await client.get("/auth/me")).data.user,
  });

  // ✅ Fetch all existing entries
  const { data: entries = [] } = useQuery({
    queryKey: ["entries"],
    queryFn: async () => (await client.get("/roi")).data,
  });

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [totalRevenue, setTotalRevenue] = useState("");
   const [purchaseCost, setPurchaseCost] = useState([{ name: "", amount: "" }]);
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

  const mutation = useMutation({
    mutationFn: (payload) => client.post("/roi", payload),
    onSuccess: () => {
      MySwal.fire({
        icon: "success",
        title: "Saved!",
        text: "Entry saved successfully ✅",
        confirmButtonColor: "#2563eb",
      }).then(() => navigate("/dashboard"));
    },
  });

  const handleArrayChange = (field, index, key, value) => {
    const arr = [...expenses[field]];
    arr[index][key] = value;
    setExpenses({ ...expenses, [field]: arr });
  };

  const addArrayItem = (field, emptyObj) => {
    setExpenses({ ...expenses, [field]: [...expenses[field], emptyObj] });
  };

  const handleSubmit = () => {
    // ✅ Check if entry already exists for selected date
    const duplicate = entries.some(
      (entry) => entry.date.split("T")[0] === date
    );

    if (duplicate) {
      MySwal.fire({
        icon: "error",
        title: "Duplicate Entry",
        text: "An entry for this date already exists ❌",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    MySwal.fire({
      title: "Are you sure?",
      text: "Please confirm all values are correct before saving.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, save it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        mutation.mutate({
          date,
          totalRevenue: Number(totalRevenue),
          purchaseCost: purchaseCost.map((p) => ({
            item: p.name,
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
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">➕ Add ROI Entry</h1>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MinimalInput label="Date" type="date" value={date} onChange={setDate} />
        <MinimalInput
          label="Total Revenue"
          type="number"
          value={totalRevenue}
          onChange={setTotalRevenue}
          placeholder="₹"
        />
      </div>

      {/* Purchase Cost */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700">Purchase Cost</h2>
        {purchaseCost.map((p, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MinimalInput
              placeholder="Name"
  value={p.name} onChange={(val) => {
   const arr = [...purchaseCost];
  arr[i].name = val;
   setPurchaseCost(arr);
 }}
            />
            <MinimalInput
              placeholder="Amount"
              type="number"
              value={p.amount}
              onChange={(val) => {
                const arr = [...purchaseCost];
                arr[i].amount = val;
                setPurchaseCost(arr);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setPurchaseCost([...purchaseCost, { name: "", amount: "" }])
          }
          className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
        >
          <FiPlus /> Add Item
        </button>
      </div>

      {/* Expenses */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-700">Expenses</h2>

        <ExpenseArray
          title="Staff Salary"
          field="staffSalary"
          data={expenses.staffSalary}
          handleChange={handleArrayChange}
          addArrayItem={addArrayItem}
        />

        <ExpenseArray
          title="Staff Accommodation"
          field="staffAccommodation"
          data={expenses.staffAccommodation}
          handleChange={handleArrayChange}
          addArrayItem={addArrayItem}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <MinimalInput
              key={key}
              label={label}
              type="number"
              value={expenses[key]}
              onChange={(val) => setExpenses({ ...expenses, [key]: val })}
              placeholder="₹"
            />
          ))}
        </div>

        <ExpenseArray
          title="Other"
          field="other"
          data={expenses.other}
          handleChange={handleArrayChange}
          addArrayItem={addArrayItem}
        />
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t py-4 flex justify-end gap-3 px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          <FiChevronLeft /> Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}

function MinimalInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-gray-600">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onWheel={(e) => type === "number" && e.target.blur()}
        className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 text-sm"
      />
    </div>
  );
}

function ExpenseArray({ title, field, data, handleChange, addArrayItem }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      {data.map((item, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(item).map((key) => (
            <MinimalInput
              key={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              type={key === "amount" ? "number" : "text"}
              value={item[key]}
              onChange={(val) => handleChange(field, i, key, val)}
            />
          ))}
        </div>
      ))}
      <button
        onClick={() =>
          addArrayItem(
            field,
            Object.fromEntries(Object.keys(data[0]).map((k) => [k, ""]))
          )
        }
        className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
      >
        <FiPlus /> Add {title}
      </button>
    </div>
  );
}
