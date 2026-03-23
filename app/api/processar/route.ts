export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase, BUCKET_NAME, GENERATED_FOLDER } from '@/lib/supabase'
import { processarPlanilhas } from '@/lib/processador'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const finalizadosFile = formData.get('finalizados') as File | null
    const andamentoFile = formData.get('andamento') as File | null
    const anteriorFile = formData.get('anterior') as File | null

    if (!finalizadosFile || !andamentoFile) {
      return NextResponse.json(
        { error: 'Arquivos obrigatórios: Projetos Finalizados e Projetos em Andamento.' },
        { status: 400 }
      )
    }

    const finalizadosBuffer = Buffer.from(await finalizadosFile.arrayBuffer())
    const andamentoBuffer = Buffer.from(await andamentoFile.arrayBuffer())
    let anteriorBuffer: Buffer

    if (anteriorFile) {
      anteriorBuffer = Buffer.from(await anteriorFile.arrayBuffer())
    } else {
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(GENERATED_FOLDER, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      if (listError || !files || files.length === 0) {
        return NextResponse.json({ error: 'Nenhuma planilha anterior encontrada. Envie manualmente.' }, { status: 400 })
      }

      const validFiles = files.filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
      if (validFiles.length === 0) {
        return NextResponse.json({ error: 'Nenhuma planilha anterior encontrada. Envie manualmente.' }, { status: 400 })
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME).download(`${GENERATED_FOLDER}/${validFiles[0].name}`)

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'Erro ao baixar planilha anterior.' }, { status: 500 })
      }
      anteriorBuffer = Buffer.from(await fileData.arrayBuffer())
    }

    const { fileBuffer, fileName } = await processarPlanilhas({ finalizadosBuffer, andamentoBuffer, anteriorBuffer })

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${GENERATED_FOLDER}/${fileName}`, new Uint8Array(fileBuffer), {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Erro ao salvar: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${GENERATED_FOLDER}/${fileName}`)

    return NextResponse.json({ success: true, fileName, downloadUrl: urlData.publicUrl })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno.'
    return NextResponse.json({ error: `Erro: ${message}` }, { status: 500 })
  }
}
