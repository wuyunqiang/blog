<script setup lang="ts" generic="T extends any">
import { ref, watch } from "vue";

import Item from "./item.vue";

type IItem = {
  data: T;
  frame: number;
  delay: number;
  row: number;
  rowH: number;
  zIndex: number;
};

type ItemIns = {
  startScroll: () => void;
  update: (p: IItem) => void;
};

const getRandomNumber = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const props = withDefaults(
  defineProps<{
    listData?: T[];
    row?: number; // 弹幕轨道行数
    rowH?: number; // 每行高度
    count?: number; // 可复用的实例化数量
    delays?: number[]; // 每条随机延迟范围
    frames?: number[]; // 控制执行速度 越大越快 每帧移动[0.7, 2]像素
  }>(),
  {
    listData: () => [],
    row: 2,
    rowH: 30,
    count: 4,
    delays: () => [1000, 5000],
    frames: () => [0.7, 2],
  }
);

const mapData = (sData: T) => {
  const delay = Math.round(
    getRandomNumber(props.delays[0] || 1000, props.delays[1] || 5000)
  );
  return {
    data: sData,
    frame: Number(
      getRandomNumber(props.frames[0] || 0.7, props.frames[1] || 2).toFixed(1)
    ),
    delay,
    row: Math.round(getRandomNumber(0, props.row - 1)),
    rowH: props.rowH,
    zIndex: delay,
  } satisfies IItem;
};

const list = ref<any[]>([]);
const views = ref<IItem[]>([]);
let idleList: ItemIns[] = [];

watch(
  () => props.listData,
  () => {
    list.value = [...list.value, ...props.listData.map(mapData)];
    if (idleList.length > 0) {
      idleList.forEach((instance) => {
        if (instance) {
          const item = list.value.shift();
          item && instance.update(item);
        }
      });
      idleList = [];
    }
  },
  {
    immediate: true,
  }
);

let short = 0;
watch(
  [list, () => props.count],
  () => {
    if (views.value.length > 0 || !list.value.length) {
      return;
    }
    views.value = list.value.splice(0, props.count);
    short = props.count - views.value.length;
    let needCount = 0;
    const first = views.value[0];
    while (short > needCount && first) {
      views.value.push(first);
      needCount++;
    }
  },
  {
    immediate: true,
  }
);

const itemRefs = ref<any[]>([]);
const handleScrollEnd = (instance: ItemIns) => {
  const item = list.value.shift();
  if (item) {
    instance.update(item);
  } else {
    idleList.push(instance);
  }
};
</script>

<template>
  <div class="dan-mu">
    <Item
      v-for="(item, index) in views"
      :ref="
        (ele) => {
          ele && (itemRefs[index] = ele);
        }
      "
      :key="index"
      :inner-style="{
        top: `${
          index + short >= views.length ? -10000 : item.row * props.rowH
        }px`,
        zIndex: `${item.zIndex}`,
        height: `${props.rowH}px`,
      }"
      :frame="item.frame"
      :delay="item.delay"
      :item="item.data"
      @onEnd="handleScrollEnd(itemRefs[index])"
    >
      <template #default="{ data }">
        <slot :data="data">
          {{ data }}
        </slot>
      </template>
    </Item>
  </div>
</template>

<style lang="scss" scoped>
.dan-mu {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
