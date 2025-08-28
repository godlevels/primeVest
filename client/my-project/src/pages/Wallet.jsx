import React, { useState, useEffect } from 'react';
import api from '../axiosConfig'; 
import { toast } from 'react-toastify';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Minus
} from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const Wallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    paymentMethod: 'usdt_trc20',
    paymentDetails: {}
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paymentMethod: 'usdt_trc20',
    paymentDetails: {}
  });
  const [depositAddress, setDepositAddress] = useState('');

  useEffect(() => {
    fetchWalletData();
    fetchDepositAddress();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await api.get('/wallet');
      setWalletData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepositAddress = async () => {
    try {
      const response = await api.get('/wallet/deposit-address');
      setDepositAddress(response.data.depositAddress);
    } catch (error) {
      console.error("Error fetching deposit address", error);
      setDepositAddress('');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wallet/deposit', depositForm);
      toast.success('Deposit request submitted successfully!');
      setShowDepositModal(false);
      setDepositForm({ amount: '', paymentMethod: 'usdt_trc20', paymentDetails: {} });
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit request failed');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wallet/withdraw', withdrawForm);
      toast.success('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', paymentMethod: 'usdt_trc20', paymentDetails: {} });
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal request failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const wallet = walletData?.wallet || {
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0
  };
  const transactions = walletData?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="btn-success"
          >
            <Plus className="h-4 w-4 mr-2" />
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="btn-primary"
          >
            <Minus className="h-4 w-4 mr-2" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                ${wallet.balance.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <WalletIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deposited</p>
              <p className="text-2xl font-bold text-success-600">
                ${wallet.totalDeposited.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <ArrowDownRight className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Withdrawn</p>
              <p className="text-2xl font-bold text-danger-600">
                ${wallet.totalWithdrawn.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-danger-100 rounded-full">
              <ArrowUpRight className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'deposit' ? 'bg-success-100' :
                    transaction.type === 'withdrawal' ? 'bg-danger-100' :
                    'bg-gray-100'
                  }`}>
                    {transaction.type === 'deposit' ? <ArrowDownRight className="h-4 w-4 text-success-600" /> :
                     transaction.type === 'withdrawal' ? <ArrowUpRight className="h-4 w-4 text-danger-600" /> :
                     <WalletIcon className="h-4 w-4 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {transaction.type}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.amount > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'completed' ? 'bg-success-100 text-success-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
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

      {/* Deposit Modal */}
      <Modal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} title="Deposit USDT (TRC20)">
        <form onSubmit={handleDeposit}>
          <div className="mb-4">
            <label className="label">Amount (USDT)</label>
            <input
              type="number"
              min="10"
              step="0.01"
              className="input-field"
              placeholder="Minimum 10 USDT"
              value={depositForm.amount}
              onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
              required
            />
          </div>

          {/* Show unique TRC20 wallet address from backend */}
          <div className="mb-4">
            <label className="label">Send USDT (TRC20) to this Address:</label>
            <div className="p-3 border rounded bg-gray-100 text-sm font-mono break-all">
              {depositAddress || 'Loading...'}
            </div>
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={() => setShowDepositModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-success flex-1">I Have Paid</button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Withdraw USDT (TRC20)">
        <form onSubmit={handleWithdraw}>
          <div className="mb-4">
            <label className="label">Amount (USDT)</label>
            <input
              type="number"
              min="10"
              max={wallet.balance}
              step="0.01"
              className="input-field"
              placeholder={`Available: ${wallet.balance.toFixed(2)} USDT`}
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="label">Your TRC20 Wallet Address</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your USDT (TRC20) wallet address"
              onChange={(e) => setWithdrawForm({ ...withdrawForm, paymentDetails: { address: e.target.value } })}
              required
            />
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={() => setShowWithdrawModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Submit Withdrawal</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Wallet;
