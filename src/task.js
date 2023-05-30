/**
 * 并行最大任务
 * @param {Promise[]} list 接收promise任务数组
 * @param {number} max 最大并行个数
 * @returns Promise
 */
export const ParallelMaxTask = async (list = [], max = 3) => {
  let _resolve, _reject;
  let resList = [];
  const p = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  if (!list.length) {
    _reject(resList);
    return p;
  }
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
  let _reject;

  const p = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  if (!list.length) {
    _reject(resList);
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
