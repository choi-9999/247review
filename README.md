# 이투스247학원 지점별 재원후기

2026년 졸업생 재원후기를 지점별로 탐색할 수 있는 정적 웹페이지입니다.

## 파일 구조

- `index.html`: 메인 페이지
- `styles.css`: 전체 스타일
- `script.js`: 데이터 렌더링 및 상호작용
- `data/reviews.js`: 브라우저에서 바로 읽는 후기 데이터
- `data/reviews.json`: 원본 JSON 데이터

## 로컬 실행

정적 파일이라 `index.html`을 브라우저에서 바로 열어도 동작합니다.

## GitHub + Vercel 권장 배포 흐름

1. 이 폴더를 GitHub 저장소에 푸시합니다.
2. Vercel에서 `Import Git Repository`로 해당 저장소를 연결합니다.
3. Framework Preset은 `Other` 또는 정적 사이트로 진행합니다.
4. 빌드 설정 없이 그대로 배포해도 됩니다.

## 수정 방법

- 후기 데이터만 바꿀 때: `data/reviews.js`, `data/reviews.json`
- 화면 스타일만 바꿀 때: `styles.css`
- 상호작용/필터를 바꿀 때: `script.js`
