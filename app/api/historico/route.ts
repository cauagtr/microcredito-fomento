import { NextResponse } from 'next/server'
import { supabase, BUCKET_NAME, GENERATED_FOLDER } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(GENERATED_FOLDER, {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar histórico.' }, { status: 500 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ files: [] })
    }

    // Gerar URLs públicas ou signed para cada arquivo
    const filesWithUrls = await Promise.all(
      files
        .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
        .map(async f => {
          const filePath = `${GENERATED_FOLDER}/${f.name}`
          const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

          // Parse date/time from filename: planilha_DD-MM-YYYY_HH-MM.xlsx
          let dateStr = ''
          let timeStr = ''
          const match = f.name.match(/planilha_(\d{2})-(\d{2})-(\d{4})_(\d{2})-(\d{2})/)
          if (match) {
            dateStr = `${match[1]}/${match[2]}/${match[3]}`
            timeStr = `${match[4]}:${match[5]}`
          } else if (f.created_at) {
            const d = new Date(f.created_at)
            dateStr = d.toLocaleDateString('pt-BR')
            timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }

          return {
            name: f.name,
            date: dateStr,
            time: timeStr,
            url: data.publicUrl,
            size: f.metadata?.size ?? 0,
            created_at: f.created_at ?? '',
          }
        })
    )

    return NextResponse.json({ files: filesWithUrls })
  } catch (err) {
    console.error('Erro ao buscar histórico:', err)
    return NextResponse.json({ error: 'Erro interno ao buscar histórico.' }, { status: 500 })
  }
}

export async function HEAD() {
  // Verificar se existe algum arquivo gerado (para detectar primeiro dia)
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(GENERATED_FOLDER, { limit: 1 })

    if (error || !files || files.length === 0) {
      return new NextResponse(null, { status: 204 }) // sem histórico
    }

    const validFiles = files.filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
    if (validFiles.length === 0) {
      return new NextResponse(null, { status: 204 })
    }

    return new NextResponse(null, { status: 200 }) // tem histórico
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
