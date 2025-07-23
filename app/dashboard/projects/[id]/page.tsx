'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User
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

interface RAMSDocument {
  id: string
  title: string
  description: string
  file_path: string
  version: number
  deadline: string
  created_at: string
  updated_at: string
  created_by: string
  profiles?: {
    full_name: string
    email: string
  }
}

interface RAMSStats {
  total: number
  overdue: number
  upcoming: number
  current: number
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [ramsDocuments, setRamsDocuments] = useState<RAMSDocument[]>([])
  const [ramsStats, setRamsStats] = useState<RAMSStats>({
    total: 0,
    overdue: 0,
    upcoming: 0,
    current: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        setError(null)
        
        // Get project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        
        if (projectError) {
          console.error('Error loading project:', projectError)
          setError(projectError.message)
          return
        }

        // Get profile information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', projectData.created_by)
          .single()
        
        if (profileError) {
          console.error('Error loading profile:', profileError)
        }

        setProject({
          ...projectData,
          profiles: profileData
        })
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Failed to load project details')
      }
    }

    const loadRAMSStats = async () => {
      console.log('=== Starting loadRAMSStats ===')
      console.log('Project ID:', projectId)
      console.log('Supabase client:', supabase)
      
      try {
        console.log('Loading RAMS documents for project:', projectId)
        
        // First, try a simple query to check if the table exists and is accessible
        console.log('Attempting test query...')
        const { data: testData, error: testError } = await supabase
          .from('rams_documents')
          .select('*')
          .limit(1)
        
        console.log('Test query result:', { data: testData, error: testError })
        
        if (testError) {
          console.error('Error accessing rams_documents table:', testError)
          console.error('Error details:', JSON.stringify(testError, null, 2))
          console.error('Error code:', testError.code)
          console.error('Error message:', testError.message)
          console.error('Error hint:', testError.hint)
          console.error('Error details property:', testError.details)
          setRamsStats({
            total: 0,
            overdue: 0,
            upcoming: 0,
            current: 0
          })
          setRamsDocuments([])
          setLoading(false)
          return
        }
        
        console.log('Test successful, table is accessible')
        console.log('Test data length:', testData?.length || 0)
        
        // Now try the actual query without profile join
        console.log('Table accessible, querying for project:', projectId)
        const { data: ramsData, error: ramsError } = await supabase
          .from('rams_documents')
          .select(`
            id,
            title,
            description,
            file_path,
            version,
            deadline,
            created_at,
            updated_at,
            created_by,
            project_id
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
        
        console.log('RAMS query result:', { data: ramsData, error: ramsError })
        
        if (ramsError) {
          console.error('Error loading RAMS documents:', ramsError)
          console.error('Error details:', JSON.stringify(ramsError, null, 2))
          
          // Try a simpler query without the profile join
          console.log('Trying simpler query without profile join...')
          const { data: simpleData, error: simpleError } = await supabase
            .from('rams_documents')
            .select('*')
            .eq('project_id', projectId)
          
          console.log('Simple query result:', { data: simpleData, error: simpleError })
          
          setRamsStats({
            total: 0,
            overdue: 0,
            upcoming: 0,
            current: 0
          })
          setRamsDocuments([])
          setLoading(false)
          return
        }

        console.log(`Found ${ramsData?.length || 0} RAMS documents for project ${projectId}`)

        // Set the documents (no profile data for now)
        const mappedDocuments: RAMSDocument[] = (ramsData || []).map(ram => ({
          ...ram,
          profiles: undefined // We'll fetch profile data separately if needed
        }))
        setRamsDocuments(mappedDocuments)

        // Calculate statistics based on deadlines
        const now = new Date()
        const stats: RAMSStats = {
          total: ramsData?.length || 0,
          overdue: 0,
          upcoming: 0,
          current: 0
        }

        ramsData?.forEach(ram => {
          const deadline = new Date(ram.deadline)
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysUntilDeadline < 0) {
            stats.overdue++
          } else if (daysUntilDeadline <= 30) {
            stats.upcoming++
          } else {
            stats.current++
          }
        })

        setRamsStats(stats)
        console.log('=== loadRAMSStats completed successfully ===')
      } catch (err) {
        console.error('=== Unexpected error in loadRAMSStats ===')
        console.error('Error type:', typeof err)
        console.error('Error:', err)
        console.error('Error stringified:', JSON.stringify(err, null, 2))
        setRamsStats({
          total: 0,
          overdue: 0,
          upcoming: 0,
          current: 0
        })
        setRamsDocuments([])
      }
      
      setLoading(false)
      console.log('=== loadRAMSStats finished ===')
    }

    const loadData = async () => {
      if (projectId) {
        await loadProjectDetails()
        await loadRAMSStats()
      }
    }
    
    loadData()
  }, [projectId])

  if (loading) {
    return <div className="p-8">Loading project details...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">Error: {error}</p>
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-500 mb-4">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/dashboard/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/projects')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-lg">
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description || 'No description provided'}</p>
          </div>
        </div>

        {/* Project Meta Info */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Created by {project.profiles?.full_name || 'Unknown User'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(project.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        </div>
      </div>

      {/* RAMS Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">RAMS Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total RAMS */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{ramsStats.total}</p>
                  <p className="text-sm text-gray-600">Total RAMS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{ramsStats.overdue}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming (Due within 30 days) */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{ramsStats.upcoming}</p>
                  <p className="text-sm text-gray-600">Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{ramsStats.current}</p>
                  <p className="text-sm text-gray-600">Current</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Create New RAMS
          </Button>
          <Button variant="outline">
            View All RAMS
          </Button>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* RAMS Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>RAMS Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ramsDocuments.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RAMS yet</h3>
              <p className="text-gray-500 mb-4">Create your first RAMS document to get started</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Create RAMS
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-6 font-medium text-gray-600 text-sm">
                      Document
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Version
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      Deadline
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
                  {ramsDocuments.map((rams) => (
                    <tr 
                      key={rams.id} 
                      className="border-b border-gray-50 hover:bg-gray-25 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <button 
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {rams.title}
                            </button>
                            {rams.description && (
                              <div className="text-sm text-gray-500 mt-1">{rams.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          v{rams.version}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`${
                            new Date(rams.deadline) < new Date() ? 'text-red-600 font-medium' : 
                            Math.ceil((new Date(rams.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 30 ? 'text-yellow-600 font-medium' :
                            'text-gray-600'
                          }`}>
                            {new Date(rams.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900 font-medium">
                              {rams.profiles?.full_name || 'Unknown User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(rams.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => window.open(rams.file_path, '_blank')}
                          >
                            Download
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
