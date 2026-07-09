import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Copy, CheckCircle2, AlertCircle, CreditCard, Banknote, Truck } from 'lucide-react'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyNdI5AalFbG_2_CAWq2Jr_xGTpI2j8W5-hnMyg98aaF_88AKxYdzX6SoP3zET63X_HUw/exec'

// ── Replace with your Paystack PUBLIC key from dashboard.paystack.com ──
const PAYSTACK_PUBLIC_KEY = 'pk_live_XXXXXXXvUreW3ZjMcDuMTowd1BZsK9CYJdk7eKJw'

const BANK_DETAILS = {
  bank: 'OPay',
  accountNumber: '8144311841',
  accountName: 'Amos Chegwe',
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button type="button" onClick={handleCopy}
      className="ml-2 p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-black flex-shrink-0"
      title="Copy">
      {copied
        ? <CheckCircle2 size={14} className="text-green-600" />
        : <Copy size={14} />}
    </button>
  )
}

export default function Checkout() {
  const { cart, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '',
    address: '', city: '', phone: '',
    paymentMethod: 'card',
  })
  const [loading, setLoading] = useState(false)
  const [transferConfirmed, setTransferConfirmed] = useState(false)

  // Load Paystack inline script once
  useEffect(() => {
    if (document.getElementById('paystack-script')) return
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-2xl font-bold uppercase mb-4">Your cart is empty</h1>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'paymentMethod') setTransferConfirmed(false)
  }

  const saveOrderLocally = (extraFields = {}) => {
    const order = {
      id: Date.now(),
      ...formData,
      items: cart,
      total,
      createdAt: new Date().toLocaleString(),
      status: 'Pending',
      ...extraFields,
    }
    const existing = JSON.parse(localStorage.getItem('orders') || '[]')
    localStorage.setItem('orders', JSON.stringify([...existing, order]))
    return order
  }

  const notifyAdmin = async (order) => {
    try {
      await fetch(GAS_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'order', order, adminEmail: 'thestyleyouhub@gmail.com' }),
      })
    } catch (_) {}
  }

  // Paystack popup handler
  const initiateCardPayment = () => {
    if (!window.PaystackPop) {
      alert('Payment system is loading, please try again in a moment.')
      return
    }
    setLoading(true)
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: formData.email,
      amount: Math.round(total * 100), // Paystack uses kobo (smallest unit)
      currency: 'NGN',
      ref: `TSYH-${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Customer Name', variable_name: 'customer_name', value: `${formData.firstName} ${formData.lastName}` },
          { display_name: 'Phone', variable_name: 'phone', value: formData.phone },
          { display_name: 'Delivery Address', variable_name: 'address', value: `${formData.address}, ${formData.city}` },
        ]
      },
      callback: async (response) => {
        // Payment successful — reference: response.reference
        const order = saveOrderLocally({ status: 'Paid', paystackRef: response.reference })
        await notifyAdmin(order)
        clearCart()
        navigate(`/checkout/success?id=${order.id}`)
        setLoading(false)
      },
      onClose: () => {
        setLoading(false)
      },
    })
    handler.openIframe()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    if (formData.paymentMethod === 'card') {
      initiateCardPayment()
      return
    }

    if (formData.paymentMethod === 'online' && !transferConfirmed) return

    setLoading(true)
    const order = saveOrderLocally()
    await notifyAdmin(order)
    clearCart()
    navigate(`/checkout/success?id=${order.id}`)
    setLoading(false)
  }

  const paymentOptions = [
    {
      value: 'card',
      icon: <CreditCard size={18} />,
      label: 'Pay with Card',
      desc: 'Visa, Mastercard, Verve — secure checkout powered by Paystack',
    },
    {
      value: 'online',
      icon: <Banknote size={18} />,
      label: 'Bank Transfer (OPay)',
      desc: 'Transfer the exact amount to our OPay account before placing your order',
    },
    {
      value: 'pay_on_delivery',
      icon: <Truck size={18} />,
      label: 'Pay on Delivery',
      desc: 'Pay with cash or card when your order arrives',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 lg:px-20 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* ── Left: Form ── */}
          <div className="order-2 lg:order-1">
            <nav className="flex items-center space-x-2 text-xs mb-8 text-gray-400 uppercase tracking-widest">
              <span className={step >= 1 ? 'text-black font-bold' : ''}>Information</span>
              <ChevronRight size={12} />
              <span className={step >= 2 ? 'text-black font-bold' : ''}>Payment</span>
            </nav>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ── Step 1 ── */}
              {step === 1 && (
                <>
                  <div className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-widest">Contact</h2>
                    <input required type="email" name="email" placeholder="Email address"
                      value={formData.email} onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-widest">Shipping Address</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required type="text" name="firstName" placeholder="First name"
                        value={formData.firstName} onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none" />
                      <input required type="text" name="lastName" placeholder="Last name"
                        value={formData.lastName} onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none" />
                    </div>
                    <input required type="text" name="address" placeholder="Street address"
                      value={formData.address} onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input required type="text" name="city" placeholder="City"
                        value={formData.city} onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none" />
                      <input required type="tel" name="phone" placeholder="Phone number"
                        value={formData.phone} onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none" />
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors text-sm">
                    Continue to Payment
                  </button>
                </>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <>
                  <div className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-widest">Payment Method</h2>

                    <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
                      {paymentOptions.map(opt => (
                        <label key={opt.value}
                          className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${formData.paymentMethod === opt.value ? 'bg-gray-50' : ''}`}>
                          <input type="radio" name="paymentMethod" value={opt.value}
                            checked={formData.paymentMethod === opt.value}
                            onChange={handleInputChange}
                            className="mt-1 accent-black flex-shrink-0" />
                          <span className={`mt-0.5 flex-shrink-0 ${formData.paymentMethod === opt.value ? 'text-black' : 'text-gray-400'}`}>
                            {opt.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Card info notice */}
                    {formData.paymentMethod === 'card' && (
                      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <CreditCard size={14} className="mt-0.5 flex-shrink-0" />
                        <p>A secure Paystack popup will open when you click <strong>Pay Now</strong>. Your card details are never stored on our site.</p>
                      </div>
                    )}

                    {/* Bank transfer details */}
                    {formData.paymentMethod === 'online' && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-green-800">
                          Transfer exactly ₦{total.toLocaleString()} to:
                        </p>
                        <div className="space-y-2">
                          {[
                            { label: 'Bank', value: BANK_DETAILS.bank },
                            { label: 'Account Number', value: BANK_DETAILS.accountNumber, large: true },
                            { label: 'Account Name', value: BANK_DETAILS.accountName },
                          ].map(row => (
                            <div key={row.label}
                              className="flex items-center justify-between bg-white border border-green-100 rounded-lg px-4 py-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{row.label}</p>
                                <p className={`font-bold ${row.large ? 'text-lg tracking-widest' : 'text-sm'}`}>{row.value}</p>
                              </div>
                              <CopyButton text={row.value} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <p>Use your <strong>name or phone number</strong> as the transfer description so we can match your payment quickly.</p>
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={transferConfirmed}
                            onChange={e => setTransferConfirmed(e.target.checked)}
                            className="mt-0.5 accent-black flex-shrink-0" />
                          <span className="text-xs text-gray-700 leading-relaxed">
                            I have transferred <strong>₦{total.toLocaleString()}</strong> to the account above and understand my order will be processed once payment is confirmed.
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button type="submit"
                      disabled={loading || (formData.paymentMethod === 'online' && !transferConfirmed)}
                      className="flex-grow bg-black text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm">
                      {loading
                        ? 'Processing…'
                        : formData.paymentMethod === 'card'
                          ? `Pay ₦${total.toLocaleString()}`
                          : 'Place Order'}
                    </button>
                    <button type="button" onClick={() => setStep(1)}
                      className="text-sm font-medium hover:underline text-center sm:text-left">
                      ← Back
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="order-1 lg:order-2">
            <div className="bg-gray-50 rounded-lg p-6 lg:p-8 sticky top-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative w-14 flex-shrink-0 bg-white border border-gray-200 rounded overflow-hidden" style={{ height: '4.5rem' }}>
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                    </div>
                    <p className="font-medium text-sm flex-shrink-0">
                      ₦{(parseFloat(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-500 font-medium">FREE</span>
                </div>
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <div className="text-right">
                  <span className="text-xs text-gray-400 mr-1">NGN</span>
                  <span className="text-2xl font-bold">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
