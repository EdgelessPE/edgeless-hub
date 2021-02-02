export default function (stationName){
    return {
        name:stationName,
        init:function (axios,callback){
            //初始化，Hub会提供一个axios的引用以便完成通讯，可以先在此时直接将所有需要的数据从后端请求出来存到内存中，就绪时调用callback
            callback()
        },
        getCateData:function (callback) {
            //使用此方法获取分类信息，并将包含分类名称的数组返回到callback(data)
            let data=[
                {
                    name:'安全急救'
                },
                {
                    name:'下载上传'
                }
            ]
            callback(data)
        },
        getPluginList:function (cateName,callback){
            //传入一个分类的名称（string），将此分类下的插件列表返回到callback(data)
            let data
            if(cateName==='安全急救'){
                data=[
                    {
                        name:'360CAD病毒专杀_1.0.0.0_汪凯.7z',
                        size: 740267,
                        url: "https://pineapple.edgeless.top/file/1/插件包/安全急救/360CAD病毒专杀_1.0.0.0_汪凯.7z"
                    },
                    {
                        name:'360急救箱_1.0.0.1_王洪峰.7z',
                        size: 7203822,
                        url: "https://pineapple.edgeless.top/file/1/插件包/安全急救/360急救箱_1.0.0.1_王洪峰.7z"
                    }
                ]
            }else{
                data=[]
            }
            callback(data)
        }
    }
}