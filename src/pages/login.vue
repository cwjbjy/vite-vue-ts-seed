<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as echarts from 'echarts';
import allAreaCode from '../assets/geoAtlasJson';

const dom = ref(null);

const map = reactive({
  name: 'china',
  code: 100000,
});

//保存访问过的数据
const queue = reactive<{ name: string; code: number }[]>([]);

const getModel = () => {
  fetch(`/100000/${map.code}.geoJson`)
    .then((res) => res.json())
    .then((res) => {
      let echartsInstance = echarts.init(dom.value);
      echartsInstance.clear();
      echarts.registerMap(map.name, res);
      echartsInstance.setOption({
        title: {},
        tooltip: {},
        series: [
          {
            name: '地图',
            type: 'map',
            roam: true,
            zoom: 1,
            map: map.name,
            data: [], //{name,value}省份对应的数值,与业务有关
          },
        ],
      });
      echartsInstance.on('click', (params) => {
        //根据名称找到对应的code
        const code = allAreaCode.find((d: { code: number; name: string }) => d.name === params.name)?.code;
        queue.push({ name: map.name, code: map.code });
        map.name = params.name;
        map.code = code || 100000; //未找到则用全国code兜底
        echarts.dispose(echartsInstance);
        getModel();
      });
      echartsInstance.getZr().on('click', function (event) {
        if (!event.target) {
          // 点击在了空白处，返回上一层级。
          const prev = queue.pop();
          if (prev) {
            map.name = prev.name;
            map.code = prev.code;
            echarts.dispose(echartsInstance);
            getModel();
          }
        }
      });
    })
    .catch(() => {
      window.alert(`缺少${map.name}-${map.code}地区的数据，请补充！！！`);
    });
};
onMounted(() => {
  getModel();
});
</script>

<template>
  <div ref="dom" class="home"></div>
</template>

<style scoped>
.home {
  height: 100vh;
  width: 100vw;
}
</style>
