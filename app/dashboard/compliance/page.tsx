'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, FileText, Users, CheckCircle, Clock } from 'lucide-react'

interface ComplianceStats {
  totalDocuments: number
  totalUsers: number
  totalSignatures: number
  pendingSignatures: number
  complianceRate: number
}

interface DocumentStatus {
  id: string
  title: string
  project_name: string
  deadline: string | null
}

export default function CompliancePage() {
  const [stats, setStats] = useState<ComplianceStats>({
    totalDocuments: 0,
    totalUsers: 0,
    totalSignatures: 0,
    pendingSignatures: 0,
    complianceRate: 0
  })
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    // Get basic stats
    const [
      { count: totalDocs },
      { count: totalUsers },
      { count: totalSigs }
    ] = await Promise.all([
      supabase.from('rams_documents').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('rams_signatures').select('*', { count: 'exact', head: true })
    ])

    // Calculate basic compliance stats
    const totalDocuments = totalDocs || 0
    const totalUsersCount = totalUsers || 0
    const totalSignatures = totalSigs || 0
    const expectedSignatures = totalDocuments * totalUsersCount
    const pendingSignatures = expectedSignatures - totalSignatures
    const complianceRate = expectedSignatures > 0 ? (totalSignatures / expectedSignatures) * 100 : 0

    setStats({
      totalDocuments,
      totalUsers: totalUsersCount,
      totalSignatures,
      pendingSignatures,
      complianceRate
    })

    // Get documents and projects separately to avoid relationship issues
    const { data: documents } = await supabase
      .from('rams_documents')
      .select('id, title, deadline, project_id')
      .order('created_at', { ascending: false })

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')

    // Combine the data
    const documentStatusData: DocumentStatus[] = documents?.map(doc => {
      const project = projects?.find(p => p.id === doc.project_id)
      return {
        id: doc.id,
        title: doc.title,
        project_name: project?.name || 'Unknown Project',
        deadline: doc.deadline
      }
    }) || []

    setDocumentStatus(documentStatusData)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-6">Loading compliance data...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Compliance Dashboard</h1>
        <p className="text-gray-600">Monitor RAMS signature compliance across all projects</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalDocuments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Signatures</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalSignatures}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-semibold text-gray-800">{stats.complianceRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status</CardTitle>
          <CardDescription>Signature completion status for each RAMS document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Document</th>
                  <th className="text-left p-3">Project</th>
                  <th className="text-left p-3">Deadline</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {documentStatus.map((doc) => (
                  <tr key={doc.id} className="border-b">
                    <td className="p-3 font-medium">{doc.title}</td>
                    <td className="p-3">{doc.project_name}</td>
                    <td className="p-3">
                      {doc.deadline ? (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{new Date(doc.deadline).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        'No deadline'
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        Pending Implementation
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {documentStatus.length === 0 && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents to track</h3>
              <p className="text-gray-600">Create RAMS documents to monitor compliance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}