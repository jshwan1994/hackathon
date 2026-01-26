// 인계일지 데이터 타입
export interface DiaryEntry {
  diary_id: string;
  date: string;
  shift: "DAY" | "NIGHT";
  writer_name: string;
  content: string;
}

// 인계일지 목업 데이터 (항상 표시)
export const diaryRecords: DiaryEntry[] = [
  {
    diary_id: "d001",
    date: "2026-01-26",
    shift: "DAY",
    writer_name: "김운전",
    content: "밸브 유량 변동 발생, 조절밸브 상태 확인 필요"
  },
  {
    diary_id: "d002",
    date: "2026-01-25",
    shift: "NIGHT",
    writer_name: "이교대",
    content: "레벨 헌팅 현상 발생, 계전팀 연락함"
  },
  {
    diary_id: "d003",
    date: "2026-01-25",
    shift: "DAY",
    writer_name: "박주간",
    content: "밸브 조작 원활, 정상 운전"
  }
];

// 근무조 한글 변환
export function formatShift(shift: "DAY" | "NIGHT"): string {
  return shift === "DAY" ? "주간" : "야간";
}
