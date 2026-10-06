import { useState, useEffect, useRef } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Copy, CheckCircle2, AlertCircle, CreditCard, Banknote, Upload, X } from 'lucide-react'
import { saveOrder } from '../lib/ordersApi'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'
import LazyImage from '../components/LazyImage'
import { compressImageFile } from '../lib/imageUtils'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { useStore } from '../lib/store'
import { NIGERIA, STATES } from '../lib/nigeria'
import { getDeliveryFee, DELIVERY_TBC_MESSAGE } from '../lib/deliveryApi'

// ── Replace with your Paystack PUBLIC key from dashboard.paystack.com ──
const PAYSTACK_PUBLIC_KEY = 'pk_live_ffedac69295791001805bbe82c00257a2cbe2a90'

const BANK_DETAILS = {
  bank: 'OPay',
  accountNumber: '7075896812',
  accountName: 'ADEOLA LAWAL',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Accepts Nigerian numbers in local (0803...) or international (+234803...) form
const PHONE_RE = /^(\+?234|0)[789][01]\d{8}$/

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

function FieldError({ children }) {
  if (!children) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{children}</p>
}

const SAVED_KEY = 'tsyh_customer'
const BLANK = { email: '', firstName: '', lastName: '', address: '', state: '', lga: '', phone: '' }
const readSaved = () => { try { const v = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null'); return v && v.email ? v : null } catch { return null } }

export default function Checkout() {
  const { cart, total: subtotal, clearCart } = useCart()
  const { delivery, products } = useStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const saved = useRef(readSaved()).current           // details remembered from a previous order on this device
  const [formData, setFormData] = useState({ ...BLANK, ...(saved || {}), paymentMethod: 'card' })
  const [usingSaved, setUsingSaved] = useState(!!saved)
  const [remember, setRemember] = useState(true)

  const useDifferentDetails = () => { setFormData((f) => ({ ...BLANK, paymentMethod: f.paymentMethod })); setErrors({}); setUsingSaved(false); setRemember(false) }
  const useSavedDetails = () => { setFormData((f) => ({ ...f, ...saved })); setErrors({}); setUsingSaved(true); setRemember(true) }
  const forgetDetails = () => { localStorage.removeItem(SAVED_KEY); setUsingSaved(false); setFormData((f) => ({ ...BLANK, paymentMethod: f.paymentMethod })) }
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [paymentProof, setPaymentProof] = useState(null)
  const [proofUploading, setProofUploading] = useState(false)
  const formSectionRef = useRef(null)

  // Delivery fee comes live from the admin's price list (state → LGA).
  const deliveryFee = getDeliveryFee(delivery, formData.state, formData.lga) // number | null
  const feeUnknown = !!formData.lga && deliveryFee === null
  const total = subtotal + (deliveryFee || 0)

  // Load Paystack inline script once
  useEffect(() => {
    if (document.getElementById('paystack-script')) return
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Animate the form section whenever the step changes, so moving between
  // "Information" and "Payment" feels intentional rather than an abrupt swap.
  useEffect(() => {
    if (prefersReducedMotion || !formSectionRef.current) return
    gsap.fromTo(
      formSectionRef.current,
      { opacity: 0, x: 12 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, [step])

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-2xl font-bold uppercase mb-4">Your cart is empty</h1>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === 'state' ? { lga: '' } : {}) }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
    if (name === 'paymentMethod') {
      setTransferConfirmed(false)
      setPaymentProof(null)
    }
  }

  const validateStep1 = () => {
    const next = {}
    if (!EMAIL_RE.test(formData.email.trim())) next.email = 'Enter a valid email address'
    if (!formData.firstName.trim()) next.firstName = 'Required'
    if (!formData.lastName.trim()) next.lastName = 'Required'
    if (!formData.address.trim()) next.address = 'Required'
    if (!formData.state) next.state = 'Select your state'
    if (!formData.lga) next.lga = 'Select your local government'
    if (!PHONE_RE.test(formData.phone.replace(/\s/g, ''))) next.phone = 'Enter a valid Nigerian phone number'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      toast('Please fix the highlighted fields', { type: 'error' })
      return false
    }
    return true
  }

  const buildOrder = (extraFields = {}) => ({
    id: Date.now(),
    ...formData,
    items: cart,
    subtotal,
    total,
    deliveryFee,
    city: `${formData.lga}, ${formData.state}`,
    createdAt: new Date().toLocaleString(),
    status: 'Pending',
    ...(paymentProof ? { paymentProof } : {}),
    ...extraFields,
  })

  const finalizeOrder = async (order) => {
    if (remember) {
      const { email, firstName, lastName, address, state, lga, phone } = order
      try { localStorage.setItem(SAVED_KEY, JSON.stringify({ email, firstName, lastName, address, state, lga, phone })) } catch { /* storage full/blocked */ }
    }
    const { synced } = await saveOrder(order)
    clearCart()
    navigate(`/checkout/success?id=${order.id}`)
    if (!synced) {
      toast('Order saved on this device. It will sync to the admin dashboard once you\'re back online.', { type: 'info', duration: 6000 })
    }
  }

  // Paystack popup handler
  // Charges `total` = items + delivery fee (delivery is ₦0 when the admin hasn't
  // priced the chosen LGA yet, so card payment still works in that case).
  const initiateCardPayment = () => {
    if (!window.PaystackPop) {
      toast('Payment system is still loading — please try again in a moment.', { type: 'error' })
      return
    }
    const amountKobo = Math.round(Number(total) * 100)
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      toast('Could not work out your total — please refresh and try again.', { type: 'error' })
      return
    }
    setLoading(true)

    // Safety net: if no Paystack window ever appears, stop the endless "Processing…"
    let opened = false
    const watchdog = setTimeout(() => {
      if (!opened && !document.querySelector('iframe[src*="paystack"], iframe[name*="paystack"]')) {
        setLoading(false)
        toast('The card window could not open. Check your connection or disable ad-blockers, then try again.', { type: 'error', duration: 7000 })
      }
    }, 12000)

    // Paystack's callback must be a plain function (not async), so the async work lives inside it.
    const onSuccess = (response) => {
      opened = true
      clearTimeout(watchdog)
      ;(async () => {
        const order = buildOrder({ status: 'Paid', paystackRef: response.reference })
        await finalizeOrder(order)
        setLoading(false)
      })()
    }

    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: formData.email.trim(),
        amount: amountKobo, // kobo
        currency: 'NGN',
        ref: `TSYH-${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: 'Customer Name', variable_name: 'customer_name', value: `${formData.firstName} ${formData.lastName}` },
            { display_name: 'Phone', variable_name: 'phone', value: formData.phone },
            { display_name: 'Delivery Address', variable_name: 'address', value: `${formData.address}, ${formData.lga}, ${formData.state}` },
            { display_name: 'Delivery Fee', variable_name: 'delivery_fee', value: deliveryFee !== null ? String(deliveryFee) : 'To be confirmed' },
          ],
        },
        callback: onSuccess,
        onClose: () => {
          opened = true
          clearTimeout(watchdog)
          setLoading(false)
          toast('Payment cancelled.', { type: 'info' })
        },
      })
      handler.openIframe()
    } catch (err) {
      clearTimeout(watchdog)
      console.error('[checkout] Paystack failed to open:', err)
      setLoading(false)
      toast(`Could not open the payment window${err?.message ? ` (${err.message})` : ''}. Please try again.`, { type: 'error', duration: 7000 })
    }
  }

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProofUploading(true)
    try {
      const compressed = await compressImageFile(file)
      setPaymentProof(compressed)
    } catch (err) {
      toast(err.message || 'Couldn\'t process that image — try a different screenshot.', { type: 'error' })
    }
    setProofUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) {
      if (validateStep1()) setStep(2)
      return
    }

    // An item the admin has since marked Out of Stock can't be bought
    const soldOut = cart.filter((it) => products.find((p) => String(p.id) === String(it.id))?.inStock === false)
    if (soldOut.length) {
      toast(`${soldOut.map((i) => i.name).join(', ')} ${soldOut.length > 1 ? 'are' : 'is'} now out of stock. Please remove ${soldOut.length > 1 ? 'them' : 'it'} from your bag.`, { type: 'error', duration: 7000 })
      return
    }

    if (formData.paymentMethod === 'card') {
      initiateCardPayment()
      return
    }

    if (formData.paymentMethod === 'online' && (!transferConfirmed || !paymentProof)) return

    setLoading(true)
    const order = buildOrder()
    await finalizeOrder(order)
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
  ]

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 lg:px-20 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* ── Left: Form ── */}
          <div className="order-2 lg:order-1">
            <nav className="flex items-center space-x-2 text-xs mb-4 text-gray-400 uppercase tracking-widest">
              <span className={step >= 1 ? 'text-black font-bold' : ''}>Information</span>
              <ChevronRight size={12} />
              <span className={step >= 2 ? 'text-black font-bold' : ''}>Payment</span>
            </nav>
            {/* Progress bar */}
            <div className="h-1 w-full bg-gray-100 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-[#C9A24B] rounded-full transition-all duration-500 ease-out"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              <div ref={formSectionRef}>

              {/* ── Step 1 ── */}
              {step === 1 && (
                <div className="space-y-8">
                  {saved && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm space-y-2">
                      {usingSaved ? (
                        <p>Welcome back, <span className="font-bold">{saved.firstName}</span>! We've filled in your details from your last order.</p>
                      ) : (
                        <p>You're entering different details. Your saved details are kept unless you tick "Remember" below.</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {usingSaved
                          ? <button type="button" onClick={useDifferentDetails} className="text-xs font-bold uppercase tracking-widest underline">Use different details / deliver elsewhere</button>
                          : <button type="button" onClick={useSavedDetails} className="text-xs font-bold uppercase tracking-widest underline">Use my saved details</button>}
                        <button type="button" onClick={forgetDetails} className="text-xs text-gray-400 underline">Forget saved details</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-widest">Contact</h2>
                    <div>
                      <input type="email" name="email" placeholder="Email address"
                        value={formData.email} onChange={handleInputChange}
                        aria-invalid={!!errors.email}
                        className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.email ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'}`} />
                      <FieldError>{errors.email}</FieldError>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-base font-bold uppercase tracking-widest">Delivery Address</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input type="text" name="firstName" placeholder="First name"
                          value={formData.firstName} onChange={handleInputChange}
                          aria-invalid={!!errors.firstName}
                          className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.firstName ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'}`} />
                        <FieldError>{errors.firstName}</FieldError>
                      </div>
                      <div>
                        <input type="text" name="lastName" placeholder="Last name"
                          value={formData.lastName} onChange={handleInputChange}
                          aria-invalid={!!errors.lastName}
                          className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.lastName ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'}`} />
                        <FieldError>{errors.lastName}</FieldError>
                      </div>
                    </div>
                    <div>
                      <input type="text" name="address" placeholder="Street address"
                        value={formData.address} onChange={handleInputChange}
                        aria-invalid={!!errors.address}
                        className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.address ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'}`} />
                      <FieldError>{errors.address}</FieldError>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <select name="state" value={formData.state} onChange={handleInputChange}
                          aria-invalid={!!errors.state}
                          className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.state ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'}`}>
                          <option value="">Select state</option>
                          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <FieldError>{errors.state}</FieldError>
                      </div>
                      <div>
                        <select name="lga" value={formData.lga} onChange={handleInputChange}
                          disabled={!formData.state} aria-invalid={!!errors.lga}
                          className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.lga ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'} disabled:bg-gray-50 disabled:text-gray-400`}>
                          <option value="">{formData.state ? 'Select local government' : 'Select a state first'}</option>
                          {(NIGERIA[formData.state] || []).map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <FieldError>{errors.lga}</FieldError>
                      </div>
                    </div>
                    {formData.lga && (
                      deliveryFee !== null ? (
                        <p className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded p-3">
                          Delivery to {formData.lga}, {formData.state}: ₦{deliveryFee.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                          {DELIVERY_TBC_MESSAGE}
                        </p>
                      )
                    )}
                    <div>
                      <div>
                        <input type="tel" name="phone" placeholder="e.g. 0803 123 4567"
                          value={formData.phone} onChange={handleInputChange}
                          aria-invalid={!!errors.phone}
                          className={`w-full border rounded p-3 text-sm outline-none transition-colors ${errors.phone ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:ring-1 focus:ring-black'}`} />
                        <FieldError>{errors.phone}</FieldError>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-black" />
                    Remember these details on this device for next time
                  </label>

                  <button type="submit"
                    className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all text-sm">
                    Continue to Payment
                  </button>
                </div>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <div className="space-y-8">
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

                        {/* Proof of payment — required before an order can
                            be placed by transfer, so the admin has
                            something to verify against instead of taking
                            "I paid" on trust. */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            Upload proof of payment *
                          </p>
                          {paymentProof ? (
                            <div className="relative inline-block">
                              <img src={paymentProof} alt="Payment proof" className="h-28 w-28 object-cover rounded-lg border border-green-200" />
                              <button type="button" onClick={() => setPaymentProof(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                aria-label="Remove screenshot">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-green-300 rounded-lg py-5 cursor-pointer hover:border-green-500 hover:bg-green-100/40 transition-colors">
                              {proofUploading
                                ? <Spinner size={16} className="text-green-700" />
                                : <Upload size={16} className="text-green-700" />}
                              <span className="text-xs font-semibold text-green-800">
                                {proofUploading ? 'Processing…' : 'Tap to upload a screenshot'}
                              </span>
                              <input type="file" accept="image/*" onChange={handleProofUpload}
                                disabled={proofUploading} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button type="submit"
                      disabled={loading || (formData.paymentMethod === 'online' && (!transferConfirmed || !paymentProof))}
                      className="flex-grow bg-black text-white px-8 py-4 rounded font-bold uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:active:scale-100 text-sm flex items-center justify-center gap-2">
                      {loading && <Spinner size={15} />}
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
                </div>
              )}
              </div>
            </form>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="order-1 lg:order-2">
            <div className="bg-gray-50 rounded-lg p-6 lg:p-8 lg:sticky lg:top-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-[40vh] lg:max-h-none overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.key} className="flex items-center gap-4">
                    <div className="relative w-14 flex-shrink-0 rounded overflow-hidden" style={{ height: '4.5rem' }}>
                      <LazyImage src={item.image} alt={item.name} className="h-full w-full" />
                      <span className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {(item.size || item.color) && <p className="text-xs text-gray-400">{[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}</p>}
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
                  <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-gray-500 font-medium text-right">
                    {deliveryFee !== null ? `₦${deliveryFee.toLocaleString()}` : feeUnknown ? 'To be confirmed' : 'Select state & LGA'}
                  </span>
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
