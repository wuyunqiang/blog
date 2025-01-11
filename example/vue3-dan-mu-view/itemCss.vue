<script setup lang="ts" generic="T extends any">
import { ref, onBeforeUnmount, watch, nextTick, onMounted, type StyleValue } from 'vue';
type IItem = {
    data: any;
    duration?: number;
    delay: number;
    row: number;
    rowH: number;
    zIndex: number;
};

const props = withDefaults(
    defineProps<{
        item: T;
        delay?: number;
        innerStyle?: StyleValue;
        gapOffset?: number;
    }>(),
    {
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
const _duration = ref(5000);
const _style = ref();
const _row = ref(0);
const _move = ref(false);
const aniStyle = ref({});
let relaseRow = true; // 是否释放当前轨道

const resetScroll = () => {
    _move.value = false;
    containerWidth = container.value?.offsetWidth || 0;
    contentWidth = content.value?.offsetWidth || 0;
    aniStyle.value = {
        transitionDelay: `0s`,
        transform: `translateX(${containerWidth}px)`,
        transitionDuration: '0s',
    };
};

let t: any = 0;
const startScroll = () => {
    relaseRow = false;
    aniStyle.value = {
        transitionDuration: `${_duration.value}ms`,
        transitionDelay: `${_delay.value}ms`,
        transform: `translateX(-100%)`,
        'transition-timing-function': `steps(${Math.ceil((_duration.value * 4) / 100)})`,
    };
    const d =
        (Math.round(((contentWidth + props.gapOffset) / (contentWidth + containerWidth)) * 100) / 100) *
        _duration.value;
    t = setTimeout(() => {
        if (!relaseRow) {
            relaseRow = true;
            emit('onRowAble', { row: _row.value });
        }
    }, _delay.value + d);
};
onBeforeUnmount(() => {
    t && clearTimeout(t);
});

const update = ({ data, delay, duration, row, rowH, zIndex }: IItem) => {
    _item.value = data;
    _delay.value = delay;
    _duration.value = duration || 5000;
    _style.value = { top: `${row * rowH}px`, zIndex: `${zIndex}`, height: `${rowH}px` };
    _row.value = row;
    startScroll();
};

onMounted(() => {
    resetScroll();
});

const onAniEnd = (e: TransitionEvent) => {
    if (e.target !== content.value) {
        return;
    }
    resetScroll();
    setTimeout(() => {
        if (!relaseRow) {
            relaseRow = true;
            emit('onEnd', { row: _row.value });
        } else {
            emit('onEnd', { row: -1 });
        }
    }, 16);
};

defineExpose({
    startScroll,
    update,
});
</script>

<template>
    <div ref="container" :style="[props.innerStyle, _style]" class="scroll-row">
        <div ref="content" :class="['scroll-content']" :style="aniStyle" @transitionend="onAniEnd">
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
    transition-property: transform;
}
</style>
