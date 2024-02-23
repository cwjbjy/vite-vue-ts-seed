<template>
  <div :class="theme">
    <div class="container">
      <select v-model="theme">
        <option value="theme-default">默认色</option>
        <option value="theme-red">红色</option>
      </select>
      <div>登录页面</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const theme = ref('theme-default');
</script>

<style lang="scss">
.container {
  width: 300px;
  height: 300px;
  @include themify($themes) {
    color: themed('font-primary');
    background-color: themed('card-primary');
  }
}
</style>
