import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import generateMockData from "../mockData/financeData";

export default function FinancePayroll({ push }) {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [stats, setStats] = useState({
    totalPayroll: "£0",
    monthlyPayroll: "£0",
    employeeCount: 0,
    avgSalary: "£0"
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    employee_name: "",
    amount: "",
    position: "",
    salary_type: "Monthly"
  });
  const [loading, setLoading] = useState(false);

  const fetchPayrollData = useCallback(async () => {
    try {
      setLoading(true);
      const { ledgerEntries } = generateMockData();
      
      // Filter payroll from finance ledger
      const payroll = ledgerEntries.filter(item => item.category === 'Driver Salary' || item.category?.includes('Salary'));
      
      setPayrollRecords(payroll);

      // Calculate stats
      const totalPayroll = payroll.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
      const uniqueEmployees = new Set(payroll.map(p => p.description)).size;

      setStats({
        totalPayroll: `£${totalPayroll.toLocaleString('en-GB')}`,
        monthlyPayroll: `£${(totalPayroll / 12).toLocaleString('en-GB')}`,
        employeeCount: uniqueEmployees,
        avgSalary: `£${(uniqueEmployees > 0 ? totalPayroll / uniqueEmployees : 0).toLocaleString('en-GB')}`
      });
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      push("Using demo data", "info");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const handleAddPayroll = async () => {
    if (!form.employee_name || !form.amount) {
      return push("Employee name and amount are required", "error");
    }

    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/finance/ledger`, {
        date: form.date,
        description: `Salary - ${form.employee_name}`,
        type: "Debit",
        amount: form.amount,
        status: "Completed",
        category: "Driver Salary"
      }, { headers });

      push("Payroll record added successfully", "success");
      setShowModal(false);
      setForm({ date: new Date().toISOString().split('T')[0], employee_name: "", amount: "", position: "", salary_type: "Monthly" });
      fetchPayrollData();
    } catch (err) {
      push("Failed to add payroll record", "error");
    }
  };

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">👥 Payroll & Employee Salaries</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Add Salary</button>
          <button className="btn btn-outline">📊 Payroll Analysis</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 24 }}>
        <div className="stat-card c1 i1">
          <div className="stat-icon">💷</div>
          <div className="stat-value">{stats.totalPayroll}</div>
          <div className="stat-label">Total Payroll</div>
        </div>
        <div className="stat-card c2 i2">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.monthlyPayroll}</div>
          <div className="stat-label">Monthly Avg</div>
        </div>
        <div className="stat-card c5 i5">
          <div className="stat-icon">👤</div>
          <div className="stat-value">{stats.employeeCount}</div>
          <div className="stat-label">Employees</div>
        </div>
        <div className="stat-card c4 i4">
          <div className="stat-icon">💼</div>
          <div className="stat-value">{stats.avgSalary}</div>
          <div className="stat-label">Avg Salary</div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="card">
        <div className="card-header">
          <h3>Payroll History</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Position</th>
                <th>Salary Amount</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollRecords.map((record) => (
                <tr key={`${record.id}-payroll`}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{record.description.replace('Salary - ', '')}</td>
                  <td>-</td>
                  <td style={{ fontWeight: 700 }}>£{parseFloat(record.amount).toLocaleString('en-GB')}</td>
                  <td>Monthly</td>
                  <td>
                    <span className={`pill ${record.status === 'Completed' ? 'green' : 'yellow'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payrollRecords.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>No payroll records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal 
          title="Add Payroll / Salary" 
          onClose={() => setShowModal(false)} 
          onConfirm={handleAddPayroll} 
          loading={loading}
        >
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Salary Amount (£)</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Employee Name</label>
              <input placeholder="Enter employee name" value={form.employee_name} onChange={e => setForm({...form, employee_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Position / Role</label>
              <input placeholder="e.g., Driver, Warehouse Manager" value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Salary Type</label>
              <select value={form.salary_type} onChange={e => setForm({...form, salary_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Bonus">Bonus</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}