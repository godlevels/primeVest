// models/Investment.js
import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentPlan', 
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  lastROICalculation: {
    type: Date,
    default: Date.now
  },
  roiHistory: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate next ROI payment date
investmentSchema.methods.getNextROIDate = function() {
  const plan = this.plan;
  const lastCalc = this.lastROICalculation;
  const nextDate = new Date(lastCalc);
  
  switch (plan.roiType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};

// Check if investment is expired
investmentSchema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;
