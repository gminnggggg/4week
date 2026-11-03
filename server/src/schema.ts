import { z } from 'zod';

/** Claude가 캡처 한 장을 보고 돌려줄 결과. 앱(src/lib/scrap.ts)의 ScrapAnalysis와 같은 모양이에요. */
export const ScrapSchema = z.object({
  category: z
    .enum(['food', 'recipe', 'shopping', 'travel', 'info', 'other'])
    .describe('food=맛집·카페, recipe=레시피, shopping=상품·쇼핑, travel=여행·숙소·예약, info=그 밖의 정보, other=분류 불가'),
  title: z.string().describe('카드에 보일 짧은 한국어 제목 (20자 이내)'),
  summary: z.string().describe('무엇에 관한 캡처인지 한국어 1~2문장 요약'),
  text: z.string().describe('이미지 속 글자를 읽기 순서대로 옮긴 전체 텍스트 (OCR). 글자가 없으면 빈 문자열'),
  places: z
    .array(
      z.object({
        name: z.string().describe('가게·장소 이름'),
        area: z.string().nullable().describe('동네나 지역 (예: 성수동). 모르면 null'),
        address: z.string().nullable().describe('이미지에 적힌 주소. 없으면 null'),
      }),
    )
    .describe('언급된 가게·장소. 없으면 빈 배열'),
  products: z
    .array(
      z.object({
        name: z.string().describe('검색에 바로 쓸 수 있는 상품명'),
        brand: z.string().nullable(),
        price: z.string().nullable().describe('이미지에 적힌 가격 그대로. 없으면 null'),
      }),
    )
    .describe('언급된 상품. 없으면 빈 배열'),
  ingredients: z.array(z.string()).describe('레시피라면 장보기용 재료 이름 목록, 아니면 빈 배열'),
  tags: z.array(z.string()).describe('검색에 도움이 되는 한국어 키워드 3~6개 (# 없이)'),
});

export type Scrap = z.infer<typeof ScrapSchema>;
