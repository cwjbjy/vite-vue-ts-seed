<template>
  <div
    ref="container"
    class="vue-waterfall-container"
    :style="{
      width,
      height,
    }"
  >
    <div v-show="loading" class="loading ball-beat" :class="{ first: isFirstLoad }">
      <div v-for="(_, index) in 3" :key="index" class="dot"></div>
    </div>
    <div ref="scrollEl" class="vue-waterfall-scroll">
      <div
        v-for="(item, index) in imgs"
        :key="index"
        class="img-box"
        :class="['default-card-animation', { __err__: item._error }]"
        :style="{
          padding: gap / 2 + 'px',
          width: colWidth + 'px',
        }"
        @click="handleClickImage(item)"
      >
        <div class="cardStyle">
          <div
            class="img-inner-box"
            :style="{
              width: imgWidth + 'px',
              height: item._height + 'px',
            }"
          >
            <img :src="item.url" />
          </div>
          <div class="img-box-footer">
            <slot :data="item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { cloneDeep } from 'lodash-es';

type Item = {
  url: string;
  info: string;
  [key: string]: any;
};

const props = withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    imgWidth?: number;
    gap?: number;
    list: Item[];
    reachBottomDistance?: number;
  }>(),
  {
    width: '100%',
    height: '100%',
    imgWidth: 240,
    gap: 20,
    reachBottomDistance: 20,
  },
);

const emit = defineEmits(['scrollReachBottom', 'onClick']);

const loading = ref(true); // 正在预加载中，显示加载动画
const isFirstLoad = ref(true); //首次加载
const imgs = ref<Item[]>([]); // 有height字段的图片列表
const cols = ref(0); // 列数
const loadedCount = ref(0); //大于此值为新增图片
const beginIndex = ref(0); // 大于此值为要新排列的图片
const colsHeight = ref<number[]>([]); //每列的高度，用于寻找最小高度

const container = ref<HTMLDivElement | null>(null);
const scrollEl = ref<HTMLDivElement | null>(null);

const colWidth = computed(() => props.imgWidth + props.gap);

const calcCols = () => {
  const width = (container.value as HTMLDivElement).offsetWidth;
  return Math.max(Math.floor(width / colWidth.value), 2);
};

const preload = () => {
  const list: Item[] = cloneDeep(props.list);
  list.forEach((item, index) => {
    if (index < loadedCount.value) return; // 只对新加载图片进行预加载
    let oImg = new Image();
    oImg.src = item.url;
    oImg.onload = oImg.onerror = (e: any) => {
      loadedCount.value++;

      // 预加载图片，计算图片容器的高
      list[index]._height =
        e.type === 'load' ? Math.round(props.imgWidth * (oImg.height / oImg.width)) : props.imgWidth;

      if (e.type == 'error') {
        list[index]._error = true;
        console.error('图片加载失败', list[index]);
      }
      if (loadedCount.value === list.length) {
        //图片_height属性已添加，执行渲染
        imgs.value = list;
        isFirstLoad.value = false;
        nextTick(() => {
          loading.value = false;
          waterfall(); //在下一个钩子中，控制图片的位置
        });
      }
    };
  });
};

const waterfall = () => {
  const imgBoxEls = (scrollEl.value as HTMLDivElement).children;
  let top, left, height;
  if (beginIndex.value == 0) colsHeight.value = [];
  for (let i = beginIndex.value; i < imgs.value.length; i++) {
    height = (imgBoxEls[i] as HTMLDivElement).offsetHeight;
    if (i < cols.value) {
      //第一排，直接把高塞入数组
      colsHeight.value.push(height);
      top = 0;
      left = i * colWidth.value;
    } else {
      const minHeight = Math.min(...colsHeight.value); // 最低高低
      const minIndex = colsHeight.value.indexOf(minHeight); // 最低高度的索引
      top = minHeight;
      left = minIndex * colWidth.value;
      // 更新colsHeight，元素的高度加到最小高度上
      colsHeight.value[minIndex] = minHeight + height;
    }
    (imgBoxEls[i] as HTMLDivElement).style.left = left + 'px';
    (imgBoxEls[i] as HTMLDivElement).style.top = top + 'px';
  }
  beginIndex.value = imgs.value.length; // 排列完之后，新增图片从这个索引开始预加载图片和排列
};

const onScroll = () => {
  //如果正在预加载
  if (loading.value) return;
  const minHeight = Math.min(...colsHeight.value);
  if (scrollEl.value) {
    if (scrollEl.value.scrollTop + scrollEl.value.offsetHeight > minHeight - props.reachBottomDistance) {
      loading.value = true;
      emit('scrollReachBottom');
    }
  }
};

const onResize = () => {
  const old = cols.value;
  cols.value = calcCols();
  if (old === cols.value) return; // 列数不变直接退出
  beginIndex.value = 0; // 开始排列的元素索引
  waterfall(); //进行排列
};

const handleClickImage = (value: Item) => {
  emit('onClick', value);
};

watch(props.list, preload);

onMounted(() => {
  preload();
  cols.value = calcCols(); //根据容器宽度和图片宽度，得到列数
  window.addEventListener('resize', onResize);
  (scrollEl.value as HTMLDivElement).addEventListener('scroll', onScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  (scrollEl.value as HTMLDivElement).removeEventListener('scroll', onScroll);
});
</script>

<style lang="scss">
.vue-waterfall-container {
  position: relative;

  .vue-waterfall-scroll {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
  }

  .img-box {
    position: absolute;
    box-sizing: border-box;

    //卡片出来时的动画
    &.default-card-animation {
      animation: show-card 0.4s;
      transition:
        left 0.6s,
        top 0.6s;
      transition-delay: 0.1s;
    }
    @keyframes show-card {
      0% {
        transform: scale(0.5);
      }
      100% {
        transform: scale(1);
      }
    }
    .cardStyle {
      box-shadow:
        rgba(0, 0, 0, 0.2) 0px 3px 1px -2px,
        rgba(0, 0, 0, 0.14) 0px 2px 2px 0px,
        rgba(0, 0, 0, 0.12) 0px 1px 5px 0px;
      border-radius: 4px;
      img {
        width: 100%;
        display: block;
        border-radius: 4px 4px 0 0;
      }
    }

    &.__err__ {
      .img-inner-box {
        background-image: url(data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/4QMraHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjk1M0JCM0QwNkVFNDExRThCNTJCQUQ2RDFGQzg0NzIxIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjk1M0JCM0NGNkVFNDExRThCNTJCQUQ2RDFGQzg0NzIxIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QTYwRUMyMDE2RUUzMTFFOEJCRTU5RTFDODg1ODgwMjYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QTYwRUMyMDI2RUUzMTFFOEJCRTU5RTFDODg1ODgwMjYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCACRAJEDASIAAhEBAxEB/8QAZQAAAwEBAQAAAAAAAAAAAAAAAAIDAQQHAQEAAAAAAAAAAAAAAAAAAAAAEAACAQMDBAEFAAMBAAAAAAAAAQIRMQMhQRJRYYEycZHBIkITsdFSYhEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A9AAAAAMFnNQWt9kAwkssVbV9CTnKb10XQVtLSyAd5ZuzURW27yfhmX9RlDI+wD4Vf/ZVi41SKCdeNI3YEnOXJtOiBZZr/wBGcMi2Ft7AXjli76PoOcqael0Mpyg9NV0A6QEhNTWl90MBoAAAAAAGGiTlxjXfZAZkycdEqyI3q26sOrd92CTm6bbsA1boh1i3lqPGKiqIZAYklYHY0x6tIDY2B3NdjEBgNJ3NACTxbx0E1TozoYsoqSowI2o06MtjyctGqSItODptsw6NX2YHSaJCXKNd90OAAAAYznnLnJvZWK5pUjRXloiNdwCjk0l9S0YqKohcSpGrvLUcDUBLK23x23FWNtVSAuHch/KXQP5PoBdqq77GJ1XfczFVKjVBcuPk6rXqBQCH8n0D+UugFwZD+bV1oNif5OOzQDyipKjI0cW0/qXYmVVjVXjqAkZcHXZ3OhHNXcthlWNHeOjAoAABDLKs6bISlWl1Busm+42Jfm30At2BmI1gRy+3gpD1XwTy+3gpH1QDASyt8uKdFuJRw1iwOjdBKy+TIutGbK3kAAxtJNuwiywdmA7s/glj9/BV04unQli9l8AWDsBjAhSja6D4pUnTZmZV+afUVOkk+4HUBgAc0bD4v2+fsJGw+L9vn7AVQMEDAjl9vBSHqvgnl9vBSHqvgDJwbfJC8JPSlEO5wTo3qMnUDEqNGz0jXoD08BRSXyBB/m6u2xvFPQ1qjoDAVNxqv1ZuJUnT5BGw9/AFQYAwJZf1+fsJKw+X9fn7CSsB0AAAc7VG13GxP82uoZFSbezFWkkwOgGCBgRy15adDZTaioq7QZPfwZQDFFfPc2MnB0vE1AwCc+WituPjaS4kzU6agPkS9hEVeqJJU0AAh7+ACHv4AqAAwI5X+aXQVKrS7g3WTY2ONZp7IC9AAAJ5lWNf+dSV1XqdL1VGc8lxk47bAUxyqqO60GIpuL5LyuxZNNVVtmAmVfkpbbi1RYAI1QVRYAI1QJ1aRYzdAbJ8Y1I1RZggI1SNxL8uW1NCoAYxckqKiu9Bm0lV23ZFtyfJ+F2Ayyr0K4VSNf8ArUnFcpKO250LRUQABoAYLkhzXdWHMA5u26uNGXF9tx8uOusfYlbTcC6aaqrdTTnTlHVfQrHJF6PRsBwAAC5i9vg0xbgaAIAAxtJVduosskVotWiTcpav6ANKXJ9the27sF9NyuLHTWXsA2OHBd3cYDQAAAAAAAwSeNS1syhgHNRxdJfUK10ujoaTuJLCrp0Amm1Ztdhv6z3Sfkxwmu4leqoBT+1P1f8AkZy4469daEaopllRqPRAH9ZOyp5Fbbu2+xmuyGUJvsAtaaWQUcnSP1Kxwq7dR0krALDGo63Y4GgAAAAAAAAAAAAAAAAAshJ7AAGK6B3YABsNx4gADAAAAAAAAAAAAAf/2Q==);
        background-repeat: no-repeat;
        background-position: center;
        background-size: 50% 50%;

        & > img {
          display: none;
        }
      }
    }
  }

  > .loading {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 6px;
    z-index: 999;

    &.first {
      bottom: 50%;
      transform: translate(-50%, 50%);
    }

    &.ball-beat {
      > .dot {
        vertical-align: bottom;
        background-color: #4b15ab;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin: 3px;
        animation-fill-mode: both;
        display: inline-block;
        animation: loading 0.7s 0s infinite linear;

        &:nth-child(2n-1) {
          animation-delay: 0.35s;
        }
      }
    }
    @keyframes loading {
      50% {
        opacity: 0.2;
        transform: scale(0.75);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
}
</style>
