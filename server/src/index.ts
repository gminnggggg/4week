import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { ScrapSchema } from './schema';

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** 쉼표로 구분한 허용 Origin 목록. 비우면 모든 Origin 허용 (개발용) */
  ALLOWED_ORIGINS?: string;
  RATE_LIMITER?: RateLimit;
}

const MODEL = 'claude-opus-5-5';
const MAX_IMAGE_BYTES = 1_500_000; // base64 디코딩 기준. 앱에서 1024px JPEG로 줄여 보내요.
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const SYSTEM = `당신은 사용자가 스마트폰으로 캡처한 이미지(인스타그램·블로그·쇼핑몰·지도 화면 등)를 정리해 주는 도우미입니다.
이미지에 실제로 보이는 정보만 사용하고, 보이지 않는 가게 이름·주소·가격은 지어내지 마세요.
모든 설명 필드는 한국어로 작성하세요. text 필드에는 이미지 속 글자를 원문 그대로 옮기되, 광고 문구·UI 버튼(좋아요, 공유 등)은 빼도 됩니다.`;

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = allowed.length === 0 ? '*' : origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const headers = cors(req.headers.get('Origin'), env);
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method === 'GET' && url.pathname === '/health') return json({ ok: true }, 200, headers);
    if (req.method !== 'POST' || url.pathname !== '/analyze') return json({ error: 'not_found' }, 404, headers);

    if (env.RATE_LIMITER) {
      const key = req.headers.get('CF-Connecting-IP') ?? 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key });
      if (!success) return json({ error: 'rate_limited' }, 429, headers);
    }

    let body: { image?: string; mediaType?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid_json' }, 400, headers);
    }
    const image = typeof body.image === 'string' ? body.image.replace(/^data:[^,]*,/, '') : '';
    const mediaType = (MEDIA_TYPES as readonly string[]).includes(body.mediaType ?? '') ? (body.mediaType as MediaType) : 'image/jpeg';
    if (!image) return json({ error: 'image_required' }, 400, headers);
    if ((image.length * 3) / 4 > MAX_IMAGE_BYTES) return json({ error: 'image_too_large' }, 413, headers);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });

    try {
      const response = await client.beta.messages.parse({
        model: MODEL,
        max_tokens: 8000,
        // 거절 시 Anthropic이 추천하는 모델로 서버에서 자동 재시도
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // 단순 추출·분류 작업이라 낮은 effort로 비용과 지연을 줄여요
        output_config: { effort: 'low', format: betaZodOutputFormat(ScrapSchema) },
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: '이 캡처를 분석해서 스키마에 맞게 정리해 주세요.' },
            ],
          },
        ],
      });

      if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 422, headers);
      if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
        return json({ error: 'incomplete' }, 502, headers);
      }
      return json({ scrap: response.parsed_output }, 200, headers);
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503, headers);
      if (error instanceof Anthropic.BadRequestError) {
        console.error('bad request', error.message);
        return json({ error: 'bad_image' }, 400, headers);
      }
      if (error instanceof Anthropic.APIError) {
        console.error('api error', error.status, error.message);
        return json({ error: 'upstream' }, 502, headers);
      }
      console.error('unexpected', error);
      return json({ error: 'internal' }, 500, headers);
    }
  },
} satisfies ExportedHandler<Env>;
