import { TransactionStatus, TransactionType, WalletTransaction } from '../types';

const BALANCES_KEY = 'business_nexus_wallet_balances';
const TX_KEY = 'business_nexus_wallet_transactions';

type BalancesMap = Record<string, number>;

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const ensureUserBalance = (userId: string) => {
  const balances = readJson<BalancesMap>(BALANCES_KEY, {});
  if (balances[userId] === undefined) {
    balances[userId] = 0;
    writeJson(BALANCES_KEY, balances);
  }
};

export const getWalletBalance = (userId: string): number => {
  ensureUserBalance(userId);
  const balances = readJson<BalancesMap>(BALANCES_KEY, {});
  return Number(balances[userId] || 0);
};

export const getAllWalletBalances = (): BalancesMap => {
  return readJson<BalancesMap>(BALANCES_KEY, {});
};

export const getTransactions = (): WalletTransaction[] => {
  const txs = readJson<WalletTransaction[]>(TX_KEY, []);
  return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getTransactionsForUser = (userId: string): WalletTransaction[] => {
  return getTransactions().filter(t => t.senderId === userId || t.receiverId === userId);
};

const applyBalanceDelta = (userId: string, delta: number) => {
  const balances = readJson<BalancesMap>(BALANCES_KEY, {});
  balances[userId] = Number(balances[userId] || 0) + delta;
  writeJson(BALANCES_KEY, balances);
};

const recordTransaction = (tx: WalletTransaction): WalletTransaction => {
  const txs = readJson<WalletTransaction[]>(TX_KEY, []);
  txs.push(tx);
  writeJson(TX_KEY, txs);
  return tx;
};

const createTx = (params: {
  type: TransactionType;
  amount: number;
  currency?: string;
  senderId?: string;
  receiverId?: string;
  status?: TransactionStatus;
  note?: string;
}): WalletTransaction => {
  return {
    id: generateId('tx'),
    type: params.type,
    amount: params.amount,
    currency: params.currency || 'USD',
    senderId: params.senderId,
    receiverId: params.receiverId,
    status: params.status || 'completed',
    note: params.note,
    createdAt: new Date().toISOString(),
  };
};

export const deposit = (userId: string, amount: number, note?: string): WalletTransaction => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return recordTransaction(createTx({ type: 'deposit', amount, senderId: userId, status: 'failed', note }));
  }

  ensureUserBalance(userId);
  applyBalanceDelta(userId, amount);

  return recordTransaction(createTx({ type: 'deposit', amount, receiverId: userId, status: 'completed', note }));
};

export const withdraw = (userId: string, amount: number, note?: string): WalletTransaction => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return recordTransaction(createTx({ type: 'withdraw', amount, senderId: userId, status: 'failed', note }));
  }

  ensureUserBalance(userId);
  const balance = getWalletBalance(userId);
  if (balance < amount) {
    return recordTransaction(createTx({ type: 'withdraw', amount, senderId: userId, status: 'failed', note: note || 'Insufficient funds' }));
  }

  applyBalanceDelta(userId, -amount);
  return recordTransaction(createTx({ type: 'withdraw', amount, senderId: userId, status: 'completed', note }));
};

export const transfer = (senderId: string, receiverId: string, amount: number, note?: string): WalletTransaction => {
  if (!senderId || !receiverId || senderId === receiverId) {
    return recordTransaction(createTx({ type: 'transfer', amount, senderId, receiverId, status: 'failed', note: note || 'Invalid sender/receiver' }));
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return recordTransaction(createTx({ type: 'transfer', amount, senderId, receiverId, status: 'failed', note }));
  }

  ensureUserBalance(senderId);
  ensureUserBalance(receiverId);

  const balance = getWalletBalance(senderId);
  if (balance < amount) {
    return recordTransaction(createTx({ type: 'transfer', amount, senderId, receiverId, status: 'failed', note: note || 'Insufficient funds' }));
  }

  applyBalanceDelta(senderId, -amount);
  applyBalanceDelta(receiverId, amount);

  return recordTransaction(createTx({ type: 'transfer', amount, senderId, receiverId, status: 'completed', note }));
};

export const fundDeal = (investorId: string, entrepreneurId: string, amount: number, note?: string): WalletTransaction => {
  return transfer(investorId, entrepreneurId, amount, note || 'Deal funding');
};
