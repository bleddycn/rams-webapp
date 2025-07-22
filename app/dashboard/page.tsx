'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FolderOpen, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock 
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'worker'
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalRAMS: 0,
    pendingSignatures: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUserProfile(profile)

      if (profile?.role === 'admin') {
        const [
          { count: totalProjects },
          { count: totalUsers },
          { count: totalRAMS },
          { count: totalSignatures }
        ] = await Promise.all([
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('rams_documents').select('*', { count: 'exact', head: true }),
          supabase.from('rams_signatures').select('*', { count: 'exact', head: true })
        ])

        setStats({
          totalProjects: totalProjects || 0,
          totalUsers: totalUsers || 0,
          totalRAMS: totalRAMS || 0,
          pendingSignatures: Math.max(0, (totalRAMS || 0) - (totalSignatures || 0))
        })
      }
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userProfile?.full_name || userProfile?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          {userProfile?.role === 'admin' 
            ? 'Here is an overview of your RAMS management system.'
            : 'Here is your RAMS compliance overview.'
          }
        </p>
      </div>

      {userProfile?.role === 'admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">RAMS Documents</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRAMS}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Signatures</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingSignatures}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Projects</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed RAMS</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending RAMS</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Welcome to your RAMS system</span>
                <span className="text-xs text-gray-400">Just now</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">System initialized</span>
                <span className="text-xs text-gray-400">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {userProfile?.role === 'admin' ? (
                <div>
                  <a href="/dashboard/projects"
                    className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="font-medium text-blue-900">Create New Project</div>
                    <div className="text-sm text-blue-600">Set up a new construction project</div>
                  </a>
                  
                  <a href="/dashboard/rams"
                    className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors mt-3"
                  >
                    <div className="font-medium text-green-900">Upload RAMS Document</div>
                    <div className="text-sm text-green-600">Add a new safety document</div>
                  </a>
                </div>
              ) : (
                <div>
                  
                  <a href="/dashboard/my-rams"
                    className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-blue-900">View Pending RAMS</div>
                    <div className="text-sm text-blue-600">Sign outstanding documents</div>
                  </a>
                  
                  <a href="/dashboard/projects"
                    className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors mt-3"
                  >
                    <div className="font-medium text-green-900">My Projects</div>
                    <div className="text-sm text-green-600">View assigned projects</div>
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}