import * as XLSX from 'xlsx'

// ============================================================
// MAPA DE CORES DOS COLABORADORES — edite aqui se necessário
// Cores correspondem à paleta padrão do Google Sheets
// ============================================================
const COLLABORATOR_COLORS: Record<string, string> = {
  "ANDRESSA": "E06C75",
  "ANNA":     "C9A0DC",
  "CAUA":     "F4A460", // normalizado sem acento
  "CONRADO":  "E88080",
  "JULIANO":  "93C47D",
  "LETICIA":  "EA9999",
  "MARCOS":   "6FA8DC",
  "PEDRO":    "9FC5E8",
  "RAIANE":   "D5A6E6",
  "VALERIO":  "FFFFFF", // normalizado sem acento
}

// ============================================================
// UTILITÁRIOS
// ============================================================

/** Normaliza string: maiúsculas, remove acentos, trim */
function normalizeStr(s: string): string {
  if (!s) return ''
  return s
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Encontra o índice de uma coluna pelo nome (case-insensitive, sem acentos) */
function findColIndex(headers: string[], name: string): number {
  const norm = normalizeStr(name)
  return headers.findIndex(h => normalizeStr(h) === norm)
}

/** Lê um buffer de arquivo (xlsx/xls/csv) e retorna array de linhas (arrays de valores) */
function parseFile(buffer: Buffer): { headers: string[]; rows: unknown[][] } {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })

  if (data.length === 0) return { headers: [], rows: [] }

  const headers = (data[0] as unknown[]).map(h => (h ? String(h).trim() : ''))
  const rows = data.slice(1) as unknown[][]

  return { headers, rows }
}

// ============================================================
// PARTE 1 e 2 — Processamento de colunas (Andamento e Finalizados)
// ============================================================

/**
 * Aplica as transformações de colunas:
 * Step 4: Delete A-E, depois E-F, depois G em diante
 * Step 5: Cut C → B, Cut F → D, Cut A → E
 */
function processColumns(headers: string[], rows: unknown[][]): { headers: string[]; rows: unknown[][] } {
  // Trabalha com índices 0-based
  // Step 4a: Delete colunas 0-4 (A até E, 5 colunas)
  let h = [...headers]
  let r = rows.map(row => [...row])

  // Delete A through E (indices 0,1,2,3,4)
  h.splice(0, 5)
  r = r.map(row => { row.splice(0, 5); return row })

  // Step 4b: Delete colunas E-F (agora índices 4 e 5, 2 colunas)
  if (h.length > 5) {
    h.splice(4, 2)
    r = r.map(row => { row.splice(4, 2); return row })
  }

  // Step 4c: Delete coluna G em diante (agora índice 6 em diante)
  if (h.length > 6) {
    h.splice(6)
    r = r.map(row => { row.splice(6); return row })
  }

  // Step 5: reordenação
  // Cut coluna C (índice 2) → Insert at B (índice 1)
  // Ex: [A, B, C, D, E, F] → remover índice 2, inserir no índice 1
  const colC_h = h.splice(2, 1)[0]
  const colC_r = r.map(row => row.splice(2, 1)[0])
  h.splice(1, 0, colC_h)
  r = r.map((row, i) => { row.splice(1, 0, colC_r[i]); return row })

  // Cut coluna F (agora índice 5) → Insert at D (índice 3)
  const colF_h = h.splice(5, 1)[0]
  const colF_r = r.map(row => row.splice(5, 1)[0])
  h.splice(3, 0, colF_h)
  r = r.map((row, i) => { row.splice(3, 0, colF_r[i]); return row })

  // Cut coluna A (índice 0) → Insert at E (índice 4)
  const colA_h = h.splice(0, 1)[0]
  const colA_r = r.map(row => row.splice(0, 1)[0])
  h.splice(4, 0, colA_h)
  r = r.map((row, i) => { row.splice(4, 0, colA_r[i]); return row })

  return { headers: h, rows: r }
}

// ============================================================
// FILTRO DE FINALIZADOS (Step 6)
// ============================================================

function filterFinalizados(headers: string[], rows: unknown[][]): unknown[][] {
  const etapaNames = ['ETAPA', 'NA ETAPA', 'STATUS']
  const dateNames = ['NA ETAPA DESDE', 'ETAPA DESDE', 'DATA ETAPA', 'DATA']

  let etapaIdx = -1
  let dateIdx = -1

  for (const name of etapaNames) {
    const idx = findColIndex(headers, name)
    if (idx !== -1) { etapaIdx = idx; break }
  }
  for (const name of dateNames) {
    const idx = findColIndex(headers, name)
    if (idx !== -1) { dateIdx = idx; break }
  }

  const validEtapas = ['CONCEDIDO', 'EXCLUIDO', 'RECUSADO']

  const today = new Date()
  const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1
  const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()

  return rows.filter(row => {
    // Filtro por etapa
    if (etapaIdx !== -1) {
      const etapa = normalizeStr(String(row[etapaIdx] ?? ''))
      if (!validEtapas.includes(etapa)) return false
    }

    // Filtro por data (mês mais recente)
    if (dateIdx !== -1) {
      const rawDate = row[dateIdx]
      if (rawDate) {
        let d: Date | null = null
        if (rawDate instanceof Date) {
          d = rawDate
        } else if (typeof rawDate === 'number') {
          d = XLSX.SSF.parse_date_code ? new Date((rawDate - 25569) * 86400 * 1000) : new Date()
        } else {
          d = new Date(String(rawDate))
        }
        if (d && !isNaN(d.getTime())) {
          if (d.getMonth() !== lastMonth || d.getFullYear() !== lastMonthYear) return false
        }
      }
    }

    return true
  })
}

// ============================================================
// VLOOKUP helper
// ============================================================

function buildLookupMap(rows: unknown[][], keyIdx: number, valueIdx: number): Map<string, unknown> {
  const map = new Map<string, unknown>()
  for (const row of rows) {
    const key = normalizeStr(String(row[keyIdx] ?? ''))
    if (key && !map.has(key)) {
      map.set(key, row[valueIdx] ?? '')
    }
  }
  return map
}

// ============================================================
// PROCESSADOR PRINCIPAL
// ============================================================

export interface ProcessInput {
  finalizadosBuffer: Buffer
  andamentoBuffer: Buffer
  anteriorBuffer: Buffer
}

export interface ProcessResult {
  fileBuffer: Buffer
  fileName: string
}

export async function processarPlanilhas(input: ProcessInput): Promise<ProcessResult> {
  // --- Parse all files ---
  const finalizados = parseFile(input.finalizadosBuffer)
  const andamento = parseFile(input.andamentoBuffer)
  const anterior = parseFile(input.anteriorBuffer)

  // --- PARTE 1: Processar Andamento ---
  const andamentoProcessed = processColumns(andamento.headers, andamento.rows)

  // --- PARTE 2: Processar Finalizados ---
  const finalizadosProcessedCols = processColumns(finalizados.headers, finalizados.rows)
  const finalizadosFiltered = filterFinalizados(
    finalizadosProcessedCols.headers,
    finalizadosProcessedCols.rows
  )

  // --- PARTE 3: Construir planilha final ---

  // Step 1: Copiar "Observação Anterior" → "Observação" na planilha anterior
  const obsAnteriorIdx = findColIndex(anterior.headers, 'OBSERVACAO ANTERIOR')
  const obsIdx = findColIndex(anterior.headers, 'OBSERVACAO')
  if (obsAnteriorIdx !== -1 && obsIdx !== -1) {
    for (const row of anterior.rows) {
      row[obsIdx] = row[obsAnteriorIdx]
    }
  }

  // Step 2 e 3: Montar dados consolidados
  const allHeaders = andamentoProcessed.headers
  const allRows: unknown[][] = [
    ...andamentoProcessed.rows,
    ...finalizadosFiltered,
  ]

  // Garantir 10 colunas mínimas (A até J)
  while (allHeaders.length < 10) allHeaders.push('')
  const finalRows = allRows.map(row => {
    const r = [...row]
    while (r.length < 10) r.push('')
    return r
  })

  // Column B index (0-based = 1) é a chave de lookup
  const colBIdx = 1
  // Column H index (0-based = 7) = Observação Anterior
  const colHIdx = 7
  // Column J index (0-based = 9) = Responsável
  const colJIdx = 9

  // Build lookup maps from anterior
  const anteriorColBIdx = findColIndex(anterior.headers, 'B') !== -1
    ? findColIndex(anterior.headers, 'B')
    : Math.min(1, anterior.headers.length - 1)

  const anteriorColHIdx = findColIndex(anterior.headers, 'OBSERVACAO ANTERIOR') !== -1
    ? findColIndex(anterior.headers, 'OBSERVACAO ANTERIOR')
    : Math.min(7, anterior.headers.length - 1)

  const anteriorColJIdx = findColIndex(anterior.headers, 'RESPONSAVEL') !== -1
    ? findColIndex(anterior.headers, 'RESPONSAVEL')
    : Math.min(9, anterior.headers.length - 1)

  // Descobrir índice real da coluna B (número proposta ou similar)
  const lookupH = buildLookupMap(anterior.rows, anteriorColBIdx, anteriorColHIdx)
  const lookupJ = buildLookupMap(anterior.rows, anteriorColBIdx, anteriorColJIdx)

  // Step 4: VLOOKUP Observação Anterior (col H)
  // Step 5: VLOOKUP Responsável (col J)
  for (const row of finalRows) {
    const key = normalizeStr(String(row[colBIdx] ?? ''))

    // Col H
    if (lookupH.has(key)) {
      row[colHIdx] = lookupH.get(key)
    } else {
      row[colHIdx] = 'N/A'
    }

    // Col J
    if (lookupJ.has(key)) {
      row[colJIdx] = lookupJ.get(key)
    } else {
      row[colJIdx] = 'N/A'
    }
  }

  // Step 6: Auto-fill Responsável para tipos conhecidos
  // Detecta coluna de tipo/produto
  const tipoIdx = ['TIPO', 'PRODUTO', 'PROPOSTA', 'MODALIDADE'].reduce((found, name) => {
    if (found !== -1) return found
    return findColIndex(allHeaders, name)
  }, -1)

  const sistemaIdx = findColIndex(allHeaders, 'SISTEMA')

  const microTypes = [
    'MICROCREDITO',
    'PRE-PROPOSTA MICROCREDITO',
    'MENSAGENS',
    'PESQUISA DE PROJETOS',
  ]

  for (const row of finalRows) {
    const respVal = normalizeStr(String(row[colJIdx] ?? ''))
    if (respVal === '' || respVal === 'N/A') {
      if (tipoIdx !== -1) {
        const tipo = normalizeStr(String(row[tipoIdx] ?? ''))
        const sistema = sistemaIdx !== -1 ? normalizeStr(String(row[sistemaIdx] ?? '')) : ''
        if (microTypes.includes(tipo) && sistema === 'INFORMATICA') {
          row[colJIdx] = 'MARCOS' // padrão para Microcrédito/Informática
        }
      }
    }
  }

  // Step 7: Copiar coluna J → coluna A
  for (const row of finalRows) {
    row[0] = row[colJIdx]
  }

  // ============================================================
  // CRIAR WORKBOOK XLSX
  // ============================================================
  const wb = XLSX.utils.book_new()

  const sheetData = [allHeaders, ...finalRows]
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Aplicar cores por colaborador nas linhas de dados
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

  for (let rowIdx = 1; rowIdx <= finalRows.length; rowIdx++) {
    const row = finalRows[rowIdx - 1]
    const respRaw = String(row[colJIdx] ?? '')
    const respNorm = normalizeStr(respRaw)
    const color = COLLABORATOR_COLORS[respNorm]

    if (color) {
      for (let colIdx = range.s.c; colIdx <= range.e.c; colIdx++) {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })
        if (!ws[cellAddr]) {
          ws[cellAddr] = { v: '', t: 's' }
        }
        ws[cellAddr].s = {
          fill: {
            patternType: 'solid',
            fgColor: { rgb: color },
          },
        }
      }
    }
  }

  // Step 8: Nome da aba = data de hoje DD/MM/YYYY
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()
  const sheetTabName = `${dd}/${mm}/${yyyy}`

  XLSX.utils.book_append_sheet(wb, ws, sheetTabName)

  // Nome do arquivo
  const HH = String(today.getHours()).padStart(2, '0')
  const MIN = String(today.getMinutes()).padStart(2, '0')
  const fileName = `planilha_${dd}-${mm}-${yyyy}_${HH}-${MIN}.xlsx`

  // Gerar buffer
  const fileBuffer = Buffer.from(
    XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true })
  )

  return { fileBuffer, fileName }
}
