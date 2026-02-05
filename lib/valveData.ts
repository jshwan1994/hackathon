import { ValveData, DrawingData } from '@/types/valve';

// 새로운 형식의 valve_data_new.json에서 로드한 데이터 파싱
export function parseValveDataNew(rawData: any[]): ValveData[] {
  return rawData.map(item => ({
    tag: item.tag,
    location: item.location,
    drawing: item.drawing,
    type: item.type,
    position: item.position,
    cad_position: item.cad_position,
    layer: item.layer,
    status: 'operational',
  }));
}

// 밸브 타입별 목업 사양 데이터
function getMockSpecs(tag: string): ValveData['specs'] {
  const valveType = tag.substring(0, 2);

  const specs: Record<string, ValveData['specs']> = {
    'VG': {
      pressureRating: '150 PSI',
      temperature: '-20°C ~ 120°C',
      material: 'SS-316',
      flowCoeff: 'Cv 450',
      manufacturerId: 'GV-2024-X99-AB'
    },
    'VC': {
      pressureRating: '200 PSI',
      temperature: '-10°C ~ 150°C',
      material: 'Carbon Steel',
      flowCoeff: 'Cv 380',
      manufacturerId: 'CV-2024-Y45-CD'
    },
    'VL': {
      pressureRating: '100 PSI',
      temperature: '0°C ~ 100°C',
      material: 'Brass',
      flowCoeff: 'Cv 250',
      manufacturerId: 'LV-2024-Z12-EF'
    },
    'VB': {
      pressureRating: '300 PSI',
      temperature: '-40°C ~ 180°C',
      material: 'Stainless Steel',
      flowCoeff: 'Cv 520',
      manufacturerId: 'BV-2024-W88-GH'
    },
    'FV': {
      pressureRating: '180 PSI',
      temperature: '-5°C ~ 130°C',
      material: 'Cast Iron',
      flowCoeff: 'Cv 420',
      manufacturerId: 'FV-2024-V33-IJ'
    },
    'HV': {
      pressureRating: '120 PSI',
      temperature: '5°C ~ 90°C',
      material: 'Bronze',
      flowCoeff: 'Cv 180',
      manufacturerId: 'HV-2024-U77-KL'
    },
    'XV': {
      pressureRating: '250 PSI',
      temperature: '-15°C ~ 160°C',
      material: 'Alloy Steel',
      flowCoeff: 'Cv 480',
      manufacturerId: 'XV-2024-T55-MN'
    },
    'PR': {
      pressureRating: '300 PSI',
      temperature: '-20°C ~ 200°C',
      material: 'Chrome Moly',
      flowCoeff: 'Cv 550',
      manufacturerId: 'PR-2024-S22-OP'
    },
    'TC': {
      pressureRating: '160 PSI',
      temperature: '0°C ~ 140°C',
      material: 'Stainless Steel',
      flowCoeff: 'Cv 320',
      manufacturerId: 'TC-2024-R44-QR'
    },
    'FC': {
      pressureRating: '190 PSI',
      temperature: '-10°C ~ 150°C',
      material: 'Carbon Steel',
      flowCoeff: 'Cv 410',
      manufacturerId: 'FC-2024-Q66-ST'
    },
    'LC': {
      pressureRating: '140 PSI',
      temperature: '5°C ~ 120°C',
      material: 'Cast Steel',
      flowCoeff: 'Cv 290',
      manufacturerId: 'LC-2024-P99-UV'
    }
  };

  return specs[valveType] || {
    pressureRating: '150 PSI',
    temperature: '-20°C ~ 120°C',
    material: 'Stainless Steel',
    flowCoeff: 'Cv 400',
    manufacturerId: 'GEN-2024-M11-WX'
  };
}

// 랜덤 점검 날짜 생성
function getRandomLastInspected(): string {
  const days = Math.floor(Math.random() * 30) + 1;
  const hours = Math.floor(Math.random() * 24);

  if (days === 1) return `${hours}시간 전`;
  if (days <= 7) return `${days}일 전`;
  if (days <= 14) return `${Math.floor(days / 7)}주 전`;
  return `${days}일 전`;
}

// 기존 형식 지원 (valve_data.json)
export function parseValveData(rawData: Record<string, string[]>): ValveData[] {
  const valves: ValveData[] = [];

  Object.entries(rawData).forEach(([location, tags]) => {
    tags.forEach(tag => {
      // 여러 밸브가 /로 구분된 경우 분리
      const individualTags = tag.split('/');
      individualTags.forEach(t => {
        const trimmedTag = t.trim();
        valves.push({
          tag: trimmedTag,
          location: location,
          status: 'operational',
          specs: getMockSpecs(trimmedTag),
          lastInspected: getRandomLastInspected()
        });
      });
    });
  });

  return valves;
}

// 밸브 검색 함수 (태그 우선 검색)
export function searchValves(valves: ValveData[], query: string): ValveData[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase().trim();

  // 1. 태그가 검색어로 시작하는 항목 (최우선)
  const startsWithTag = valves.filter(valve =>
    valve.tag.toLowerCase().startsWith(lowerQuery)
  );

  // 2. 태그에 검색어가 포함된 항목 (시작 제외)
  const containsInTag = valves.filter(valve =>
    !valve.tag.toLowerCase().startsWith(lowerQuery) &&
    valve.tag.toLowerCase().includes(lowerQuery)
  );

  // 3. 위치에 검색어가 포함된 항목 (태그 매칭 제외)
  const containsInLocation = valves.filter(valve =>
    !valve.tag.toLowerCase().includes(lowerQuery) &&
    valve.location.toLowerCase().includes(lowerQuery)
  );

  return [...startsWithTag, ...containsInTag, ...containsInLocation];
}

// 도면 데이터 파싱
export function parseDrawingData(csvText: string): DrawingData[] {
  const lines = csvText.split('\n');
  const drawings: DrawingData[] = [];

  // 첫 줄은 헤더이므로 스킵
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length >= 4) {
      drawings.push({
        seq: parseInt(parts[0]),
        drawing_no: parts[1],
        title: parts[2],
        file_name: parts[3],
      });
    }
  }

  return drawings;
}
