// backend/routes/wallet.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import dotenv from "dotenv";
import TronWeb from "tronweb";

dotenv.config();
const router = express.Router();


// ✅ Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "" },
  privateKey: process.env.MASTER_TRON_PRIVATE_KEY || "",
});

// backend/routes/wallet.js

// ✅ Get wallet info for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      balance: user.wallet.balance,
      depositAddress: user.wallet.usdtDepositAddress || null,
    });
  } catch (err) {
    console.error("Wallet fetch error:", err);
    res.status(500).json({ message: "Error fetching wallet data" });
  }
});


/**
 * 🔹 Generate or fetch user's deposit address
 */
router.get("/deposit-address", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // ✅ if user already has an address, return it
    if (user.wallet && user.wallet.usdtDepositAddress) {
      return res.json({ depositAddress: user.wallet.usdtDepositAddress });
    }

    // ✅ otherwise generate a new address
    const account = await tronWeb.createAccount();

    user.wallet.usdtDepositAddress = account.address.base58;
    user.wallet.tronPrivateKey = account.privateKey; // store securely!
    await user.save();

    res.json({ depositAddress: account.address.base58 });
  } catch (err) {
    console.error("Deposit address error:", err);
    res.status(500).json({ message: "Error generating deposit address" });
  }
});

/**
 * 🔹 Generate TRC20 deposit address (unique for each user)
 */
router.post("/generate-deposit-address", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // ✅ If user already has an address, reuse it
    if (user.wallet.usdtDepositAddress) {
      return res.json({ depositAddress: user.wallet.usdtDepositAddress });
    }

    // ✅ Generate new TRON account
    const account = await tronWeb.createAccount();

    user.wallet.usdtDepositAddress = account.address.base58;
    user.wallet.tronPrivateKey = account.privateKey;
    await user.save();

    res.json({ depositAddress: account.address.base58 });
  } catch (err) {
    console.error("Deposit address error:", err);
    res.status(500).json({ message: "Error generating deposit address" });
  }
});

/**
 * 🔹 Create a deposit transaction
 */
router.post("/deposit", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user.id);

    if (!user.wallet.usdtDepositAddress) {
      return res.status(400).json({ message: "No deposit address generated" });
    }

    const tx = new Transaction({
      user: user._id,
      type: "deposit",
      amount,
      paymentMethod: "usdt-trc20",
      status: "pending",
    });

    await tx.save();

    res.json({
      message: "Deposit transaction created. Send USDT to your deposit address.",
      depositAddress: user.wallet.usdtDepositAddress,
      reference: tx.reference,
    });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ message: "Error creating deposit transaction" });
  }
});

/**
 * 🔹 Create a withdrawal transaction
 */
router.post("/withdraw", authenticateToken, async (req, res) => {
  try {
    const { amount, toAddress } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!toAddress) {
      return res.status(400).json({ message: "Withdrawal address required" });
    }

    const user = await User.findById(req.user.id);

    if (user.wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const tx = new Transaction({
      user: user._id,
      type: "withdraw",
      amount,
      paymentMethod: "usdt-trc20",
      status: "pending",
    });

    await tx.save();

    // (implementing actual blockchain sending here)
    user.wallet.balance -= amount;
    await user.save();

    res.json({
      message: "Withdrawal request submitted",
      reference: tx.reference,
    });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Error processing withdrawal" });
  }
});

export default router;
