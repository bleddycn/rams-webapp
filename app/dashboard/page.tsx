'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FolderOpen, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock,
  Shield,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'worker'
}

interface DashboardStats {
  totalProjects: number
  totalUsers: number
  totalRAMS: number
  totalSignatures: number
  pendingSignatures: number
  complianceRate: number
}

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalUsers: 0,
    totalRAMS: 0,
    totalSignatures: 0,
    pendingSignatures: 0,
    complianceRate: 0
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

        const pendingSignatures = Math.max(0, (totalRAMS || 0) - (totalSignatures || 0))
        const complianceRate = totalRAMS ? ((totalSignatures || 0) / totalRAMS) * 100 : 0

        setStats({
          totalProjects: totalProjects || 0,
          totalUsers: totalUsers || 0,
          totalRAMS: totalRAMS || 0,
          totalSignatures: totalSignatures || 0,
          pendingSignatures,
          complianceRate
        })
      }
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const isAdmin = userProfile?.role === 'admin'

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
        <div className="flex items-center text-sm text-gray-500">
          <span>Home</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Dashboard Overview</span>
        </div>
      </div>

      {/* Welcome Section */}
      <Card className="mb-8 border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Welcome back, {userProfile?.full_name || userProfile?.email?.split('@')[0]}!
              </h2>
              <p className="text-gray-600">
                {isAdmin 
                  ? 'Here\'s an overview of your RAMS management system.'
                  : 'Here\'s your RAMS compliance overview.'
                }
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active projects
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">RAMS Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalRAMS}</p>
                  <p className="text-xs text-gray-500 mt-1">Safety documents</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">Registered users</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Compliance Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.complianceRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.totalSignatures} signatures</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">My Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                  <p className="text-xs text-gray-500 mt-1">Assigned to me</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed RAMS</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                  <p className="text-xs text-green-600 mt-1">Signed documents</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending RAMS</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                  <p className="text-xs text-orange-600 mt-1">Awaiting signature</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Welcome to your RAMS system</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">System initialized successfully</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">Dashboard configured</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  
                  <a href="/dashboard/projects"
                    className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">Create New Project</div>
                        <div className="text-sm text-blue-600">Set up a new construction project</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                  
                  <a href="/dashboard/rams"
                    className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">Upload RAMS Document</div>
                        <div className="text-sm text-green-600">Add a new safety document</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                  
                  <a href="/dashboard/compliance"
                    className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-purple-900">View Compliance</div>
                        <div className="text-sm text-purple-600">Monitor signature compliance</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                </>
              ) : (
                <>
                  
                  <a href="/dashboard/my-rams"
                    className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">View Pending RAMS</div>
                        <div className="text-sm text-blue-600">Sign outstanding documents</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                  
                  <a href="/dashboard/projects"
                    className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">My Projects</div>
                        <div className="text-sm text-green-600">View assigned projects</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}