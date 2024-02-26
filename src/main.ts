import { createApp } from 'vue';
import router from './router/index';
import store from './store';
import './style.css';
import App from './App.vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'; //引入图标
import 'element-plus/dist/index.css'; //引入样式
import '@/assets/theme/index.css';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(router).use(store);

app.mount('#app');
