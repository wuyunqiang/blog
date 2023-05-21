const State = {
  pending: "pending",
  fulfilled: "fulfilled",
  rejected: "rejected",
};

class MyPromise {
  state = State.pending;
  res = null;
  handles = [];

  constructor(executor) {
    const resolve = (data) => {
      this.changeState(State.fulfilled, data);
    };
    const reject = (reason) => {
      this.changeState(State.rejected, reason);
    };
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  changeState = (state, res) => {
    if (this.state !== State.pending) {
      return;
    }
    this.state = state;
    this.res = res;
    this.runMicrotask();
  };

  isPromiseLike = (promise) => {
    return promise && typeof promise.then === "function";
  };

  runOne = (callback, resolve, reject) => {
    try {
      const nextBack = this.state === State.fulfilled ? resolve : reject;
      if (typeof callback !== "function") {
        nextBack(this.res);
        return;
      }
      const data = callback(this.res);
      if (this.isPromiseLike(data)) {
        data.then(resolve, reject);
        return;
      }
      resolve(data);
    } catch (error) {
      reject(error);
    }
  };
  run = () => {
    if (this.state === State.pending || !this.handles.length) {
      return;
    }
    const item = this.handles.shift();
    const { onFulfilled, onRejected, resolve, reject } = item;
    this.runOne(
      this.state === State.fulfilled ? onFulfilled : onRejected,
      resolve,
      reject
    );
    this.run();
  };

  /**
   * 运行于微任务中
   * */
  runMicrotask = () => {
    queueMicrotask(this.run);
  };

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.handles.push({ resolve, reject, onFulfilled, onRejected });
      this.runMicrotask();
    });
  }
}

const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("aaaaa");
    reject("xxxxx");
  }, 2000);
});

p.then(
  (data) => {
    console.log("test data 111:", data);
    return Promise.resolve("bbbbb");
  },
  (error) => {
    console.log("test err 111:", error);
  }
)
  .then((data) => {
    console.log("test data 33333:", data);
    return "ccccc";
  })
  .then((data) => {
    console.log("test data 444444:", data);
    return Promise.reject("ddddd");
  })
  .then(
    (data) => {},
    (error) => {
      console.log("test error 5555:", error);
    }
  );

p.then(
  (data) => {
    console.log("test data 222:", data);
  },
  (error) => {
    console.log("test err 222:", error);
  }
);
