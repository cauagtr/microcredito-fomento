import { NextRequest, NextResponse } from 'next/server'
import { supabase, BUCKET_NAME, GENERATED_FOLDER } from '@/lib/supabase'
import { processarPlanilhas } from '@/lib/processador'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

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
      // Primeiro dia — arquivo enviado manualmente
      anteriorBuffer = Buffer.from(await anteriorFile.arrayBuffer())
    } else {
      // Dias seguintes — buscar último arquivo gerado no Supabase
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(GENERATED_FOLDER, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (listError || !files || files.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma planilha anterior encontrada no histórico. Por favor, envie a planilha do dia anterior manualmente.' },
          { status: 400 }
        )
      }

      const latestFile = files[0]
      const filePath = `${GENERATED_FOLDER}/${latestFile.name}`

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filePath)

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: 'Erro ao baixar a planilha anterior do histórico.' },
          { status: 500 }
        )
      }

      anteriorBuffer = Buffer.from(await fileData.arrayBuffer())
    }

    // Processar planilhas
    const { fileBuffer, fileName } = await processarPlanilhas({
      finalizadosBuffer,
      andamentoBuffer,
      anteriorBuffer,
    })

    // Salvar no Supabase Storage
    const storagePath = `${GENERATED_FOLDER}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro ao salvar no Supabase:', uploadError)
      // Mesmo com erro no upload, retornar o arquivo para o usuário
    }

    // Retornar arquivo para download
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-File-Name': fileName,
      },
    })
  } catch (err: unknown) {
    console.error('Erro no processamento:', err)
    const message = err instanceof Error ? err.message : 'Erro interno desconhecido.'
    return NextResponse.json({ error: `Erro ao processar planilhas: ${message}` }, { status: 500 })
  }
}
