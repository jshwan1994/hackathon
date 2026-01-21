# PID Valve Viewer

Next.js 기반의 PID 밸브 3D 뷰어 애플리케이션

## 기술 스택

- Next.js 15.1.4 (App Router)
- React 18
- TypeScript
- React Three Fiber (@react-three/fiber)
- Three.js
- Tailwind CSS

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

개발 서버는 http://localhost:3000 에서 실행됩니다.

## Vercel 배포

### 1. Vercel CLI 설치 (선택사항)

```bash
npm i -g vercel
```

### 2. Vercel에 배포

#### 방법 A: GitHub 연동 (권장)

1. GitHub에 저장소 푸시
2. [Vercel](https://vercel.com) 접속 및 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 프로젝트 설정 확인 (자동 감지됨)
6. "Deploy" 클릭

#### 방법 B: Vercel CLI 사용

```bash
# 프로젝트 디렉토리에서 실행
vercel

# 프로덕션 배포
vercel --prod
```

### 배포 설정

`vercel.json` 파일에 다음 설정이 포함되어 있습니다:

- Framework: Next.js 자동 감지
- Region: 서울 (icn1)
- Build Command: `npm run build`
- Output Directory: `.next`

### 환경 변수

현재 프로젝트는 환경 변수가 필요하지 않습니다.
향후 API 키나 환경별 설정이 필요한 경우:

1. Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
2. 필요한 환경 변수 추가
3. 재배포

## 프로젝트 구조

```
pid-viewer/
├── app/              # Next.js App Router
│   ├── layout.tsx    # 루트 레이아웃
│   ├── page.tsx      # 메인 페이지
│   └── globals.css   # 글로벌 스타일
├── components/       # React 컴포넌트
├── data/            # 데이터 파일
├── lib/             # 유틸리티 함수
├── public/          # 정적 파일
├── types/           # TypeScript 타입 정의
└── vercel.json      # Vercel 배포 설정
```
