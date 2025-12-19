import { Link, useLocation } from 'react-router-dom'

export function OrderSuccessPage() {
  const location = useLocation()
  const orderNumber = location.state?.orderNumber || 'Unknown'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
        <p className="text-gray-600 mb-4">Thank you for your order</p>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Order Number</p>
          <p className="text-xl font-bold text-gray-800">{orderNumber}</p>
        </div>

        <p className="text-gray-600 mb-6">
          We're preparing your order. You'll receive updates on your order status.
        </p>

        <div className="space-y-3">
          <Link
            to="/orders"
            className="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            View My Orders
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  )
}
