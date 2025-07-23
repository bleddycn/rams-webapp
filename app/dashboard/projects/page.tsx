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
  FolderOpen,
  User,
  Calendar,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
  created_by: string
  profiles?: {
    full_name: string
    email: string
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setError(null)
      console.log('Loading projects...')
      
      // First get all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (projectsError) {
        console.error('Error loading projects:', projectsError)
        setError(projectsError.message)
        setLoading(false)
        return
      }

      // Then get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
      
      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        setError(profilesError.message)
        setLoading(false)
        return
      }

      // Manually join the data since both created_by and profiles.id reference auth.users.id
      const projectsWithProfiles = projectsData?.map(project => ({
        ...project,
        profiles: profilesData?.find(profile => profile.id === project.created_by)
      })) || []

      console.log('Projects loaded:', projectsWithProfiles)
      setProjects(projectsWithProfiles)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Failed to load projects')
    }
    
    setLoading(false)
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to create a project')
        setCreating(false)
        return
      }

      const { error } = await supabase
        .from('projects')
        .insert([
          {
            name: newProject.name,
            description: newProject.description,
            created_by: user.id
          }
        ])

      if (error) {
        console.error('Error creating project:', error)
        setError(error.message)
      } else {
        setNewProject({ name: '', description: '' })
        setShowCreateForm(false)
        await loadProjects() // Reload projects
      }
    } catch (err) {
      console.error('Unexpected error creating project:', err)
      setError('Failed to create project')
    }
    
    setCreating(false)
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-8">Loading projects...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Projects</h1>
        <div className="flex items-center text-sm text-gray-500">
          <span>Home</span>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span>Project Management</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">Error: {error}</p>
          <Button 
            onClick={loadProjects} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={createProject} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Input
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project description"
                    className="mt-1"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setError(null)
                    }}
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
              placeholder="Search projects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              All statuses
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              All projects
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Add Project Button */}
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          Debug: Found {projects.length} projects in database
        </div>
      )}

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">
                    Project
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Created By
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Created
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="border-b border-gray-50 hover:bg-gray-25 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button 
                            onClick={() => window.location.href = `/dashboard/projects/${project.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                          >
                            {project.name}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ● Active
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-900 font-medium">
                            {project.profiles?.full_name || 'Unknown User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No projects match your search criteria' : 'Create your first project to get started'}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Project
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filteredProjects.length > 0 && (
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
                  1 - {Math.min(10, filteredProjects.length)} of {filteredProjects.length}
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