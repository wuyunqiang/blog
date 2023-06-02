/**
 * 并行最大任务
 * @param {Promise[]} list 接收promise任务数组
 * @param {number} max 最大并行个数
 * @returns Promise
 */
export const ParallelMaxTask = async (list = [], max = 3) => {
  let _resolve;
  let resList = [];
  const p = new Promise((resolve) => {
    _resolve = resolve;
  });

  if (!list.length) {
    _resolve(resList);
    return p;
  }
  max = Math.min(max, list.length);
  console.log("test max", max);
  const tasks = list.map((item) => Promise.resolve(item));
  let curParallelTaskCount = 0;
  let index = 0;
  let doneCount = 0;
  const run = async () => {
    if (curParallelTaskCount < max && tasks.length) {
      const curIndex = index++;
      try {
        ++curParallelTaskCount;
        const task = tasks.shift();
        const res = await task;
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
        if (list.length === doneCount) {
          _resolve(resList);
        } else {
          run();
        }
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
 * @param {[(res:[])=>{}]} list 接受一个函数的数组 数组中的每个函数将接收前面的结果
 * @returns Promise
 */
export const SerialTask = async (list = []) => {
  const resList = [];
  let _resolve;

  const p = new Promise((resolve) => {
    _resolve = resolve;
  });
  if (!list.length) {
    _resolve(resList);
    return;
  }
  let curIndex = 0;
  const tasks = list;
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
          if (++curIndex === list.length) {
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
