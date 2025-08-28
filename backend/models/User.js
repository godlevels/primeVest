// backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ Wallet info
    wallet: {
      balance: { type: Number, default: 0 },
      totalDeposited: { type: Number, default: 0 },
      totalWithdrawn: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },

      // ✅ TRC20 USDT deposit address
      usdtDepositAddress: {
        type: String,
        unique: true,
        sparse: true,
      },
      tronPrivateKey: {
        type: String,
        select: false, 
      },
    },

    // ✅ Referrals
    referral: {
      code: { type: String, unique: true },
      referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      referrals: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          level: { type: Number, default: 1 },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      totalReferrals: { type: Number, default: 0 },
      totalReferralEarnings: { type: Number, default: 0 },
    },

    profile: {
      phone: String,
      country: String,
      avatar: String,
      dateOfBirth: Date,
    },

    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

// 🔑 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Generate referral code & update timestamp
userSchema.pre("save", function (next) {
  if (!this.referral.code) {
    this.referral.code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  }
  this.updatedAt = Date.now();
  next();
});

// 🔑 Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 🔑 Virtual full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// 🔑 Transform output (hide sensitive fields)
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    if (ret.wallet) {
      delete ret.wallet.tronPrivateKey;
    }
    return ret;
  },
});

const User = mongoose.model("User", userSchema);
export default User;
