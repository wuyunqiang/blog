let curCount = 0;
let map = new Map();
const execute = (callback) => {
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

export const KillAwaitPromise = {
  run,
  execute,
};

export default KillAwaitPromise;
