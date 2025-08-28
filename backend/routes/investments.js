import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import InvestmentPlan from '../models/InvestmentPlan.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateReferralBonus } from '../utils/referralUtils.js';

const router = express.Router(); 

// Get all active investment plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await InvestmentPlan.find({ isActive: true }).sort({ minAmount: 1 });
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Failed to get investment plans' });
  }
});

// Get user's investments
router.get('/my-investments', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id })
      .populate('plan', 'name roiPercentage roiType duration')
      .sort({ createdAt: -1 });

    res.json({ investments });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ message: 'Failed to get investments' });
  }
});

// Create new investment
router.post('/invest', [
  authenticateToken,
  body('planId').isMongoId().withMessage('Valid plan ID required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, amount } = req.body;

    // Get plan and user
    const plan = await InvestmentPlan.findById(planId);
    const user = await User.findById(req.user._id);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Investment plan not found or inactive' });
    }

    // Validate amount
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return res.status(400).json({ 
        message: `Investment amount must be between $${plan.minAmount} and $${plan.maxAmount}` 
      });
    }

    // Check wallet balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Create investment
    const investment = new Investment({
      user: req.user._id,
      plan: planId,
      amount,
      endDate
    });

    await investment.save();

    // Deduct from wallet
    user.wallet.balance -= amount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      type: 'admin_debit',
      amount: -amount,
      description: `Investment in ${plan.name}`,
      status: 'completed',
      investment: investment._id
    });
    await transaction.save();

    // Update plan statistics
    plan.totalInvestments += amount;
    plan.totalUsers += 1;
    await plan.save();

    // Process referral bonuses
    await calculateReferralBonus(user, amount);

    // Create notification
    await new Notification({
      user: req.user._id,
      title: 'Investment Created',
      message: `You have successfully invested $${amount} in ${plan.name}`,
      type: 'system',
      relatedInvestment: investment._id
    }).save();

    res.status(201).json({
      message: 'Investment created successfully',
      investment: await Investment.findById(investment._id).populate('plan')
    });
  } catch (error) {
    console.error('Investment error:', error);
    res.status(500).json({ message: 'Investment creation failed' });
  }
});

// Get investment details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('plan');

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    res.json({ investment });
  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({ message: 'Failed to get investment details' });
  }
});

export default router; 