/**
 * 并行最大任务
 * @param {Function[]} tasks 接收任务数组
 * @param {number} max 最大并行个数
 * @returns Promise
 */
export const parallelMaxTask = async (tasks = [], max = 3) => {
  let _resolve;
  let resList = [];
  const p = new Promise((resolve) => {
    _resolve = resolve;
  });

  if (!tasks.length) {
    _resolve(resList);
    return p;
  }
  max = Math.min(max, tasks.length);
  let curParallelTaskCount = 0;
  let index = 0;
  let doneCount = 0;
  const run = async () => {
    if (curParallelTaskCount >= max || index >= tasks.length) {
      return;
    }
    const curIndex = index++;
    try {
      ++curParallelTaskCount;
      const task = tasks[curIndex];
      const res = await task(resList);
      resList[curIndex] = {
        status: "succ",
        data: res,
      };
    } catch (error) {
      resList[curIndex] = {
        status: "fail",
        data: error,
      };
    } finally {
      doneCount++;
      curParallelTaskCount--;
      if (tasks.length === doneCount) {
        _resolve(resList);
      } else {
        run();
      }
    }
  };
  for (let i = 0; i < max; i++) {
    run();
  }
  return p;
};

/**
 * 串行任务 顺序执行 并返回结果
 * @param {Function[]} tasks 接受一个函数的数组 数组中的每个函数将接收前面的结果
 * @returns Promise
 */
export const serialTask = async (tasks = []) => {
  const resList = [];
  let _resolve;

  const p = new Promise((resolve) => {
    _resolve = resolve;
  });
  if (!tasks.length) {
    _resolve(resList);
    return;
  }
  let curIndex = 0;
  const run = () => {
    if (curIndex < tasks.length) {
      const task = tasks[curIndex];
      task(resList)
        .then((res) => {
          resList[curIndex] = {
            status: "succ",
            data: res,
          };
        })
        .catch((err) => {
          resList[curIndex] = {
            status: "fail",
            data: err,
          };
        })
        .finally(() => {
          if (++curIndex === tasks.length) {
            _resolve(resList);
          } else {
            run();
          }
        });
    }
  };
  run();
  return p;
};

/**
 * 将一个promise转换为一个可取消的promise
 * @param {Promise} task 希望被转换的promise实例
 * @returns {Promise} 返回具有cancel()&isCancel()的promise对象
 */
export const TaskCancelable = (task) => {
  let _reject;
  let isCancel = false;
  const _status = Symbol("cancel");
  const cancelP = new Promise((resolve, reject) => {
    _reject = reject;
  });
  const p = Promise.race([task, cancelP]);
  /***
   * 调用cancel时可能promise状态已经变为成功,
   * 所以不能在cancel里面改变isCancel
   * 只有catch的原因是cancel才代表被取消成功了
   */
  p.catch((reason) => {
    if (reason === _status) {
      isCancel = true;
    }
  });

  p.cancel = () => {
    _reject(_status);
  };
  p.isCancel = () => {
    return isCancel;
  };
  return p;
};

/**
 * 时间切片的方式运行任务
 * 避免执行较多任务阻塞UI
 * 优先使用requestAnimationFrame,否则使用setTimeout兼容
 * @param {Function} task
 * @returns {Promise}
 */
export const nextFrameExecute = async (task) => {
  let _resolve, _reject;
  const p = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      Promise.resolve(task()).then(_resolve, _reject);
    });
    return p;
  }
  setTimeout(() => {
    Promise.resolve(task()).then(_resolve, _reject);
  }, 16);
  return p;
};

/**
 * 支持动态添加
 * 支持并行&串行
 * 时间切片
 */

export const TaskStatus = {
  Done: 1,
  Processing: 2,
};
export class DynamicTasks {
  status = TaskStatus.Done;
  store = {}; // 存储结果
  handles = []; // 回调列表
  parallelMax;
  frame = false;

  constructor(config = {}) {
    this.parallelMax = config.parallelMax || 3;
    this.frame = config.frame;
  }
  getResult() {
    return this.store;
  }
  removeItem(key) {
    if (this.store[key]) {
      Reflect.deleteProperty(this.store, key);
    }
  }
  removeStore() {
    this.store = {};
  }
  add(data) {
    const list = Array.isArray(data) ? data : [data];
    this.handles.push(...list);
  }

  async loopRun(_resolve) {
    if (!this.handles.length) {
      _resolve(this.store);
      return;
    }
    const { task, key } = this.handles.shift();
    try {
      const runner = this.frame
        ? () => nextFrameExecute(() => task(this.store))
        : () => task(this.store);
      const res = await runner();
      this.store[key] = {
        status: "succ",
        data: res,
      };
    } catch (error) {
      this.store[key] = {
        status: "fail",
        data: error,
      };
    } finally {
      this.loopRun(_resolve);
    }
  }
  async run() {
    let _resolve;
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
