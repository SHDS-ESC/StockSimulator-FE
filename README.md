# 🚀 프로젝트 이름

Vite + React 기반의 프론트엔드 프로젝트입니다. 빠른 개발 서버와 간단한 설정으로 효율적인 개발 환경을 제공합니다.

---

## 📦 빠른 시작 (Getting Started)

### 1. 저장소 클론
```bash
git clone <REPO_URL>
cd <PROJECT_DIR>
```

### 2. Node.js 버전 확인
- 권장: **Node.js 20.x (LTS)**  
```bash
node -v
```

### 3. 패키지 설치
```bash
# npm
npm install

# 또는 pnpm 사용 시
pnpm install
```

### 4. 환경 변수 파일 설정
```bash
cp .env.example .env
# 필요한 값 채우기
>> ex) REACT_APP_API_BASE_URL=http://localhost:8080
```

### 5. 개발 서버 실행
```bash
npm run dev
# 또는
pnpm dev
```

브라우저에서 👉 [http://localhost:5173](http://localhost:5173) 접속

---

## 📂 프로젝트 구조
```
.
├─ public/               # 정적 자산
├─ src/
│  ├─ assets/            # 이미지/폰트 등
│  ├─ App.jsx            # 메인 컴포넌트
│  └─ main.jsx           # React DOM 진입점
├─ index.html            # Vite가 관리하는 HTML
├─ package.json
└─ vite.config.js
```

---

## ⚙️ 주요 스크립트

| Script        | 설명                          |
|---------------|-------------------------------|
| `npm run dev` | 개발 서버 실행 (HMR 지원)     |
| `npm run build` | 프로덕션 빌드 생성          |
| `npm run preview` | 빌드 결과 로컬 미리보기   |
| `npm run lint` | (옵션) ESLint 코드 검사      |
| `npm run format` | (옵션) Prettier 코드 정리  |

---

## 🔐 환경 변수
- Vite는 `VITE_` 접두사가 붙은 변수만 클라이언트에서 접근 가능
- 예시: `.env.example`
```env
VITE_API_BASE_URL=https://api.example.com
```

---

## 🛠️ 협업 규칙 (예시)

- **브랜치명**
  - 기능: `feat/기능명`
  - 버그: `fix/이슈명`
  - 문서: `docs/파일명`
- **PR 규칙**
  - 제목: `feat: 로그인 기능 추가`
  - 내용: 변경 요약, 실행 방법, 이슈 번호

---

## 🏗️ 빌드 & 배포
```bash
npm run build
```
- 결과물은 `dist/` 폴더에 생성
- 정적 호스팅(S3, Netlify, Vercel 등) 가능

---

## 🧹 코드 품질 (옵션)
```bash
npm run lint    # ESLint 검사
npm run format  # Prettier 코드 정리
```

---

## 📝 라이선스
이 프로젝트의 라이선스는 [MIT](./LICENSE)입니다.
