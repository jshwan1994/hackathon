// 정비이력 데이터 타입
export interface MaintenanceRecord {
  permittowork: string;
  description: string;
  daterequired: string;
  requester: string;
  department: string;
  equipment: string;
  status: string;
}

// API에서 정비이력 가져오기 (실제 HxGN EAM 데이터)
export async function fetchMaintenanceHistory(equipmentCode?: string): Promise<MaintenanceRecord[]> {
  try {
    const url = equipmentCode
      ? `/api/maintenance?equipmentCode=${encodeURIComponent(equipmentCode)}`
      : '/api/maintenance';

    const response = await fetch(url);
    const data = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    // API 실패 시 빈 배열 반환
    return [];
  } catch (error) {
    console.error('Failed to fetch maintenance history:', error);
    return [];
  }
}

// 날짜 포맷
export function formatMaintenanceDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split(" ");
  if (parts.length >= 1) {
    const datePart = parts[0].split("-");
    if (datePart.length === 3) {
      const time = parts[1] || "";
      return `${datePart[1]}/${datePart[2]} ${time}`.trim();
    }
  }
  return dateStr;
}

// 상태 색상
export function getStatusColor(status: string): string {
  if (status.includes("완료")) {
    return "bg-green-500/20 text-green-400";
  } else if (status.includes("진행") || status.includes("승인")) {
    return "bg-blue-500/20 text-blue-400";
  }
  return "bg-gray-500/20 text-gray-400";
}
