'use client'

import { Download, FileSpreadsheet, Calendar, Clock } from 'lucide-react'

interface HistoricoItem {
  name: string
  date: string
  time: string
  url: string
  size: number
}

interface HistoricoTableProps {
  files: HistoricoItem[]
  loading: boolean
  error: string
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function HistoricoTable({ files, loading, error }: HistoricoTableProps) {
  if (loading) {
    return (
      <div style={{
        background: '#FFF', borderRadius: 12, border: '1px solid #E2E6ED',
        padding: 48, textAlign: 'center',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #E2E6ED', borderTopColor: '#003366',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <div style={{ fontSize: 14, color: '#6B7A94' }}>Carregando histórico...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: '#FFF8F8', borderRadius: 12,
        border: '1px solid #FECACA',
        padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, color: '#DC2626' }}>⚠️ {error}</div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div style={{
        background: '#FFF', borderRadius: 12, border: '1px solid #E2E6ED',
        padding: 64, textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: '#F0F4F8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <FileSpreadsheet size={28} color="#A0ABB8" />
        </div>
        <div style={{ fontSize: 15, color: '#6B7A94', fontWeight: 500 }}>
          Nenhuma planilha gerada ainda.
        </div>
        <div style={{ fontSize: 13, color: '#A0ABB8', marginTop: 6 }}>
          Processe planilhas na aba &quot;Processar Planilhas&quot; para ver o histórico aqui.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#FFF', borderRadius: 12, border: '1px solid #E2E6ED',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '130px 90px 1fr auto',
        gap: 0,
        background: '#F5F7FA',
        borderBottom: '1px solid #E2E6ED',
        padding: '12px 20px',
      }}>
        {['Data', 'Hora', 'Arquivo', 'Download'].map((col, i) => (
          <div key={i} style={{
            fontSize: 11.5, fontWeight: 600, color: '#6B7A94',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            textAlign: i === 3 ? 'center' : 'left',
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Rows */}
      {files.map((f, idx) => (
        <div
          key={f.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '130px 90px 1fr auto',
            gap: 0,
            padding: '14px 20px',
            borderBottom: idx < files.length - 1 ? '1px solid #F0F2F5' : 'none',
            background: idx % 2 === 1 ? '#FAFBFC' : '#FFF',
            alignItems: 'center',
            transition: 'background 0.1s',
          }}
        >
          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Calendar size={13} color="#8A93A6" />
            <span style={{ fontSize: 13.5, color: '#2C3649', fontWeight: 500 }}>
              {f.date || '—'}
            </span>
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock size={13} color="#8A93A6" />
            <span style={{ fontSize: 13, color: '#6B7A94' }}>{f.time || '—'}</span>
          </div>

          {/* Filename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <FileSpreadsheet size={15} color="#003366" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, color: '#2C3649', fontWeight: 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {f.name}
              </div>
              {f.size > 0 && (
                <div style={{ fontSize: 11, color: '#A0ABB8' }}>
                  {formatBytes(f.size)}
                </div>
              )}
            </div>
          </div>

          {/* Download */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a
              href={f.url}
              download={f.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#003366', color: '#FFF',
                padding: '7px 14px', borderRadius: 7,
                fontSize: 12.5, fontWeight: 500, textDecoration: 'none',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#004488')}
              onMouseLeave={e => (e.currentTarget.style.background = '#003366')}
            >
              <Download size={13} />
              Baixar
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
