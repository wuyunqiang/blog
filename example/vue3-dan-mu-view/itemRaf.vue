<!-- eslint-disable no-underscore-dangle -->
<script setup lang="ts" generic="T extends any">
import { ref, onBeforeUnmount, watch, nextTick, onMounted, type StyleValue } from 'vue';
import { fpsLimiter } from './fpsLimiter';
type IFrameItem = {
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
        gapOffset?: number;
    }>(),
    {
        frame: 1,
        delay: 1000,
        innerStyle: () => ({}),
        gapOffset: 50,
    },
);

const emit = defineEmits<{
    (event: 'onEnd', params: { row: number }): void;
    (event: 'onRowAble', params: { row: number }): void;
}>();

const container = ref<HTMLElement>();
const content = ref<HTMLElement>();
let containerWidth = 0;
let contentWidth = 0;

const _item = ref(props.item);
const _delay = ref(props.delay);
const _frame = ref(props.frame);
const _style = ref();
const _row = ref(0);
let relaseRow = true; // 是否释放当前轨道
const resetScroll = () => {
    containerWidth = container.value?.offsetWidth || 0;
    contentWidth = content.value?.offsetWidth || 0;
    if (content.value) {
        content.value.style.transform = `translateX(${containerWidth}px)`;
    }
};
console.log('test js');

const { raf, stopRaf } = fpsLimiter();
const startScroll = () => {
    relaseRow = false;
    resetScroll();
    setTimeout(() => {
        if (contentWidth <= 0 || containerWidth <= 0) {
            return;
        }
        let tx = containerWidth;
        const step = () => {
            tx -= _frame.value;
            if (content.value) {
                content.value.style.transform = `translateX(${tx}px)`;
            }

            if (containerWidth - tx > contentWidth + props.gapOffset && !relaseRow) {
                relaseRow = true;
                nextTick(() => {
                    emit('onRowAble', { row: _row.value });
                });
            }
            if (tx < -contentWidth) {
                nextTick(() => {
                    stopRaf();
                    emit('onEnd', { row: relaseRow ? -1 : _row.value });
                    relaseRow = true;
                });
                return;
            }
        };
        raf(step);
    }, _delay.value);
};

onBeforeUnmount(() => {
    stopRaf();
});

const update = ({ data, delay, frame, row, rowH, zIndex }: IFrameItem) => {
    _item.value = data;
    _delay.value = delay;
    _frame.value = frame;
    _style.value = { top: `${row * rowH}px`, zIndex: `${zIndex}`, height: `${rowH}px` };
    _row.value = row;
    nextTick(() => {
        startScroll();
    });
};

onMounted(() => {
    resetScroll();
});

defineExpose({
    startScroll,
    update,
});
</script>

<template>
    <div ref="container" :style="[props.innerStyle, _style]" class="scroll-row">
        <div ref="content" class="scroll-content">
            <slot :data="_item">
                {{ _item }}
            </slot>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.scroll-row {
    width: 100%;
    position: absolute;
    white-space: nowrap;
}

.scroll-content {
    display: inline-block;
}
</style>
