import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 등록한 앱 이름(appName)과 반드시 같아야 해요.
  appName: 'onmedia',
  brand: {
    primaryColor: '#4143d4',
  },
  permissions: [
    { name: 'photos', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  navigationBar: {
    withBackButton: false,
    withHomeButton: true,
    withTitle: true,
    theme: 'light',
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',
});
