export const CURRENCY_CODE = 'NGN' as const;
export const CURRENCY_SYMBOL = '₦' as const;

export function formatNaira(
  amount: number,
  options?: { showKobo?: boolean }
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const isNegative = safe < 0;
  const abs = Math.abs(safe);
  const hasFraction = Math.abs(abs - Math.round(abs)) >= 0.005;
  const useKobo = Boolean(options?.showKobo) || hasFraction;

  const formatted = abs.toLocaleString('en-NG', {
    minimumFractionDigits: useKobo ? 2 : 0,
    maximumFractionDigits: useKobo ? 2 : 0,
  });

  return `${isNegative ? '-' : ''}${CURRENCY_SYMBOL}${formatted}`;
}
