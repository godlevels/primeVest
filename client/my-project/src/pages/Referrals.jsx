/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../axiosConfig'; 
import { toast } from 'react-toastify';
import { 
  Users, 
  Copy, 
  Share2, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  Gift
} from 'lucide-react';

const Referrals = () => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await api.get('/referrals/stats'); // ✅ uses token automatically
      setReferralData(response.data);
    } catch (error) {
      console.error("Referral fetch error:", error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralData?.referralLink) return;
    navigator.clipboard.writeText(referralData.referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareReferralLink = () => {
    if (!referralData?.referralLink) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join InvestPro',
        text: 'Start investing and earning with InvestPro!',
        url: referralData.referralLink
      });
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No referral data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
      </div>

      {/* Referral Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-3xl font-bold text-gray-900">
                {referralData.totalReferrals}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-success-600">
                ${referralData.totalEarnings?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <DollarSign className="h-8 w-8 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Referral Code</p>
              <p className="text-2xl font-bold text-primary-600">
                {referralData.referralCode}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Gift className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={referralData.referralLink}
            readOnly
            className="input-field flex-1"
          />
          <button
            onClick={copyReferralLink}
            className="btn-secondary"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={shareReferralLink}
            className="btn-primary"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Share this link to earn referral bonuses when people join and invest!
        </p>
      </div>

      {/* Earnings Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Earnings by Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Level 1 (5%)</p>
                <p className="text-xl font-bold text-blue-900">
                  ${referralData.earningsByLevel?.level1?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Level 2 (2%)</p>
                <p className="text-xl font-bold text-green-900">
                  ${referralData.earningsByLevel?.level2?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Level 3 (1%)</p>
                <p className="text-xl font-bold text-purple-900">
                  ${referralData.earningsByLevel?.level3?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Referrals</h2>
        
        {!referralData.referrals || referralData.referrals.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No referrals yet</p>
            <p className="text-sm text-gray-400">Share your referral link to start earning bonuses!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referralData.referrals.map((referral) => (
              <div key={referral._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-100 rounded-full">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {referral.user.firstName} {referral.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{referral.user.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(referral.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-gray-900">Level {referral.level}</p>
                  <p className="text-sm text-success-600">
                    ${referral.user.wallet?.totalDeposited?.toFixed(2) || '0.00'} invested
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">How Referrals Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Level 1 - 5%</h3>
            <p className="text-sm text-gray-600">
              Earn 5% bonus on direct referrals' investments
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-4">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Level 2 - 2%</h3>
            <p className="text-sm text-gray-600">
              Earn 2% bonus on your referrals' referrals
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-4">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Level 3 - 1%</h3>
            <p className="text-sm text-gray-600">
              Earn 1% bonus on third-level referrals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
