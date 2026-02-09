// 점검시 조작사항 (밸브 격리 절차) 데이터

export interface IsolationStep {
  step: number;
  action: 'CLOSE' | 'OPEN' | 'VERIFY';
  valve?: string;
  type?: string;
  description_ko: string;
  description_en: string;
  direction?: 'upstream' | 'downstream' | 'drain';
}

export interface IsolationProcedure {
  target: string;
  steps: IsolationStep[];
}

// DXF 분석에서 추출된 격리 절차 데이터
// 실제 운영 시에는 서버에서 로드하거나 JSON 파일에서 가져옴
export const isolationProcedures: Record<string, IsolationProcedure> = {
  'VC-4307': {
    target: 'VC-4307',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-4308',
        type: 'gate',
        description_ko: '하류(후단) Gate 밸브 VG-4308 폐쇄',
        description_en: 'Close downstream gate valve VG-4308',
        direction: 'downstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VB-4302',
        type: 'ball',
        description_ko: '하류(후단) Ball 밸브 VB-4302 폐쇄',
        description_en: 'Close downstream ball valve VB-4302',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VC-4306': {
    target: 'VC-4306',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-4307',
        type: 'gate',
        description_ko: '하류(후단) Gate 밸브 VG-4307 폐쇄',
        description_en: 'Close downstream gate valve VG-4307',
        direction: 'downstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VB-4301',
        type: 'ball',
        description_ko: '하류(후단) Ball 밸브 VB-4301 폐쇄',
        description_en: 'Close downstream ball valve VB-4301',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VG-4308': {
    target: 'VG-4308',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VC-4307',
        type: 'check',
        description_ko: '상류(전단) Check 밸브 VC-4307 확인 (역류 방지)',
        description_en: 'Verify upstream check valve VC-4307 (backflow prevention)',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VB-4302',
        type: 'ball',
        description_ko: '하류(후단) Ball 밸브 VB-4302 폐쇄',
        description_en: 'Close downstream ball valve VB-4302',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VB-4302': {
    target: 'VB-4302',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-4308',
        type: 'gate',
        description_ko: '상류(전단) Gate 밸브 VG-4308 폐쇄',
        description_en: 'Close upstream gate valve VG-4308',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VC-0585',
        type: 'check',
        description_ko: '하류(후단) Check 밸브 VC-0585 확인',
        description_en: 'Verify downstream check valve VC-0585',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  // DH1 Heater Condensate System - 추가 밸브들
  'VB-4301': {
    target: 'VB-4301',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-4307',
        type: 'gate',
        description_ko: '상류(전단) Gate 밸브 VG-4307 폐쇄',
        description_en: 'Close upstream gate valve VG-4307',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VC-0584',
        type: 'check',
        description_ko: '하류(후단) Check 밸브 VC-0584 확인',
        description_en: 'Verify downstream check valve VC-0584',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VG-4307': {
    target: 'VG-4307',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VC-4306',
        type: 'check',
        description_ko: '상류(전단) Check 밸브 VC-4306 확인 (역류 방지)',
        description_en: 'Verify upstream check valve VC-4306 (backflow prevention)',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VB-4301',
        type: 'ball',
        description_ko: '하류(후단) Ball 밸브 VB-4301 폐쇄',
        description_en: 'Close downstream ball valve VB-4301',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  // DH HE Condensate System 주요 밸브들
  'VG-0581': {
    target: 'VG-0581',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-0582',
        type: 'gate',
        description_ko: '상류(전단) Gate 밸브 VG-0582 폐쇄',
        description_en: 'Close upstream gate valve VG-0582',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VC-0581',
        type: 'check',
        description_ko: '하류(후단) Check 밸브 VC-0581 확인',
        description_en: 'Verify downstream check valve VC-0581',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'OPEN',
        valve: 'VL-0582',
        type: 'drain',
        description_ko: '드레인 밸브 VL-0582 개방 (잔압 해소)',
        description_en: 'Open drain valve VL-0582 (release residual pressure)',
        direction: 'drain'
      },
      {
        step: 4,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VC-0581': {
    target: 'VC-0581',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-0581',
        type: 'gate',
        description_ko: '상류(전단) Gate 밸브 VG-0581 폐쇄',
        description_en: 'Close upstream gate valve VG-0581',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VB-0581',
        type: 'ball',
        description_ko: '하류(후단) Ball 밸브 VB-0581 폐쇄',
        description_en: 'Close downstream ball valve VB-0581',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VB-0581': {
    target: 'VB-0581',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VC-0581',
        type: 'check',
        description_ko: '상류(전단) Check 밸브 VC-0581 확인 (역류 방지)',
        description_en: 'Verify upstream check valve VC-0581 (backflow prevention)',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VG-0583',
        type: 'gate',
        description_ko: '하류(후단) Gate 밸브 VG-0583 폐쇄',
        description_en: 'Close downstream gate valve VG-0583',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VC-0585': {
    target: 'VC-0585',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VB-4302',
        type: 'ball',
        description_ko: '상류(전단) Ball 밸브 VB-4302 폐쇄',
        description_en: 'Close upstream ball valve VB-4302',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VG-0586',
        type: 'gate',
        description_ko: '하류(후단) Gate 밸브 VG-0586 폐쇄',
        description_en: 'Close downstream gate valve VG-0586',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VC-0584': {
    target: 'VC-0584',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VB-4301',
        type: 'ball',
        description_ko: '상류(전단) Ball 밸브 VB-4301 폐쇄',
        description_en: 'Close upstream ball valve VB-4301',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'VG-0585',
        type: 'gate',
        description_ko: '하류(후단) Gate 밸브 VG-0585 폐쇄',
        description_en: 'Close downstream gate valve VG-0585',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  // VL (Line/Drain) 밸브들
  'VL-0582': {
    target: 'VL-0582',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-0581',
        type: 'gate',
        description_ko: '상류(전단) Gate 밸브 VG-0581 폐쇄',
        description_en: 'Close upstream gate valve VG-0581',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'VL-0583': {
    target: 'VL-0583',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-0582',
        type: 'gate',
        description_ko: '상류(전단) Gate 밸브 VG-0582 폐쇄',
        description_en: 'Close upstream gate valve VG-0582',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  // Control Valve - FCV, LCV
  'FCV-0703': {
    target: 'FCV-0703',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'HV-0703A',
        type: 'hand',
        description_ko: '상류(전단) Hand 밸브 HV-0703A 폐쇄',
        description_en: 'Close upstream hand valve HV-0703A',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'HV-0703B',
        type: 'hand',
        description_ko: '하류(후단) Hand 밸브 HV-0703B 폐쇄',
        description_en: 'Close downstream hand valve HV-0703B',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'OPEN',
        valve: 'VL-0703',
        type: 'drain',
        description_ko: '바이패스/드레인 밸브 VL-0703 개방',
        description_en: 'Open bypass/drain valve VL-0703',
        direction: 'drain'
      },
      {
        step: 4,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  'LCV-0702': {
    target: 'LCV-0702',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'HV-0702A',
        type: 'hand',
        description_ko: '상류(전단) Hand 밸브 HV-0702A 폐쇄',
        description_en: 'Close upstream hand valve HV-0702A',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'CLOSE',
        valve: 'HV-0702B',
        type: 'hand',
        description_ko: '하류(후단) Hand 밸브 HV-0702B 폐쇄',
        description_en: 'Close downstream hand valve HV-0702B',
        direction: 'downstream'
      },
      {
        step: 3,
        action: 'OPEN',
        valve: 'VL-0702',
        type: 'drain',
        description_ko: '바이패스/드레인 밸브 VL-0702 개방',
        description_en: 'Open bypass/drain valve VL-0702',
        direction: 'drain'
      },
      {
        step: 4,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  },
  // Safety Valve - PSV
  'PSV-0701': {
    target: 'PSV-0701',
    steps: [
      {
        step: 1,
        action: 'CLOSE',
        valve: 'VG-0701',
        type: 'gate',
        description_ko: '입구측 Gate 밸브 VG-0701 폐쇄',
        description_en: 'Close inlet gate valve VG-0701',
        direction: 'upstream'
      },
      {
        step: 2,
        action: 'VERIFY',
        description_ko: '안전밸브 태깅 확인 - 작업 허가서 확인',
        description_en: 'Verify safety valve tagging - Check work permit'
      },
      {
        step: 3,
        action: 'VERIFY',
        description_ko: '압력계 확인 - 잔압 0 확인 후 작업 시작',
        description_en: 'Check pressure gauge - Verify zero pressure before starting work'
      }
    ]
  }
};

// 밸브 태그로 격리 절차 조회
export function getIsolationProcedure(tag: string): IsolationProcedure | null {
  // 정확한 매칭
  if (isolationProcedures[tag]) {
    return isolationProcedures[tag];
  }

  // 대소문자 무시하고 찾기
  const upperTag = tag.toUpperCase();
  for (const key of Object.keys(isolationProcedures)) {
    if (key.toUpperCase() === upperTag) {
      return isolationProcedures[key];
    }
  }

  return null;
}

// 액션별 색상
export function getActionColor(action: IsolationStep['action']): string {
  switch (action) {
    case 'CLOSE':
      return 'bg-red-500/20 text-red-400';
    case 'OPEN':
      return 'bg-green-500/20 text-green-400';
    case 'VERIFY':
      return 'bg-blue-500/20 text-blue-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

// 액션 아이콘
export function getActionIcon(action: IsolationStep['action']): string {
  switch (action) {
    case 'CLOSE':
      return 'block';
    case 'OPEN':
      return 'check_circle';
    case 'VERIFY':
      return 'verified';
    default:
      return 'help';
  }
}
