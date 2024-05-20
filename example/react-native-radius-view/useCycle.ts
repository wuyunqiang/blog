import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, type PanResponderGestureState } from 'react-native';

export type LayoutItem = { centerX: number; centerY: number };

export const enum Direction {
    'left',
    'right',
}

export type AniItem = {
    AniX: Animated.Value;
    AniY: Animated.Value;
    scale: Animated.Value;
    opt: Animated.Value;
};

const LocationNums = [8, 6, 4, 2, 0, 1, 3, 5, 7];
const LocationCount = 9;
const Center = Math.floor(9 / 2);
export const useCycle = <T>(dataList: T[]) => {
    const layoutListRef = useRef<LayoutItem[]>([]);
    const onItemLayout = (e, index) => {
        layoutListRef.current[index] = {
            centerX: e.nativeEvent.layout.x + e.nativeEvent.layout.width / 2,
            centerY: e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2,
        };
    };

    const lockRef = useRef(false); // 动画进行中上锁
    const [curItem, changeCurItem] = useState<{ data: T; index: number }>();

    const [cycleList, changeCycleList] = useState<
        {
            data: T;
            ani: AniItem;
        }[]
    >([]);
    const infoList = useRef<
        {
            pos: number;
            offsetX: number;
            offsetY: number;
            center: boolean;
        }[]
    >([]);
    const [start, setStart] = useState(Center);
    const [end, setEnd] = useState(Center);
    useEffect(() => {
        if (!dataList.length) {
            return;
        }
        const list = [];
        for (let i = 0; i < LocationCount; i++) {
            list[i] = {
                data: dataList[i],
                ani: {
                    AniX: new Animated.Value(0),
                    AniY: new Animated.Value(0),
                    scale: new Animated.Value(i === 0 ? 1.5 : 1),
                    opt: new Animated.Value(i === 0 ? 1 : 0),
                },
            };
        }
        changeCycleList(list);

        const nextStart =
            dataList.length % 2 === 0
                ? Center - (dataList.length / 2 - 1)
                : Center - Math.floor(dataList.length / 2);
        const nextEnd = Center + Math.floor(dataList.length / 2);
        setStart(nextStart);
        setEnd(nextEnd);
        changeCurItem({
            data: dataList[0],
            index: 0,
        });
        infoList.current = LocationNums.slice(nextStart, nextEnd + 1).map(item => ({
            pos: item,
            offsetX: 0,
            offsetY: 0,
            center: item === 0,
        }));
    }, [dataList]);

    const changeCenterIndex = (isAdd, step) => {
        const curUserIndex = infoList.current.findIndex(item => item.center);
        // console.log('test curUserIndex', isAdd ? curUserIndex + step : curUserIndex - step);
        infoList.current[curUserIndex].center = false;
        infoList.current[isAdd ? curUserIndex + step : curUserIndex - step].center = true;
    };

    const generateAniList = (
        aniListXY: Array<Animated.CompositeAnimation>,
        item: {
            data: T;
            ani: AniItem;
        },
        aniObj: { x: number; y: number; o: number; s: number },
    ) => {
        const t = 400;
        aniListXY.push(
            Animated.timing(item.ani.AniX, {
                toValue: aniObj.x,
                duration: t,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(item.ani.AniY, {
                toValue: aniObj.y,
                duration: t,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(item.ani.scale, {
                toValue: aniObj.s,
                duration: t,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(item.ani.opt, {
                toValue: aniObj.o,
                duration: 200,
                useNativeDriver: true,
            }),
        );
    };

    const leftXY = (step = 1) => {
        const aniListXY = [];
        [...infoList.current].reverse().forEach((info, i) => {
            let s = 1;
            let o = 0;
            const item = cycleList[info.pos];
            let index = end - i; // 当前的元素位置
            if (index < 0) {
                return;
            }
            const nextIndex = Math.max(index - step, 0); // 将要移动到的下一个元素位置
            if (index >= LocationNums.length && nextIndex >= LocationNums.length) { // 处理超出边界的case
                return;
            }
            index = Math.min(end - i, LocationNums.length - 1);

            const x =
                layoutListRef.current[LocationNums[nextIndex]].centerX -
                layoutListRef.current[LocationNums[index]].centerX;
            const y =
                layoutListRef.current[LocationNums[nextIndex]].centerY -
                layoutListRef.current[LocationNums[index]].centerY;
            if (LocationNums[nextIndex] === 0) {
                s = 1.5;
                o = 1;
            }

            info.offsetX = info.offsetX + x;
            info.offsetY = info.offsetY + y;
            generateAniList(aniListXY, item, { x: info.offsetX, y: info.offsetY, s, o });
        });

        changeCenterIndex(true, step);
        setStart(start - step);
        setEnd(end - step);
        return aniListXY;
    };

    const rightXY = (step = 1) => {
        const aniListXY = [];
        [...infoList.current].forEach((info, i) => {
            let s = 1;
            let o = 0;
            const item = cycleList[info.pos];
            let index = start + i;
            const nextIndex = Math.min(index + step, LocationNums.length - 1);
            if (index > LocationNums.length - 1) {
                return;
            }
            if (index < 0 && nextIndex < 0) {
                return;
            }
            index = Math.max(start + i, 0);
            const x =
                layoutListRef.current[LocationNums[nextIndex]].centerX -
                layoutListRef.current[LocationNums[index]].centerX;
            const y =
                layoutListRef.current[LocationNums[nextIndex]].centerY -
                layoutListRef.current[LocationNums[index]].centerY;
            if (LocationNums[nextIndex] === 0) {
                s = 1.5;
                o = 1;
            }
            info.offsetX = info.offsetX + x;
            info.offsetY = info.offsetY + y;
            // console.log('test index nextIndex', index, nextIndex);
            generateAniList(aniListXY, item, { x: info.offsetX, y: info.offsetY, s, o });
        });
        setStart(start + step);
        setEnd(end + step);
        changeCenterIndex(false, step);
        return aniListXY;
    };

    const updatePage = () => {
        const item = infoList.current.find(item => item.center);
        const nextItem = dataList[item.pos];
        if (nextItem) {
            changeCurItem({ data: nextItem, index: item.pos });
        }
        lockRef.current = false;
    };

    const startAni = aniList => {
        Animated.parallel([...aniList]).start(() => {
            updatePage();
        });
    };

    const startScroll = (direction: Direction) => {
        const aniList = direction === Direction.left ? leftXY() : rightXY();
        startAni(aniList);
    };

    const panDx = useRef<PanResponderGestureState>();
    const onTouchEnd = (gestureState: PanResponderGestureState) => {
        if (lockRef.current) {
            panDx.current = null;
            return;
        }
        if (gestureState.dx > 0 && start < Center) {
            startScroll(Direction.right);
        } else if (gestureState.dx < 0 && end > Center) {
            startScroll(Direction.left);
        }
        panDx.current = null;
    };

    const panResponder = PanResponder.create({
        // 其他东西想要成为响应者。这个视图应该释放响应者吗
        onPanResponderTerminationRequest: () => true,
        // 设置成为响应者
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder(evt, gestureState) {
            // 取消的情况gestureState数据会被清空 这里保存状态
            if (cycleList.length > 1 && Math.abs(gestureState.dx) > 15) {
                panDx.current = { ...gestureState };
                return true;
            }
            return false;
        },
        onStartShouldSetPanResponderCapture: () => false,
        // 抬起
        onPanResponderRelease(evt, gestureState) {
            onTouchEnd(gestureState);
        },
        // 取消
        onPanResponderTerminate(evt, gestureState) {
            onTouchEnd(panDx.current || gestureState);
        },
    });

    const onClick = (nextUserIndex: number) => {
        if (lockRef.current) {
            return;
        }
        /**
         * 点击某个用户 先映射到[start, end]范围获取当前的location位置
         * 通过Center & location差值计算出需要位移的方向和步骤
         */
        const location = start + infoList.current.findIndex(item => item.pos === nextUserIndex);
        let aniList = [];
        // 当前在右边 向做移动N步
        if (location > Center) {
            aniList = leftXY(location - Center);
        }
        if (location < Center) {
            aniList = rightXY(Center - location);
        }
        if (aniList.length) {
            startAni(aniList);
        }
    };

    return {
        panResponder,
        onClick,
        onTouchEnd,
        onItemLayout,
        cycleList,
        curItem,
    };
};
