# 온미디어: 토스 미니앱 (앱인토스)

캡처한 맛집·레시피·쇼핑 정보를 자동으로 분류하고 검색해 바로 행동으로 이어주는 스크랩북 미니앱이에요. 갤러리 정리 기능도 함께 들어 있어요. Stitch 디자인을 React + Vite + Tailwind로 옮겼어요.

## 시작하기

```bash
npm install
npm run dev      # 브라우저 개발 (앱인토스 devtools 패널로 SDK 흉내)
npm run build    # dist/ 생성 + onmedia.ait 생성
npm run deploy   # 앱인토스 콘솔 업로드 (ait token add 로 API 키 등록 필요)
```

`npm run build`가 끝나면 루트에 **`onmedia.ait`** 파일이 생겨요. 이 파일을 앱인토스 콘솔에 올리면 돼요.

## 기능 (v1: 캡처 스크랩북 MVP)

| 탭 | 내용 |
| --- | --- |
| **홈** | 캡처 불러오기, 자연어 검색("지난달 성수동 카페"), 카테고리 칩, 스크랩 카드 피드 |
| **컬렉션** | 즐겨찾기, 30일 넘게 안 본 "잊고 있던 스크랩", 카테고리별 모음 |
| **갤러리 정리** | 흔들린 사진, 비슷한 연사, 스크린샷, 어두운 사진을 기기 안에서 찾아 삭제 목록에 담기 |
| **인사이트** | 카테고리 비율, 자주 저장한 동네와 키워드, CSV 내보내기, 갤러리 정리 설정 |

**스크랩 상세 화면**에서는 원본 캡처, AI 요약, 추출 텍스트(복사)를 보여줘요. 카테고리에 따라 바로가기 버튼이 붙어요.
- 장소: 네이버 지도, 카카오맵
- 상품: 쿠팡, 네이버쇼핑
- 재료: 컬리, 쿠팡, 유튜브

공유는 토스 공유 시트로 해요.

### 분석 흐름

1. 사용자가 갤러리에서 캡처를 고르면(한 번에 20장) 긴 변 1024px JPEG로 줄여 **기기(IndexedDB)에 저장**해요.
2. 앱이 `server/`의 Cloudflare Worker로 이미지를 보내요. Worker는 Claude API(`claude-opus-5-5`, 구조화된 출력)로 다음을 한 번에 받아요.
   - OCR 텍스트, 카테고리, 제목, 요약
   - 장소, 상품, 재료, 태그
3. 결과를 기기에 저장해요. 검색은 기기 안에서만 해요. 서버는 이미지를 저장하지 않아요.

### 갤러리 정리 (기기 내 분석)

토스 미니앱 SDK로는 사진을 직접 지울 수 없어서, 정리할 사진은 앱 안의 삭제 목록에 담고 실제 삭제는 사용자가 기기 사진 앱에서 해요. 판정 기준값은 `src/lib/analyze.ts`의 `THRESHOLD`에서 조정해요.

## 분석 서버 배포 (최초 1회)

```bash
cd server
npm install
npx wrangler login                        # Cloudflare 계정 로그인
npx wrangler secret put ANTHROPIC_API_KEY # Claude API 키 입력 (console.anthropic.com)
npx wrangler deploy                       # → https://onmedia-api.<계정>.workers.dev
```

배포 주소를 루트의 `.env`에 넣고 앱을 다시 빌드해요.

```bash
cp .env.example .env
# VITE_API_BASE=https://onmedia-api.<계정>.workers.dev
npm run build   # → onmedia.ait
```

- 로컬 테스트: `server/.dev.vars`에 `ANTHROPIC_API_KEY=...`를 넣고 `npm run dev`를 실행하세요(http://localhost:8787).
- 남용 방지: IP당 분당 30회로 제한돼요(`server/wrangler.toml`). 실제 앱 Origin을 알면 `ALLOWED_ORIGINS`에도 넣어 주세요.
- 비용: 캡처 1장에 대략 입력 1~2천 토큰, 출력 수백 토큰이 들어요. 실제 비용은 Anthropic 콘솔 사용량에서 확인하세요.

## 구조

| 파일 | 설명 |
| --- | --- |
| `apps-in-toss.config.ts` | 앱 이름(`appName`), 브랜드 색, 사진 권한, 내비게이션 바 |
| `server/` | Claude API를 부르는 분석 서버 (Cloudflare Worker) |
| `src/lib/scrap.ts` | 스크랩 타입, 서버 호출, 검색, 바로가기 링크, CSV |
| `src/lib/db.ts` | 스크랩 기기 저장 (IndexedDB) |
| `src/scrapStore.tsx` | 스크랩 상태와 분석 대기열 |
| `src/lib/analyze.ts` | 갤러리 정리용 품질 분석과 분류 |
| `src/lib/device.ts` | SDK 사진 불러오기, 권한, 햅틱, 저장소 |
| `src/store.tsx` | 갤러리 정리 상태 |
| `src/tabs/*.tsx` | 홈, 컬렉션, 갤러리 정리, 인사이트 화면 |
| `src/components/*` | 리뷰 시트, 사진 뷰어, 토스트 등 |

## Stitch 원본과 달라진 점

- 가짜 iOS 상태바(9:41)와 홈 인디케이터를 지웠어요. 실제 기기 상태바와 토스 내비게이션 바가 그 자리를 대신해요.
- 폰 프레임을 지우고 화면 전체를 쓰게 했어요. 하단 요소는 안전 영역(safe area)만큼 올렸어요.
- 가짜 데이터(GB 용량, 인물, 지도, "지우님" 등)를 실제 분석 결과로 바꿨어요.
- 헤더의 검색, 알림, 프로필 버튼 자리에 **캡처 스크랩** 버튼과 (담긴 사진이 있을 때) **삭제 목록** 버튼을 넣었어요. 검색은 홈 화면 검색창에서 해요.
- 시스템 뒤로가기를 누르면 열린 창, 홈 탭 순서로 닫혀요.

## 출시 전 체크리스트

- [ ] `apps-in-toss.config.ts`의 `appName`을 콘솔에 등록한 이름과 맞추기
- [ ] 분석 서버 배포 후 `.env`의 `VITE_API_BASE`를 채우고 다시 빌드
- [ ] 콘솔에 앱 아이콘과 소개 문구 등록 (사진 권한: "선택한 캡처의 글자 인식과 사진 품질 분석", 클립보드: "추출한 텍스트 복사")
- [ ] 개인정보 처리방침에 "분석을 위해 이미지를 AI 서버(Anthropic)로 전송하고 저장하지 않음" 명시
- [ ] 실제 토스 앱(샌드박스)에서 사진 선택, 권한 거부, 재요청 흐름 확인
