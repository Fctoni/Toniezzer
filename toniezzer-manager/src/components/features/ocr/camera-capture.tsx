'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, X, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function CameraCapture({ onCapture, onCancel, isLoading }: CameraCaptureProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setMode('camera')
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      alert('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `recibo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setCapturedFile(file)
            setCapturedImage(canvas.toDataURL('image/jpeg'))
            stopCamera()
            setMode('preview')
          }
        }, 'image/jpeg', 0.9)
      }
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
    setMode('select')
  }, [])

  const handleCancel = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setCapturedFile(null)
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
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button className="flex-1" onClick={capturePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Capturar
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

