// vite.config.ts
import { defineConfig } from "file:///C:/Users/81904/cooking-cost-system/cooking-cost-system/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/81904/cooking-cost-system/cooking-cost-system/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\81904\\cooking-cost-system\\cooking-cost-system\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 3e3,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3e3,
      clientPort: 3e3
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false
      },
      "/uploads": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFw4MTkwNFxcXFxjb29raW5nLWNvc3Qtc3lzdGVtXFxcXGNvb2tpbmctY29zdC1zeXN0ZW1cXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXDgxOTA0XFxcXGNvb2tpbmctY29zdC1zeXN0ZW1cXFxcY29va2luZy1jb3N0LXN5c3RlbVxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvODE5MDQvY29va2luZy1jb3N0LXN5c3RlbS9jb29raW5nLWNvc3Qtc3lzdGVtL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgICByZWFjdCgpXHJcbiAgICBdLFxyXG5cclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgICBhbGlhczoge1xyXG4gICAgICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG5cclxuICAgIHNlcnZlcjoge1xyXG4gICAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgICAgICBwb3J0OiAzMDAwLFxyXG4gICAgICAgIGhtcjoge1xyXG4gICAgICAgICAgICBwcm90b2NvbDogJ3dzJyxcclxuICAgICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXHJcbiAgICAgICAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgICAgICAgIGNsaWVudFBvcnQ6IDMwMDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBwcm9jZXNzLmVudi5WSVRFX0FQSV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnL3VwbG9hZHMnOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LlZJVEVfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXN0OiB7XHJcbiAgICAgICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcclxuICAgICAgICBzZXR1cEZpbGVzOiBbJy4vc3JjL3Rlc3Qvc2V0dXAudHMnXSxcclxuICAgICAgICBjc3M6IHRydWUsXHJcbiAgICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQTJYLFNBQVMsb0JBQW9CO0FBQ3haLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLEVBQ1Y7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0o7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNKLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNELFVBQVU7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0gsUUFBUTtBQUFBLFFBQ0osUUFBUSxRQUFRLElBQUksZ0JBQWdCO0FBQUEsUUFDcEMsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1o7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNSLFFBQVEsUUFBUSxJQUFJLGdCQUFnQjtBQUFBLFFBQ3BDLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNaO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUVBLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxFQUNmO0FBQUEsRUFFQSxNQUFNO0FBQUEsSUFDRixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMscUJBQXFCO0FBQUEsSUFDbEMsS0FBSztBQUFBLEVBQ1Q7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
