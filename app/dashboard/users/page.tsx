'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  User,
  Mail,
  Shield,
  Calendar,
  UserCheck,
  UserX,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'worker'
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'worker'>('all')
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'worker' as 'admin' | 'worker',
    password: ''
  })
  const [creating, setCreating] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Get current user to check permissions
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser(profile)

      // Load all users (only admins should see this page)
      if (profile?.role === 'admin') {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        setUsers(usersData || [])
      }
    }
    
    setLoading(false)
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      })

      if (authError) {
        alert('Error creating user: ' + authError.message)
        setCreating(false)
        return
      }

      // Update profile with additional info
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: authData.user.id,
              email: newUser.email,
              full_name: newUser.full_name,
              role: newUser.role
            }
          ])

        if (profileError) {
          alert('Error updating profile: ' + profileError.message)
        } else {
          setNewUser({ email: '', full_name: '', role: 'worker', password: '' })
          setShowCreateForm(false)
          loadData()
        }
      }
    } catch (error) {
      alert('Error creating user: ' + (error as Error).message)
    }
    
    setCreating(false)
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'worker') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      loadData()
    } else {
      alert('Error updating user role: ' + error.message)
    }
  }

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      // Delete from profiles first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (!profileError) {
        // Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)
        
        if (!authError) {
          loadData()
        } else {
          alert('Error deleting user from auth: ' + authError.message)
        }
      } else {
        alert('Error deleting user profile: ' + profileError.message)
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return <div className="p-8">Loading users...</div>
  }

  // Only admins should see this page
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">User Management</h1>
        <div className="flex items-center text-sm text-gray-500">
          <span>Home</span>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span>User Management</span>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
              <form onSubmit={createUser} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="Enter full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    className="mt-1"
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'worker' })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'worker')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="worker">Workers</option>
            </select>
          </div>
        </div>

        {/* Add User Button */}
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">
                    User
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="border-b border-gray-50 hover:bg-gray-25 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.full_name || 'No name provided'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Worker
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ● Active
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {user.id !== currentUser?.id && (
                          <>
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'worker')}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="worker">Worker</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteUser(user.id)}
                              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No users match your search criteria' 
                  : 'Create your first user to get started'
                }
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create User
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page</span>
                <Button variant="outline" className="h-8 px-3 text-sm">
                  10
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-600">
                  1 - {Math.min(10, filteredUsers.length)} of {filteredUsers.length}
                </span>
                
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 bg-blue-600 text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}