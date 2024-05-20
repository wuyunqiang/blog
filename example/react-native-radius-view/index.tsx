/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';
import { styles } from './style';
import { type AniItem, useCycle } from './useCycle';

export type IProps<T> = {
    onChangeItem?: (item: { data: T; index: number }) => void;
    dataList: T[];
    renderItem: (item: T, ani: AniItem, index: number) => JSX.Element;
};

export const KrnRadiusView = <T,>({ dataList, onChangeItem, renderItem }: IProps<T>) => {
    const { panResponder, onClick, onItemLayout, cycleList, curItem } = useCycle(dataList);

    useEffect(() => {
        onChangeItem(curItem);
    }, [curItem]);

    return (
        <View style={styles.scroll} {...panResponder.panHandlers}>
            {cycleList.map((item, index) => {
                const { data, ani } = item;
                const stylesList = [
                    styles.avatar,
                    index === 0 && styles.curAvatar,
                    index === 1 && styles.index1,
                    index === 2 && styles.index2,
                    index === 3 && styles.index3,
                    index === 4 && styles.index4,
                    index === 5 && styles.index5,
                    index === 6 && styles.index6,
                    index === 7 && styles.index7,
                    index === 8 && styles.index8,
                    {
                        transform: [
                            {
                                translateX: ani.AniX,
                            },
                            {
                                translateY: ani.AniY,
                            },
                            {
                                scale: ani.scale,
                            },
                        ],
                    },
                ];
                if (!data) {
                    return (
                        <Animated.View
                            style={[...stylesList, { zIndex: -1 }]}
                            onLayout={e => onItemLayout(e, index)}
                            key={index}
                        ></Animated.View>
                    );
                }

                return (
                    <Animated.View
                        style={stylesList}
                        onLayout={e => onItemLayout(e, index)}
                        key={index}
                    >
                        <TouchableWithoutFeedback onPress={() => onClick(index)}>
                            {renderItem(data, ani, index)}
                        </TouchableWithoutFeedback>
                    </Animated.View>
                );
            })}
        </View>
    );
};
