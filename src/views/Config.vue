<template>
<div>
  <a-page-header
      title="配置中心"
      @back="() => $router.go(-1)"
  />
  <a-list
      item-layout="horizontal"
      :data-source="Options"
  >
    <a-list-item slot="renderItem" slot-scope="item, index">
      <a-switch slot="actions" v-model="item.state" :disabled="!item.available" @change="onChange(item)" />
      <a-list-item-meta
          :description="item.description"
      >
        <a-avatar slot="avatar" style="color: #ffffff; backgroundColor: #ffffff"/>
        <div slot="title">{{ item.title }}</div>
      </a-list-item-meta>
      <a-tooltip v-if="item.showTip">
        <a-icon type="question-circle" />
        <template slot="title">
          <template v-if="!item.available">
            需要{{item.higherThan}}以上版本
            <br/>
          </template>
          {{item.information}}
        </template>
      </a-tooltip>
    </a-list-item>
  </a-list>
</div>
</template>

<script>
import ConfigInterface from "@/interface/ConfigInterface"
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";
export default {
name: "Config",
  data(){
  return{
    Options:[],
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
    onChange(item){
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
    }
  },
  created() {
    this.prepareData()
  }
}
</script>