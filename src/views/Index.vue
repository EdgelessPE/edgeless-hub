<template>
<div>
  <a-page-header
      :title="text_welcome"
      :backIcon="false"
  >
  </a-page-header>
<a-row style="width: 100%">
  <a-col :span="16">
    <a-result :title="events[0].DisplayTitle">
      <template slot="subTitle">
<!--        <a-tag color="red">-->
<!--          Alpha-->
<!--        </a-tag>-->
<!--        <a-tag color="blue">-->
<!--          3.1.0-->
<!--        </a-tag>-->
        {{events[0].DisplayDescription}}
      </template>
      <template #icon>
        <a-icon :type="events[0].DisplayIcon" theme="twoTone" />
      </template>
      <template #extra>
        <a-button :type="events[0].ButtonType" @click="routeTo(events[0].ButtonRoute)">
          {{events[0].ButtonText}}
        </a-button>
      </template>
    </a-result>
  </a-col>
  <a-col :span="8">
    <a-card :title="$store.state.updateList.length===0?('已安装'+$store.state.fileList.length+'个插件'):('有'+$store.state.updateList.length+'个插件可更新')" :bordered="false" style="width: 300px">
      <template slot="extra">
        <a-button v-if="$store.state.updateList.length!==0" type="primary" @click="routeTo('/down')">更新</a-button>
        <a-button v-else @click="routeTo('/down')">管理</a-button>
      </template>
        <p>随便看看</p>
        <a-list>
          <a-button slot="loadMore" type="link" icon="reload" @click="openQQLink">
            换一批
          </a-button>
          <a-list-item>
            <a-list-item-meta
                title="PotPlayer"
                description="影音播放"
            >
            </a-list-item-meta>
            <template slot="extra">
              <a-button>安装</a-button>
            </template>
          </a-list-item>
          <a-list-item>
            <a-list-item-meta
                title="360急救箱"
                description="安全急救"
            >
            </a-list-item-meta>
            <template slot="extra">
              <a-button>安装</a-button>
            </template>
          </a-list-item>
          <a-list-item>
            <a-list-item-meta
                title="Audition"
                description="办公编辑"
            >
            </a-list-item-meta>
            <template slot="extra">
              <a-button>安装</a-button>
            </template>
          </a-list-item>
        </a-list>
    </a-card>
  </a-col>
</a-row>
</div>
</template>

<script>
import DownloadManager from "@/components/DownloadManager";
const fs=window.require('fs')
export default {
name: "Index",
  data(){
  return{
    text_welcome:"",
    events:[
      {
        EventLevel:1,
        EventName:"默认",
        EventFrom:"Edgeless",
        DisplayTitle:"Loading...",
        DisplayDescription:"",
        DisplayIcon:"hourglass",
        ButtonText:"Loading...",
        ButtonRoute:"/index",
        ButtonType:"default"
      }
    ],
    localVersion:"",
    onlineVersion:"",

  }
  },
  methods:{
    openQQLink(){
      this.$electron.shell.openExternal('https://home.edgeless.top/jump/qqg.html')
    },
    geneWelcome(){
      //获取系统用户名
      const os=window.require('os')
      let username=os.userInfo().username
      //获取当前时间
      const date=new Date()
      //判断当前小时数，对应凌晨，早上，中午，下午，傍晚，晚上
      let hour=date.getHours()
      if(0<=hour&&hour<6){
        this.text_welcome="🛏️夜深了，"+username+"记得早睡早起哦"
      }else if(6<=hour&&hour<11){
        this.text_welcome="🌞"+username+"早上好，今天也是活力满满的一天！"
      }else if(11<=hour&&hour<14){
        this.text_welcome="⏰中午啦"+username+"，稍事休息一下吧"
      }else if(14<=hour&&hour<18){
        this.text_welcome="☕嘿"+username+"，又到了愉快的下午茶时光~"
      }else if(18<=hour&&hour<0){
        this.text_welcome="😃美妙的夜晚就应该好好放纵自己，是吧"+username+"？"
      }
    },
    async geneEdgelessEvents(){
      //判断有无启动盘
      if(DownloadManager.methods.exist(this.$store.state.pluginPath)){
        //判断是否为新版规范
        if(DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\ventoy\\ventoy_wimboot.img")){
          //判断是否需要升级
          this.localVersion=fs.readFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\version.txt").toString().split("_")[3]
          let res=await this.$axios.get("https://pineapple.edgeless.top/api/v2/info/iso")
          this.onlineVersion=res.data.version
          if(this.onlineVersion===this.localVersion){
            //检查是否为alpha用户
            if(DownloadManager.methods.matchFiles(this.$store.state.pluginPath[0]+":\\","^Edgeless_Alpha.*wim$").length>0){
              this.events.push({
                EventLevel:2,
                EventName:"Alpha用户",
                EventFrom:"Edgeless",
                DisplayTitle:"您已加入Edgeless Alpha内测计划",
                DisplayDescription:"感谢您对Edgeless的认可，在试用新功能时如果遇到问题请及时反馈",
                DisplayIcon:"crown",
                ButtonText:"追踪Alpha更新",
                ButtonRoute:"/alpha",
                ButtonType:"default"
              })
            }else{
              //无事件的Beta用户
              this.events.push({
                EventLevel:2,
                EventName:"Beta用户",
                EventFrom:"Edgeless",
                DisplayTitle:"您已拥有最新版本Edgeless Beta",
                DisplayDescription:"来点新鲜插件？",
                DisplayIcon:"smile",
                ButtonText:"前往插件市场",
                ButtonRoute:"/reco",
                ButtonType:"default"
              })
            }
          }else{
            //需要更新Edgeless Beta
            this.events.push({
              EventLevel:1,
              EventName:"Beta更新",
              EventFrom:"Edgeless",
              DisplayTitle:"有新版Edgeless可供下载",
              DisplayDescription:"当前版本："+this.localVersion+" >> 最新版本："+this.onlineVersion,
              DisplayIcon:"bulb",
              ButtonText:"更新Edgeless",
              ButtonRoute:"/update",
              ButtonType:"primary"
            })
          }
        }else{
          //旧版规范，需要升级
          this.events.push({
            EventLevel:0,
            EventName:"升级规范",
            EventFrom:"Edgeless",
            DisplayTitle:"检测到非新版规范的启动盘",
            DisplayDescription:"Edgeless Hub不支持旧版规范启动盘的升级等功能，我们建议您重新制作；如果您正在使用Ventoy官方版，也请点击重新制作按钮，制作过程中不会格式化U盘",
            DisplayIcon:"meh",
            ButtonText:"重新制作",
            ButtonRoute:"/burning",
            ButtonType:"primary"
          })
        }
      }else{
        //无启动盘或默认状态
        this.events.push({
          EventLevel:0,
          EventName:"无启动盘",
          EventFrom:"Edgeless",
          DisplayTitle:"尚未检测到Edgeless",
          DisplayDescription:"插入您的Edgeless或开始制作Edgeless启动盘",
          DisplayIcon:"frown",
          ButtonText:"制作启动盘",
          ButtonRoute:"/burning",
          ButtonType:"primary"
        })
      }
      //交换数组顺序
      this.events[0]=this.events[1]
    },
    routeTo(name){
      this.$router.push(name)
    },
  },
  created() {
    this.geneWelcome()
    this.geneEdgelessEvents()
  }
}
</script>