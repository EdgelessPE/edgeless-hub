<template>
  <a-layout id="main" :style="{ height: '100%' , width:'100%'}">
    <a-layout-sider v-model="collapsed" :trigger="null" collapsible :theme="theme">
      <div class="logo" :style="{ height: '3vw' , width:'100%' , color:(theme==='light')?'black':'white'}" @click="() => {this.collapsed = !this.collapsed}">
        {{collapsed?'e':'edgElEss'}}
      </div>
      <a-menu mode="inline" :default-selected-keys="['1']" :theme="theme">
        <a-menu-item key="home">
          <a-icon type="home" />
          <span>首页</span>
          <router-link to="/"></router-link>
        </a-menu-item>
        <a-sub-menu key="cate">
          <template slot="title"> <a-icon type="unordered-list" /><span>分类</span> </template>
          <template v-for="cateItem in cateData">
            <a-menu-item :key="cateItem.name">
              {{cateItem.name}}
              <router-link :to="'/cate?name='+cateItem.name"></router-link>
            </a-menu-item>
          </template>
        </a-sub-menu>
        <a-menu-item key="download">
          <a-icon type="download" />
          <span>下载管理</span>
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

export default {
  data() {
    return {
      collapsed: false,
      theme:'dark',

      cateData:[{"name":"下载上传","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"办公编辑","time":"2020-12-10 03:25","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"即时通讯","time":"2020-12-10 03:25","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"压缩镜像","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"安全急救","time":"2020-12-10 03:25","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"安装备份","time":"2020-12-10 03:25","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"实用工具","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"开发辅助","time":"2020-12-10 03:25","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"录屏看图","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"影音播放","time":"2020-12-10 03:03","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"浏览器","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"游戏娱乐","time":"2020-12-10 03:17","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"磁盘数据","time":"2020-12-10 03:25","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"美化增强","time":"2020-12-10 03:18","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"资源管理","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"输入法","time":"2020-12-10 03:26","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"运行环境","time":"2020-12-10 03:51","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"远程连接","time":"2020-12-10 03:46","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"配置检测","time":"2020-12-10 03:42","size":4096,"type":"FOLDER","path":"/插件包/","url":null},{"name":"驱动管理","time":"2020-12-10 03:44","size":4096,"type":"FOLDER","path":"/插件包/","url":null}]
    };
  },
  components:{
    'TopBar':TopBar
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