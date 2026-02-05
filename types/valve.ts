export interface ValveData {
  tag: string;
  location: string;
  drawing?: string;
  type?: string;
  category?: string;  // Valve, Pressure, Temperature, Flow, Level, Analysis, etc.
  position?: {
    x_percent: number;
    y_percent: number;
  };
  cad_position?: {
    x: number;
    y: number;
    z: number;
  };
  layer?: string;
  specs?: {
    pressureRating?: string;
    temperature?: string;
    material?: string;
    flowCoeff?: string;
    manufacturerId?: string;
  };
  status?: 'operational' | 'maintenance' | 'offline';
  lastInspected?: string;
}

// 카테고리별 아이콘/색상 매핑
export const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  // 밸브/계기류
  'Valve': { icon: 'valve', color: '#3b82f6', label: '밸브' },
  'Safety Valve': { icon: 'safety', color: '#dc2626', label: '안전밸브' },
  'Control Valve': { icon: 'tune', color: '#ec4899', label: '조절밸브' },
  'Pressure': { icon: 'speed', color: '#ef4444', label: '압력' },
  'Temperature': { icon: 'thermostat', color: '#f97316', label: '온도' },
  'Flow': { icon: 'water_drop', color: '#06b6d4', label: '유량' },
  'Level': { icon: 'straighten', color: '#8b5cf6', label: '레벨' },
  'Analysis': { icon: 'science', color: '#10b981', label: '분석' },
  'Position': { icon: 'my_location', color: '#6366f1', label: '위치' },
  'Hand/Manual': { icon: 'pan_tool', color: '#78716c', label: '수동' },
  'Speed': { icon: 'speed', color: '#14b8a6', label: '속도' },
  'Vibration': { icon: 'vibration', color: '#a855f7', label: '진동' },
  'Electrical': { icon: 'bolt', color: '#eab308', label: '전기' },
  'Other': { icon: 'category', color: '#64748b', label: '기타' },
};

export interface DrawingData {
  seq: number;
  drawing_no: string;
  title: string;
  file_name: string;
}

export interface SearchResult {
  valve: ValveData;
  drawing?: DrawingData;
}
