import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 这行代码会从环境变量中读取值
    const env = loadEnv(mode, '.', '');
    // 增加兼容性：优先读取 GEMINI_API_KEY，如果没有就读 GOOGLE_API_KEY
    const finalApiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "";

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 这样写可以让你的代码无论通过哪个名字都能找到钥匙
        'process.env.API_KEY': JSON.stringify(finalApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(finalApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
