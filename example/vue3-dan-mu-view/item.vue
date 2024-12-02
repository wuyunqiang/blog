<!-- eslint-disable no-underscore-dangle -->
<script setup lang="ts" generic="T extends any">
import {
  ref,
  onBeforeUnmount,
  watch,
  nextTick,
  onMounted,
  type StyleValue,
} from "vue";

type IItem = {
  data: any;
  frame: number;
  delay: number;
  row: number;
  rowH: number;
  zIndex: number;
};

const props = withDefaults(
  defineProps<{
    item: T;
    frame?: number;
    delay?: number;
    innerStyle?: StyleValue;
  }>(),
  {
    frame: 1,
    delay: 1000,
    innerStyle: () => ({}),
  }
);

const emit = defineEmits<{
  (event: "onEnd"): void;
}>();

const container = ref<HTMLElement>();
const content = ref<HTMLElement>();
const translateX = ref(0);
let containerWidth = 0;
let contentWidth = 0;
let animationFrameId = 0;

const _item = ref(props.item);
const _delay = ref(props.delay);
const _frame = ref(props.frame);
const _style = ref();

const resetScroll = () => {
  containerWidth = container.value?.offsetWidth || 0;
  contentWidth = content.value?.offsetWidth || 0;
  translateX.value = containerWidth;
};

const stopScroll = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

const startScroll = () => {
  resetScroll();
  setTimeout(() => {
    if (contentWidth <= 0 || containerWidth <= 0) {
      return;
    }
    const step = () => {
      translateX.value -= _frame.value;
      if (translateX.value < -contentWidth) {
        nextTick(() => {
          emit("onEnd");
        });
      } else {
        animationFrameId = requestAnimationFrame(step);
      }
    };
    step();
  }, _delay.value);
};

onBeforeUnmount(() => {
  stopScroll();
});

const update = ({ data, delay, frame, row, rowH, zIndex }: IItem) => {
  _item.value = data;
  _delay.value = delay;
  _frame.value = frame;
  _style.value = {
    top: `${row * rowH}px`,
    zIndex: `${zIndex}`,
    height: `${rowH}px`,
  };
  nextTick(() => {
    startScroll();
  });
};

onMounted(() => {
  startScroll();
});

defineExpose({
  startScroll,
  update,
});
</script>

<template>
  <div ref="container" :style="[props.innerStyle, _style]" class="scroll-row">
    <div
      ref="content"
      class="scroll-content"
      :style="{ transform: `translateX(${translateX}px)` }"
    >
      <slot :data="_item">
        {{ _item }}
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.scroll-row {
  overflow: hidden;
  width: 100%;
  position: absolute;
  white-space: nowrap;
}

.scroll-content {
  display: inline-block;
}
</style>
