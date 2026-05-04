import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  PieChart, BarChart3, Eye, Plus, AlertCircle,
  CheckCircle, Clock, Target, Wallet
} from 'lucide-react';

function BudgetTracking() {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, analyticsRes, forecastRes] = await Promise.all([
        axios.get('/budgets'),
        axios.get('/budgets/analytics/overview'),
        axios.get('/budgets/analytics/forecast')
      ]);
      setBudgets(budgetsRes.data);
      setAnalytics(analyticsRes.data);
      setForecast(forecastRes.data);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (budgetData) => {
    try {
      const response = await axios.post('/budgets', budgetData);
      setBudgets([response.data, ...budgets]);
      setShowBudgetModal(false);
      alert('Budget created successfully!');
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget');
    }
  };

  const getBudgetStatus = (budget) => {
    const utilization = (budget.spent / budget.allocated) * 100;
    if (utilization >= 90) return { color: '#dc2626', status: 'Critical', icon: AlertCircle };
    if (utilization >= 75) return { color: '#f59e0b', status: 'Warning', icon: Clock };
    if (utilization >= 50) return { color: '#3b82f6', status: 'On Track', icon: CheckCircle };
    return { color: '#10b981', status: 'Good', icon: CheckCircle };
  };

  if (loading) {
    return <div className="loading">Loading budget data...</div>;
  }

  return (
    <div className="budget-tracking">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0 }}>Budget Tracking & Analytics</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowTransactionModal(true)}
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Transaction
          </button>
          <button 
            onClick={() => setShowBudgetModal(true)}
            style={{ background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Create Budget
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'overview' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'overview' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'overview' ? '600' : 'normal'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'budgets' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'budgets' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'budgets' ? '600' : 'normal'
          }}
        >
          Budgets
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'analytics' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'analytics' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'analytics' ? '600' : 'normal'
          }}
        >
          Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <Wallet size={28} style={{ color: '#667eea', marginBottom: '8px' }} />
              <h3 style={{ margin: '8px 0', fontSize: '24px' }}>£{analytics.summary.total_budget.toLocaleString()}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Budget</p>
            </div>
            <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <DollarSign size={28} style={{ color: '#10b981', marginBottom: '8px' }} />
              <h3 style={{ margin: '8px 0', fontSize: '24px' }}>£{analytics.summary.total_allocated.toLocaleString()}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Allocated</p>
            </div>
            <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <TrendingDown size={28} style={{ color: '#dc2626', marginBottom: '8px' }} />
              <h3 style={{ margin: '8px 0', fontSize: '24px' }}>£{analytics.summary.total_spent.toLocaleString()}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Spent</p>
            </div>
            <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <Target size={28} style={{ color: '#f59e0b', marginBottom: '8px' }} />
              <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{analytics.summary.overall_utilization.toFixed(1)}%</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Utilization</p>
            </div>
          </div>

          {/* Department Breakdown */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Budget by Department</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {analytics.by_department.map(dept => {
                const utilization = dept.utilization || 0;
                const statusColor = utilization >= 90 ? '#dc2626' : utilization >= 75 ? '#f59e0b' : '#10b981';
                
                return (
                  <div key={dept.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span><strong>{dept.department}</strong></span>
                      <span>£{dept.spent.toLocaleString()} / £{dept.allocated.toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${utilization}%`, 
                        background: statusColor, 
                        height: '8px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#666' }}>
                      <span>{utilization.toFixed(1)}% used</span>
                      <span>Available: £{(dept.available || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Spend Chart */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Monthly Spend Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
              {analytics.monthly_spend.map((month, idx) => {
                const height = (month.amount / Math.max(...analytics.monthly_spend.map(m => m.amount))) * 160;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      height: `${height}px`, 
                      width: '100%', 
                      background: '#667eea', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s'
                    }} />
                    <span style={{ fontSize: '12px', marginTop: '8px' }}>{month.month}</span>
                    <span style={{ fontSize: '10px', color: '#666' }}>£{Math.round(month.amount / 1000)}k</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {budgets.map(budget => {
              const status = getBudgetStatus(budget);
              const StatusIcon = status.icon;
              
              return (
                <div key={budget.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>{budget.name}</h3>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{budget.budget_code}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          background: status.color, 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <StatusIcon size={12} /> {status.status}
                        </span>
                        <button 
                          onClick={() => setSelectedBudget(budget)}
                          style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Department</span>
                        <div style={{ fontWeight: '500' }}>{budget.department}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Fiscal Year</span>
                        <div style={{ fontWeight: '500' }}>{budget.fiscal_year}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Budget</span>
                        <div style={{ fontWeight: '500', color: '#667eea' }}>£{budget.total_budget.toLocaleString()}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Available</span>
                        <div style={{ fontWeight: '500', color: '#10b981' }}>£{budget.available.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Budget Utilization</span>
                        <span>{budget.utilization_percentage?.toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${budget.utilization_percentage}%`, 
                          background: budget.utilization_percentage >= 90 ? '#dc2626' : 
                                     budget.utilization_percentage >= 75 ? '#f59e0b' : '#10b981',
                          height: '8px'
                        }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Allocated</div>
                        <div style={{ fontWeight: '500' }}>£{budget.allocated.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Spent</div>
                        <div style={{ fontWeight: '500', color: '#dc2626' }}>£{budget.spent.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Committed</div>
                        <div style={{ fontWeight: '500', color: '#f59e0b' }}>£{budget.committed.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Available</div>
                        <div style={{ fontWeight: '500', color: '#10b981' }}>£{budget.available.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && forecast && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Forecast</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Current Spend</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>£{forecast.current_spend.toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Monthly Average</span>
                <div style={{ fontSize: '18px', fontWeight: '500' }}>£{forecast.monthly_average.toLocaleString()}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Projected Year End</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: forecast.projected_variance > 0 ? '#dc2626' : '#10b981' }}>
                  £{forecast.forecasted_year_end.toLocaleString()}
                </div>
                <span style={{ fontSize: '12px' }}>
                  {forecast.projected_variance > 0 ? '+' : ''}{forecast.projected_variance.toLocaleString()} vs budget
                </span>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Top Spending Categories</h3>
              {analytics?.top_categories.map((cat, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{cat.category}</span>
                    <span>£{cat.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(cat.amount / analytics.top_categories[0].amount) * 100}%`, 
                      background: '#667eea', 
                      height: '6px' 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Monthly Forecast</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
              {forecast.monthly_forecast.map((month, idx) => {
                const height = (month.forecast / Math.max(...forecast.monthly_forecast.map(m => m.forecast))) * 160;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      height: `${height}px`, 
                      width: '100%', 
                      background: '#f59e0b', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s'
                    }} />
                    <span style={{ fontSize: '12px', marginTop: '8px' }}>{month.month}</span>
                    <span style={{ fontSize: '10px', color: '#666' }}>£{Math.round(month.forecast / 1000)}k</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Budget Detail Modal */}
      {selectedBudget && (
        <BudgetDetailModal 
          budget={selectedBudget}
          onClose={() => setSelectedBudget(null)}
        />
      )}

      {/* Create Budget Modal */}
      {showBudgetModal && (
        <BudgetModal 
          onClose={() => setShowBudgetModal(false)} 
          onSubmit={handleCreateBudget}
        />
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal 
          budgets={budgets}
          onClose={() => setShowTransactionModal(false)} 
        />
      )}
    </div>
  );
}

// Budget Detail Modal
function BudgetDetailModal({ budget, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{budget.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div><strong>Budget Code:</strong> {budget.budget_code}</div>
          <div><strong>Department:</strong> {budget.department}</div>
          <div><strong>Fiscal Year:</strong> {budget.fiscal_year}</div>
          <div><strong>Period:</strong> {budget.start_date} to {budget.end_date}</div>
        </div>
        
        <h4>Category Breakdown</h4>
        {budget.categories.map((cat, idx) => (
          <div key={idx} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>{cat.name}</span>
              <span>£{cat.spent.toLocaleString()} / £{cat.allocated.toLocaleString()}</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${(cat.spent / cat.allocated) * 100}%`, 
                background: '#667eea', 
                height: '6px' 
              }} />
            </div>
          </div>
        ))}
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Budget Modal
function BudgetModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    department: 'Facilities',
    fiscal_year: new Date().getFullYear(),
    total_budget: '',
    categories: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.total_budget) {
      alert('Please fill all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', padding: '24px' }}>
        <h3>Create New Budget</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Budget Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <select
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="Facilities">Facilities</option>
            <option value="IT">IT</option>
            <option value="Operations">Operations</option>
            <option value="Admin">Admin</option>
          </select>
          <input
            type="number"
            placeholder="Total Budget (£) *"
            value={formData.total_budget}
            onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <input
            type="number"
            placeholder="Fiscal Year"
            value={formData.fiscal_year}
            onChange={(e) => setFormData({...formData, fiscal_year: parseInt(e.target.value)})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create Budget</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Transaction Modal
function TransactionModal({ budgets, onClose }) {
  const [formData, setFormData] = useState({
    budget_id: '',
    type: 'spent',
    amount: '',
    category: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.budget_id || !formData.amount) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      await axios.post(`/budgets/${formData.budget_id}/transactions`, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        reference_type: 'manual'
      });
      alert('Transaction added successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', padding: '24px' }}>
        <h3>Add Transaction</h3>
        <form onSubmit={handleSubmit}>
          <select
            value={formData.budget_id}
            onChange={(e) => setFormData({...formData, budget_id: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          >
            <option value="">Select Budget *</option>
            {budgets.map(budget => (
              <option key={budget.id} value={budget.id}>{budget.name}</option>
            ))}
          </select>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="spent">Expense</option>
            <option value="committed">Committed (PO)</option>
          </select>
          <input
            type="number"
            placeholder="Amount (£) *"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', minHeight: '80px' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BudgetTracking;