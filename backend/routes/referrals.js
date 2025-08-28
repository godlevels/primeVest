import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get referral statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id) 
      .populate({
        path: 'referral.referrals.user',
        select: 'firstName lastName email createdAt wallet.totalDeposited'
      });

    // Calculate referral earnings by level
    const referralEarnings = await Transaction.find({
      user: req.user._id,
      type: 'referral_bonus'
    });

    const earningsByLevel = {
      level1: 0,
      level2: 0,
      level3: 0
    };

    referralEarnings.forEach(earning => {
      const level = earning.description.includes('Level 1') ? 'level1' :
                   earning.description.includes('Level 2') ? 'level2' : 'level3';
      earningsByLevel[level] += earning.amount;
    });

    res.json({
      referralCode: user.referral.code,
      totalReferrals: user.referral.totalReferrals,
      totalEarnings: user.referral.totalReferralEarnings,
      earningsByLevel,
      referrals: user.referral.referrals,
      referralLink: `${process.env.PLATFORM_URL}/register?ref=${user.referral.code}`
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Failed to get referral statistics' });
  }
});

// Get referral tree
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const buildReferralTree = async (userId, level = 1, maxLevel = 3) => {
      if (level > maxLevel) return [];

      const user = await User.findById(userId)
        .select('firstName lastName email createdAt wallet.totalDeposited referral.referrals')
        .populate('referral.referrals.user', 'firstName lastName email createdAt wallet.totalDeposited');

      if (!user) return [];

      const tree = {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          joinedAt: user.createdAt,
          totalDeposited: user.wallet.totalDeposited,
          level
        },
        children: []
      };

      // Get children for next level
      for (const referral of user.referral.referrals) {
        const childTree = await buildReferralTree(referral.user._id, level + 1, maxLevel);
        if (childTree.length > 0) {
          tree.children.push(...childTree);
        } else if (level < maxLevel) {
          tree.children.push({
            user: {
              id: referral.user._id,
              name: `${referral.user.firstName} ${referral.user.lastName}`,
              email: referral.user.email,
              joinedAt: referral.user.createdAt,
              totalDeposited: referral.user.wallet.totalDeposited,
              level: level + 1
            },
            children: []
          });
        }
      }

      return [tree];
    };

    const tree = await buildReferralTree(req.user._id);
    res.json({ tree: tree[0] || { user: null, children: [] } });
  } catch (error) {
    console.error('Get referral tree error:', error);
    res.status(500).json({ message: 'Failed to get referral tree' });
  }
});

export default router;