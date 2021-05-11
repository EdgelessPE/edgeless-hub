<template>
<div>
  <a-page-header
      title="配置中心"
      @back="() => $router.go(-1)"
  />
  <a-card title="壁纸" style="width: 100%">
    <a-space>
      <a-button @click="ViewWP">查看</a-button>
      <a-button @click="ChangeWP">更换</a-button>
    </a-space>
  </a-card>
  <br/>
  <a-card title="分辨率" style="width: 100%">
    <a-tooltip slot="extra">
      <a-icon type="exclamation-circle"/>
      <template slot="title">
        在某些使用UEFI引导启动的场合下Edgeless无法改变分辨率，此项配置失效
      </template>
    </a-tooltip>
    <a-radio-group v-model="ResolutionWay" @change="onChangeRadio">
      <a-radio-button value="0">
        自动调节（默认）
      </a-radio-button>
      <a-radio-button value="1">
        不调节
      </a-radio-button>
      <a-radio-button value="2">
        自定义调节
      </a-radio-button>
    </a-radio-group>
    <template v-if="ResolutionWay==='1'">
      <br/><br/>
      <a-alert message="选择此项可以解决显示器提示超出显示范围/输出参数不支持的问题" type="info" show-icon />
    </template>
    <template v-if="ResolutionWay==='2'">
      <br/><br/>
      <a-row>
        <a-col :span="2">
          显示分辨率
        </a-col>
        <a-col :span="4">
          <a-select style="width: 100%" size="small" v-model="resolution_index" @change="onChangeSelect">
            <template v-for="(item,index) in ResolutionList">
              <a-select-option :value="index">
                {{item.h+' x '+item.w}}
              </a-select-option>
            </template>
          </a-select>
        </a-col>
        <a-col :span="1"/>
        <a-col :span="1">
          色位
        </a-col>
        <a-col :span="3">
          <a-select style="width: 100%" size="small" v-model="ResolutionConfig.bit">
            <a-select-option :value="32">
              32bit (推荐)
            </a-select-option>
            <a-select-option :value="16">
              16bit
            </a-select-option>
          </a-select>
        </a-col>
        <a-col :span="1"/>
        <a-col :span="2">
          刷新率
        </a-col>
        <a-col :span="2">
          <a-select style="width: 100%" size="small" v-model="ResolutionConfig.fps">
            <a-select-option :value="60">
              60 FPS
            </a-select-option>
            <a-select-option :value="30">
              30 FPS
            </a-select-option>
          </a-select>
        </a-col>

        <a-col :span="6"/>
        <a-col :span="2">
          <a-button size="small" type="primary" v-on:click="writeResolutionConfig">应用</a-button>
        </a-col>
      </a-row>
    </template>
  </a-card>
  <br/>
  <a-card title="偏好调整" style="width: 100%">
    <a-tooltip slot="extra">
      <a-icon type="exclamation-circle"/>
      <template slot="title">
        仅支持针对Beta版本配置偏好，Alpha版本的特性请自行参考文档配置
      </template>
    </a-tooltip>
    <a-list
        item-layout="horizontal"
        :data-source="Options"
    >
      <a-list-item slot="renderItem" slot-scope="item, index">
        <a-switch slot="actions" v-model="item.state" :disabled="!item.available" @change="onChangeSwitch(item)" />
        <a-list-item-meta
            :description="item.description"
        >
          <div slot="title">{{ item.title }}</div>
        </a-list-item-meta>
        <a-tooltip v-if="item.showTip||!item.available">
          <a-icon type="question-circle" />
          <template slot="title">
            <template v-if="!item.available">
              需要高于{{item.higherThan}}版本可用
              <br/>
            </template>
            {{item.information}}
          </template>
        </a-tooltip>
      </a-list-item>
    </a-list>
  </a-card>
</div>
</template>

<script>
import ConfigInterface from "@/interface/ConfigInterface"
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";
const fs=window.require('fs')
export default {
name: "Config",
  data(){
  return{
    Options:[],
    //这个列表的h和w写反了，之后会处理一下
    ResolutionList:[
      {
        h:1920,
        w:1080
      },
      {
        h:1680,
        w:1050
      },
      {
        h:1600,
        w:900
      },
      {
        h:1440,
        w:900
      },
      {
        h:1400,
        w:1050
      },
      {
        h:1366,
        w:768
      },
      {
        h:1360,
        w:768
      },
      {
        h:1280,
        w:1024
      },
      {
        h:1280,
        w:960
      },
      {
        h:1280,
        w:800
      },
      {
        h:1280,
        w:768
      },
      {
        h:1280,
        w:720
      },
      {
        h:1280,
        w:600
      },
      {
        h:1152,
        w:864
      },
      {
        h:1024,
        w:768
      },
      {
        h:800,
        w:600
      }
    ],
    ResolutionWay:"0",
    ResolutionConfig:{
      h:1920,
      w:1080,
      bit:32,
      fps:60
    },
    resolution_index:0,
  }
  },
  methods:{
    prepareData(){
      //获取当前的Edgeless版本号
      let version=this.$store.state.EdgelessVersion.split("_")[3]
      //处理是否显示information小问号，分离可用和不可用的选项
      let ava=[],una=[]
      ConfigInterface.forEach((item)=>{
        item['state']=this.currentState(item.folderName)
        if(item.information===""){
          item['showTip']=false
        }else{
          item['showTip']=true
        }
        if(version>item.higherThan){
          item['available']=true
          ava.push(item)
        }else{
          item['available']=false
          una.push(item)
        }
        this.Options=ava.concat(una)
      })
    },
    currentState(folderName){
      return DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\"+folderName)
    },

    onChangeSwitch(item){
      DownloadManager.methods.mkdir(this.$store.state.pluginPath[0]+":\\Edgeless\\Config")
      if(this.currentState(item.folderName)){
        if(!DownloadManager.methods.delDir(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\"+item.folderName)){
          notification.open({
            message:'应用配置失败',
            description:'无法删除标记：'+(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\"+item.folderName)
          })
          item.state=true
        }else{
          item.state=false
        }
      }else{
        if(!DownloadManager.methods.mkdir(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\"+item.folderName)){
          notification.open({
            message:'应用配置失败',
            description:'无法创建标记：'+(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\"+item.folderName)
          })
          item.state=false
        }else{
          item.state=true
        }
      }
    },
    onChangeRadio(){
      switch (this.ResolutionWay) {
        case "1":
          DownloadManager.methods.mkdir(this.$store.state.pluginPath[0]+":\\Edgeless\\Config")
          fs.writeFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\分辨率.txt","DisableAutoSuit")
          break
        default:
          DownloadManager.methods.del(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\分辨率.txt")
          break
      }
    },
    onChangeSelect(){
      let val=this.ResolutionList[this.resolution_index]
      this.ResolutionConfig.h=val.w
      this.ResolutionConfig.w=val.h
    },
    writeResolutionConfig(){
      //w1024 h768 b32 f60
      DownloadManager.methods.mkdir(this.$store.state.pluginPath[0]+":\\Edgeless\\Config")
      fs.writeFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\分辨率.txt","w"+this.ResolutionConfig.w+" h"+this.ResolutionConfig.h+" b"+this.ResolutionConfig.bit+" f"+this.ResolutionConfig.fps)
      notification.open({
        message:'自定义分辨率应用成功',
        description:"写入配置："+"w"+this.ResolutionConfig.w+" h"+this.ResolutionConfig.h+" b"+this.ResolutionConfig.bit+" f"+this.ResolutionConfig.fps
      })
    },
    ViewWP(){
      this.$electron.shell.openPath(this.$store.state.pluginPath[0]+":\\Edgeless\\wp.jpg")
    },
    ChangeWP(){
      //注册响应监听
      this.$electron.ipcRenderer.on('openFileDialog-reply',(event,arg)=>{
        if(arg){
          //判断套娃更换
          if(arg[0]===(this.$store.state.pluginPath[0]+":\\Edgeless\\wp.jpg")){
            notification.open({
              message:'壁纸更换失败',
              description:"搁这套娃呢？"
            })
            return
          }
          //备份原壁纸
          //DownloadManager.methods.del(this.$store.state.pluginPath[0]+":\\Edgeless\\wp_bak.jpg")
          DownloadManager.methods.ren(this.$store.state.pluginPath[0]+":\\Edgeless\\wp.jpg",this.$store.state.pluginPath[0]+":\\Edgeless\\wp_bak.jpg")
          DownloadManager.methods.copy(arg[0],this.$store.state.pluginPath[0]+":\\Edgeless\\wp.jpg",false,()=>{
            notification.open({
              message:'壁纸更换完毕',
              description:"原壁纸已备份为wp_bak.jpg"
            })
          })
        }else{
          notification.open({
            message:'壁纸更换失败',
            description:"没有选中文件"
          })
        }
      })
      //发送打开对话框事件
      this.$electron.ipcRenderer.send('openFileDialog-request',"")
    },
  },
  created() {
    //检查启动盘是否存在
    if(!DownloadManager.methods.exist(this.$store.state.pluginPath)){
      notification.open({
        message:'无法执行配置',
        description:'未检测到Edgeless启动盘，请先执行写入步骤'
      })
      this.$router.push("/burning")
    }
    //准备偏好调整的数据
    this.prepareData()
    //判断当前分辨率的模式
    if(DownloadManager.methods.exist(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\分辨率.txt")){
      if(fs.readFileSync(this.$store.state.pluginPath[0]+":\\Edgeless\\Config\\分辨率.txt").toString()==="DisableAutoSuit"){
        this.ResolutionWay="1"
      }else{
        this.ResolutionWay="2"
      }
    }else{
      this.ResolutionWay="0"
    }
  }
}
</script>