import TronWeb from 'tronweb';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
});

export async function checkDepositsForUser(user) {
  try {
    const events = await tronWeb.trx.getTransactionsRelated(user.tronDepositAddress, 'to', 100);

    for (const tx of events) {
      if (tx.raw_data.contract[0].parameter.value.contract_address === process.env.USDT_CONTRACT) {
        const amount = tx.raw_data.contract[0].parameter.value.amount / 1e6; // USDT has 6 decimals

        // Check if already credited
        const exists = await Transaction.findOne({ txId: tx.txID });
        if (exists) continue;

        // Credit user wallet
        user.wallet.balance += amount;
        await user.save();

        await new Transaction({
          user: user._id,
          type: 'deposit',
          amount,
          description: 'USDT Deposit (TRC20)',
          status: 'completed',
          txId: tx.txID
        }).save();
      }
    }
  } catch (error) {
    console.error('Deposit check error:', error);
  }
}
