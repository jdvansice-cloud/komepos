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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Main Content - takes remaining space above fixed nav */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-40 bottom-nav">
          <Link 
            to="/" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press ${isActive('/') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Menu</span>
          </Link>
          
          <Link 
            to="/orders" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press ${isActive('/orders') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-medium">Orders</span>
          </Link>
          
          <Link 
            to="/cart" 
            className={`flex flex-col items-center min-w-[60px] py-1 btn-press relative ${isActive('/cart') ? 'text-red-600' : 'text-gray-500'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">Account</span>
          </Link>
        </nav>
      )}
      
      {/* Spacer for fixed bottom nav */}
      {!hideNav && <div className="h-16 flex-shrink-0" />}
    </div>
  )
}
