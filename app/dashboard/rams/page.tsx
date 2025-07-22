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
  FileText,
  Calendar,
  Building,
  User,
  Eye,
  Users,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface RamsDocument {
  id: string
  title: string
  description: string
  file_path: string
  deadline: string
  created_at: string
  project_id: string
  projects: { name: string }
  profiles?: { full_name: string; email: string }
}

interface Signature {
  id: string
  signature_data: string
  signed_at: string
  profiles: { full_name: string; email: string } | null
}

export default function RamsPage() {
  const [documents, setDocuments] = useState<RamsDocument[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    project_id: '',
    deadline: ''
  })
  const [creating, setCreating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedDocumentSignatures, setSelectedDocumentSignatures] = useState<Signature[]>([])
  const [showSignaturesModal, setShowSignaturesModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load projects for dropdown
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name')
      .order('name')

    // Load RAMS documents
    const { data: documentsData } = await supabase
      .from('rams_documents')
      .select(`
        *,
        projects (name),
        profiles!rams_documents_created_by_fkey (full_name, email)
      `)
      .order('created_at', { ascending: false })

    setProjects(projectsData || [])
    setDocuments(documentsData || [])
    setLoading(false)
  }

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      let filePath = 'placeholder.pdf'
      
      if (selectedFile) {
        setUploading(true)
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('rams-documents')
          .upload(fileName, selectedFile)
        
        if (uploadError) {
          alert('Error uploading file: ' + uploadError.message)
          setUploading(false)
          setCreating(false)
          return
        }
        
        filePath = uploadData.path
        setUploading(false)
      }

      const { error } = await supabase
        .from('rams_documents')
        .insert([
          {
            title: newDocument.title,
            description: newDocument.description,
            project_id: newDocument.project_id,
            deadline: newDocument.deadline || null,
            file_path: filePath,
            created_by: user.id
          }
        ])

      if (!error) {
        setNewDocument({ title: '', description: '', project_id: '', deadline: '' })
        setSelectedFile(null)
        setShowCreateForm(false)
        loadData()
      }
    }
    
    setCreating(false)
  }

  const viewDocument = (documentId: string) => {
    window.location.href = `/dashboard/rams/${documentId}`
  }

  const viewSignatures = async (documentId: string) => {
    const { data, error } = await supabase
      .from('rams_signatures')
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq('rams_document_id', documentId)
      .order('signed_at', { ascending: false })

    if (data) {
      setSelectedDocumentSignatures(data)
      setShowSignaturesModal(true)
    }
  }

  const renderSignature = (signatureData: string) => {
    if (signatureData.startsWith('typed:')) {
      const name = signatureData.replace('typed:', '')
      return (
        <div className="text-sm font-medium border-b border-gray-800 inline-block pb-1">
          {name}
        </div>
      )
    } else if (signatureData.startsWith('style:')) {
      const parts = signatureData.split(':')
      const name = parts[1]
      const styleIndex = parseInt(parts[2])
      const signatureStyles = [
        { className: 'font-serif italic text-blue-900' },
        { className: 'font-bold text-gray-800' },
        { className: 'font-mono text-green-800' },
        { className: 'font-cursive text-purple-800' }
      ]
      const style = signatureStyles[styleIndex] || signatureStyles[0]
      return (
        <div className={`text-sm ${style.className}`}>
          {name}
        </div>
      )
    } else if (signatureData.startsWith('drawn:')) {
      const imageData = signatureData.replace('drawn:', '')
      return (
        <img 
          src={imageData} 
          alt="Drawn signature" 
          className="max-w-full h-12 border border-gray-300 rounded"
        />
      )
    }
    return <span className="text-gray-500 text-sm">Unknown signature format</span>
  }

  const filteredDocuments = documents.filter(document =>
    document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    document.projects?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-8">Loading RAMS documents...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">RAMS Documents</h1>
        <div className="flex items-center text-sm text-gray-500">
          <span>Home</span>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span>RAMS Management</span>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New RAMS Document</h3>
              <form onSubmit={createDocument} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">Document Title</Label>
                  <Input
                    id="title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="Enter document title"
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Input
                    id="description"
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                    placeholder="Enter document description"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project" className="text-sm font-medium text-gray-700">Project</Label>
                  <select
                    id="project"
                    value={newDocument.project_id}
                    onChange={(e) => setNewDocument({ ...newDocument, project_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">Deadline (optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newDocument.deadline}
                    onChange={(e) => setNewDocument({ ...newDocument, deadline: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pdfFile" className="text-sm font-medium text-gray-700">PDF Document</Label>
                  <Input
                    id="pdfFile"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={creating || uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {uploading ? 'Uploading...' : creating ? 'Creating...' : 'Create Document'}
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
              placeholder="Search documents"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              All projects
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              All statuses
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Add Document Button */}
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add RAMS Document
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
                    Document
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Project
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Deadline
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
                {filteredDocuments.map((document) => (
                  <tr 
                    key={document.id} 
                    className="border-b border-gray-50 hover:bg-gray-25 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium text-sm">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{document.title}</div>
                          <div className="text-sm text-gray-500">{document.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{document.projects?.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        document.file_path !== 'placeholder.pdf'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        ● {document.file_path !== 'placeholder.pdf' ? 'Ready' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {document.deadline ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(document.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No deadline</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(document.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {document.file_path !== 'placeholder.pdf' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewDocument(document.id)}
                            className="h-8 px-2 text-gray-500 hover:text-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => viewSignatures(document.id)}
                          className="h-8 px-2 text-gray-500 hover:text-gray-700"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
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
          {filteredDocuments.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No documents match your search criteria' : 'Create your first RAMS document to get started'}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create RAMS Document
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filteredDocuments.length > 0 && (
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
                  1 - {Math.min(10, filteredDocuments.length)} of {filteredDocuments.length}
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

      {/* Signatures Modal */}
      {showSignaturesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Document Signatures</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignaturesModal(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                {selectedDocumentSignatures.length > 0 ? (
                  selectedDocumentSignatures.map((signature) => (
                    <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {signature.profiles?.full_name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600">{signature.profiles?.email}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(signature.signed_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Signature:</label>
                        <div className="mt-2 p-3 bg-gray-50 rounded border min-h-[60px] flex items-center">
                          {renderSignature(signature.signature_data)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures yet</h3>
                    <p className="text-gray-600">This document hasn't been signed by anyone</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}