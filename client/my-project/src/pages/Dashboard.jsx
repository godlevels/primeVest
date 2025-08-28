/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import api from '../axiosConfig';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/users/dashboard"); // ✅ secured request
      setDashboardData(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ✅ prevent destructuring crash
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  const {
    user,
    wallet,
    activeInvestments,
    recentTransactions,
    recentEarnings,
    stats,
  } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-primary-100">
          Here's an overview of your investment portfolio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${wallet.balance.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Wallet className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Investments</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalActiveInvestment.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                ${wallet.totalEarnings.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-full">
              <DollarSign className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Referrals</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReferrals}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Investments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Active Investments</h2>
          <a href="/investments" className="text-primary-600 hover:text-primary-700 font-medium">
            View All
          </a>
        </div>
        
        {activeInvestments.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No active investments yet</p>
            <a href="/investments" className="btn-primary mt-4 inline-block">
              Start Investing
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {activeInvestments.map((investment) => (
              <div key={investment._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{investment.plan.name}</h3>
                    <p className="text-sm text-gray-600">
                      ${investment.amount.toFixed(2)} • {investment.plan.roiPercentage}% {investment.plan.roiType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success-600">
                      +${investment.totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Earnings</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.round(((new Date() - new Date(investment.startDate)) / (new Date(investment.endDate) - new Date(investment.startDate))) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{
                        width: `${Math.min(100, Math.round(((new Date() - new Date(investment.startDate)) / (new Date(investment.endDate) - new Date(investment.startDate))) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <a href="/wallet" className="text-primary-600 hover:text-primary-700 font-medium">
              View All
            </a>
          </div>
          
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'deposit' ? 'bg-success-100' :
                      transaction.type === 'withdrawal' ? 'bg-danger-100' :
                      transaction.type === 'roi_earning' ? 'bg-primary-100' :
                      'bg-gray-100'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <ArrowDownRight className={`h-4 w-4 ${
                          transaction.type === 'deposit' ? 'text-success-600' : 'text-gray-600'
                        }`} />
                      ) : (
                        <ArrowUpRight className={`h-4 w-4 ${
                          transaction.type === 'withdrawal' ? 'text-danger-600' :
                          transaction.type === 'roi_earning' ? 'text-primary-600' :
                          'text-gray-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {transaction.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.amount > 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'completed' ? 'bg-success-100 text-success-800' :
                      transaction.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                      'bg-danger-100 text-danger-800'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Earnings</h2>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          
          {recentEarnings.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No earnings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEarnings.map((earning) => (
                <div key={earning._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-success-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">ROI Payment</p>
                      <p className="text-sm text-gray-500">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success-600">
                      +${earning.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
