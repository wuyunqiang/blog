<script setup lang="ts">
import { computed } from "vue";
defineOptions({
  inheritAttrs: true,
});

const props = defineProps<{
  list: any[];
  column: number;
}>();

const fillList = computed(() => {
  const len = props.column - (props.list.length % props.column);
  return len === props.column ? 0 : len;
});

const itemStyle = computed(() => {
  return {
    width: 100 / props.column + "%",
  };
});
</script>

<template>
  <div class="list">
    <div
      v-for="(item, index) of props.list"
      :key="index"
      :style="itemStyle"
      class="itemClass"
    >
      <slot name="item" :item="item"></slot>
    </div>
    <div
      v-for="index of fillList"
      :key="index"
      :style="itemStyle"
      class="itemClass"
    ></div>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  align-content: flex-start;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;
}

.itemClass {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
