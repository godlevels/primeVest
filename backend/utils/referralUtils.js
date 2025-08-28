import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

// Referral bonus percentages by level
const REFERRAL_BONUSES = {
  1: 0.05, // 5% for level 1 
  2: 0.02, // 2% for level 2
  3: 0.01, // 1% for level 3
};

/**
 * Calculates and distributes referral bonuses up to 3 levels.
 * @param {Object} user - 
 * @param {Number} investmentAmount - 
 */
export const calculateReferralBonus = async (user, investmentAmount) => {
  try {
    if (!user?.referral?.referredBy) return;

    // Build the referrer chain (up to 3 levels)
    const referrerChain = [];
    let currentReferrer = await User.findById(user.referral.referredBy);
    let level = 1;

    while (currentReferrer && level <= 3) {
      referrerChain.push({ user: currentReferrer, level });

      if (currentReferrer?.referral?.referredBy) {
        currentReferrer = await User.findById(currentReferrer.referral.referredBy);
        level++;
      } else {
        break;
      }
    }

    // Process bonuses for each level
    for (const { user: referrer, level } of referrerChain) {
      const bonusPercentage = REFERRAL_BONUSES[level];
      if (!bonusPercentage) continue;

      const bonusAmount = investmentAmount * bonusPercentage;

      // Ensure wallet and referral objects exist
      if (!referrer.wallet) {
        referrer.wallet = {
          balance: 0,
          totalDeposited: 0,
          totalWithdrawn: 0,
          totalEarnings: 0
        };
      }
      if (!referrer.referral) {
        referrer.referral = {
          code: "",
          totalReferrals: 0,
          totalReferralEarnings: 0
        };
      }
      if (typeof referrer.wallet.balance !== "number") referrer.wallet.balance = 0;
      if (typeof referrer.referral.totalReferralEarnings !== "number") referrer.referral.totalReferralEarnings = 0;

      referrer.wallet.balance += bonusAmount;
      referrer.referral.totalReferralEarnings += bonusAmount;
      await referrer.save();

      // Create transaction record
      const transaction = await Transaction.create({
        user: referrer._id,
        type: "referral_bonus",
        amount: bonusAmount,
        description: `Level ${level} referral bonus from ${user.firstName} ${user.lastName}`,
        status: "completed",
      });

      // Create notification
      await Notification.create({
        user: referrer._id,
        title: "Referral Bonus Earned",
        message: `You earned $${bonusAmount.toFixed(
          2
        )} referral bonus from ${user.firstName} ${user.lastName}'s investment`,
        type: "referral",
        relatedTransaction: transaction._id,
      });
    }
  } catch (error) {
    console.error("Referral bonus calculation error:", error);
  }
};