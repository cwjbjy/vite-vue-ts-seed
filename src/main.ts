import { createApp } from 'vue';
import router from './router/index';
import './style.css';
import App from './App.vue';

const app = createApp(App);

app.use(router); //注册路由

app.mount('#app');
