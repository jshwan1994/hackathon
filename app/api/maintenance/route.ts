import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// MaintenanceRecord from local cache
interface CachedRecord {
  permittowork: string
  description: string
  daterequired: string
  requester: string
  department: string
  equipment: string
  status: string
  extracted_tags: string[]
}

interface CachedData {
  date_range: { from: string; to: string }
  total_records: number
  records: CachedRecord[]
}

// Correct interface based on actual API response structure
interface PermitToWork {
  PERMITTOWORKID: {
    PERMITTOWORKCODE: string
    DESCRIPTION: string
  }
  STATUS: {
    STATUSCODE: string
  }
  EQUIPMENTID: {
    EQUIPMENTCODE: string
    DESCRIPTION: string
  }
  DATEREQUIRED?: {
    YEAR: number
    MONTH: number
    DAY: number
    HOUR?: number
    MINUTE?: number
  } | null
  StandardUserDefinedFields?: {
    UDFCHAR03?: string | null
    UDFCHAR06?: string | null
    UDFCHAR07?: string | null
    UDFCHAR09?: string | null
  } | null
}

interface EAMResponse {
  Result: {
    ResultData: {
      DATARECORD: PermitToWork[]
      RECORDS: number
    }
  }
}

// Load cached maintenance data
async function loadCachedData(): Promise<CachedRecord[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'maintenance_history.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data: CachedData = JSON.parse(fileContent)
    return data.records || []
  } catch (error) {
    console.log('[Maintenance API] No cached data found')
    return []
  }
}

// Extract valve/instrument tags from equipment code
function extractTags(equipmentCode: string): string[] {
  const tags: string[] = []
  const prefixes = [
    'XV', 'VG', 'VL', 'VC', 'VB', 'FCV', 'LCV', 'HV', 'FV', 'PCV', 'TCV', 'PRV', 'FSV', 'MOV', 'SOV',
    'FT', 'PT', 'TT', 'LT', 'AT', 'FI', 'PI', 'TI', 'LI', 'AI',
    'FC', 'PC', 'TC', 'LC', 'AC', 'FE', 'PE', 'TE', 'LE', 'AE',
    'FS', 'PS', 'TS', 'LS', 'FR', 'PR', 'TR', 'LR',
    'PDI', 'TDI', 'FIC', 'PIC', 'TIC', 'LIC', 'PDIT', 'TDIT'
  ]

  for (const prefix of prefixes) {
    const regex = new RegExp(`(${prefix})[-]?(\\d{3,5}[A-Z]?)`, 'gi')
    const matches = equipmentCode.matchAll(regex)
    for (const match of matches) {
      tags.push(`${match[1].toUpperCase()}-${match[2]}`)
    }
  }
  return tags
}

// Fetch first page only (50 records)
async function fetchFirstPage(): Promise<PermitToWork[]> {
  const response = await fetch(
    'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork',
    {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'tenant': 'RJZUW7ZJDTGNQN6S_PRD',
        'organization': 'P3',
        'Authorization': 'Basic MjExMDAwNDM6UG1zMTEwODEwIQ=='
      },
      cache: 'no-store'
    }
  )

  if (!response.ok) return []

  const data = await response.json()
  return data.Result?.ResultData?.DATARECORD || []
}

// Fetch ALL records from EAM API with pagination (for real-time 3-month data)
async function fetchAllFromEAM(): Promise<PermitToWork[]> {
  const allRecords: PermitToWork[] = []
  let cursorPosition = 0
  const maxCalls = 10  // Safety limit (500 records max)

  for (let i = 0; i < maxCalls; i++) {
    try {
      const response = await fetch(
        'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork',
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'tenant': 'RJZUW7ZJDTGNQN6S_PRD',
            'organization': 'P3',
            'Authorization': 'Basic MjExMDAwNDM6UG1zMTEwODEwIQ==',
            'cursorposition': String(cursorPosition)
          },
          cache: 'no-store'
        }
      )

      if (!response.ok) break

      const data = await response.json()
      const result = data.Result?.ResultData
      const records = result?.DATARECORD || []
      const nextPos = result?.NEXTCURSORPOSITION

      if (records.length === 0) break

      allRecords.push(...records)
      console.log(`[EAM Fetch] Page ${i + 1}: ${records.length} records, total: ${allRecords.length}`)

      // Check if more pages exist
      if (!nextPos || nextPos === 0 || nextPos <= cursorPosition) break

      cursorPosition = nextPos
    } catch (error) {
      console.error('[EAM Fetch] Error:', error)
      break
    }
  }

  return allRecords
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const equipmentCode = searchParams.get('equipmentCode')
  const fetchAll = searchParams.get('fetchAll') === 'true'  // 전체 데이터 가져오기 옵션

  try {
    // 1. Fetch from EAM API (realtime)
    let realtimeRecords: any[] = []
    try {
      // fetchAll=true면 전체 데이터(3개월+), 아니면 최신 50건만
      const permits = fetchAll ? await fetchAllFromEAM() : await fetchFirstPage()
      console.log(`[Maintenance API] Real-time API: ${permits.length} records (fetchAll=${fetchAll})`)

      // Transform API records
      realtimeRecords = permits.map((permit: PermitToWork) => {
        let dateStr = ''
        if (permit.DATEREQUIRED) {
          const year = permit.DATEREQUIRED.YEAR ? new Date(permit.DATEREQUIRED.YEAR).getFullYear() : 2026
          const month = String(permit.DATEREQUIRED.MONTH || 1).padStart(2, '0')
          const day = String(permit.DATEREQUIRED.DAY || 1).padStart(2, '0')
          const hour = String(permit.DATEREQUIRED.HOUR || 9).padStart(2, '0')
          const minute = String(permit.DATEREQUIRED.MINUTE || 0).padStart(2, '0')
          dateStr = `${year}-${month}-${day} ${hour}:${minute}`
        }

        const udf = permit.StandardUserDefinedFields
        return {
          permittowork: permit.PERMITTOWORKID?.PERMITTOWORKCODE || '',
          description: permit.PERMITTOWORKID?.DESCRIPTION || permit.EQUIPMENTID?.DESCRIPTION || '',
          daterequired: dateStr,
          requester: udf?.UDFCHAR07 || udf?.UDFCHAR03 || '',
          department: udf?.UDFCHAR06 || '',
          equipment: permit.EQUIPMENTID?.EQUIPMENTCODE || '',
          status: permit.STATUS?.STATUSCODE || '',
          extracted_tags: extractTags(permit.EQUIPMENTID?.EQUIPMENTCODE || ''),
          source: 'realtime'
        }
      })
    } catch (apiError) {
      console.log('[Maintenance API] Real-time API failed, using cache only')
    }

    // 2. Load cached data (3 months history)
    const cachedRecords = await loadCachedData()
    console.log(`[Maintenance API] Cached data: ${cachedRecords.length} records`)

    // 3. Merge and deduplicate (realtime first, then cache)
    const allRecordsMap = new Map<string, any>()

    // Add realtime records first
    for (const record of realtimeRecords) {
      allRecordsMap.set(record.permittowork, record)
    }

    // Add cached records (skip if already in realtime)
    for (const record of cachedRecords) {
      if (!allRecordsMap.has(record.permittowork)) {
        allRecordsMap.set(record.permittowork, { ...record, source: 'cache' })
      }
    }

    let allRecords = Array.from(allRecordsMap.values())
    console.log(`[Maintenance API] Total merged: ${allRecords.length} records`)

    // 4. Filter by equipment code if provided
    if (equipmentCode) {
      const searchTerm = equipmentCode.replace(/-/g, '').toLowerCase()
      const searchTermWithDash = equipmentCode.toLowerCase()

      console.log(`[Maintenance API] Searching for: "${searchTerm}"`)

      allRecords = allRecords.filter(record => {
        const equipCode = record.equipment?.toLowerCase() || ''
        const desc = record.description?.toLowerCase() || ''

        // Check equipment code
        if (equipCode.includes(searchTerm)) return true

        // Check extracted tags
        for (const tag of record.extracted_tags || []) {
          const tagNorm = tag.replace(/-/g, '').toLowerCase()
          if (tagNorm.includes(searchTerm) || tag.toLowerCase().includes(searchTermWithDash)) {
            return true
          }
        }

        // Check description
        if (desc.includes(searchTermWithDash) || desc.includes(searchTerm)) return true

        return false
      })

      console.log(`[Maintenance API] After filtering: ${allRecords.length} records`)
    }

    // Sort by date (newest first) and limit
    allRecords.sort((a, b) => (b.daterequired || '').localeCompare(a.daterequired || ''))
    const maintenanceHistory = allRecords.slice(0, 20)

    return NextResponse.json({
      success: true,
      total: allRecordsMap.size,
      filtered: maintenanceHistory.length,
      realtimeCount: realtimeRecords.length,
      cachedCount: cachedRecords.length,
      data: maintenanceHistory
    })

  } catch (error) {
    console.error('Maintenance API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance history', data: [] },
      { status: 500 }
    )
  }
}
