import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface AppLayoutProps {
  children: ReactNode
  hideNav?: boolean
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const location = useLocation()
  const { itemCount } = useCart()
  
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="flex-shrink-0 bg-white border-t flex justify-around py-2 bottom-nav">
          <Link 
            to="/" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press ${isActive('/') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <span className="text-xl">{isActive('/') ? '🏠' : '🏠'}</span>
            <span className="text-xs font-medium">Menu</span>
          </Link>
          
          <Link 
            to="/orders" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press ${isActive('/orders') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <span className="text-xl">📋</span>
            <span className="text-xs font-medium">Orders</span>
          </Link>
          
          <Link 
            to="/cart" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press relative ${isActive('/cart') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <span className="text-xl">🛒</span>
            <span className="text-xs font-medium">Cart</span>
            {itemCount > 0 && (
              <span className="absolute top-0 right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
          
          <Link 
            to="/account" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press ${isActive('/account') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Account</span>
          </Link>
        </nav>
      )}
    </div>
  )
}
