<template>
  <div>
    <div>登录页面</div>
    {{ user.name }}
    <el-button type="">按钮</el-button>
    <router-link to="/home"> 跳转home </router-link>;
  </div>
</template>

<script setup lang="ts">
import { getList } from '@/apis/user';
import { reactive } from 'vue';
import type { User } from '@/types/user';

getList({ id: 2 });

const user: User = reactive({
  name: 'zhangsan',
  age: 20,
});
</script>

<style lang="scss">
body {
  color: $test-color;
}
</style>
