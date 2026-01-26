import { NextRequest, NextResponse } from "next/server";

const DIARY_API_URL =
  "https://bwlemppblj.execute-api.ap-northeast-2.amazonaws.com/prod/diaries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const firstDate = searchParams.get("first_date");
    const lastDate = searchParams.get("last_date");
    const position = searchParams.get("position") || "all";

    // 환경변수에서 토큰 가져오기
    const token = process.env.DIARY_API_TOKEN;

    if (!token || token === "여기에_JWT_토큰을_입력하세요") {
      return NextResponse.json(
        { error: "API 토큰이 설정되지 않았습니다. .env.local 파일을 확인하세요." },
        { status: 401 }
      );
    }

    if (!firstDate || !lastDate) {
      return NextResponse.json(
        { error: "first_date와 last_date 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 외부 API 호출
    const apiUrl = `${DIARY_API_URL}?first_date=${firstDate}&last_date=${lastDate}&position=${position}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API 요청 실패: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("인계일지 API 프록시 오류:", error);
    return NextResponse.json(
      { error: "인계일지 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
