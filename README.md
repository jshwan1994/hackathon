# PID 밸브 뷰어

배관계장도(P&ID) 밸브 검색 및 조회 시스템

## 기능

- 🔍 실시간 밸브 검색
- 📊 도면 뷰어
- 📝 밸브 상세 정보 표시
- 🎨 다크 모드 UI
- ⚡ 빠른 성능

## 시작하기

1. 의존성 설치:
```bash
npm install
# 또는
pnpm install
```

2. 개발 서버 실행:
```bash
npm run dev
# 또는
pnpm dev
```

3. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 사용 방법

1. 상단 검색창에 밸브 태그 입력 (예: V-102, HV-6003)
2. 검색 결과에서 원하는 밸브 선택
3. 오른쪽 패널에서 밸브 상세 정보 확인
4. 도면에서 밸브 위치 확인

## 데이터 추가

`public/data/valve_data.json` 파일에 밸브 데이터 추가

## 기술 스택

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
