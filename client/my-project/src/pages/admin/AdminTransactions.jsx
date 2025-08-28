import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  DollarSign, 
  Filter, 
  Check, 
  X, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processForm, setProcessForm] = useState({
    action: 'approve',
    notes: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filters]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/admin/transactions', {
        params: {
          page: currentPage,
          limit: 20,
          ...filters
        }
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/admin/transactions/${selectedTransaction._id}/process`, processForm);
      toast.success(`Transaction ${processForm.action}d successfully!`);
      setShowProcessModal(false);
      setProcessForm({ action: 'approve', notes: '' });
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process transaction');
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="h-4 w-4 text-success-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-danger-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'approved':
        return 'bg-primary-100 text-primary-800';
      case 'rejected':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Transaction Type</label>
            <select
              className="input-field"
              value={filters.type}
              onChange={(e) => {
                setFilters({...filters, type: e.target.value});
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="roi_earning">ROI Earnings</option>
              <option value="referral_bonus">Referral Bonuses</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => {
                setFilters({...filters, status: e.target.value});
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ type: '', status: '' });
                setCurrentPage(1);
              }}
              className="btn-secondary w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.user.firstName} {transaction.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.reference}</div>
                    {transaction.paymentMethod && (
                      <div className="text-xs text-gray-500 capitalize">
                        {transaction.paymentMethod.replace('_', ' ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(transaction.type === 'withdrawal' && transaction.status === 'pending') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setProcessForm({ action: 'approve', notes: '' });
                            setShowProcessModal(true);
                          }}
                          className="text-success-600 hover:text-success-900"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setProcessForm({ action: 'reject', notes: '' });
                            setShowProcessModal(true);
                          }}
                          className="text-danger-600 hover:text-danger-900"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {transaction.status !== 'pending' && transaction.processedBy && (
                      <div className="text-xs text-gray-500">
                        Processed by: {transaction.processedBy.firstName} {transaction.processedBy.lastName}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Process Transaction Modal */}
      {showProcessModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {processForm.action === 'approve' ? 'Approve' : 'Reject'} Transaction
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">User:</span>
                  <span className="font-medium">
                    {selectedTransaction.user.firstName} {selectedTransaction.user.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${Math.abs(selectedTransaction.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {selectedTransaction.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium">{selectedTransaction.reference}</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleProcessTransaction}>
              <div className="mb-4">
                <label className="label">Notes (Optional)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Add any notes about this decision..."
                  value={processForm.notes}
                  onChange={(e) => setProcessForm({...processForm, notes: e.target.value})}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProcessModal(false);
                    setSelectedTransaction(null);
                    setProcessForm({ action: 'approve', notes: '' });
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 ${
                    processForm.action === 'approve' ? 'btn-success' : 'btn-danger'
                  }`}
                >
                  {processForm.action === 'approve' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
