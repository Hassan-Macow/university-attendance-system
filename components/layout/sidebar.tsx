'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  IconLayoutDashboard,
  IconBuilding,
  IconUsers,
  IconBook,
  IconCalendar,
  IconChartBar,
  IconSettings,
  IconUser,
  IconLogout,
  IconCheck,
  IconBolt,
  IconRocket,
  IconTarget,
  IconTrophy,
  IconAward,
  IconBell,
  IconHelp,
  IconDownload,
  IconStack
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { AuthUser } from '@/lib/auth'

interface SidebarProps {
  user: AuthUser
  onSignOut: () => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: IconLayoutDashboard,
    roles: ['superadmin']
  },
  {
    name: 'Dean Dashboard',
    href: '/dean-dashboard',
    icon: IconLayoutDashboard,
    roles: ['dean']
  },
  {
    name: 'Lecturer Dashboard',
    href: '/lecturer-dashboard',
    icon: IconLayoutDashboard,
    roles: ['lecturer']
  },
  {
    name: 'Student Dashboard',
    href: '/student-dashboard',
    icon: IconLayoutDashboard,
    roles: ['student']
  },
  {
    name: 'Campuses',
    href: '/campuses',
    icon: IconBuilding,
    roles: ['superadmin']
  },
  {
    name: 'Departments',
    href: '/departments',
    icon: IconBuilding,
    roles: ['superadmin', 'dean']
  },
  {
    name: 'Programs',
    href: '/programs',
    icon: IconStack,
    roles: ['superadmin', 'dean']
  },
  {
    name: 'Students',
    href: '/students',
    icon: IconUsers,
    roles: ['superadmin', 'dean']
  },
  {
    name: 'Batches',
    href: '/batches',
    icon: IconUsers,
    roles: ['superadmin', 'dean']
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: IconBook,
    roles: ['superadmin', 'dean']
  },
  {
    name: 'Schedules',
    href: '/schedules',
    icon: IconCalendar,
    roles: ['superadmin', 'dean', 'lecturer', 'student']
  },
  {
    name: 'Take Attendance',
    href: '/attendance',
    icon: IconCheck,
    roles: ['lecturer']
  },
  {
    name: 'My Attendance',
    href: '/my-attendance',
    icon: IconCheck,
    roles: ['student']
  },
  {
    name: 'My Courses',
    href: '/my-courses',
    icon: IconBook,
    roles: ['student']
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: IconChartBar,
    roles: ['superadmin', 'dean']
  },
  {
    name: 'User Management',
    href: '/users',
    icon: IconUsers,
    roles: ['superadmin']
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: IconSettings,
    roles: ['superadmin', 'dean', 'lecturer']
  }
]

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  )

  return (
          <div className="flex h-full w-64 flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
      {/* Logo Section */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-slate-700">
        <img
          src="/assets/images/university/Zamzam_University_logo.svg.png"
          alt="Zamzam University Logo"
          className="h-10 w-auto object-contain mr-3"
        />
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-white">
            Zamzam University
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Attendance Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                       isActive
                         ? 'bg-[#1B75BB] text-white'
                         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
                 <div className="h-8 w-8 rounded-full bg-[#1B75BB] flex items-center justify-center">
                   <IconUser className="h-4 w-4 text-white" />
                 </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOut}
          className="w-full"
        >
          <IconLogout className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
