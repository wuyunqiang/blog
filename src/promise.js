import microtask from './microtask.js'
const State = {
  pending: "pending",
  fulfilled: "fulfilled",
  rejected: "rejected",
};
class MyPromise {
  #state = State.pending;
  #res = null;
  #handles = [];

  constructor(executor) {
    const resolve = (data) => {
      this.#changeState(State.fulfilled, data);
    };
    const reject = (reason) => {
      this.#changeState(State.rejected, reason);
    };
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  #changeState = (state, res) => {
    if (this.#state !== State.pending) {
      return;
    }
    this.#state = state;
    this.#res = res;
    this.#runMicrotask();
  };

  #isPromiseLike = (promise) => {
    return (
      typeof promise !== null &&
      (typeof promise === "object" || typeof promise === "function") &&
      typeof promise.then === "function"
    );
  };

  #runOne = (callback, resolve, reject) => {
    try {
      const nextBack = this.#state === State.fulfilled ? resolve : reject;
      if (typeof callback !== "function") {
        nextBack(this.#res);
        return;
      }
      const data = callback(this.#res);
      if (this.#isPromiseLike(data)) {
        data.then(resolve, reject);
        return;
      }
      resolve(data);
    } catch (error) {
      reject(error);
    }
  };
  #run = () => {
    if (this.#state === State.pending || !this.#handles.length) {
      return;
    }
    const item = this.#handles.shift();
    const { onFulfilled, onRejected, resolve, reject } = item;
    this.#runOne(
      this.#state === State.fulfilled ? onFulfilled : onRejected,
      resolve,
      reject
    );
    this.#run();
  };

  /**
   * 运行于微任务中
   * */
  #runMicrotask = () => {
    microtask(this.#run);
  };

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.#handles.push({ resolve, reject, onFulfilled, onRejected });
      this.#runMicrotask();
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (data) => {
        onFinally();
        return data;
      },
      (reason) => {
        onFinally();
        throw reason;
      }
    );
  }

  static resolve(data) {
    if (data instanceof Promise) {
      return data;
    }
    let _resolve;
    let _reject;
    const p = new MyPromise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
    if (p.#isPromiseLike(data)) {
      data.then(_resolve, _reject);
    } else {
      _resolve(data);
    }
    return p;
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let resList = [];
      let length = 0;
      promises
        .map((item) => MyPromise.resolve(item))
        .forEach((p, index) => {
          p.then((res) => {
            length++;
            resList[index] = res;
            if (length == promises.length) {
              resolve(resList);
            }
          }, reject);
        });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises
        .map((item) => MyPromise.resolve(item))
        .forEach((p) => {
          p.then(resolve, reject);
        });
    });
  }
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      let errorList = [];
      let length = 0;
      promises
        .map((item) => MyPromise.resolve(item))
        .forEach((p, index) => {
          p.then(
            (res) => {
              resolve(res);
            },
            (err) => {
              length++;
              errorList[index] = err;
              if (length == promises.length) {
                reject(errorList);
              }
            }
          );
        });
    });
  }

  static allSettled(promises) {
    return new MyPromise((resolve) => {
      let resList = [];
      let length = 0;
      promises
        .map((item) => MyPromise.resolve(item))
        .forEach((p, index) => {
          p.then(
            (res) => {
              length++;
              resList[index] = {
                status: "fulfilled",
                value: res,
              };
            },
            (err) => {
              length++;
              resList[index] = {
                status: "rejected",
                reason: err,
              };
            }
          ).finally(() => {
            if (length === promises.length) {
              resolve(resList);
            }
          });
        });
    });
  }
}

const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("aaaaa");
    reject("xxxxx");
  }, 3000);
});
const p4 = p
  .then(
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
    () => {},
    (error) => {
      console.log("test error 5555:", error, p);
    }
  );

  const sourceP = Promise.resolve()
  console.log("sourceP:", sourceP);

// p4.then(() => {});
// p4.then(() => {});
// p4.then(() => {});

// p.then(
//   (data) => {
//     console.log("test data 222:", data);
//   },
//   (error) => {
//     console.log("test err 222:", error);
//   }
// );

// const p1 = MyPromise.resolve(111);
// const p2 = MyPromise.reject(2222);
// const p3 = MyPromise.resolve(33333);
// MyPromise.allSettled([p1, p2, p3])
//   .then((res) => {
//     console.log("res:", res);
//   })
//   .catch((err) => {
//     console.log("err:", err);
//   });
