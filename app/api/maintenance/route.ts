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

// Get cache file path
function getCacheFilePath(): string {
  return path.join(process.cwd(), 'public', 'data', 'maintenance_history.json')
}

// Load GLANCE components (all_components.json)
async function loadGlanceComponents(): Promise<Set<string>> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'all_components.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const components = JSON.parse(fileContent)

    // Extract all tags and normalize them
    const tagSet = new Set<string>()
    for (const comp of components) {
      if (comp.tag) {
        // Add original tag
        tagSet.add(comp.tag.toUpperCase())
        // Add normalized version (without dash)
        tagSet.add(comp.tag.replace(/-/g, '').toUpperCase())
      }
    }
    return tagSet
  } catch (error) {
    console.log('[Maintenance API] Failed to load GLANCE components')
    return new Set()
  }
}

// Count matched records with GLANCE components
function countMatchedRecords(records: any[], glanceTags: Set<string>): { matchedCount: number, matchedComponents: Set<string> } {
  let matchedCount = 0
  const matchedComponents = new Set<string>()

  for (const record of records) {
    const extractedTags = record.extracted_tags || []
    let matched = false

    for (const tag of extractedTags) {
      const normalizedTag = tag.replace(/-/g, '').toUpperCase()
      const tagWithDash = tag.toUpperCase()

      if (glanceTags.has(normalizedTag) || glanceTags.has(tagWithDash)) {
        matched = true
        matchedComponents.add(tag)
      }
    }

    if (matched) matchedCount++
  }

  return { matchedCount, matchedComponents }
}

// Load cached maintenance data with metadata
async function loadCachedDataWithMeta(): Promise<CachedData | null> {
  try {
    const filePath = getCacheFilePath()
    const fileContent = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.log('[Maintenance API] No cached data found')
    return null
  }
}

// Check if cache needs refresh (older than 14 days)
function isCacheStale(cachedData: CachedData | null): boolean {
  if (!cachedData || !cachedData.date_range?.to) return true

  const lastUpdate = new Date(cachedData.date_range.to)
  const now = new Date()
  const daysDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

  console.log(`[Cache Check] Last update: ${cachedData.date_range.to}, Days ago: ${daysDiff.toFixed(1)}`)
  return daysDiff >= 14
}

// Fetch 6 months of data from EAM API (for cache refresh)
async function fetch6MonthsFromEAM(): Promise<PermitToWork[]> {
  const allRecords: PermitToWork[] = []
  let cursorPosition = 0
  const maxCalls = 20  // ~1000 records (enough for 6 months)

  console.log('[Cache Refresh] Fetching 6 months data from EAM...')

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
      console.log(`[Cache Refresh] Page ${i + 1}: ${records.length} records, total: ${allRecords.length}`)

      if (!nextPos || nextPos === 0 || nextPos <= cursorPosition) break
      cursorPosition = nextPos
    } catch (error) {
      console.error('[Cache Refresh] Error:', error)
      break
    }
  }

  return allRecords
}

// Save refreshed cache file
async function saveCacheFile(records: CachedRecord[]): Promise<void> {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  const cacheData: CachedData = {
    date_range: {
      from: sixMonthsAgo.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0]
    },
    total_records: records.length,
    records: records
  }

  const filePath = getCacheFilePath()
  await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf-8')
  console.log(`[Cache Refresh] Saved ${records.length} records to cache`)
}

// Refresh cache if stale (called automatically)
async function refreshCacheIfNeeded(): Promise<CachedRecord[]> {
  const cachedData = await loadCachedDataWithMeta()

  if (!isCacheStale(cachedData)) {
    console.log('[Cache] Cache is fresh, no refresh needed')
    return cachedData?.records || []
  }

  console.log('[Cache] Cache is stale (14+ days old), refreshing...')

  try {
    // Fetch 6 months data from EAM
    const permits = await fetch6MonthsFromEAM()

    if (permits.length === 0) {
      console.log('[Cache Refresh] No data from EAM, keeping old cache')
      return cachedData?.records || []
    }

    // Transform and filter to 6 months
    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    const transformedRecords: CachedRecord[] = permits
      .map((permit: PermitToWork) => {
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
          extracted_tags: extractTags(permit.EQUIPMENTID?.EQUIPMENTCODE || '')
        }
      })
      .filter(record => {
        if (!record.daterequired) return false
        const recordDate = new Date(record.daterequired.replace(' ', 'T'))
        return recordDate >= sixMonthsAgo
      })

    console.log(`[Cache Refresh] Filtered to 6 months: ${transformedRecords.length} records`)

    // Save to cache file
    await saveCacheFile(transformedRecords)

    return transformedRecords
  } catch (error) {
    console.error('[Cache Refresh] Failed:', error)
    return cachedData?.records || []
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

    // 2. Load cached data (6 months history) - auto-refresh if stale (14+ days)
    const cachedRecords = await refreshCacheIfNeeded()
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

    // 3.5. Calculate GLANCE matched records
    const glanceTags = await loadGlanceComponents()
    const { matchedCount, matchedComponents } = countMatchedRecords(allRecords, glanceTags)
    console.log(`[Maintenance API] GLANCE matched: ${matchedCount} records (${matchedComponents.size} unique components)`)

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
      matchedWithGlance: matchedCount,
      matchedComponentsCount: matchedComponents.size,
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
