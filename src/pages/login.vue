<template>
  <div>
    <select name="pets" @change="handleChange">
      <option value="default">默认色</option>
      <option value="red">红色</option>
    </select>
    <div>登录页面</div>
  </div>
</template>

<script setup lang="ts">
const handleChange = (e: Event) => {
  window.document.documentElement.setAttribute('data-theme', (e.target as HTMLSelectElement).value);
};
</script>

<style lang="scss">
body {
  color: var(--font-primary);
  background-color: var(--card-primary);
}
/* body {
  filter: grayscale(1);
} */
</style>
