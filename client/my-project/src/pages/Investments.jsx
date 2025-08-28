/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { TrendingUp, Plus } from 'lucide-react';
import api from '../axiosConfig';

const Investments = () => {
  const [plans, setPlans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [investAmount, setInvestAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const staticPlans = [
        {
          _id: '1',
          name: 'Basic',
          description: 'Starter plan for beginners',
          roiPercentage: 60,
          roiType: 'monthly',
          duration: 30,
          maxAmount: 10,
          isCompounding: false,
        },
        {
          _id: '2',
          name: 'Silver',
          description: 'Great for steady growth',
          roiPercentage: 60,
          roiType: 'monthly',
          duration: 30,
          maxAmount: 25,
          isCompounding: true,
        },
        {
          _id: '3',
          name: 'Gold',
          description: 'Higher returns with medium risk',
          roiPercentage: 60,
          roiType: 'monthly',
          duration: 30,
          maxAmount: 50,
          isCompounding: true,
        },
        {
          _id: '4',
          name: 'Platinum',
          description: 'Premium plan for maximum profit',
          roiPercentage: 60,
          roiType: 'monthly',
          duration: 30,
          maxAmount: 100,
          isCompounding: true,
        },
      ];

      const [plansRes, investmentsRes] = await Promise.all([
        api.get('/investments/plans').catch(() => ({ data: {} })),
        api.get('/investments/my-investments').catch(() => ({ data: {} })),
      ]);

      // ✅ Always fallback if backend data is missing/invalid
      const validPlans =
        Array.isArray(plansRes.data?.plans) && plansRes.data.plans.length > 0
          ? plansRes.data.plans
          : staticPlans;

      setPlans(validPlans);
      setMyInvestments(
        Array.isArray(investmentsRes.data?.investments)
          ? investmentsRes.data.investments
          : []
      );
    } catch (error) {
      toast.error('Failed to load investment data');
      setPlans(staticPlans); 
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (e) => {
    e.preventDefault();

    if (!selectedPlan || !investAmount) {
      toast.error('Please select a plan and enter amount');
      return;
    }

    const amount = parseFloat(investAmount);
    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      toast.error(
        `Amount must be between $${selectedPlan.minAmount} and $${selectedPlan.maxAmount}`
      );
      return;
    }

    try {
      await api.post('/investments/invest', {
        planId: selectedPlan._id,
        amount,
      });

      toast.success('Investment created successfully!');
      setShowInvestModal(false);
      setInvestAmount('');
      setSelectedPlan(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Investment failed');
    }
  };

  const calculateProgress = (investment) => {
    const start = new Date(investment.startDate);
    const end = new Date(investment.endDate);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
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
        <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
      </div>

      {/* Investment Plans */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Available Investment Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <div className="p-2 bg-primary-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                </div>
              </div>

              <p className="text-gray-600 mb-4">{plan.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ROI:</span>
                  <span className="font-medium text-success-600">
                    {plan.roiPercentage}% {plan.roiType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-medium">{plan.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Min Amount:</span>
                  <span className="font-medium">${plan.minAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Amount:</span>
                  <span className="font-medium">${plan.maxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="font-medium">
                    {plan.isCompounding ? 'Compounding' : 'Fixed'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowInvestModal(true);
                }}
                className="w-full btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* My Investments */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          My Investments
        </h2>

        {myInvestments.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No investments yet</p>
            <p className="text-sm text-gray-400">
              Start investing to see your portfolio here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myInvestments.map((investment) => (
              <div key={investment._id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {investment.plan.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Started{' '}
                      {new Date(investment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      investment.status === 'active'
                        ? 'bg-success-100 text-success-800'
                        : investment.status === 'completed'
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {investment.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Investment</p>
                    <p className="font-semibold text-gray-900">
                      ${investment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="font-semibold text-success-600">
                      +${investment.totalEarnings.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ROI Rate</p>
                    <p className="font-semibold text-primary-600">
                      {investment.plan.roiPercentage}%{' '}
                      {investment.plan.roiType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(investment.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {investment.status === 'active' && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(calculateProgress(investment))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${calculateProgress(investment)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investment Modal */}
      {showInvestModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invest in {selectedPlan.name}
            </h3>

            <form onSubmit={handleInvest}>
              <div className="mb-4">
                <label className="label">Investment Amount</label>
                <input
                  type="number"
                  min={selectedPlan.minAmount}
                  max={selectedPlan.maxAmount}
                  step="0.01"
                  className="input-field"
                  placeholder={`Min: $${selectedPlan.minAmount}, Max: $${selectedPlan.maxAmount}`}
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  required
                />
              </div>

              {/* ROI Projection */}
              {investAmount && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-green-700 mb-2">
                    📊 ROI Projection
                  </h4>
                  {(() => {
                    const amount = parseFloat(investAmount) || 0;
                    const dailyRate = selectedPlan.roiPercentage / 100;
                    const totalProfit = selectedPlan.isCompounding
                      ? amount *
                        (Math.pow(1 + dailyRate, selectedPlan.duration) - 1) // compounding
                      : amount * dailyRate * selectedPlan.duration; // fixed ROI
                    const totalReturn = amount + totalProfit;

                    return (
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span>Expected Profit:</span>
                          <span className="font-medium text-green-700">
                            +${totalProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Return:</span>
                          <span className="font-medium text-green-900">
                            ${totalReturn.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{selectedPlan.duration} days</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvestModal(false);
                    setSelectedPlan(null);
                    setInvestAmount('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Confirm Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
