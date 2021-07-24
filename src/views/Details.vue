<template>
<div>
  <a-page-header
      :title="item.softName"
      :sub-title="cateName"
      @back="() => $router.go(-1)"
  >
    <template slot="extra">
      <CateButton slot="actions" :name="item.softName" :url="item.softUrl" :version_online="item.softVer" :key="item.softName"/>
    </template>
    <a-row type="flex">
      <a-col :span="4">
        <a-statistic title="版本号" :value="item.softVer" />
      </a-col>
      <a-col :span="4">
        <a-statistic title="打包者" :value="item.softAuthor" >
          <a-tag v-if="item.botTag" slot="suffix" color="cyan">自动构建</a-tag>
        </a-statistic>
      </a-col>
      <a-col :span="4">
        <a-statistic title="大小" :value="item.softSize" :suffix="item.sizeUnit"/>
      </a-col>
    </a-row>
  </a-page-header>

  <a-divider>插件详情页面由百度提供，搜索结果仅供参考，与Edgeless无关</a-divider>

  <webview id="webview" :src="'https://www.baidu.com/s?wd='+item.softName"
           style="display:inline-flex; width:80vw; height:40vw"/>
</div>
</template>

<script>
import CateButton from "@/components/CateButton";
export default {
  name: "Details",
  components: {CateButton},
  data(){
    return{
      item:{
        softName:"",
        softUrl:"",
        softVer:"",
        softSize:"",
        sizeUnit:"",
        softAuthor:"",
        botTag:false
      },
      cateName:""
    }
  },
  methods:{
    initItem(){
      //处理size
      let size=this.$route.query.softSize
      let softSize=size.slice(0,-2)
      let sizeUnit=size.slice(-2)
      if(sizeUnit==="0B"){
        softSize=size.slice(0,-1)
        sizeUnit=size.slice(-1)
      }

      //处理author
      let author=this.$route.query.softAuthor
      let botTag=false
      if(author.includes("（bot）")){
        author=author.slice(0,-5)
        botTag=true
      }

      this.item={
        softName:this.$route.query.softName,
        softUrl:this.$route.query.softUrl,
        softVer:this.$route.query.softVer,
        softSize,
        sizeUnit,
        softAuthor:author,
        botTag,
      }
      this.cateName=this.$route.query.cateName
    }
  },
  mounted() {
    //回到顶部
    scrollTo(0,0)
    //初始化item对象
    this.initItem()
  }
}
</script>