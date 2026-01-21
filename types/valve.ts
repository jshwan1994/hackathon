export interface ValveData {
  tag: string;
  location: string;
  drawing?: string;
  type?: string;
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
