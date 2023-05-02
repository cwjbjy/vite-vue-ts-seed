import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; //这个path用到了上面安装的@types/node

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  //这里进行配置别名
  resolve: {
    alias: {
      "@": path.resolve("./src"), // @代替src
      "#": path.resolve("./types"), // #代替types
    },
  },
});
