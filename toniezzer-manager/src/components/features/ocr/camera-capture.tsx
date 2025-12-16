'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, X, RotateCcw, Check } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function CameraCapture({ onCapture, onCancel, isLoading }: CameraCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setIsVideoReady(false)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Aguardar o video estar pronto para reproduzir
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsVideoReady(true)
          }).catch((err) => {
            console.error('Erro ao iniciar video:', err)
            setCameraError('Erro ao iniciar a camera.')
          })
        }
      }
      setMode('camera')
    } catch (error) {
      console.error('Erro ao acessar camera:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setCameraError(`Nao foi possivel acessar a camera: ${errorMessage}`)
      alert('Nao foi possivel acessar a camera. Verifique as permissoes.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsVideoReady(false)
  }, [])

  // Limpar camera ao desmontar componente
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video ou canvas nao disponivel')
      alert('Erro: componentes de video nao disponiveis. Tente novamente.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    // Verificar se o video tem dimensoes validas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video sem dimensoes validas:', video.videoWidth, video.videoHeight)
      alert('Aguarde a camera carregar completamente antes de capturar.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      console.error('Nao foi possivel obter contexto 2D do canvas')
      alert('Erro ao processar imagem. Tente novamente.')
      return
    }

    try {
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `recibo-${Date.now()}.jpg`, { type: 'image/jpeg' })
          setCapturedFile(file)
          setCapturedImage(canvas.toDataURL('image/jpeg'))
          stopCamera()
          setMode('preview')
        } else {
          console.error('Falha ao criar blob da imagem')
          alert('Erro ao capturar imagem. Tente novamente.')
        }
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('Erro ao capturar foto:', error)
      alert('Erro ao capturar foto. Tente novamente.')
    }
  }, [stopCamera])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCapturedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string)
        setMode('preview')
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleConfirm = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile)
    }
  }, [capturedFile, onCapture])

  const handleRetry = useCallback(() => {
    setCapturedImage(null)
    setCapturedFile(null)
    setCameraError(null)
    setIsVideoReady(false)
    setMode('select')
  }, [])

  const handleCancel = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setCapturedFile(null)
    setCameraError(null)
    setIsVideoReady(false)
    setMode('select')
    onCancel?.()
  }, [stopCamera, onCancel])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        {mode === 'select' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">
              📷 Capturar Recibo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={startCamera}
              >
                <Camera className="h-8 w-8" />
                <span>Tirar Foto</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                <span>Upload</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            {onCancel && (
              <Button variant="ghost" className="w-full" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <div className="animate-spin text-3xl mb-2">⏳</div>
                    <p>Carregando camera...</p>
                  </div>
                </div>
              )}
            </div>
            {cameraError && (
              <p className="text-sm text-red-500 text-center">{cameraError}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                className="flex-1" 
                onClick={capturePhoto}
                disabled={!isVideoReady}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isVideoReady ? 'Capturar' : 'Aguarde...'}
              </Button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {mode === 'preview' && capturedImage && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleRetry}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refazer
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Usar Esta
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

