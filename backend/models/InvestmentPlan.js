// models/InvestmentPlan.js
import mongoose from 'mongoose';

const investmentPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  minAmount: {
    type: Number,
    required: true,
    min: 0
  },
  maxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  roiPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  roiType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  duration: {
    type: Number,
    required: true, // in days
    min: 1
  },
  isCompounding: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalInvestments: {
    type: Number,
    default: 0
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  features: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update `updatedAt` before saving
investmentPlanSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total ROI for the plan
investmentPlanSchema.methods.calculateTotalROI = function () {
  const periodsPerDay = this.roiType === 'daily' ? 1 :
    this.roiType === 'weekly' ? 1 / 7 : 1 / 30;
  const totalPeriods = this.duration * periodsPerDay;

  if (this.isCompounding) {
    return Math.pow(1 + (this.roiPercentage / 100), totalPeriods) - 1;
  } else {
    return (this.roiPercentage / 100) * totalPeriods;
  }
};

const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);

export default InvestmentPlan;
