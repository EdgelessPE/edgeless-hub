import StationInterface from "@/interface/StationInterface"
//实例化
const sObject = StationInterface('卡诺云Legacy（推荐）')
//内部存储变量
let cateData = [], fileListPool = {}, url = 'https://legacy.edgeless.top/api/v2/plugin', counter = 0, inited = false,
    formatCateData = []
//实现接口
sObject.init = function (axios, callback) {
    //锁止
    if (inited) {
        callback()
        return
    }
    inited = true
    //获取分类数据
    axios.get(url + '/cateData')
        .then((res) => {
            //console.log(res.data.payload)
            //接收结果，初始化计数器
            cateData = res.data.payload
            cateData.forEach((name) => {
                formatCateData.push({
                    name: name
                })
            })
            counter = cateData.length
            //对每个分类获取插件包列表
            for (let i = 0; i < cateData.length; i++) {
                let queryName = cateData[i]
                axios.get(url + '/listData?name=' + queryName)
                    .then((response) => {
                        //console.log(response.data.payload)
                        //将其塞入pool
                        fileListPool[queryName] = response.data.payload
                        //计数
                        counter--
                        if (counter === 0) {
                            callback()
                        }
                    })
            }
        })
}
sObject.getCateData = function (callback) {
    callback(formatCateData)
}
sObject.getPluginList = function (cateName, callback) {
    callback(fileListPool[cateName])
}
sObject.providerLogo = "https://oss.wngamebox.cn/wp-content/uploads/2020/10/logo.png"
sObject.providerLink = "https://wngamebox.cn/"

export default sObject