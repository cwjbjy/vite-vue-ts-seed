<template>
  <div>
    <div>登录页面</div>
    <el-button type="">按钮</el-button>
    <router-link to="/home"> 跳转home </router-link>;
  </div>
</template>

<script setup lang="ts">
import { getList } from '@/apis/user';

getList({ id: 2 });
</script>

<style lang="scss">
body {
  color: $test-color;
}
</style>
