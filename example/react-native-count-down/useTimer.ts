import { useEffect, useRef } from 'react';

export type FormatTimeParams = {
    now?: number;
    hour?: number;
    min?: number;
    second?: number;
    time?: string;
};
export type IParams = {
    targetTimeStamp: number; // 目标时间戳
    intervalTime?: number; // 间隔时间 默认一秒
    updateTime: (t: FormatTimeParams) => void; // 每隔intervalTime时间回调一次
    auto?: boolean; // 是否自动执行
    format?: string;
    onEnd: (t: FormatTimeParams) => void;
};

export const useTimer = ({
    targetTimeStamp,
    intervalTime = 1000,
    updateTime,
    auto = false,
    format = 'hh:mm:ss',
    onEnd,
}: IParams) => {
    const timeRef = useRef(0);
    const startCountdown = () => {
        let countTime = 0; // 初始化计时器计数变量
        const start = Date.now(); //
        // 定义计时器的执行函数
        function run() {
            if (timeRef.current) {
                clearTimeout(timeRef.current);
            }

            if (targetTimeStamp < 0) {
                return;
            }

            let hour = 0;
            let min = 0;
            let second = 0;
            const now = Date.now();

            const formatTime = format.toLowerCase();

            if (Date.now() >= targetTimeStamp) {
                const p = {
                    now,
                    hour,
                    min,
                    second,
                    time: formatTime.replace('hh', '00').replace('mm', '00').replace('ss', '00'),
                };
                updateTime(p);
                onEnd && onEnd(p);
                return;
            }
            hour = Math.floor(((targetTimeStamp - now) / 1000 / 60 / 60) % 24);
            min = Math.floor(((targetTimeStamp - now) / 1000 / 60) % 60);
            second = Math.floor(((targetTimeStamp - now) / 1000) % 60);
            updateTime({
                now,
                hour,
                min,
                second,
                time: formatTime
                    .replace('hh', hour.toString().padStart(2, '0'))
                    .replace('mm', min.toString().padStart(2, '0'))
                    .replace('ss', second.toString().padStart(2, '0')),
            });
            countTime++; // 每次执行时递增计时器的计数
            // 计算按照计时器当前速度实际经过的时间（countTime * 速度）
            const realTime = countTime * intervalTime;

            // 计算从计时开始到现在系统经过的时间
            const sysTime = Date.now() - start;

            // 计算实际时间和理想时间之间的差异
            // 如果实际时间大于理想时间几个轮训 应该对间隔取余 跳过多余的轮次
            const patch = (sysTime - realTime) % intervalTime;

            // 使用系统时间进行修复，调整下一次setTimeout的延迟时间
            // 通过设置intervalTime - patch，尝试校正setTimeout的延迟，以补偿偏差
            timeRef.current = setTimeout(run, intervalTime - patch);
        }

        // 启动计时器，初始调用run函数，并设置延迟为intervalTime
        timeRef.current = setTimeout(run, intervalTime);
    };

    useEffect(() => {
        if (auto) {
            startCountdown();
        }
        return () => {
            if (timeRef.current) {
                clearTimeout(timeRef.current);
            }
        };
        // 初始化执行一次 不在改变
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        startCountdown,
    };
};
