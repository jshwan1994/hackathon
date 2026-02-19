import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "public", "data", "roadview-settings.json");

// GET: 저장된 설정 읽기
export async function GET() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return NextResponse.json(null);
    }
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(null);
  }
}

// POST: 설정 저장 (dev 모드에서만 파일에 직접 저장)
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // public/data 디렉토리 확인
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
