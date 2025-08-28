import cron from 'node-cron';
import moment from 'moment';
import Investment from '../models/Investment.js';
import InvestmentPlan from '../models/InvestmentPlan.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { calculateReferralBonus } from './referralUtils.js';
 
// Calculate and distribute ROI earnings
export const calculateROIEarnings = async () => {
  try {
    console.log('Starting ROI calculation...');
    
    const activeInvestments = await Investment.find({ status: 'active' })
      .populate('plan')
      .populate('user'); 
 
    for (const investment of activeInvestments) {
      const { plan, user } = investment;
      const now = new Date();
      
      // Check if investment has expired
      if (now > investment.endDate) {
        investment.status = 'completed';
        await investment.save();
        
        // Send completion notification
        await new Notification({
          user: user._id,
          title: 'Investment Completed',
          message: `Your investment in ${plan.name} has been completed. Total earnings: $${investment.totalEarnings.toFixed(2)}`,
          type: 'plan_expiry',
          relatedInvestment: investment._id
        }).save();
        
        continue;
      }

      // Calculate next ROI payment date
      const lastCalc = moment(investment.lastROICalculation);
      const nextPayment = moment(lastCalc);
      
      switch (plan.roiType) {
        case 'daily':
          nextPayment.add(1, 'day');
          break;
        case 'weekly':
          nextPayment.add(1, 'week');
          break;
        case 'monthly':
          nextPayment.add(1, 'month');
          break;
      }

      // Check if it's time for ROI payment
      if (moment().isSameOrAfter(nextPayment)) {
        let roiAmount;
        
        if (plan.isCompounding) {
          const currentValue = investment.amount + investment.totalEarnings;
          roiAmount = currentValue * (plan.roiPercentage / 100);
        } else {
          roiAmount = investment.amount * (plan.roiPercentage / 100);
        }

        // Update investment
        investment.totalEarnings += roiAmount;
        investment.lastROICalculation = now;
        investment.roiHistory.push({
          amount: roiAmount,
          date: now,
          type: plan.roiType
        });
        await investment.save();

        // Update user wallet
        user.wallet.balance += roiAmount;
        user.wallet.totalEarnings += roiAmount;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
          user: user._id,
          type: 'roi_earning',
          amount: roiAmount,
          description: `${plan.roiType} ROI from ${plan.name}`,
          status: 'completed',
          investment: investment._id
        });
        await transaction.save();

        // Create notification
        await new Notification({
          user: user._id,
          title: 'ROI Credited',
          message: `$${roiAmount.toFixed(2)} ROI has been credited to your wallet from ${plan.name}`,
          type: 'roi_earning',
          relatedTransaction: transaction._id,
          relatedInvestment: investment._id
        }).save();

        // Send email notification
        await sendEmail({
          to: user.email,
          subject: 'ROI Credited - InvestPro',
          html: `
            <h2>ROI Credited to Your Account</h2>
            <p>Dear ${user.firstName},</p>
            <p>Your ${plan.roiType} ROI of <strong>$${roiAmount.toFixed(2)}</strong> has been credited to your wallet.</p>
            <p>Investment Plan: ${plan.name}</p>
            <p>Current Wallet Balance: $${user.wallet.balance.toFixed(2)}</p>
            <p>Thank you for investing with InvestPro!</p>
          `
        });

        console.log(`ROI of $${roiAmount.toFixed(2)} credited to user ${user.email}`);
      }
    }
    
    console.log('ROI calculation completed');
  } catch (error) {
    console.error('ROI calculation error:', error);
  }
};

// Schedule ROI calculation to run every hour
cron.schedule('0 * * * *', calculateROIEarnings);

// Schedule daily cleanup tasks
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily cleanup tasks...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });
    
    console.log('Daily cleanup completed');
  } catch (error) {
    console.error('Daily cleanup error:', error);
  }
});

console.log('Cron jobs initialized');
