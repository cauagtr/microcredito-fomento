'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSpreadsheet, History, BarChart3 } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()

  const tabs = [
    { href: '/processar', label: 'Processar Planilhas', icon: FileSpreadsheet },
    { href: '/historico', label: 'Histórico', icon: History },
  ]

  return (
    <header style={{ background: '#003366', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 64 }}>
            {/* Logo mark */}
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(200,150,62,0.2)',
              border: '1.5px solid rgba(200,150,62,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <BarChart3 size={18} color="#C8963E" />
            </div>

            <div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: '#FFFFFF',
                letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>
                Sistema de Planilhas
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Microcrédito
              </div>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Institution badge */}
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              display: 'none', // hide on small
            }}>
              Uso Interno
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <nav style={{ display: 'flex', gap: 0 }}>
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 20px',
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                  borderBottom: active ? '2.5px solid #C8963E' : '2.5px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.01em',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
