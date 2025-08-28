import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import InvestmentPlan from '../models/InvestmentPlan.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication 
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalInvestments = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingWithdrawals = await Transaction.countDocuments({
      type: 'withdrawal',
      status: 'pending'
    });

    const recentTransactions = await Transaction.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalInvestments: totalInvestments[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        pendingWithdrawals
      },
      recentTransactions
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data' });
  }
});

// Manage investment plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await InvestmentPlan.find().sort({ createdAt: -1 });
    res.json({ plans });
  } catch (error) {
    console.error('Get admin plans error:', error);
    res.status(500).json({ message: 'Failed to get plans' });
  }
});

router.post('/plans', [
  body('name').trim().isLength({ min: 3 }).withMessage('Plan name must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('minAmount').isFloat({ min: 1 }).withMessage('Minimum amount must be greater than 0'),
  body('maxAmount').isFloat({ min: 1 }).withMessage('Maximum amount must be greater than 0'),
  body('roiPercentage').isFloat({ min: 0.1, max: 100 }).withMessage('ROI percentage must be between 0.1 and 100'),
  body('roiType').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid ROI type'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const planData = req.body;
    
    // Validate min/max amounts
    if (planData.minAmount >= planData.maxAmount) {
      return res.status(400).json({ message: 'Maximum amount must be greater than minimum amount' });
    }

    const plan = new InvestmentPlan(planData);
    await plan.save();

    res.status(201).json({
      message: 'Investment plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Failed to create investment plan' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await InvestmentPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Failed to update plan' });
  }
});

// Manage users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = { role: 'user' };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Manage transactions
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get admin transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

// Approve/reject withdrawal
router.put('/transactions/:id/process', [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('notes').optional().trim()
], async (req, res) => { 
  try {
    const { action, notes } = req.body;
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'firstName lastName email wallet');

    if (!transaction || transaction.type !== 'withdrawal') {
      return res.status(404).json({ message: 'Withdrawal transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    transaction.status = action === 'approve' ? 'completed' : 'rejected';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    transaction.notes = notes;

    if (action === 'approve') {
      // Deduct from user wallet for withdrawal
      const user = transaction.user;
      user.wallet.balance -= transaction.amount;
      user.wallet.totalWithdrawn += transaction.amount;
      await user.save();
    }

    await transaction.save();

    // Create notification
    await new Notification({
      user: transaction.user._id,
      title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: `Your withdrawal request of $${transaction.amount} has been ${action}d.`,
      type: 'withdrawal',
      relatedTransaction: transaction._id
    }).save();

    // Send email
    await sendEmail({
      to: transaction.user.email,
      subject: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'} - InvestPro`,
      html: `
        <h2>Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}</h2>
        <p>Dear ${transaction.user.firstName},</p>
        <p>Your withdrawal request of <strong>$${transaction.amount}</strong> has been ${action}d.</p>
        <p>Reference: ${transaction.reference}</p>
        ${notes ? `<p>Notes: ${notes}</p>` : ''}
        <p>Thank you for choosing InvestPro!</p>
      `
    });

    res.json({
      message: `Withdrawal ${action}d successfully`,
      transaction
    });
  } catch (error) {
    console.error('Process transaction error:', error);
    res.status(500).json({ message: 'Failed to process transaction' });
  }
});

// Manual wallet adjustment
router.post('/users/:id/wallet', [
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').trim().isLength({ min: 5 }).withMessage('Description required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, amount, description } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin') {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for debit if insufficient balance
    if (type === 'debit' && user.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient user balance for debit' });
    }

    // Update wallet
    if (type === 'credit') {
      user.wallet.balance += amount;
    } else {
      user.wallet.balance -= amount;
    }
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: type === 'credit' ? 'admin_credit' : 'admin_debit',
      amount: type === 'credit' ? amount : -amount,
      description,
      status: 'completed',
      processedBy: req.user._id,
      processedAt: new Date()
    });
    await transaction.save();

    // Create notification
    await new Notification({
      user: user._id,
      title: `Wallet ${type === 'credit' ? 'Credited' : 'Debited'}`,
      message: `Your wallet has been ${type}ed with $${amount}. ${description}`,
      type: 'system',
      relatedTransaction: transaction._id
    }).save();

    res.json({
      message: `Wallet ${type}ed successfully`,
      transaction,
      newBalance: user.wallet.balance
    });
  } catch (error) {
    console.error('Wallet adjustment error:', error);
    res.status(500).json({ message: 'Failed to adjust wallet' });
  }
});

// Send system announcement
router.post('/announcement', [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  body('sendEmail').isBoolean().withMessage('Send email flag required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, sendEmail: shouldSendEmail } = req.body;

    // Get all users
    const users = await User.find({ role: 'user', isActive: true });

    // Create notifications for all users
    const notifications = users.map(user => ({
      user: user._id,
      title,
      message,
      type: 'system'
    }));

    await Notification.insertMany(notifications);

    // Send emails if requested
    if (shouldSendEmail) {
      const emailPromises = users.map(user =>
        sendEmail({
          to: user.email,
          subject: `${title} - InvestPro`,
          html: `
            <h2>${title}</h2>
            <p>Dear ${user.firstName},</p>
            <div>${message}</div>
            <p>Best regards,<br>InvestPro Team</p>
          `
        })
      );

      await Promise.all(emailPromises);
    }

    res.json({
      message: 'Announcement sent successfully',
      recipientCount: users.length
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ message: 'Failed to send announcement' });
  }
});

export default router;