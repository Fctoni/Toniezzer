'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, X } from 'lucide-react'

interface UploadPlaudProps {
  onUpload: (content: string, fileName: string) => void
  isLoading?: boolean
}

export function UploadPlaud({ onUpload, isLoading }: UploadPlaudProps) {
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (file.type === 'text/markdown' || file.type === 'text/plain' || 
        file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setContent(text)
        setFileName(file.name)
      }
      reader.readAsText(file)
    } else {
      alert('Por favor, selecione um arquivo .md ou .txt')
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const handleClear = useCallback(() => {
    setContent('')
    setFileName(null)
  }, [])

  const handleSubmit = useCallback(() => {
    if (content.trim()) {
      onUpload(content, fileName || 'reuniao.md')
    }
  }, [content, fileName, onUpload])

  return (
    <Card>
      <CardContent className="p-6">
        {!content ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Arraste o arquivo Markdown aqui
            </h3>
            <p className="text-muted-foreground mb-4">
              ou clique para selecionar
            </p>
            <input
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </label>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Formatos aceitos: .md, .txt
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
              placeholder="Conteúdo do arquivo..."
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClear} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processando...
                  </>
                ) : (
                  '🤖 Processar com IA'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

