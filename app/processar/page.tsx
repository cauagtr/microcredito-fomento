'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/components/NavBar'
import UploadCard from '@/components/UploadCard'
import { CheckCircle2, AlertTriangle, Download, Loader2, Info } from 'lucide-react'

interface ResultState {
  type: 'success' | 'error'
  message: string
  fileName?: string
  downloadUrl?: string
  dateTime?: string
}

export default function ProcessarPage() {
  const [isFirstDay, setIsFirstDay] = useState<boolean | null>(null)
  const [checkingHistory, setCheckingHistory] = useState(true)
  const [lastFileName, setLastFileName] = useState('')

  const [finalizados, setFinalizados] = useState<File | null>(null)
  const [andamento, setAndamento] = useState<File | null>(null)
  const [anterior, setAnterior] = useState<File | null>(null)

  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)

  // Detectar se é primeiro dia
  useEffect(() => {
    async function checkHistory() {
      try {
        const res = await fetch('/api/historico', { method: 'HEAD' })
        if (res.status === 200) {
          setIsFirstDay(false)
          // Buscar nome do último arquivo
          const listRes = await fetch('/api/historico')
          const data = await listRes.json()
          if (data.files && data.files.length > 0) {
            setLastFileName(data.files[0].name)
          }
        } else {
          setIsFirstDay(true)
        }
      } catch {
        setIsFirstDay(true)
      } finally {
        setCheckingHistory(false)
      }
    }
    checkHistory()
  }, [])

  const canSubmit = finalizados && andamento && (isFirstDay ? !!anterior : true)

  const handleSubmit = async () => {
    if (!canSubmit || processing) return
    setProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('finalizados', finalizados!)
      formData.append('andamento', andamento!)
      if (anterior) formData.append('anterior', anterior)

      const res = await fetch('/api/processar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        setResult({ type: 'error', message: err.error || 'Erro ao processar planilhas.' })
        return
      }

      // Download do arquivo
      const blob = await res.blob()
      const fileName = res.headers.get('X-File-Name') || 'planilha_gerada.xlsx'
      const url = URL.createObjectURL(blob)

      const now = new Date()
      const dateTime = now.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })

      setResult({
        type: 'success',
        message: 'Planilha gerada com sucesso!',
        fileName,
        downloadUrl: url,
        dateTime,
      })

      // Auto-trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()

      // Refresh page state — agora não é mais primeiro dia
      setIsFirstDay(false)
      setFinalizados(null)
      setAndamento(null)
      setAnterior(null)
      setLastFileName(fileName)
    } catch (err) {
      setResult({
        type: 'error',
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
      <NavBar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#1A1F2E',
            letterSpacing: '-0.02em', margin: 0,
          }}>
            Processar Planilhas
          </h1>
          <p style={{ fontSize: 14, color: '#6B7A94', margin: '6px 0 0', lineHeight: 1.5 }}>
            Faça upload das planilhas exportadas do sistema e gere a consolidação diária automaticamente.
          </p>
        </div>

        {/* Main card */}
        <div style={{
          background: '#FFF',
          borderRadius: 14,
          border: '1px solid #E2E6ED',
          padding: '32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>

          {checkingHistory ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 48, color: '#6B7A94', fontSize: 14 }}>
              <Loader2 size={18} color="#003366" style={{ animation: 'spin 0.8s linear infinite' }} />
              Verificando histórico...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Mode indicator */}
              {isFirstDay !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: isFirstDay ? '#FFF8ED' : '#EBF4FF',
                  border: `1px solid ${isFirstDay ? '#F5C97A' : '#BFDBFE'}`,
                  borderRadius: 8, padding: '10px 16px',
                  marginBottom: 28, fontSize: 13,
                  color: isFirstDay ? '#92600A' : '#1D4ED8',
                }}>
                  <Info size={15} />
                  {isFirstDay
                    ? 'Primeiro uso detectado — envie as 3 planilhas abaixo para iniciar o histórico.'
                    : `Modo diário — a planilha anterior (${lastFileName || 'mais recente'}) será carregada automaticamente do histórico.`
                  }
                </div>
              )}

              {/* Upload cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isFirstDay ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                gap: 16,
                marginBottom: 28,
              }}>
                <UploadCard
                  label="Projetos Finalizados"
                  description="Planilha de projetos finalizados exportada do sistema"
                  file={finalizados}
                  onChange={setFinalizados}
                  disabled={processing}
                />
                <UploadCard
                  label="Projetos em Andamento"
                  description="Planilha de projetos em andamento exportada do sistema"
                  file={andamento}
                  onChange={setAndamento}
                  disabled={processing}
                />
                {isFirstDay && (
                  <UploadCard
                    label="Planilha do Dia Anterior"
                    description="Planilha de microcrédito do dia anterior (Google Sheets)"
                    file={anterior}
                    onChange={setAnterior}
                    disabled={processing}
                  />
                )}
                {isFirstDay === false && (
                  <UploadCard
                    label="Planilha do Dia Anterior"
                    description=""
                    file={null}
                    onChange={() => {}}
                    disabled={false}
                    autoFilled={true}
                    autoFilledName={lastFileName || 'Carregando do histórico...'}
                  />
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || processing}
                style={{
                  width: '100%',
                  background: !canSubmit || processing ? '#A0ABB8' : '#C8963E',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '15px 24px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: !canSubmit || processing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'background 0.18s, transform 0.1s',
                  letterSpacing: '-0.01em',
                  boxShadow: canSubmit && !processing ? '0 4px 12px rgba(200,150,62,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (canSubmit && !processing) e.currentTarget.style.background = '#B8862E' }}
                onMouseLeave={e => { if (canSubmit && !processing) e.currentTarget.style.background = '#C8963E' }}
              >
                {processing ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Processando...
                  </>
                ) : (
                  <>
                    Gerar Planilha de Hoje
                  </>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

              {/* Result area */}
              {result && (
                <div style={{
                  marginTop: 20,
                  borderRadius: 10,
                  padding: '20px 24px',
                  background: result.type === 'success' ? '#F0FDF4' : '#FFF8F8',
                  border: `1px solid ${result.type === 'success' ? '#86EFAC' : '#FECACA'}`,
                  animation: 'fadeIn 0.25s ease-out',
                }}>
                  <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {result.type === 'success' ? (
                      <CheckCircle2 size={22} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 15, fontWeight: 600,
                        color: result.type === 'success' ? '#15803D' : '#DC2626',
                        marginBottom: 4,
                      }}>
                        {result.message}
                      </div>
                      {result.type === 'success' && result.dateTime && (
                        <div style={{ fontSize: 12.5, color: '#6B7A94', marginBottom: 12 }}>
                          Gerada em: {result.dateTime} · {result.fileName}
                        </div>
                      )}
                      {result.type === 'error' && (
                        <div style={{ fontSize: 13, color: '#EF4444', marginTop: 4 }}>
                          {result.message === 'Planilha gerada com sucesso!' ? '' : ''}
                        </div>
                      )}
                      {result.downloadUrl && result.fileName && (
                        <a
                          href={result.downloadUrl}
                          download={result.fileName}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: '#16A34A', color: '#FFF',
                            padding: '9px 18px', borderRadius: 8,
                            fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
                          onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
                        >
                          <Download size={14} />
                          Baixar Planilha
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info footer */}
        <div style={{
          marginTop: 24, padding: '16px 20px',
          background: '#F0F4F8', borderRadius: 10,
          border: '1px solid #DDE3EE',
          fontSize: 12.5, color: '#6B7A94', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#2C3649' }}>Como funciona:</strong>{' '}
          O sistema processa as planilhas exportadas, aplica os filtros e reordenamentos necessários,
          realiza o cruzamento de dados com o dia anterior e gera o arquivo consolidado com cores por colaborador.
          O arquivo é salvo automaticamente no histórico e disponibilizado para download imediato.
        </div>
      </main>
    </div>
  )
}
