const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const InvestmentPlan = require('../models/InvestmentPlan');

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/investment_platform');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await InvestmentPlan.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: process.env.ADMIN_EMAIL || 'admin@investment.com',
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });
    await admin.save();
    console.log('Admin user created');

    // Create sample investment plans
    const plans = [
      {
        name: 'Starter Plan',
        description: 'Perfect for beginners looking to start their investment journey with low risk and steady returns.',
        minAmount: 100,
        maxAmount: 1000,
        roiPercentage: 1.5,
        roiType: 'daily',
        duration: 30,
        isCompounding: false,
        features: ['Daily ROI payments', 'Low risk investment', 'Perfect for beginners']
      },
      {
        name: 'Growth Plan',
        description: 'Ideal for investors seeking higher returns with moderate risk and compounding benefits.',
        minAmount: 1000,
        maxAmount: 5000,
        roiPercentage: 2.0,
        roiType: 'daily',
        duration: 45,
        isCompounding: true,
        features: ['Compounding interest', 'Higher ROI rate', 'Medium risk investment']
      },
      {
        name: 'Premium Plan',
        description: 'For serious investors who want maximum returns with our highest ROI rates and exclusive benefits.',
        minAmount: 5000,
        maxAmount: 25000,
        roiPercentage: 2.5,
        roiType: 'daily',
        duration: 60,
        isCompounding: true,
        features: ['Maximum ROI rate', 'Compounding interest', 'Priority support', 'Exclusive benefits']
      },
      {
        name: 'Weekly Saver',
        description: 'A conservative weekly plan perfect for steady, predictable returns over time.',
        minAmount: 500,
        maxAmount: 10000,
        roiPercentage: 8,
        roiType: 'weekly',
        duration: 84, // 12 weeks
        isCompounding: false,
        features: ['Weekly payments', 'Predictable returns', 'Low risk']
      }
    ];

    for (const planData of plans) {
      const plan = new InvestmentPlan(planData);
      await plan.save();
    }
    console.log('Sample investment plans created');

    // Create sample test user
    const testUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', 12),
      isEmailVerified: true,
      wallet: {
        balance: 1000,
        totalDeposited: 1000
      }
    });
    await testUser.save();
    console.log('Test user created');

    console.log('\n=== Database Seeded Successfully ===');
    console.log('Admin Credentials:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\nTest User Credentials:');
    console.log('Email: john.doe@example.com');
    console.log('Password: password123');
    console.log('Wallet Balance: $1000');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
