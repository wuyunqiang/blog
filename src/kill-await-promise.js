let curCount = 0;
let map = new Map();
const promise = (callback) => {
  if (map.get(curCount)) {
    const res = map.get(curCount);
    curCount++;
    return res;
  }
  const p = new Promise(callback);
  throw p;
};

const run = (action) => {
  try {
    action();
  } catch (error) {
    error
      .then((res) => {
        map.set(curCount, res);
      })
      .catch((err) => {
        map.set(curCount, err);
      })
      .finally(() => {
        curCount = 0;
        run(action);
      });
  }
};

const execute = (task) => {
  curCount = 0;
  map = new Map();
  run(task);
};

export const KillAwaitPromise = {
  execute,
  promise,
};

export default KillAwaitPromise;
