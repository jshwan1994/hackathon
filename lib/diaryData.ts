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
    date: "2026-03-03",
    shift: "DAY",
    writer_name: "김운전",
    content: "밸브 유량 변동 발생, 조절밸브 상태 확인 필요"
  },
  {
    diary_id: "d002",
    date: "2026-03-02",
    shift: "NIGHT",
    writer_name: "박정비",
    content: "보일러 순환펌프 진동 이상 감지, 베어링 점검 예정"
  }
];

// 근무조 한글 변환
export function formatShift(shift: "DAY" | "NIGHT"): string {
  return shift === "DAY" ? "주간" : "야간";
}
