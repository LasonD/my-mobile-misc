import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Даша і КШЕ',
  webDir: 'www',
  server: {
    url: 'http://192.168.0.145:8100',
    cleartext: true
  }
};

export default config;
