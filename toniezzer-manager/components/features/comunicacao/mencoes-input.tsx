'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, cn } from '@/lib/utils'
import type { User } from '@/lib/types/database'

interface MencoesInputProps {
  value: string
  onChange: (value: string, mencoes: string[]) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function MencoesInput({ 
  value, 
  onChange, 
  placeholder = 'Escreva sua mensagem... Use @ para mencionar alguém',
  className,
  minHeight = '100px'
}: MencoesInputProps) {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Carregar usuários
  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('ativo', true)
        .order('nome_completo')
      
      if (data) setUsuarios(data)
    }
    fetchUsuarios()
  }, [])

  // Extrair menções do texto
  const extractMencoes = useCallback((text: string): string[] => {
    const mentions: string[] = []
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g
    let match
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[2]) // ID do usuário
    }
    return mentions
  }, [])

  // Detectar digitação de @ e filtrar usuários
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const position = e.target.selectionStart || 0
    setCursorPosition(position)

    // Detectar início de menção
    const textBeforeCursor = newValue.slice(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Verificar se não há espaço entre @ e cursor (menção em andamento)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStart(lastAtIndex)
        setShowSuggestions(true)
        setSelectedIndex(0)
        
        // Filtrar usuários
        const searchTerm = textAfterAt.toLowerCase()
        const filtered = usuarios.filter(u => 
          u.nome_completo.toLowerCase().includes(searchTerm)
        ).slice(0, 5)
        setFilteredUsuarios(filtered)
      } else {
        setShowSuggestions(false)
        setMentionStart(null)
      }
    } else {
      setShowSuggestions(false)
      setMentionStart(null)
    }

    onChange(newValue, extractMencoes(newValue))
  }

  // Inserir menção
  const insertMention = (usuario: User) => {
    if (mentionStart === null) return

    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(cursorPosition)
    
    // Formato: @[Nome](id)
    const mentionText = `@[${usuario.nome_completo}](${usuario.id}) `
    const newValue = beforeMention + mentionText + afterMention

    onChange(newValue, extractMencoes(newValue))
    setShowSuggestions(false)
    setMentionStart(null)

    // Focar no textarea e mover cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPosition = mentionStart + mentionText.length
        textareaRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }

  // Navegação com teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredUsuarios.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredUsuarios.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsuarios.length - 1
        )
        break
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault()
          insertMention(filteredUsuarios[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Renderizar texto com menções formatadas (preview)
  const renderFormattedText = (text: string) => {
    // Substituir formato @[Nome](id) por @Nome destacado
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '<span class="bg-primary/20 text-primary rounded px-1">@$1</span>')
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('resize-none', className)}
        style={{ minHeight }}
      />

      {/* Sugestões de menção */}
      {showSuggestions && filteredUsuarios.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredUsuarios.map((usuario, index) => (
            <button
              key={usuario.id}
              type="button"
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors',
                index === selectedIndex && 'bg-accent'
              )}
              onClick={() => insertMention(usuario)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={usuario.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {getInitials(usuario.nome_completo)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{usuario.nome_completo}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {usuario.perfil?.replace('_', ' ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Preview do texto formatado */}
      {value && (
        <div 
          className="mt-2 p-2 bg-muted/50 rounded-md text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: renderFormattedText(value) }}
        />
      )}
    </div>
  )
}

