/***
 *
 * ! all
 * queueMicrotask https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask
 * promise
 *
 * ! node:
 * process.nextTick
 * setImmediate
 *
 * ! browser:
 * MutationObserver https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 * MessageChannel
 * onreadystatechange
 *
 * ! all
 * setTimeout
 */

const list = [
  {
    test: () => {
      return typeof queueMicrotask === "function";
    },
    run: (callback) => {
      queueMicrotask(callback);
    },
  },
  {
    test: () => {
      return typeof Promise !== "undefined";
    },
    run: (callback) => {
      Promise.resolve().then(callback);
    },
  },
  {
    test: () => {
      return (
        typeof process === "object" && typeof process.nextTick === "function"
      );
    },
    run: (callback) => {
      process.nextTick(callback);
    },
  },
  {
    test: () => {
      return typeof setImmediate === "function";
    },
    run: (callback) => {
      setImmediate(callback);
    },
  },
  {
    test: () => {
      return (
        typeof MutationObserver !== "undefined" && typeof window !== "undefined"
      );
    },
    run: (callback) => {
      let called = 0;
      let observer = new MutationObserver(callback);
      let element = document.createTextNode("");
      observer.observe(element, {
        characterData: true,
      });
      const change = () => {
        element.data = called = ++called % 2;
      };
      change();
    },
  },
  {
    test: () => {
      return (
        typeof MessageChannel !== "undefined" && typeof window !== "undefined"
      );
    },
    run: (callback) => {
      var channel = new global.MessageChannel();
      channel.port1.onmessage = callback;
      const change = function () {
        channel.port2.postMessage(0);
      };
      change();
    },
  },
  {
    test: () => {
      return (
        typeof window !== "undefined" &&
        "document" in window &&
        "onreadystatechange" in global.document.createElement("script")
      );
    },
    run: (callback) => {
      var scriptEl = document.createElement("script");
      scriptEl.onreadystatechange = function () {
        callback();
        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      document.documentElement.appendChild(scriptEl);
    },
  },
  {
    test: () => {
      return true;
    },
    run: (callback) => {
      setTimeout(callback, 0);
    },
  },
];

const microtask = (callback) => {
  const runner = list.find((item) => item.test());
  runner && runner.run(callback);
};

export default microtask;
