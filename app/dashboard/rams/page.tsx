'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Upload, Calendar, Eye, Users } from 'lucide-react'

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
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    project_id: '',
    deadline: ''
  })
  const [creating, setCreating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Signatures modal state
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
        projects (name)
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
      
      // Upload file if one is selected
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
  console.log('Looking for signatures for document ID:', documentId)
  
  // First, get the signatures
  const { data: signaturesData, error: signaturesError } = await supabase
    .from('rams_signatures')
    .select('*')
    .eq('rams_document_id', documentId)
    .order('signed_at', { ascending: false })

  console.log('Signatures data:', signaturesData)
  console.log('Signatures error:', signaturesError)

  if (signaturesData && signaturesData.length > 0) {
    // Get user profiles separately
    const userIds = signaturesData.map(sig => sig.user_id)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    console.log('Profiles data:', profilesData)

    // Combine the data
    const signaturesWithProfiles = signaturesData.map(signature => ({
      ...signature,
      profiles: profilesData?.find(profile => profile.id === signature.user_id) || null
    }))

    setSelectedDocumentSignatures(signaturesWithProfiles)
  } else {
    setSelectedDocumentSignatures([])
  }
  
  setShowSignaturesModal(true)
}

  const renderSignature = (signatureData: string) => {
    if (signatureData.startsWith('typed:')) {
      const name = signatureData.replace('typed:', '')
      return (
        <div className="text-xl font-cursive border-b-2 border-gray-800 inline-block pb-1">
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
        <div className={`text-xl ${style.className}`}>
          {name}
        </div>
      )
    } else if (signatureData.startsWith('drawn:')) {
      const imageData = signatureData.replace('drawn:', '')
      return (
        <img 
          src={imageData} 
          alt="Drawn signature" 
          className="max-w-full h-16 border border-gray-300 rounded"
        />
      )
    }
    return <span className="text-gray-500">Unknown signature format</span>
  }

  if (loading) {
    return <div className="p-6">Loading RAMS documents...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">RAMS Documents</h1>
          <p className="text-gray-600">Manage Risk Assessment Method Statements</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New RAMS</span>
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New RAMS Document</CardTitle>
            <CardDescription>Add a new Risk Assessment Method Statement</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createDocument} className="space-y-4">
              <div>
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="Enter document title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  placeholder="Enter document description"
                />
              </div>
              
              <div>
                <Label htmlFor="project">Project</Label>
                <select
                  id="project"
                  value={newDocument.project_id}
                  onChange={(e) => setNewDocument({ ...newDocument, project_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm"
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
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newDocument.deadline}
                  onChange={(e) => setNewDocument({ ...newDocument, deadline: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="pdfFile">PDF Document</Label>
                <Input
                  id="pdfFile"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-4">
                <Button type="submit" disabled={creating || uploading}>
                  {uploading ? 'Uploading...' : creating ? 'Creating...' : 'Create Document'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>{document.title}</span>
              </CardTitle>
              <CardDescription>{document.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Project:</strong> {document.projects?.name}
                </p>
                {document.deadline && (
                  <p className="text-sm text-gray-600 flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(document.deadline).toLocaleDateString()}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Created: {new Date(document.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>File:</strong> {document.file_path !== 'placeholder.pdf' ? 'PDF Uploaded' : 'No file uploaded'}
                </p>
                <div className="flex space-x-2 mt-4">
                  {document.file_path !== 'placeholder.pdf' ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewDocument(document.id)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Document</span>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload PDF
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => viewSignatures(document.id)}
                    className="flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>View Signatures</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RAMS documents yet</h3>
          <p className="text-gray-600 mb-4">Create your first RAMS document to get started</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create RAMS Document
          </Button>
        </div>
      )}

      {/* Signatures Modal */}
      {showSignaturesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-[600px] max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Document Signatures</CardTitle>
              <CardDescription>
                All signatures for this RAMS document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDocumentSignatures.length > 0 ? (
                  selectedDocumentSignatures.map((signature) => (
                    <div key={signature.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {signature.profiles?.full_name || 'Unknown User'}
                          </h3>
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
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowSignaturesModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}