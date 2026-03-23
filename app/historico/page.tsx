'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/components/NavBar'
import HistoricoTable from '@/components/HistoricoTable'
import { RefreshCw } from 'lucide-react'

interface HistoricoItem {
  name: string
  date: string
  time: string
  url: string
  size: number
}

export default function HistoricoPage() {
  const [files, setFiles] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchHistory() {
    try {
      const res = await fetch('/api/historico')
      if (!res.ok) throw new Error('Erro ao buscar histórico')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFiles(data.files || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchHistory()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
      <NavBar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{
              fontSize: 22, fontWeight: 700, color: '#1A1F2E',
              letterSpacing: '-0.02em', margin: 0,
            }}>
              Histórico de Planilhas
            </h1>
            <p style={{ fontSize: 14, color: '#6B7A94', margin: '6px 0 0' }}>
              {files.length > 0
                ? `${files.length} planilha${files.length > 1 ? 's' : ''} gerada${files.length > 1 ? 's' : ''} — mais recentes primeiro`
                : 'Registro de todas as planilhas geradas pelo sistema'
              }
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#FFF', border: '1px solid #D1D9E6',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, color: '#2C3649', fontWeight: 500,
              cursor: loading || refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: loading || refreshing ? 0.6 : 1,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#003366'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D9E6'}
          >
            <RefreshCw
              size={13}
              style={refreshing ? { animation: 'spin 0.8s linear infinite' } : {}}
            />
            Atualizar
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </div>

        <HistoricoTable files={files} loading={loading} error={error} />
      </main>
    </div>
  )
}
