'use client'

import { useRef, useState, DragEvent } from 'react'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'

interface UploadCardProps {
  label: string
  description?: string
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  autoFilled?: boolean
  autoFilledName?: string
}

export default function UploadCard({
  label,
  description,
  file,
  onChange,
  disabled = false,
  autoFilled = false,
  autoFilledName = '',
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (disabled || autoFilled) return
    const dropped = e.dataTransfer.files[0]
    if (dropped) onChange(dropped)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled && !autoFilled) setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleClick = () => {
    if (disabled || autoFilled) return
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    onChange(f)
    e.target.value = ''
  }

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const hasFile = file !== null || autoFilled
  const fileName = autoFilled ? autoFilledName : file?.name ?? ''

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px ${hasFile ? 'solid' : 'dashed'} ${
          autoFilled ? '#4CAF50' :
          hasFile ? '#003366' :
          dragging ? '#003366' : '#D1D9E6'
        }`,
        borderRadius: 10,
        padding: '24px 20px',
        background: autoFilled
          ? 'rgba(76,175,80,0.05)'
          : hasFile
          ? 'rgba(0,51,102,0.04)'
          : dragging
          ? 'rgba(0,51,102,0.06)'
          : '#FAFBFD',
        cursor: disabled || autoFilled ? 'default' : 'pointer',
        transition: 'all 0.18s ease',
        position: 'relative',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={handleChange}
        style={{ display: 'none' }}
        disabled={disabled || autoFilled}
      />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: autoFilled
          ? 'rgba(76,175,80,0.12)'
          : hasFile
          ? 'rgba(0,51,102,0.1)'
          : 'rgba(0,51,102,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 2,
        flexShrink: 0,
      }}>
        {autoFilled ? (
          <CheckCircle2 size={22} color="#4CAF50" />
        ) : hasFile ? (
          <FileText size={22} color="#003366" />
        ) : (
          <Upload size={22} color="#6B7A94" />
        )}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 13.5, fontWeight: 600,
        color: autoFilled ? '#2E7D32' : hasFile ? '#003366' : '#2C3649',
        textAlign: 'center', letterSpacing: '-0.01em',
      }}>
        {label}
      </div>

      {/* File name or instruction */}
      {hasFile ? (
        <div style={{
          fontSize: 12,
          color: autoFilled ? '#4CAF50' : '#003366',
          textAlign: 'center',
          maxWidth: '100%',
          wordBreak: 'break-all',
          lineHeight: 1.4,
          padding: '0 8px',
        }}>
          {autoFilled ? (
            <>
              <span style={{ display: 'block', fontSize: 11, color: '#6B7A94', marginBottom: 2 }}>
                Carregado automaticamente
              </span>
              <span>{fileName}</span>
            </>
          ) : (
            fileName
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#8A93A6', textAlign: 'center', lineHeight: 1.5 }}>
          {description || 'Clique ou arraste o arquivo aqui'}
          <div style={{ fontSize: 11, color: '#ABB4C4', marginTop: 3 }}>
            .csv, .xls ou .xlsx
          </div>
        </div>
      )}

      {/* Remove button */}
      {file && !autoFilled && !disabled && (
        <button
          onClick={clearFile}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(220,53,69,0.1)',
            border: 'none', borderRadius: 6,
            padding: '3px 5px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            transition: 'background 0.15s',
          }}
          title="Remover arquivo"
        >
          <X size={13} color="#DC3545" />
        </button>
      )}
    </div>
  )
}
