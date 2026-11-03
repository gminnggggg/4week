import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

export default defineConfig({
  plugins: [react(), aitDevtools.vite()],
  // 미니앱 번들은 상대 경로로 로드되므로 base를 './'로 둡니다.
  base: './',
});
