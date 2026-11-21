import React from 'react';
import {
  ExternalLink,
  Users,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatNaira } from '../../utils/currency';

export function AffiliateManagementPanel() {
  const {
    affiliates,
    affiliateConversions,
    affiliatePayouts,
    updateAffiliateCommissionRate,
    updateAffiliateConversionStatus,
    updateAffiliatePayoutStatus,
    navigate,
  } = useStore();

  // KPI calculations
  const totalAffiliates = affiliates.length;
  const totalReferredOrders = affiliateConversions.length;
  const totalSalesVolume = affiliateConversions.reduce(
    (sum, c) => sum + (c.orderTotal || 0),
    0
  );
  const pendingCommissions = affiliateConversions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
  const settledPayouts = affiliatePayouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Map of conversion count by affiliate code
  const conversionsByCode = affiliateConversions.reduce<Record<string, number>>(
    (acc, c) => {
      const code = (c.affiliateCode || '').toUpperCase();
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Affiliate Partners, Conversions & Payouts
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Monitor partner referrals, adjust commission percentages (default 20%), approve conversions, and settle withdrawal requests.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/affiliates')}
          className="px-3.5 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Partner Portal</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Affiliates
            </p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
              {totalAffiliates}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Referred Orders
            </p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
              {totalReferredOrders}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Sales Volume
            </p>
            <p className="text-lg font-bold font-display text-slate-900 mt-1 tabular-nums">
              {formatNaira(totalSalesVolume)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Pending Commissions
            </p>
            <p className="text-lg font-bold font-display text-amber-700 mt-1 tabular-nums">
              {formatNaira(pendingCommissions)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Settled Payouts
            </p>
            <p className="text-lg font-bold font-display text-emerald-700 mt-1 tabular-nums">
              {formatNaira(settledPayouts)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 1. Registered Affiliates Table */}
      <section className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between bg-slate-50">
          <h2 className="font-display text-sm font-bold text-[#1d2327]">
            Registered Affiliates ({affiliates.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            Standard Commission: 20%
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-2.5">Partner Name & Email</th>
              <th className="px-4 py-2.5">Referral Code</th>
              <th className="px-4 py-2.5 text-center">Clicks</th>
              <th className="px-4 py-2.5 text-center">Referred Orders</th>
              <th className="px-4 py-2.5">Commission Rate (%)</th>
              <th className="px-4 py-2.5">Payout Method</th>
              <th className="px-4 py-2.5">Settlement Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No registered affiliates found.
                </td>
              </tr>
            ) : (
              affiliates.map((aff) => {
                const referredCount = conversionsByCode[aff.code.toUpperCase()] || 0;
                // Commission rate is stored directly as a whole number integer (e.g. 20)
                const rateInt = Math.round(aff.commissionRate);
                return (
                  <tr key={aff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-900">{aff.userName}</p>
                      <p className="text-[11px] text-slate-500">{aff.userEmail}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-bold text-[#2271b1] px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                        {aff.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium text-slate-700">
                      {aff.clicks}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800">
                        {referredCount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={75}
                          aria-label={`Commission rate for ${aff.userName}`}
                          value={rateInt}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!Number.isNaN(val)) {
                              updateAffiliateCommissionRate(aff.id, val);
                            }
                          }}
                          className="w-16 h-8 px-2 border border-[#8c8f94] rounded-sm text-xs font-bold tabular-nums text-slate-900 bg-white focus:outline-none focus:border-[#2271b1]"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-800">
                        {aff.payoutMethod}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">
                      {aff.bankDetails}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* 2. Referral Conversions Ledger */}
      <section className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between bg-slate-50">
          <h2 className="font-display text-sm font-bold text-[#1d2327]">
            Referral Conversions Ledger ({affiliateConversions.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            20% standard attribution on net sales
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-2.5">Order ID</th>
              <th className="px-4 py-2.5">Ref Code</th>
              <th className="px-4 py-2.5">Buyer</th>
              <th className="px-4 py-2.5 text-right">Order Total</th>
              <th className="px-4 py-2.5 text-right">Commission</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            {affiliateConversions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No referral conversions recorded yet.
                </td>
              </tr>
            ) : (
              affiliateConversions.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-bold text-[#2271b1]">
                    {conv.orderId}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                    {conv.affiliateCode}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {conv.buyerName}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    {formatNaira(conv.orderTotal)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                    {formatNaira(conv.commissionAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${
                        conv.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : conv.status === 'paid'
                          ? 'bg-blue-100 text-blue-800'
                          : conv.status === 'declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                    {conv.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAffiliateConversionStatus(conv.id, 'approved')
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {conv.status !== 'paid' && conv.status !== 'declined' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAffiliateConversionStatus(conv.id, 'paid')
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#2271b1] bg-sky-50 border border-sky-300 rounded hover:bg-sky-100 cursor-pointer"
                      >
                        Mark Paid
                      </button>
                    )}
                    {conv.status !== 'declined' && conv.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAffiliateConversionStatus(conv.id, 'declined')
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded hover:bg-rose-100 cursor-pointer"
                      >
                        Decline
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* 3. Payout Requests */}
      <section className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between bg-slate-50">
          <h2 className="font-display text-sm font-bold text-[#1d2327]">
            Payout Requests ({affiliatePayouts.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            Bank Transfer / GTB Settlement queue
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-2.5">Partner</th>
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Settlement Bank / GTB Details</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            {affiliatePayouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No withdrawal requests pending.
                </td>
              </tr>
            ) : (
              affiliatePayouts.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-900">
                    {pay.affiliateName}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#2271b1]">
                    {pay.affiliateCode}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">
                    {pay.bankDetails}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    {formatNaira(pay.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${
                        pay.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pay.status === 'declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pay.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-1.5 whitespace-nowrap">
                    {pay.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateAffiliatePayoutStatus(pay.id, 'paid')}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded cursor-pointer shadow-sm"
                        >
                          Mark Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAffiliatePayoutStatus(pay.id, 'declined')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-300 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
