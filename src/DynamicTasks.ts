/**
 * 支持动态添加
 * 支持并行&串行
 * 时间切片
 */

import { nextFrameExecute } from '../src/task'
import { Config, Resolve, TaskItem, TaskList } from '../type/task'
export const TaskStatus = {
    Done: 1,
    Processing: 2,
};

export class DynamicTasks {
    status = TaskStatus.Done;
    store: any = {}; // 存储结果
    handles: TaskList = []; // 回调列表
    parallelMax;
    frame = false;
    curParallelTaskCounter = 0;

    constructor(config: Config) {
        this.parallelMax = config.parallelMax || 3;
        this.frame = !!config.frame;
    }
    getResult() {
        return this.store;
    }
    removeItem(key: string) {
        if (this.store[key]) {
            Reflect.deleteProperty(this.store, key);
        }
    }
    removeStore() {
        this.store = {};
    }
    add(data: TaskItem | TaskList) {
        const list = Array.isArray(data) ? data : [data];
        this.handles.push(...list);
        this.run();
    }

    async loopRun(_resolve: Resolve) {
        if (!this.handles.length) {
            this.status = TaskStatus.Done;
            _resolve(this.store);
            return;
        }
        const nextTask = this.handles[0];
        // 串行阶段有尚未结束的任务 等待之前的任务结束后在继续执行
        if (!nextTask.parallel && this.curParallelTaskCounter >= 1) {
            return;
        }
        if (nextTask.parallel && this.curParallelTaskCounter >= this.parallelMax) {
            return;
        }
        const { task, key, parallel = false } = this.handles.shift() as TaskItem;
        const runner = this.frame
            ? () => nextFrameExecute(() => task(this.store))
            : () => task(this.store);
        this.curParallelTaskCounter++;
        runner()
            .then((res) => {
                this.store[key] = {
                    status: "succ",
                    data: res,
                };
            })
            .catch((error) => {
                this.store[key] = {
                    status: "fail",
                    data: error,
                };
            })
            .finally(() => {
                this.curParallelTaskCounter--;
                this.loopRun(_resolve);
            });
        if (parallel) {
            this.loopRun(_resolve);
        }
    }

    async run() {
        let _resolve: Resolve = () => { };
        const p = new Promise((resolve) => {
            _resolve = resolve;
        });
        if (!this.handles.length) {
            this.status = TaskStatus.Done;
            _resolve(this.store);
            return p;
        }
        if (this.status == TaskStatus.Processing) {
            return p;
        }
        this.status = TaskStatus.Processing;
        this.loopRun(_resolve);
        return p;
    }
}