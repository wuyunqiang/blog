import React, { memo, useState } from 'react';
import { type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import { useStyles } from './styles';
import { type FormatTimeParams, useTimer } from './useTimer';

export type IProps = {
    format?: string; // 可以自定义格式化的时间 例如hh/mm/ss, hh:mm, mm-ss 等形式。
    targetTimeStamp: number; // 目标时间戳
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    onEnd?: (p: FormatTimeParams) => void; // 倒计时结束回调
    onUpdate?: (p: FormatTimeParams) => void; // 每次更新的回调函数
};

const CountDown = ({ targetTimeStamp, style, textStyle, format, onEnd, onUpdate }: IProps) => {
    const styles = useStyles();

    const [timeStr, changeTime] = useState('');
    const updateTime = (p: FormatTimeParams) => {
        const { time } = p;
        changeTime(time);
        onUpdate && onUpdate(p);
    };
    useTimer({
        targetTimeStamp,
        updateTime,
        auto: true,
        format,
        onEnd,
    });
    return (
        <View style={[styles.countDown, style]}>
            <Text style={[styles.text, textStyle]}>{timeStr}</Text>
        </View>
    );
};

export default memo(CountDown);
