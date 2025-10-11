'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { AuthUser, getCurrentUser, signOut } from '@/lib/auth'
import { ToastContainer } from '@/components/ui/toast'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)

      // Redirect to appropriate dashboard if user is on wrong page
      if (currentUser && pathname === '/dashboard') {
        switch (currentUser.role) {
          case 'dean':
            router.push('/dean-dashboard')
            break
          case 'lecturer':
            router.push('/lecturer-dashboard')
            break
          case 'student':
            router.push('/student-dashboard')
            break
          case 'superadmin':
            // Superadmin can stay on main dashboard
            break
        }
      }
    }
    
    loadUser()
  }, [router, pathname])

  const handleSignOut = () => {
    signOut()
    setUser(null)
    window.location.href = '/login'
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <a 
            href="/login" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
