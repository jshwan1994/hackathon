// 인계일지 데이터 타입 정의
export interface DiaryBodyItem {
  content: string | null;
  index?: number;
  entry_id?: string;
}

export interface DiaryEntry {
  diary_id: string;
  date: string;
  shift: "DAY" | "NIGHT";
  writer_name: string;
  body: DiaryBodyItem[];
}

export interface DiaryResponse {
  count: number;
  items: DiaryEntry[];
  last_page_key: string | null;
}

// 날짜 포맷 변환 (YYYYMMDD -> YYYY-MM-DD)
export function formatDiaryDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

// 근무조 한글 변환
export function formatShift(shift: "DAY" | "NIGHT"): string {
  return shift === "DAY" ? "주간" : "야간";
}

// 밸브 태그가 포함된 일지 항목 검색
export function searchDiariesByValveTag(
  diaries: DiaryEntry[],
  valveTag: string
): DiaryEntry[] {
  if (!valveTag || !diaries || diaries.length === 0) {
    return [];
  }

  // 밸브 태그를 정규화 (대소문자 무시, 하이픈/공백 유연하게 처리)
  const normalizedTag = valveTag.toUpperCase().replace(/[-\s]/g, "");

  return diaries.filter((diary) => {
    // body 배열의 모든 content에서 밸브 태그 검색
    return diary.body.some((item) => {
      if (!item.content) return false;
      const normalizedContent = item.content.toUpperCase().replace(/[-\s]/g, "");
      return normalizedContent.includes(normalizedTag);
    });
  });
}

// 특정 일지에서 밸브 태그가 언급된 줄만 추출
export function extractRelevantContent(
  diary: DiaryEntry,
  valveTag: string
): string[] {
  const normalizedTag = valveTag.toUpperCase().replace(/[-\s]/g, "");
  const relevantLines: string[] = [];

  diary.body.forEach((item) => {
    if (!item.content) return;

    // 내용을 줄 단위로 분리하여 해당 밸브 태그가 포함된 줄만 추출
    const lines = item.content.split('\n');
    lines.forEach((line) => {
      const normalizedLine = line.toUpperCase().replace(/[-\s]/g, "");
      if (normalizedLine.includes(normalizedTag) && line.trim()) {
        relevantLines.push(line.trim());
      }
    });
  });

  return relevantLines;
}

// 오늘 기준 날짜 범위 계산 (최근 N일)
export function getDateRange(days: number = 30): {
  firstDate: string;
  lastDate: string;
} {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - days);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  return {
    firstDate: formatDate(pastDate),
    lastDate: formatDate(today),
  };
}

// 인계일지 API 호출 (클라이언트용 - 토큰은 서버에서 처리)
export async function fetchDiaries(
  firstDate: string,
  lastDate: string
): Promise<DiaryEntry[]> {
  try {
    // CLO(운전) 포지션의 일지 조회 (position=all은 지원되지 않음)
    const response = await fetch(
      `/api/diaries?first_date=${firstDate}&last_date=${lastDate}&position=CLO`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
    }

    const data: DiaryResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("인계일지 조회 실패:", error);
    throw error;
  }
}
