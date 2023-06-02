export class PromiseEnhance extends Object{
  _reject;
  _resolve;
  _cancelResolve;
  constructor(executor){
    const p = new Promise((resolve, reject)=>{
      this._resolve = resolve;
      this._reject = reject;
      executor&&executor(this._resolve, this._reject)
    })
    const cancelP = new Promise((resolve) => {
      this._cancelResolve = resolve;
     });
     return Promise.race([p, cancelP]);

  }
  cancel() {
    this._cancelResolve('canceled');
  }
}

const p = new PromiseEnhance((resolve) => {
  setTimeout(() => {
    resolve(1111);
  }, 5000);
});

p.then((res)=>{
  console.log('test 正常结果',res)
})

setTimeout(()=>{
  p.cancel().then((res) => {
    console.log('test res', res)
  });
},1000)

