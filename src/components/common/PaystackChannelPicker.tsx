import { Building2, CheckCircle2, CreditCard, Hash, Layers } from 'lucide-react';
import {
  PAYSTACK_PAYMENT_OPTIONS,
  type PaystackPaymentOptionId,
} from '../../utils/paystack';

interface PaystackChannelPickerProps {
  selectedOption: PaystackPaymentOptionId;
  onSelect: (optionId: PaystackPaymentOptionId) => void;
  paystackConfigured: boolean;
  darkSurface?: boolean;
}

function getOptionIcon(id: PaystackPaymentOptionId) {
  switch (id) {
    case 'card':
      return <CreditCard className="w-3.5 h-3.5 shrink-0" />;
    case 'bank_transfer':
      return <Building2 className="w-3.5 h-3.5 shrink-0" />;
    case 'ussd':
      return <Hash className="w-3.5 h-3.5 shrink-0" />;
    default:
      return <Layers className="w-3.5 h-3.5 shrink-0" />;
  }
}

export function PaystackChannelPicker({
  selectedOption,
  onSelect,
  paystackConfigured,
  darkSurface = false,
}: PaystackChannelPickerProps) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        darkSurface
          ? 'bg-[#112240] border-[#263d66] text-white'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0a192f]">
          <span className={darkSurface ? 'text-[#f5c451]' : 'text-[#0a192f]'}>
            Paystack NGN Payment Options
          </span>
        </p>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
            paystackConfigured
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {paystackConfigured ? 'Live Gateway' : 'Sandbox Preview'}
        </span>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-1.5"
        role="radiogroup"
        aria-label="Paystack payment channel"
      >
        {PAYSTACK_PAYMENT_OPTIONS.map((option) => {
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={`text-left px-2.5 py-2 rounded-md border cursor-pointer flex items-start gap-2 ${
                isSelected
                  ? 'bg-[#0a192f] text-[#f5c451] border-[#d4af37] ring-1 ring-[#d4af37]'
                  : darkSurface
                  ? 'bg-[#0a192f]/70 text-slate-200 border-[#263d66] hover:border-[#d4af37]/60'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span className="mt-0.5">{getOptionIcon(option.id)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1 text-[11px] font-bold leading-tight">
                  <span className="truncate">{option.label}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 shrink-0 text-[#f5c451]" />}
                </span>
                <span
                  className={`block text-[10px] mt-0.5 leading-snug ${
                    isSelected
                      ? 'text-slate-200'
                      : darkSurface
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {option.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
