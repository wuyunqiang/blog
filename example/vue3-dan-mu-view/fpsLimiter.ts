/***
 * 控制requestAnimationFrame执行频率 = Min(系统, 60)
 * 为了兼容部分帧率为120fps的设置
 */
export type ICallBack = (currentFps?: number) => void;

export const calculateAverageFps = (n: number) => {
    let _res: (value: any) => void;
    const p = new Promise((resolve) => {
        _res = resolve;
    });
    let frames = 0;
    let startTime = performance.now();
    function rafLoop() {
        frames += 2;
        if (performance.now() - startTime < n * 1000) {
            window.setTimeout(rafLoop, 33.3);
        } else {
            const elapsed = (performance.now() - startTime) / 1000;
            const fps = Math.round(frames / elapsed);
            _res(fps);
        }
    }
    window.setTimeout(rafLoop, 33.3);
    return p;
};

// 调用函数，例如计算5秒的平均FPS
const p = calculateAverageFps(5);

export const fpsLimiter = () => {
    let stop = false;
    let rafId = 0;

    const stopRaf = () => {
        console.log('test stopRaf ');
        stop = true;
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
    };

    const startExpectFps = (cb: ICallBack, fps: number) => {
        stop = false;
        let frameCount = 0;
        let fpsInterval = 1000 / fps;
        let now = 0;
        let then = Date.now();
        let startTime = then;
        let delta;
        let currentFps;

        function loop() {
            if (stop) {
                return;
            }
            rafId = window.setTimeout(loop, 33.3);
            now = Date.now();
            delta = now - then;
            if (delta > fpsInterval) {
                then = now - (delta % fpsInterval);
                if (cb) {
                    const sinceStart = now - startTime;
                    currentFps = Math.round((1000 / (sinceStart / (frameCount += 2))) * 100) / 100;
                    cb(currentFps);
                }
            }
        }
        loop();
    };

    const startNormal = (cb: ICallBack) => {
        stop = false;
        const loop = () => {
            if (stop) {
                return;
            }
            rafId = window.setTimeout(loop, 33.3);
            cb && cb();
        };
        loop();
    };

    /**
     * 期望60fps run cb
     * @param cb
     */
    const raf = (cb: ICallBack) => {
        const expFps = 60;
        p.then((sysFps: any) => {
            console.log('test sysFps: ', sysFps);
            if (sysFps > expFps) {
                startExpectFps(cb, expFps);
            } else {
                startNormal(cb);
            }
        });
    };

    return { raf, stopRaf, startExpectFps };
};

export default fpsLimiter;
