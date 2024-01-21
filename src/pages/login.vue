<template>
  <Waterfall
    :list="list"
    :img-width="300"
    :width="'100vw'"
    :height="'100vh'"
    @scroll-reach-bottom="handleReachBottom"
    @on-click="handleClick"
  >
    <!-- 自定义底部文案 -->
    <template #default="{ data }">
      <div style="width: 100%; height: 50px; overflow: hidden">
        <div>{{ data.info }}</div>
      </div>
    </template>
  </Waterfall>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import Waterfall from '@/components/Waterfall.vue';
import imgs from './imgs';

// type ImageType = (typeof imgs)[0];

const list = reactive(imgs);

//触底之后添加数据
const handleReachBottom = () => {
  list.push(...imgs);
};

//图片的点击事件
const handleClick = () => {
  // console.log(item);
};
</script>

<style>
body {
  margin: 0;
}
</style>
