import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign,
  Calendar,
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    minAmount: '',
    maxAmount: '',
    roiPercentage: '',
    roiType: 'daily',
    duration: '',
    isCompounding: false,
    features: []
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/admin/plans');
      setPlans(response.data.plans);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlan) {
        await axios.put(`/api/admin/plans/${editingPlan._id}`, planForm);
        toast.success('Plan updated successfully!');
      } else {
        await axios.post('/api/admin/plans', planForm);
        toast.success('Plan created successfully!');
      }
      
      setShowPlanModal(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: '',
      description: '',
      minAmount: '',
      maxAmount: '',
      roiPercentage: '',
      roiType: 'daily',
      duration: '',
      isCompounding: false,
      features: []
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan) => {
    setPlanForm({
      name: plan.name,
      description: plan.description,
      minAmount: plan.minAmount,
      maxAmount: plan.maxAmount,
      roiPercentage: plan.roiPercentage,
      roiType: plan.roiType,
      duration: plan.duration,
      isCompounding: plan.isCompounding,
      features: plan.features || []
    });
    setEditingPlan(plan);
    setShowPlanModal(true);
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      await axios.put(`/api/admin/plans/${planId}`, { isActive: !currentStatus });
      toast.success('Plan status updated!');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Investment Plans</h1>
        <button
          onClick={() => setShowPlanModal(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan._id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => togglePlanStatus(plan._id, plan.isActive)}
                  className={`${plan.isActive ? 'text-success-600' : 'text-gray-400'}`}
                  title={plan.isActive ? 'Active' : 'Inactive'}
                >
                  {plan.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => handleEdit(plan)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ROI:</span>
                <span className="font-medium text-success-600">
                  {plan.roiPercentage}% {plan.roiType}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="font-medium">{plan.duration} days</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount Range:</span>
                <span className="font-medium">${plan.minAmount} - ${plan.maxAmount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="font-medium">
                  {plan.isCompounding ? 'Compounding' : 'Fixed'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Invested:</span>
                <span className="font-medium text-primary-600">
                  ${plan.totalInvestments.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Users:</span>
                <span className="font-medium">{plan.totalUsers}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plan.isActive ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  Created {new Date(plan.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No investment plans yet</p>
          <button
            onClick={() => setShowPlanModal(true)}
            className="btn-primary mt-4"
          >
            Create Your First Plan
          </button>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Plan Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Starter Plan"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Describe the plan benefits..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">Minimum Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="input-field"
                    value={planForm.minAmount}
                    onChange={(e) => setPlanForm({...planForm, minAmount: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">Maximum Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="input-field"
                    value={planForm.maxAmount}
                    onChange={(e) => setPlanForm({...planForm, maxAmount: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">ROI Percentage (%)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    className="input-field"
                    value={planForm.roiPercentage}
                    onChange={(e) => setPlanForm({...planForm, roiPercentage: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">ROI Type</label>
                  <select
                    className="input-field"
                    value={planForm.roiType}
                    onChange={(e) => setPlanForm({...planForm, roiType: e.target.value})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="label">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={planForm.duration}
                    onChange={(e) => setPlanForm({...planForm, duration: e.target.value})}
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCompounding"
                    className="mr-2"
                    checked={planForm.isCompounding}
                    onChange={(e) => setPlanForm({...planForm, isCompounding: e.target.checked})}
                  />
                  <label htmlFor="isCompounding" className="text-sm font-medium text-gray-700">
                    Compounding Interest
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
