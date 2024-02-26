<template>
  <div>
    <select name="pets" @change="handleChange">
      <option value="default">默认色</option>
      <option value="black">黑色</option>
    </select>
    <div>登录页面</div>
    <div ref="echartRef" class="myChart"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import themeColor from '@/config/theme';
import * as echarts from 'echarts';

type ThemeTypes = 'default' | 'black';

const echartRef = ref<HTMLDivElement | null>(null);
const theme = ref<ThemeTypes>('default');
const handleChange = (e: Event) => {
  const selectTheme = (e.target as HTMLSelectElement).value as ThemeTypes;
  theme.value = selectTheme;
  window.document.documentElement.setAttribute('data-theme', selectTheme);
};

const drawGraph = () => {
  let echartsInstance = echarts.getInstanceByDom(echartRef.value!);
  if (!echartsInstance) {
    echartsInstance = echarts.init(echartRef.value);
  }
  echartsInstance.clear();
  var option = {
    color: ['#3398DB'],
    title: {
      text: '柱状图',
      left: 'center',
      textStyle: {
        color: themeColor[theme.value].font,
      },
    },
    xAxis: [
      {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisLabel: {
          show: true,
          color: themeColor[theme.value].font,
        },
        nameTextStyle: {
          color: themeColor[theme.value].font,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          show: true,
          color: themeColor[theme.value].font,
        },
        nameTextStyle: {
          color: themeColor[theme.value].font,
        },
      },
    ],
    series: [
      {
        name: '直接访问',
        type: 'bar',
        barWidth: '60%',
        data: [10, 52, 200, 334, 390, 330, 220],
      },
    ],
  };

  echartsInstance.setOption(option);
};
onMounted(() => {
  drawGraph();
});
watch(theme, () => {
  drawGraph();
});
</script>

<style lang="scss">
body {
  color: var(--font-primary);
  background-color: var(--background-main);
}
.myChart {
  width: 300px;
  height: 300px;
}
</style>
