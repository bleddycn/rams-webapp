'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Shield,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Building,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

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
  created_at: string
  signatures_count: number
  expected_signatures: number
  compliance_percentage: number
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'pending' | 'overdue'>('all')

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
    const pendingSignatures = Math.max(0, expectedSignatures - totalSignatures)
    const complianceRate = expectedSignatures > 0 ? (totalSignatures / expectedSignatures) * 100 : 0

    setStats({
      totalDocuments,
      totalUsers: totalUsersCount,
      totalSignatures,
      pendingSignatures,
      complianceRate
    })

    // Get documents with signature counts
    const { data: documents } = await supabase
      .from('rams_documents')
      .select(`
        id, 
        title, 
        deadline, 
        project_id, 
        created_at,
        rams_signatures(count)
      `)
      .order('created_at', { ascending: false })

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')

    // Process document status data
    const documentStatusData: DocumentStatus[] = documents?.map(doc => {
      const project = projects?.find(p => p.id === doc.project_id)
      const signaturesCount = doc.rams_signatures?.[0]?.count || 0
      const expectedSignatures = totalUsersCount
      const compliancePercentage = expectedSignatures > 0 ? (signaturesCount / expectedSignatures) * 100 : 0
      
      return {
        id: doc.id,
        title: doc.title,
        project_name: project?.name || 'Unknown Project',
        deadline: doc.deadline,
        created_at: doc.created_at,
        signatures_count: signaturesCount,
        expected_signatures: expectedSignatures,
        compliance_percentage: compliancePercentage
      }
    }) || []

    setDocumentStatus(documentStatusData)
    setLoading(false)
  }

  const getStatusInfo = (doc: DocumentStatus) => {
    const isOverdue = doc.deadline && new Date(doc.deadline) < new Date()
    const isCompliant = doc.compliance_percentage >= 100

    if (isCompliant) {
      return { 
        status: 'Compliant', 
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      }
    } else if (isOverdue) {
      return { 
        status: 'Overdue', 
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle 
      }
    } else {
      return { 
        status: 'Pending', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock 
      }
    }
  }

  const filteredDocuments = documentStatus.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    const statusInfo = getStatusInfo(doc)
    switch (statusFilter) {
      case 'compliant':
        return statusInfo.status === 'Compliant'
      case 'pending':
        return statusInfo.status === 'Pending'
      case 'overdue':
        return statusInfo.status === 'Overdue'
      default:
        return true
    }
  })

  if (loading) {
    return <div className="p-8">Loading compliance data...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Compliance Dashboard</h1>
        <div className="flex items-center text-sm text-gray-500">
          <span>Home</span>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span>Compliance Management</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDocuments}</p>
                <p className="text-xs text-gray-500 mt-1">RAMS documents</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
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
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed Signatures</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSignatures}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Signed documents
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
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
                <p className="text-xs text-gray-500 mt-1">{stats.pendingSignatures} pending</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'compliant' | 'pending' | 'overdue')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="compliant">Compliant</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Status Table */}
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
                    Compliance
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                    Deadline
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
                {filteredDocuments.map((doc) => {
                  const statusInfo = getStatusInfo(doc)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <tr 
                      key={doc.id} 
                      className="border-b border-gray-50 hover:bg-gray-25 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.title}</div>
                            <div className="text-sm text-gray-500">
                              Created {new Date(doc.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{doc.project_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {doc.signatures_count}/{doc.expected_signatures}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.compliance_percentage.toFixed(0)}% complete
                            </div>
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                doc.compliance_percentage >= 100 ? 'bg-green-500' :
                                doc.compliance_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, doc.compliance_percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {doc.deadline ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(doc.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No deadline</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredDocuments.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No documents match your search criteria' 
                  : 'Create RAMS documents to monitor compliance'
                }
              </p>
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
    </div>
  )
}