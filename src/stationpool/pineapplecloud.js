import StationInterface from "@/interface/StationInterface"
//实例化
const sObject=StationInterface('菠萝云V1')
//内部存储变量
let cateData=[],fileListPool={},url='https://pineapple.edgeless.top/api/list/1',counter=0,inited=false
//实现接口
sObject.init=function (axios,callback) {
    //锁止
    if(inited) return
    inited=true
    //获取分类数据
    axios.get(url+'?path=插件包')
        .then((res)=>{
            //console.log(res.data.data)
            //过滤出为文件夹的结果，并初始化计数器
            res.data.data.forEach((item)=>{
                if(item.type==="FOLDER") {
                    cateData.push({
                        name:item.name
                    })
                    counter++
                }
            })
            //对每个分类获取插件包列表
            for(let i=0;i<cateData.length;i++){
                let queryName=cateData[i].name
                axios.get(url+'?path=/插件包/'+queryName)
                    .then((response)=>{
                        let tmp_ret=[]
                        //筛选.7z文件
                        response.data.data.forEach((item)=>{
                            if(item.name.indexOf('.7z')!==-1) {
                                tmp_ret.push(item)
                            }
                        })
                        //将其塞入pool
                        fileListPool[queryName]=tmp_ret
                        //计数
                        counter--
                        if(counter===0){
                            callback()
                        }
                    })
            }
        })
}
sObject.getCateData=function (callback) {
    callback(cateData)
}
sObject.getPluginList=function (cateName,callback){
    callback(fileListPool[cateName])
}
export default sObject