'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AuthUser } from '@/lib/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Building2,
  GraduationCap,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    router.push('/login')
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: user?.role === 'lecturer' ? '/lecturer-dashboard' : user?.role === 'dean' ? '/dean-dashboard' : '/dashboard',
      icon: LayoutDashboard,
      roles: ['superadmin', 'dean', 'lecturer']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['superadmin']
    },
    {
      name: 'Departments',
      href: '/departments',
      icon: Building2,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Lecturers',
      href: '/lecturers',
      icon: UserCircle,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Students',
      href: '/students',
      icon: GraduationCap,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Batches',
      href: '/batches',
      icon: Users,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Courses',
      href: '/courses',
      icon: BookOpen,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Campuses',
      href: '/campuses',
      icon: Building2,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Schedules',
      href: '/schedules',
      icon: Calendar,
      roles: ['superadmin', 'dean', 'lecturer']
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: ClipboardCheck,
      roles: ['superadmin', 'dean', 'lecturer']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['superadmin', 'dean']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['superadmin', 'dean', 'lecturer']
    }
  ]

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user?.role || '')
  )

  // Debug: Log navigation items
  useEffect(() => {
    if (user) {
      console.log('Current user role:', user.role)
      console.log('Filtered navigation items:', filteredNavigation.map(item => item.name))
    }
  }, [user, filteredNavigation])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary">Attendance System</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border">
          <div className="flex items-center justify-between h-full px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
