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

// 정비이력 목업 데이터 (항상 표시)
export const maintenanceRecords: MaintenanceRecord[] = [
  {
    permittowork: "30433",
    description: "유량조절밸브 분해점검 및 Actuator 정비",
    daterequired: "2026-01-26 09:00",
    requester: "김필규",
    department: "계전팀",
    equipment: "FCV-7011",
    status: "승인완료"
  },
  {
    permittowork: "30432",
    description: "레벨조절밸브 Positioner 교정",
    daterequired: "2026-01-25 09:00",
    requester: "김필규",
    department: "계전팀",
    equipment: "LCV-7011",
    status: "승인완료"
  },
  {
    permittowork: "30431",
    description: "수동밸브 Packing 교체",
    daterequired: "2026-01-24 13:00",
    requester: "성상우",
    department: "기계팀",
    equipment: "HV-7011-A",
    status: "작업완료"
  }
];

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
