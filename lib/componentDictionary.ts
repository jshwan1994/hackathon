// 밸브/계기류 사전 데이터

export interface DictionaryEntry {
  code: string;
  name: string;
  nameEn: string;
  description: string;
  category: 'valve' | 'safety' | 'control' | 'instrument';
}

// 밸브류 사전
export const valveDictionary: DictionaryEntry[] = [
  // 일반 밸브
  { code: 'VG', name: '게이트 밸브', nameEn: 'Gate Valve', description: '유체의 흐름을 완전히 차단하거나 개방하는 용도. 완전 개폐용으로 사용', category: 'valve' },
  { code: 'VB', name: '볼 밸브', nameEn: 'Ball Valve', description: '빠른 개폐가 필요한 곳에 사용. 90도 회전으로 개폐', category: 'valve' },
  { code: 'VL', name: '라인 밸브', nameEn: 'Line Valve', description: '배관 라인에 설치되는 일반 차단 밸브', category: 'valve' },
  { code: 'VC', name: '체크 밸브', nameEn: 'Check Valve', description: '유체의 역류를 방지. 한 방향으로만 흐름 허용', category: 'valve' },
  { code: 'VF', name: '플랜지 밸브', nameEn: 'Flange Valve', description: '플랜지 연결 방식의 밸브. 대구경 배관에 주로 사용', category: 'valve' },
  { code: 'XV', name: '개폐 밸브', nameEn: 'On/Off Valve', description: 'On/Off 제어용 밸브. 자동 차단 시스템에 사용', category: 'valve' },
  { code: 'HV', name: '수동 밸브', nameEn: 'Hand Valve', description: '현장에서 수동으로 조작하는 밸브', category: 'valve' },
  { code: 'VN', name: '니들 밸브', nameEn: 'Needle Valve', description: '미세 유량 조절용. 정밀한 유량 제어가 필요한 곳에 사용', category: 'valve' },
  { code: 'CV', name: '콘트롤 밸브', nameEn: 'Control Valve', description: '자동 제어 시스템에서 유량/압력을 조절하는 밸브', category: 'valve' },

  // 안전밸브
  { code: 'PSV', name: '압력 안전밸브', nameEn: 'Pressure Safety Valve', description: '설정 압력 초과 시 자동으로 열려 과압 방지. 장비 보호용', category: 'safety' },
  { code: 'PRV', name: '압력 릴리프 밸브', nameEn: 'Pressure Relief Valve', description: '압력을 일정 수준으로 유지하기 위해 초과 압력 방출', category: 'safety' },

  // 조절밸브
  { code: 'TCV', name: '온도 조절밸브', nameEn: 'Temperature Control Valve', description: '온도에 따라 유량을 자동 조절. 열교환기 등에 사용', category: 'control' },
  { code: 'FCV', name: '유량 조절밸브', nameEn: 'Flow Control Valve', description: '유량을 설정값으로 유지하도록 자동 조절', category: 'control' },
  { code: 'PCV', name: '압력 조절밸브', nameEn: 'Pressure Control Valve', description: '압력을 설정값으로 유지하도록 자동 조절', category: 'control' },
  { code: 'LCV', name: '레벨 조절밸브', nameEn: 'Level Control Valve', description: '탱크 수위에 따라 유량을 자동 조절', category: 'control' },
];

// 계기류 사전
export const instrumentDictionary: DictionaryEntry[] = [
  // 압력 계기
  { code: 'PI', name: '압력 지시계', nameEn: 'Pressure Indicator', description: '현장에서 압력을 직접 확인하는 계기', category: 'instrument' },
  { code: 'PIT', name: '압력 지시 전송기', nameEn: 'Pressure Indicating Transmitter', description: '압력을 측정하고 제어실로 신호 전송', category: 'instrument' },
  { code: 'PT', name: '압력 전송기', nameEn: 'Pressure Transmitter', description: '압력을 전기 신호로 변환하여 전송', category: 'instrument' },
  { code: 'PIC', name: '압력 지시 조절계', nameEn: 'Pressure Indicating Controller', description: '압력을 측정하고 자동으로 제어', category: 'instrument' },
  { code: 'PS', name: '압력 스위치', nameEn: 'Pressure Switch', description: '설정 압력에서 접점 동작. 알람/인터록용', category: 'instrument' },
  { code: 'PSH', name: '고압 스위치', nameEn: 'Pressure Switch High', description: '압력이 상한값 도달 시 동작', category: 'instrument' },
  { code: 'PSL', name: '저압 스위치', nameEn: 'Pressure Switch Low', description: '압력이 하한값 도달 시 동작', category: 'instrument' },
  { code: 'PSHH', name: '고고압 스위치', nameEn: 'Pressure Switch High-High', description: '비상 고압에서 동작. 트립/셧다운용', category: 'instrument' },
  { code: 'PSLL', name: '저저압 스위치', nameEn: 'Pressure Switch Low-Low', description: '비상 저압에서 동작. 트립/셧다운용', category: 'instrument' },
  { code: 'PAH', name: '고압 알람', nameEn: 'Pressure Alarm High', description: '압력 상한 초과 시 경보 발생', category: 'instrument' },
  { code: 'PAL', name: '저압 알람', nameEn: 'Pressure Alarm Low', description: '압력 하한 미달 시 경보 발생', category: 'instrument' },

  // 온도 계기
  { code: 'TI', name: '온도 지시계', nameEn: 'Temperature Indicator', description: '현장에서 온도를 직접 확인하는 계기', category: 'instrument' },
  { code: 'TIT', name: '온도 지시 전송기', nameEn: 'Temperature Indicating Transmitter', description: '온도를 측정하고 제어실로 신호 전송', category: 'instrument' },
  { code: 'TT', name: '온도 전송기', nameEn: 'Temperature Transmitter', description: '온도를 전기 신호로 변환하여 전송', category: 'instrument' },
  { code: 'TIC', name: '온도 지시 조절계', nameEn: 'Temperature Indicating Controller', description: '온도를 측정하고 자동으로 제어', category: 'instrument' },
  { code: 'TE', name: '온도 센서', nameEn: 'Temperature Element', description: '온도를 감지하는 센서 (열전대, RTD 등)', category: 'instrument' },
  { code: 'TS', name: '온도 스위치', nameEn: 'Temperature Switch', description: '설정 온도에서 접점 동작', category: 'instrument' },
  { code: 'TW', name: '온도 웰', nameEn: 'Thermowell', description: '온도 센서를 보호하는 보호관', category: 'instrument' },
  { code: 'TAL', name: '저온 알람', nameEn: 'Temperature Alarm Low', description: '온도 하한 미달 시 경보 발생', category: 'instrument' },

  // 유량 계기
  { code: 'FI', name: '유량 지시계', nameEn: 'Flow Indicator', description: '현장에서 유량을 직접 확인하는 계기', category: 'instrument' },
  { code: 'FIT', name: '유량 지시 전송기', nameEn: 'Flow Indicating Transmitter', description: '유량을 측정하고 제어실로 신호 전송', category: 'instrument' },
  { code: 'FT', name: '유량 전송기', nameEn: 'Flow Transmitter', description: '유량을 전기 신호로 변환하여 전송', category: 'instrument' },
  { code: 'FIC', name: '유량 지시 조절계', nameEn: 'Flow Indicating Controller', description: '유량을 측정하고 자동으로 제어', category: 'instrument' },
  { code: 'FE', name: '유량 센서', nameEn: 'Flow Element', description: '유량을 감지하는 센서 (오리피스, 벤츄리 등)', category: 'instrument' },
  { code: 'FQI', name: '적산 유량계', nameEn: 'Flow Quantity Indicator', description: '누적 유량을 측정하여 표시', category: 'instrument' },
  { code: 'FS', name: '유량 스위치', nameEn: 'Flow Switch', description: '설정 유량에서 접점 동작', category: 'instrument' },
  { code: 'FSH', name: '고유량 스위치', nameEn: 'Flow Switch High', description: '유량이 상한값 도달 시 동작', category: 'instrument' },
  { code: 'FY', name: '유량 연산기', nameEn: 'Flow Relay/Compute', description: '유량 신호를 연산/변환하는 장치', category: 'instrument' },
  { code: 'FO', name: '유량 오리피스', nameEn: 'Flow Orifice', description: '유량 측정용 차압 발생 장치', category: 'instrument' },
  { code: 'FC', name: '유량 조절기', nameEn: 'Flow Controller', description: '유량을 조절하는 컨트롤러', category: 'instrument' },

  // 레벨 계기
  { code: 'LI', name: '레벨 지시계', nameEn: 'Level Indicator', description: '현장에서 액위를 직접 확인하는 계기', category: 'instrument' },
  { code: 'LIT', name: '레벨 지시 전송기', nameEn: 'Level Indicating Transmitter', description: '액위를 측정하고 제어실로 신호 전송', category: 'instrument' },
  { code: 'LT', name: '레벨 전송기', nameEn: 'Level Transmitter', description: '액위를 전기 신호로 변환하여 전송', category: 'instrument' },
  { code: 'LIC', name: '레벨 지시 조절계', nameEn: 'Level Indicating Controller', description: '액위를 측정하고 자동으로 제어', category: 'instrument' },
  { code: 'LG', name: '레벨 게이지', nameEn: 'Level Gauge', description: '탱크 액위를 육안으로 확인하는 유리관', category: 'instrument' },
  { code: 'LS', name: '레벨 스위치', nameEn: 'Level Switch', description: '설정 수위에서 접점 동작', category: 'instrument' },
  { code: 'LSH', name: '고수위 스위치', nameEn: 'Level Switch High', description: '수위가 상한값 도달 시 동작', category: 'instrument' },
  { code: 'LSL', name: '저수위 스위치', nameEn: 'Level Switch Low', description: '수위가 하한값 도달 시 동작', category: 'instrument' },
  { code: 'LSHH', name: '고고수위 스위치', nameEn: 'Level Switch High-High', description: '비상 고수위에서 동작. 트립용', category: 'instrument' },
  { code: 'LAH', name: '고수위 알람', nameEn: 'Level Alarm High', description: '수위 상한 초과 시 경보 발생', category: 'instrument' },

  // 위치/밸브 계기
  { code: 'ZI', name: '위치 지시계', nameEn: 'Position Indicator', description: '밸브 개도를 현장에서 확인', category: 'instrument' },
  { code: 'ZIT', name: '위치 지시 전송기', nameEn: 'Position Indicating Transmitter', description: '밸브 개도를 제어실로 전송', category: 'instrument' },
  { code: 'ZT', name: '위치 전송기', nameEn: 'Position Transmitter', description: '밸브 위치를 전기 신호로 전송', category: 'instrument' },
  { code: 'ZSO', name: '밸브 열림 스위치', nameEn: 'Valve Open Switch', description: '밸브가 완전 열림 상태일 때 동작', category: 'instrument' },
  { code: 'ZSC', name: '밸브 닫힘 스위치', nameEn: 'Valve Close Switch', description: '밸브가 완전 닫힘 상태일 때 동작', category: 'instrument' },
  { code: 'ZIF', name: '밸브 위치 실패 지시', nameEn: 'Valve Position Fail Indicator', description: '밸브 위치 이상 시 표시', category: 'instrument' },
  { code: 'ZTF', name: '밸브 위치 실패 전송', nameEn: 'Valve Position Fail Transmitter', description: '밸브 위치 이상 신호 전송', category: 'instrument' },

  // 분석 계기
  { code: 'AI', name: '분석 지시계', nameEn: 'Analyzer Indicator', description: '성분 분석 결과를 현장에서 확인', category: 'instrument' },
  { code: 'AIT', name: '분석 지시 전송기', nameEn: 'Analyzer Indicating Transmitter', description: '분석 결과를 제어실로 전송', category: 'instrument' },
  { code: 'AT', name: '분석 전송기', nameEn: 'Analyzer Transmitter', description: '분석 신호를 전송하는 장치', category: 'instrument' },
  { code: 'AE', name: '분석 센서', nameEn: 'Analyzer Element', description: '성분을 분석하는 센서 (pH, 산소 등)', category: 'instrument' },
  { code: 'AIC', name: '분석 지시 조절계', nameEn: 'Analyzer Indicating Controller', description: '분석 결과에 따라 자동 제어', category: 'instrument' },
  { code: 'AC', name: '분석 조절기', nameEn: 'Analyzer Controller', description: '분석 결과를 조절하는 컨트롤러', category: 'instrument' },

  // 수동/스위치
  { code: 'HS', name: '핸드 스위치', nameEn: 'Hand Switch', description: '수동 조작용 스위치. 펌프/밸브 기동/정지용', category: 'instrument' },

  // 속도 계기
  { code: 'SI', name: '속도 지시계', nameEn: 'Speed Indicator', description: '회전 속도를 현장에서 확인', category: 'instrument' },
  { code: 'SIC', name: '속도 지시 조절계', nameEn: 'Speed Indicating Controller', description: '속도를 측정하고 자동으로 제어', category: 'instrument' },
  { code: 'ST', name: '속도 전송기', nameEn: 'Speed Transmitter', description: '회전 속도를 전기 신호로 전송', category: 'instrument' },

  // 기타
  { code: 'XY', name: '릴레이/연산기', nameEn: 'Relay/Compute', description: '신호 변환 또는 논리 연산 수행', category: 'instrument' },
  { code: 'YT', name: '변환기', nameEn: 'Transducer', description: '신호 형태를 변환하는 장치', category: 'instrument' },
];

// 전체 사전
export const componentDictionary = [...valveDictionary, ...instrumentDictionary];

// 코드로 사전 항목 찾기
export function getDictionaryEntry(code: string): DictionaryEntry | undefined {
  return componentDictionary.find(entry => entry.code === code);
}

// 카테고리별 필터
export function getDictionaryByCategory(category: DictionaryEntry['category']): DictionaryEntry[] {
  return componentDictionary.filter(entry => entry.category === category);
}
