<script setup lang="ts" generic="T extends any">
import { computed, ref, watch } from 'vue';
import ItemCss from './itemCss.vue';
import ItemRaf from './itemRaf.vue';

type IItem = {
    data: T;
    frame?: number;
    delay: number;
    row: number;
    rowH: number;
    zIndex: number;
    duration?: number;
};

type ItemIns = {
    startScroll: () => void;
    update: (p: IItem) => void;
};

const getRandomNumber = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

const getRandomNumberInt = (min: number, max: number) => {
    return Math.round(getRandomNumber(min, max));
};

const props = withDefaults(
    defineProps<{
        listData?: T[];
        row?: number; // 弹幕轨道行数
        rowH?: number; // 每行高度
        count?: number; // 可复用的实例化数量
        delays?: number[]; // 每条随机延迟范围
        gapOffset?: number;
        mode?: 'css' | 'raf';
        duration?: number; // 控制执行速度
        frames?: number[]; // 控制执行速度 越大越快 每帧移动[0.7, 2]像素
    }>(),
    {
        listData: () => [],
        row: 2,
        rowH: 30,
        count: 4,
        delays: () => [1000, 5000],
        frames: () => [0.7, 2],
        gapOffset: 100,
        duration: 5000,
        mode: 'css',
    },
);

const mapData = (sData: T) => {
    const delay = getRandomNumberInt(props.delays[0] || 1000, props.delays[1] || 5000);
    return {
        data: sData,
        frame: Number(getRandomNumber(props.frames[0] || 0.7, props.frames[1] || 2).toFixed(1)),
        delay,
        row: getRandomNumberInt(0, props.row - 1),
        rowH: props.rowH,
        zIndex: delay,
    } satisfies IItem;
};

const dataList = ref<any[]>([]); // 缓存的数据列表
const views = ref<IItem[]>([]); // 实例化的item列表
let idleViewList: ItemIns[] = []; // 空闲的实例列表
const rowAbleList = ref<boolean[]>(new Array(props.row).fill(true)); // 轨道是否可用

watch(
    () => props.listData,
    () => {
        dataList.value = [...dataList.value, ...props.listData.map(mapData)];
        const runIdleList = [...idleViewList];
        idleViewList = [];
        runIdleList.forEach((instance) => {
            instance && run(instance);
        });
    },
    {
        immediate: true,
    },
);

watch(
    [dataList, () => props.count],
    () => {
        if (views.value.length > 0 || !dataList.value.length || props.count <= 0) {
            return;
        }
        for (let i = 0; i < props.count; i++) {
            views.value.push(dataList.value[0]);
        }
    },
    {
        immediate: true,
    },
);

const itemRefs = ref<any[]>([]);
const curRow = computed(() => {
    const ableList: number[] = [];
    rowAbleList.value.forEach((item, index) => {
        if (item) {
            ableList.push(index);
        }
    });
    if (!ableList.length) {
        return -1;
    }

    return ableList[getRandomNumberInt(0, ableList.length - 1)] as number;
});

/**
 * 有数据 + 有轨道 + 实例 => 可运行
 * @param instance
 */
const run = (instance: ItemIns) => {
    const itemRow = curRow.value;
    if (dataList.value[0] && itemRow > -1) {
        const item = dataList.value.shift();
        rowAbleList.value[itemRow] = false;
        instance.update({
            ...item,
            row: itemRow,
            duration: props.duration,
        });
    } else {
        idleViewList.push(instance);
    }
};

const initCount = ref(0);

const instanceCallback = (ele: any, index: number) => {
    if (ele && initCount.value < views.value.length) {
        itemRefs.value[index] = ele;
        initCount.value++;
    }
};

/**
 * 行数
 * 数据列表
 * 可复用的实例化dom条数
 * 空闲dom列表
 */
const initRun = () => {
    for (let i = 0; i < props.row; i++) {
        const item = dataList.value.shift();
        if (item) {
            itemRefs.value[i].update({
                ...item,
                row: i,
                duration: props.duration,
            });
            rowAbleList.value[i] = false;
        } else {
            idleViewList.push(itemRefs.value[i]);
        }
    }
    for (let i = props.row; i < itemRefs.value.length; i++) {
        idleViewList.push(itemRefs.value[i]);
    }
};

const stopInit = watch(initCount, () => {
    if (initCount.value > 0 && initCount.value === views.value.length) {
        setTimeout(initRun, 2000);
        stopInit();
    }
});

const onRowAble = (row: number) => {
    rowAbleList.value[row] = true;
    const instance = idleViewList.shift();
    instance && run(instance);
};

const onEnd = (instance: ItemIns, row: number) => {
    rowAbleList.value[row] = true;
    run(instance);
};
</script>

<template>
    <div v-if="mode === 'css'" class="dan-mu">
        <ItemCss
            v-for="(item, index) in views"
            :ref="(ele) => instanceCallback(ele, index)"
            :key="index"
            :delay="item.delay"
            :item="item.data"
            :gapOffset="props.gapOffset"
            @onEnd="({ row }) => onEnd(itemRefs[index], row)"
            @onRowAble="({ row }) => onRowAble(row)"
        >
            <template #default="{ data }">
                <slot :data="data">
                    {{ data }}
                </slot>
            </template>
        </ItemCss>
    </div>

    <div v-else class="dan-mu">
        <ItemRaf
            v-for="(item, index) in views"
            :ref="(ele) => instanceCallback(ele, index)"
            :key="index"
            :frame="item.frame"
            :delay="item.delay"
            :item="item.data"
            :gapOffset="props.gapOffset"
            @onEnd="({ row }) => onEnd(itemRefs[index], row)"
            @onRowAble="({ row }) => onRowAble(row)"
        >
            <template #default="{ data }">
                <slot :data="data">
                    {{ data }}
                </slot>
            </template>
        </ItemRaf>
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
