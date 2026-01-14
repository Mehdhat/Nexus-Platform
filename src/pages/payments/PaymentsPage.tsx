import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownLeft, ArrowUpRight, Send, Wallet, HandCoins } from 'lucide-react';

import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { findUserById, getUsersByRole } from '../../data/users';
import { deposit, fundDeal, getTransactionsForUser, getWalletBalance, transfer, withdraw } from '../../data/payments';
import { WalletTransaction } from '../../types';

const formatMoney = (amount: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const statusVariant = (status: WalletTransaction['status']) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  return 'error' as const;
};

const statusLabel = (status: WalletTransaction['status']) => {
  if (status === 'completed') return 'Completed';
  if (status === 'pending') return 'Pending';
  return 'Failed';
};

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [fundTo, setFundTo] = useState('');
  const [fundAmount, setFundAmount] = useState('');

  const otherUsers = useMemo(() => {
    if (!user) return [];
    const otherRole = user.role === 'entrepreneur' ? 'investor' : 'entrepreneur';
    return getUsersByRole(otherRole);
  }, [user]);

  const refresh = () => {
    if (!user) return;
    setBalance(getWalletBalance(user.id));
    setTransactions(getTransactionsForUser(user.id));
  };

  useEffect(() => {
    if (!user) return;
    if (!transferTo && otherUsers.length > 0) setTransferTo(otherUsers[0].id);
    if (!fundTo && user.role === 'investor') {
      const entrepreneurs = getUsersByRole('entrepreneur');
      if (entrepreneurs.length > 0) setFundTo(entrepreneurs[0].id);
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, otherUsers.length]);

  if (!user) return null;

  const handleDeposit = () => {
    const amount = Number(depositAmount);
    const tx = deposit(user.id, amount, 'Wallet deposit');
    if (tx.status === 'failed') {
      toast.error(tx.note || 'Deposit failed');
      return;
    }
    toast.success('Deposit completed');
    setDepositAmount('');
    refresh();
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    const tx = withdraw(user.id, amount, 'Wallet withdrawal');
    if (tx.status === 'failed') {
      toast.error(tx.note || 'Withdraw failed');
      return;
    }
    toast.success('Withdrawal completed');
    setWithdrawAmount('');
    refresh();
  };

  const handleTransfer = () => {
    const amount = Number(transferAmount);
    const tx = transfer(user.id, transferTo, amount, 'Wallet transfer');
    if (tx.status === 'failed') {
      toast.error(tx.note || 'Transfer failed');
      return;
    }
    toast.success('Transfer completed');
    setTransferAmount('');
    refresh();
  };

  const handleFund = () => {
    if (user.role !== 'investor') {
      toast.error('Only investors can fund deals in this mock flow');
      return;
    }

    const amount = Number(fundAmount);
    const tx = fundDeal(user.id, fundTo, amount, 'Deal funding');
    if (tx.status === 'failed') {
      toast.error(tx.note || 'Funding failed');
      return;
    }
    toast.success('Deal funded');
    setFundAmount('');
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Mock wallet styled like Stripe/PayPal</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{user.role.toUpperCase()}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Wallet</h2>
              <Wallet size={20} className="text-white" />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <div className="text-sm text-gray-300">Available balance</div>
              <div className="text-3xl font-semibold">{formatMoney(balance, 'USD')}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/10 p-3">
                <div className="text-xs text-gray-300">Transactions</div>
                <div className="text-lg font-semibold">{transactions.length}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <div className="text-xs text-gray-300">Last activity</div>
                <div className="text-sm font-medium">
                  {transactions[0]?.createdAt ? new Date(transactions[0].createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Deposit</h3>
                  <ArrowDownLeft size={18} className="text-success-600" />
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input
                  label="Amount"
                  placeholder="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  fullWidth
                />
                <Button fullWidth variant="success" onClick={handleDeposit}>
                  Deposit
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Withdraw</h3>
                  <ArrowUpRight size={18} className="text-error-600" />
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input
                  label="Amount"
                  placeholder="50"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  fullWidth
                />
                <Button fullWidth variant="error" onClick={handleWithdraw}>
                  Withdraw
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Transfer</h3>
                  <Send size={18} className="text-primary-600" />
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full text-sm rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {otherUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Amount"
                  placeholder="25"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  fullWidth
                />
                <Button fullWidth onClick={handleTransfer}>
                  Transfer
                </Button>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Funding deal</h2>
                <p className="text-sm text-gray-600">Mock flow: Investor → Entrepreneur</p>
              </div>
              <Badge variant={user.role === 'investor' ? 'primary' : 'gray'}>
                {user.role === 'investor' ? 'Enabled' : 'Investor only'}
              </Badge>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entrepreneur</label>
                <select
                  value={fundTo}
                  onChange={(e) => setFundTo(e.target.value)}
                  disabled={user.role !== 'investor'}
                  className="w-full text-sm rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {getUsersByRole('entrepreneur').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount"
                placeholder="500"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                fullWidth
                disabled={user.role !== 'investor'}
              />

              <div className="flex items-end">
                <Button
                  fullWidth
                  variant="secondary"
                  leftIcon={<HandCoins size={18} />}
                  disabled={user.role !== 'investor'}
                  onClick={handleFund}
                >
                  Fund
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Transaction history</h2>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receiver</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-sm text-gray-600" colSpan={5}>
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => {
                        const sender = tx.senderId ? findUserById(tx.senderId) : null;
                        const receiver = tx.receiverId ? findUserById(tx.receiverId) : null;
                        return (
                          <tr key={tx.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{tx.type.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatMoney(tx.amount, tx.currency)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{sender?.name || (tx.senderId || '—')}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{receiver?.name || (tx.receiverId || '—')}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={statusVariant(tx.status)} size="sm">
                                {statusLabel(tx.status)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
