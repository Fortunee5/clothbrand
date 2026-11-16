import OrderSuccessPopup from '../components/OrderSuccessPopup'

export default function BfSuccess() {
  return (
    <OrderSuccessPopup
      dark
      storageKey="bf_last_order"
      primary={{ to: '/blackfriday', label: 'Back to Black Friday' }}
      secondary={{ to: '/', label: 'Main Store' }}
    />
  )
}
