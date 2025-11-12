'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { 
      href: '/', 
      label: '世界排名', 
      icon: '🏆',
      gradient: 'from-amber-500 to-orange-600',
      activeGradient: 'from-amber-600 to-orange-700'
    },
    { 
      href: '/failure-analysis', 
      label: 'AI 失誤分析', 
      icon: '🤖',
      gradient: 'from-purple-500 to-pink-600',
      activeGradient: 'from-purple-600 to-pink-700'
    },
    { 
      href: '/train', 
      label: '訓練模型', 
      icon: '🧠',
      gradient: 'from-green-500 to-emerald-600',
      activeGradient: 'from-green-600 to-emerald-700'
    },
    { 
      href: '/analyze', 
      label: '動作分析', 
      icon: '📊',
      gradient: 'from-blue-500 to-cyan-600',
      activeGradient: 'from-blue-600 to-cyan-700'
    }
  ]

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-105">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                <span className="text-2xl">🏓</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Table Tennis AI
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                智能桌球訓練系統
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative"
                >
                  <div className={`
                    relative px-6 py-3 rounded-xl font-semibold text-sm
                    transition-all duration-300 transform
                    ${isActive 
                      ? `bg-gradient-to-r ${item.activeGradient} text-white shadow-lg scale-105` 
                      : 'text-slate-300 hover:text-white hover:scale-105'
                    }
                  `}>
                    {/* Hover background */}
                    {!isActive && (
                      <div className={`
                        absolute inset-0 bg-gradient-to-r ${item.gradient} 
                        rounded-xl opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300 blur-sm
                      `}></div>
                    )}
                    
                    {/* Content */}
                    <div className="relative flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
