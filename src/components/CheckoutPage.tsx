import { useState, useEffect } from 'react';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardNumberElementChangeEvent } from '@stripe/stripe-js';
import { stripePromise, stripeAppearance } from '../stripeConfig';
import type { Product } from '../data';
import { formatPrice } from '../data';
import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

interface CheckoutPageProps {
  cart: CartItem[];
  shippingInfo: ShippingInfo;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

function CheckoutForm({ cart, shippingInfo, onPaymentSuccess, onBack }: CheckoutPageProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [cardBrand, setCardBrand] = useState<string>('unknown');
  const [orderNumber] = useState(() => `AURA-${Math.floor(100000 + Math.random() * 900000)}`);
  const [mounted, setMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod'>('stripe');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (paymentMethod === 'stripe' && cart.length > 0) {
      initializePayment();
    }
  }, [cart, shippingInfo, API_URL, paymentMethod]);

  const initializePayment = async () => {
    try {
      const response = await fetch(`${API_URL}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            productPrice: item.product.price,
            quantity: item.quantity
          })),
          customerInfo: shippingInfo
        }),
      });
      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setPaymentError('Failed to initialize payment gateway.');
      }
    } catch (err) {
      console.error('Payment Init Error:', err);
      setPaymentError('Could not connect to the payment server.');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCardChange = (e: StripeCardNumberElementChangeEvent) => {
    setCardBrand(e.brand ?? 'unknown');
    if (e.error) setPaymentError(e.error.message);
    else setPaymentError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let finalPaymentStatus: 'paid' | 'pending' = 'pending';
      let finalPaymentIntentId = '';
      const resolvedCustomerName = user?.name?.trim() || shippingInfo.fullName.trim();
      const resolvedCustomerEmail = user?.email?.trim() || shippingInfo.email.trim();

      if (paymentMethod === 'stripe') {
        if (!stripe || !elements || !clientSecret) return;
        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) throw new Error('Card element not found');

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingInfo.fullName,
              email: shippingInfo.email,
              address: {
                line1: shippingInfo.address,
                city: shippingInfo.city,
                postal_code: shippingInfo.postalCode,
              },
            },
          },
        });

        if (error) {
          setPaymentError(error.message ?? 'Payment failed. Please try again.');
          setIsProcessing(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          finalPaymentStatus = 'paid';
          finalPaymentIntentId = paymentIntent.id;
        }
      }

      // Persist order to database
      const orderData = {
        orderId: orderNumber,
        userId: user?._id || (user as any)?.id,
        customerInfo: {
          fullName: resolvedCustomerName,
          email: resolvedCustomerEmail,
          addressLine1: shippingInfo.address,
          city: shippingInfo.city,
          postalCode: shippingInfo.postalCode,
        },
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0],
          productPrice: item.product.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        })),
        totalAmount: cartTotal,
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        paymentIntentId: finalPaymentIntentId
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Order could not be saved to our database.');
      }

      setIsComplete(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 4000);
      
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  const brandIcons: Record<string, string> = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 Amex',
    discover: '💳 Discover',
    diners: '💳 Diners',
    jcb: '💳 JCB',
    unionpay: '💳 UnionPay',
    unknown: '💳',
  };

  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: '400',
        color: '#111111',
        '::placeholder': { color: '#9ca3af' },
        fontSmoothing: 'antialiased',
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
  };

  /* ─── SUCCESS SCREEN ─── */
  if (isComplete) {
    const isCod = paymentMethod === 'cod';
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="checkout-success-card glass-card rounded-3xl p-12 max-w-lg w-full text-center">
          <div className="checkout-success-icon mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_8px_40px_rgba(16,185,129,0.4)]">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">{isCod ? 'Order Confirmed!' : 'Payment Successful!'}</h2>
          <p className="text-gray-500 mb-8">{isCod ? 'Your Cash on Delivery order has been placed.' : 'Thank you for shopping with AURA'}</p>

          <div className="glass-panel rounded-2xl p-6 mb-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Number</span>
              <span className="font-mono font-bold text-gray-900">#{orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{isCod ? 'Order Total' : 'Amount Paid'}</span>
              <span className="font-bold text-gray-900">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-700">{shippingInfo.email}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            {isCod ? `Your order confirmation has been sent to ${shippingInfo.email}` : `A confirmation email has been sent to ${shippingInfo.email}`}
          </p>

          <div className="checkout-progress-bar h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-[checkout-progress_4s_linear]" />
          </div>
          <p className="text-xs text-gray-400 mt-3">Redirecting to store...</p>
        </div>
      </div>
    );
  }

  /* ─── CHECKOUT FORM ─── */
  return (
    <div className={`min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </button>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Checkout</h1>
          <p className="text-gray-500 mt-1">Complete your purchase securely with Stripe</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ─── Payment Form ─── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping Summary */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold tracking-widest uppercase text-gray-900">Shipping To</h3>
                <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">Confirmed</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">{shippingInfo.fullName}</p>
                <p>{shippingInfo.address}</p>
                <p>{shippingInfo.city}, {shippingInfo.postalCode}</p>
                <p className="text-gray-400">{shippingInfo.email}</p>
              </div>
            </div>

            {/* Card Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/50 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold tracking-widest uppercase text-gray-900">Payment Method</h3>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-500 font-medium">Secure Checkout</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'stripe' ? 'border-black bg-black/5' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="text-xl">💳</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase">Pay with Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cod' ? 'border-black bg-black/5' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="text-xl">🚚</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase">Cash on Delivery</span>
                    </button>
                  </div>

                  {/* Card UI (only for Stripe) */}
                  {paymentMethod === 'stripe' ? (
                    <div className="animate-fade-in space-y-6">
                      {/* Card Preview */}
                      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                        <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-10">
                            <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80" />
                            <span className="text-xs font-medium opacity-60 tracking-wider">{brandIcons[cardBrand]}</span>
                          </div>
                          <div className="text-lg font-mono tracking-[0.25em] opacity-70 mb-6">•••• •••• •••• ••••</div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1">Card Holder</p>
                              <p className="text-sm font-medium tracking-wide">{shippingInfo.fullName || 'YOUR NAME'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1">Expires</p>
                              <p className="text-sm font-mono">••/••</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stripe Elements */}
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2">
                            Card Number
                          </label>
                          <div className="stripe-element-wrapper glass-panel px-4 py-3.5 rounded-xl transition-all focus-within:ring-2 focus-within:ring-black/20 focus-within:bg-white/90">
                            <CardNumberElement
                              options={elementOptions}
                              onChange={handleCardChange}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2">
                              Expiry Date
                            </label>
                            <div className="stripe-element-wrapper glass-panel px-4 py-3.5 rounded-xl transition-all focus-within:ring-2 focus-within:ring-black/20 focus-within:bg-white/90">
                              <CardExpiryElement options={elementOptions} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2">
                              CVC
                            </label>
                            <div className="stripe-element-wrapper glass-panel px-4 py-3.5 rounded-xl transition-all focus-within:ring-2 focus-within:ring-black/20 focus-within:bg-white/90">
                              <CardCvcElement options={elementOptions} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in py-10 text-center glass-panel rounded-2xl border-dashed border-2 border-black/10">
                      <div className="text-4xl mb-4">🚚</div>
                      <h4 className="font-bold text-gray-900 mb-2">Cash on Delivery</h4>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto px-4">
                        Pay in cash when your order is delivered to your doorstep. Please ensure someone is available at the shipping address to receive the package.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {paymentError && (
                    <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50/80 border border-red-200 rounded-xl px-4 py-3 animate-[checkout-shake_0.4s_ease]">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium">{paymentError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={(paymentMethod === 'stripe' && !stripe) || isProcessing}
                className="w-full glass-dark py-4 rounded-full text-sm font-bold tracking-widest 
                  hover:bg-black/90 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  transition-all duration-300 flex items-center justify-center gap-3 shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {paymentMethod === 'cod' ? 'CONFIRM ORDER' : `PAY ${formatPrice(cartTotal)}`}
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  PCI Compliant
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="font-semibold text-[#635BFF]">stripe</span>
                  Powered
                </div>
              </div>
            </form>
          </div>

          {/* ─── Order Summary ─── */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl p-6 sticky top-28">
              <h3 className="text-sm font-bold tracking-widest uppercase text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-3 group">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      <img src={item.product.images[0]} className="w-full h-full object-cover" alt={item.product.name} loading="lazy" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.selectedColor} · {item.selectedSize}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200/50 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax</span>
                  <span>Included</span>
                </div>
                <div className="border-t border-gray-200/50 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {/* Test mode notice */}
              <div className="mt-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">i</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-900 mb-1">Test Mode</p>
                    <p className="text-[11px] text-indigo-600 leading-relaxed">
                      Use card <span className="font-mono font-bold">4242 4242 4242 4242</span> with any future date and any CVC to test.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Wrapper with Stripe Provider ─── */
export default function CheckoutPage(props: CheckoutPageProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: stripeAppearance,
        locale: 'en',
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}
