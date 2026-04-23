export const MANUAL_PAYMENT_METHODS = ['cash', 'check', 'venmo', 'stripe_manual'] as const
export type ManualPaymentMethod = typeof MANUAL_PAYMENT_METHODS[number]
