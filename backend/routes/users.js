import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().trim(),
  body('country').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get active investments
    const activeInvestments = await Investment.find({
      user: req.user._id,
      status: 'active'
    }).populate('plan', 'name roiPercentage roiType duration');

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent ROI earnings
    const recentEarnings = await Transaction.find({
      user: req.user._id,
      type: 'roi_earning'
    }).sort({ createdAt: -1 }).limit(5);

    // Calculate total active investment amount
    const totalActiveInvestment = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      user,
      wallet: user.wallet,
      activeInvestments,
      recentTransactions,
      recentEarnings,
      stats: {
        totalActiveInvestment,
        totalReferrals: user.referral.totalReferrals,
        totalReferralEarnings: user.referral.totalReferralEarnings
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data' });
  }
});
 
export default router;