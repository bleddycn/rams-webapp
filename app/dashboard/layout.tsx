'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  Users, 
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'worker'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const adminNavItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
    { title: 'Compliance', href: '/dashboard/compliance', icon: Shield },
    { title: 'Users', href: '/dashboard/users', icon: Users },
  ]

  const workerNavItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'My RAMS', href: '/dashboard/my-rams', icon: FileText },
    { title: 'My Projects', href: '/dashboard/projects', icon: FolderOpen },
  ]

  const navItems = profile?.role === 'admin' ? adminNavItems : workerNavItems

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo/ramses-logo.png"
              alt="RAMSES"
              width={200}
              height={80}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Role Badge */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              profile?.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
            }`}></div>
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {profile?.role === 'admin' ? 'Administrator' : 'Worker'}
            </span>
          </div>
        </div>

        <nav className="mt-6">
          <div className="px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 text-gray-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          {/* Mobile logo */}
          <Image
            src="/logo/ramses-logo.png"
            alt="RAMSES"
            width={100}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}