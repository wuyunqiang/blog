import microtask from './microtask.js'
const State = {
  pending: "pending",
  fulfilled: "fulfilled",
  rejected: "rejected",
};
export class MyPromise {
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
       promise !== null &&
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