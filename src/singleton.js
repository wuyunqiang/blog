const obj = {};
class Singleton {
    constructor(){
        if(obj['instance']){
            return obj['instance'];
        }
        obj['instance'] = this;
        return this;
    }
}


const s1 = new Singleton();
const s2 = new Singleton();

console.log('test s1 === s2', s1 === s2)











