'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  Users, 
  Shield,
  LogOut 
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'worker'
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUserProfile(profile)
      }
      setLoading(false)
    }

    getProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">RAMS</h1>
              <p className="text-sm text-gray-500">
                {userProfile?.role === 'admin' ? 'Administrator' : 'Worker'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 py-3">
            <div className="flex items-center space-x-3 text-blue-600 bg-blue-50 rounded-lg p-3">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
          </div>
          
          {userProfile?.role === 'admin' ? (
            <div className="space-y-1 px-6">
              <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg p-3 cursor-pointer"
              onClick={() => window.location.href = '/dashboard/projects'}
              >
              <FolderOpen className="w-5 h-5" />
              <span>Projects</span>
            </div>
              <div 
                className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg p-3 cursor-pointer"
                onClick={() => window.location.href = '/dashboard/rams'}
              >
                <FileText className="w-5 h-5" />
                <span>RAMS Documents</span>
              </div>
              <div 
                className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg p-3 cursor-pointer"
                onClick={() => window.location.href = '/dashboard/users'}
              >
                <Users className="w-5 h-5" />
                <span>Users</span>
              </div>
              <div 
                className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg p-3 cursor-pointer"
                onClick={() => window.location.href = '/dashboard/compliance'}
              >
                <Shield className="w-5 h-5" />
                <span>Compliance</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1 px-6">
              <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg p-3 cursor-pointer">
                <FileText className="w-5 h-5" />
                <span>My RAMS</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg p-3 cursor-pointer">
                <FolderOpen className="w-5 h-5" />
                <span>My Projects</span>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
              <p className="text-gray-600">Welcome back, {userProfile?.full_name || userProfile?.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-800">0</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">RAMS Documents</p>
                  <p className="text-2xl font-semibold text-gray-800">0</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Signatures</p>
                  <p className="text-2xl font-semibold text-gray-800">0</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-800">0</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600">No recent activity to display.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}