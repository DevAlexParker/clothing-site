import { loadStripe } from '@stripe/stripe-js';

// Your Stripe publishable key (test mode)
// Replace with your keys in the .env file
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Stripe Elements appearance to match AURA's glassmorphism theme
export const stripeAppearance = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: '#111111',
    colorBackground: 'rgba(255, 255, 255, 0.7)',
    colorText: '#111111',
    colorDanger: '#dc2626',
    fontFamily: "'Inter', system-ui, sans-serif",
    spacingUnit: '4px',
    borderRadius: '12px',
    fontSizeBase: '14px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
    colorTextPlaceholder: '#9ca3af',
    colorIconCardError: '#dc2626',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      padding: '12px 16px',
      transition: 'all 0.2s ease',
    },
    '.Input:focus': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(0, 0, 0, 0.2)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    },
    '.Input--invalid': {
      border: '1px solid #dc2626',
      boxShadow: '0 0 0 1px #dc2626',
    },
    '.Label': {
      fontWeight: '600',
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: '#6b7280',
      marginBottom: '8px',
    },
    '.Tab': {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    '.Tab--selected': {
      backgroundColor: '#111111',
      color: '#ffffff',
      border: '1px solid #111111',
    },
    '.Tab:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  },
};
