export const isArrowFunction = (fn)=>{
    return fn && fn.constructor === Function && !fn.prototype
}

export const isAsyncFunction = (fn)=>{
    return Object.prototype.toString.call(fn) === '[object AsyncFunction]';
}