'use client'

import { useEffect, useState, useRef, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, FileText, Calendar, Building, Pen, Check } from 'lucide-react'

interface RamsDocument {
  id: string
  title: string
  description: string
  file_path: string
  deadline: string | null
  created_at: string
  projects: { name: string } | null
}

const signatureStyles = [
  { className: 'font-serif italic text-blue-900', name: 'Classic Script' },
  { className: 'font-bold text-gray-800', name: 'Bold Print' },
  { className: 'font-mono text-green-800', name: 'Modern' },
  { className: 'font-cursive text-purple-800', name: 'Elegant' }
]

export default function ViewRamsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [document, setDocument] = useState<RamsDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [signing, setSigning] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  
  // Enhanced signature states
  const [signatureType, setSignatureType] = useState<'type' | 'draw' | 'style'>('type')
  const [selectedStyle, setSelectedStyle] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadDocument()
  }, [resolvedParams.id])

  const checkSignatureStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('rams_signatures')
        .select('id')
        .eq('rams_document_id', resolvedParams.id)
        .eq('user_id', user.id)
        .single()
      
      setHasSigned(!!data)
    }
  }

  const loadDocument = async () => {
    const { data } = await supabase
      .from('rams_documents')
      .select(`
        *,
        projects (name)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (data) {
      setDocument(data)
      
      // Get PDF URL
      if (data.file_path !== 'placeholder.pdf') {
        const { data: urlData } = supabase.storage
          .from('rams-documents')
          .getPublicUrl(data.file_path)
        
        setPdfUrl(urlData.publicUrl)
      }
      
      // Check signature status
      await checkSignatureStatus()
    }
    
    setLoading(false)
  }

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#000'
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        setIsDrawing(true)
        ctx.beginPath()
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#000'
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const isSignatureReady = () => {
    if (signatureType === 'type' || signatureType === 'style') {
      return signatureName.trim().length > 0
    }
    if (signatureType === 'draw') {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          return imageData.data.some(channel => channel !== 0)
        }
      }
    }
    return false
  }

  const handleEnhancedSign = async () => {
    if (!isSignatureReady()) {
      alert('Please provide a signature')
      return
    }
    
    setSigning(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      let signatureData = ''
      
      if (signatureType === 'type') {
        signatureData = `typed:${signatureName}`
      } else if (signatureType === 'style') {
        signatureData = `style:${signatureName}:${selectedStyle}`
      } else if (signatureType === 'draw') {
        const canvas = canvasRef.current
        if (canvas) {
          signatureData = `drawn:${canvas.toDataURL()}`
        }
      }

      const { error } = await supabase
        .from('rams_signatures')
        .insert([
          {
            rams_document_id: resolvedParams.id,
            user_id: user.id,
            signature_data: signatureData,
            ip_address: 'browser'
          }
        ])
      
      if (!error) {
        setHasSigned(true)
        setShowSignatureModal(false)
        setSignatureName('')
        setSelectedStyle(0)
        clearCanvas()
        alert('Document signed successfully!')
      } else {
        alert('Error signing document: ' + error.message)
      }
    }
    
    setSigning(false)
  }

  if (loading) {
    return <div className="p-6">Loading document...</div>
  }

  if (!document) {
    return <div className="p-6">Document not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{document.title}</h1>
              <p className="text-gray-600">{document.description}</p>
            </div>
          </div>
          <Button 
            className={hasSigned ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            onClick={() => hasSigned ? null : setShowSignatureModal(true)}
            disabled={hasSigned}
          >
            {hasSigned ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Signed
              </>
            ) : (
              <>
                <Pen className="w-4 h-4 mr-2" />
                Sign Document
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Document Info Sidebar */}
        <div className="w-80 bg-white shadow-sm p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Document Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Project</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-800">{document.projects?.name || 'Unknown'}</span>
                </div>
              </div>
              
              {document.deadline && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Deadline</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-800">
                      {new Date(document.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-800 mt-1">
                  {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium text-gray-800 mb-2">Signature Status</h3>
                {hasSigned ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-800">
                      <strong>Signed:</strong> You have signed this document
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Pending:</strong> You haven't signed this document yet
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[800px] border-0"
                  title="RAMS Document"
                />
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Available</h3>
                    <p className="text-gray-600">This document doesn't have a PDF file attached</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-[600px] max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Sign Document</CardTitle>
              <CardDescription>
                By signing this document, you confirm that you have read and understood the RAMS requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Signature Type Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      signatureType === 'type' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSignatureType('type')}
                  >
                    Type Name
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      signatureType === 'draw' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSignatureType('draw')}
                  >
                    Draw Signature
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      signatureType === 'style' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSignatureType('style')}
                  >
                    Signature Styles
                  </button>
                </div>

                {/* Type Name Option */}
                {signatureType === 'type' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signature">Enter your full name:</Label>
                      <Input
                        id="signature"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Your full name"
                        className="mt-1 text-lg"
                      />
                    </div>
                    {signatureName && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="text-2xl font-cursive border-b-2 border-gray-800 inline-block pb-1">
                          {signatureName}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Draw Signature Option */}
                {signatureType === 'draw' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Draw your signature:</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg">
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={200}
                          className="w-full h-48 cursor-crosshair"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <p className="text-sm text-gray-600">
                          Sign above using your mouse or touch screen
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearCanvas}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signature Styles Option */}
                {signatureType === 'style' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="styleName">Enter your name:</Label>
                      <Input
                        id="styleName"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Your full name"
                        className="mt-1"
                      />
                    </div>
                    {signatureName && (
                      <div className="space-y-3">
                        <Label>Choose a signature style:</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {signatureStyles.map((style, index) => (
                            <div
                              key={index}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedStyle === index
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedStyle(index)}
                            >
                              <div className={`text-2xl ${style.className}`}>
                                {signatureName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t">
                  <Button 
                    onClick={handleEnhancedSign}
                    disabled={signing || !isSignatureReady()}
                    className="flex-1"
                  >
                    {signing ? 'Signing...' : 'Sign Document'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowSignatureModal(false)
                      clearCanvas()
                      setSignatureName('')
                      setSelectedStyle(0)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}