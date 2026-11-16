import OrderSuccessPopup from '../components/OrderSuccessPopup'

export default function CheckoutSuccess() {
  return (
    <OrderSuccessPopup
      storageKey="tsyh_last_order"
      primary={{ to: '/shop', label: 'Continue Shopping' }}
      secondary={{ to: '/', label: 'Back to Home' }}
    />
  )
}
