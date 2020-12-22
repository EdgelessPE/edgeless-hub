<template>
  <a-layout id="main" :style="{ height: '100%' , width:'100%'}">
    <a-layout-sider v-model="collapsed" :trigger="null" collapsible :theme="theme">
      <div class="logo" :style="{ height: '3vw' , width:'100%' , color:(theme==='light')?'black':'white'}" @click="() => {this.collapsed = !this.collapsed}">
        {{collapsed?'e':'edgElEss'}}
      </div>
      <a-menu mode="inline" :default-selected-keys="['/']" :theme="theme" :selectedKeys="selectedKey">
        <a-menu-item key="/">
          <a-icon type="home" />
          <span>首页</span>
          <router-link to="/"/>
        </a-menu-item>
        <a-sub-menu key="/cate">
          <template slot="title"> <a-icon type="unordered-list" /><span>分类</span> </template>
          <template v-for="cateItem in cateData">
            <a-menu-item :key="cateItem.name">
              {{cateItem.name}}
              <router-link :to="'/cate?name='+cateItem.name"/>
            </a-menu-item>
          </template>
        </a-sub-menu>
        <a-menu-item key="/down">
          <a-icon type="download" />
          <span>下载管理</span>
          <router-link to="/down"/>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0">
        <TopBar/>
      </a-layout-header>
      <a-layout-content
          :style="{ margin: '24px 16px', padding: '24px', background: '#fff', minHeight: '280px' }"
      >
        <router-view/>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import TopBar from "@/components/TopBar"
import {notification} from 'ant-design-vue'
import DownloadManager from "@/components/DownloadManager";

export default {
  data() {
    return {
      collapsed: false
      };
  },
  methods:{
    refreshData(){
      let url=this.$store.state.stationUrl
      //获取分类数据
      this.$axios.get(url+'?path=插件包')
          .then((res)=>{
        //console.log(res.data.data.fileList)
        this.$store.commit('setCateData',res.data.data.fileList)
        this.getPluginData()
      })
          .catch((err)=>{
        notification.open({
          message:'获取分类信息失败',
          description:"服务器错误："+err.message
        })
      })
    },
    getPluginData(){
      let url=this.$store.state.stationUrl
      //获取插件列表
      for(let i=0;i<this.cateData.length;i++){
        let queryName=this.cateData[i].name
        this.$axios.get(url+'?path=/插件包/'+queryName)
            .then((res)=>{
              let tmp_ret=[]
              res.data.data.fileList.forEach((item)=>{
                if(item.name.indexOf('.7z')!==-1) {
                  tmp_ret.push(item)
                }
              })
              this.$store.commit('appendAllData',{
                'cateName':queryName,
                'files':tmp_ret
              })
            })
      }
    },
    getTaskInfo(gid){
      //查找原任务位置
      let pointer=-1
      this.$store.state.ourTasksPool.forEach((item,index)=>{
        if(item.gid===gid) pointer=index
      })
      if(pointer!==-1){
        //返回原任务信息
        return this.$store.state.ourTasksPool[pointer]
      }else{
        console.log('gid not find')
      }
    }
  },
  components:{
    'TopBar':TopBar
  },
  computed:{
    selectedKey:function (){
      let path=this.$route.path
      if(path==='/cate') return [this.$route.query.name]
       else return [path]
    },
    cateData:function (){
      return this.$store.state.cateData
    },
    theme:function (){
      return this.$store.state.theme
    }
  },
  created() {
    //获取列表数据
    this.refreshData()

    //配置自动刷新aria2c
    setInterval(()=>{
      //console.log(this.$store.state.tasks)
      DownloadManager.methods.updateMaster()
    },1000)

    //初始化DownloadManager
    DownloadManager.methods.init(this.$axios,this.$store)

    //监听事件
    this.$root.eventHub.$on('add-download-task',(data)=>{
      DownloadManager.methods.taskAdd(data.url,data.name)
    })
    this.$root.eventHub.$on('unpause-download-task',(data)=>{
      DownloadManager.methods.taskUnpause(data.gid)
    })
    this.$root.eventHub.$on('pause-download-task',(data)=>{
      DownloadManager.methods.taskPause(data.gid)
    })
    this.$root.eventHub.$on('restart-download-task',(data)=>{
      //读取原任务信息
      let info=this.getTaskInfo(data.gid)
      //删除原任务信息
      this.$store.commit('removeTask',data.gid)
      //重新发送下载任务
      DownloadManager.methods.taskRestart(info)
    })
  }
};
</script>
<style>
#main .trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

#main .trigger:hover {
  color: #1890ff;
}

#main .logo {

  margin: 0 auto;
  font-size: 1.2vw;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: justify;
  font-family: earth;
}
#main .logo:hover{
  cursor: pointer;
}

@font-face
{
  font-family: earth;
  src: url('common/font/earth.ttf');
}
</style>