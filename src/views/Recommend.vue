<template>
  <div>
    <a-back-top />
    <a-page-header
        :sub-title="'共'+recommendList.length+'个插件包'"
        @back="() => $router.go(-1)"
    >
      <template slot="title">
        <a-icon type="trophy" />
        精选插件
      </template>
    </a-page-header>
      <a-list :grid="{ gutter: 16, column: 4 }" :data-source="recommendData">
        <a-list-item slot="renderItem" slot-scope="item, index">
          <a-card>
            <template slot="title">
              <div @click="gotoDetails(item)" style="cursor:pointer">
                {{item.softName}}
                <a-tag v-if="item.botTag" color="cyan">自动构建</a-tag>
              </div>
            </template>
            {{'分类：'+item.cateName}}
            <br/>
            {{'版本号：'+item.softVer}}
            <br/>
            {{'打包者：'+item.displayAuthor}}
            <br/>
            {{'大小：'+item.softSize}}
            <CateButton slot="actions" :name="item.softName" :fullName="item.softName+'_'+item.softVer+'_'+item.softAuthor+'.7z'" :url="item.softUrl" :version_online="item.softVer" :key="item.softName"/>
          </a-card>
        </a-list-item>
      </a-list>
    <a-layout-footer style="text-align: center">
      没找到需要的插件？尝试自己
      <a-button size="small" v-on:click="$router.push('/wiki?location=https://wiki.edgeless.top/v2/develop/quickstart.html')">制作插件包</a-button>
    </a-layout-footer>
  </div>
</template>

<script>
import CateButton from "@/components/CateButton"
export default {
  name: 'Home',
  components:{
    CateButton
  },
  data(){
    return{
      recommendList:['QQ','迅雷','Google Chrome','IDM','Office2010','VSCode','Wechat','Bandizip',
        '火绒安全','Edgeless密码管家','微PE工具包','adb','VMTools','PotPlayer','千千静听','网易云音乐',
        'Edge','Firefox','分区助手','MacType','Listary','Everything','手心输入法','Python','Anydesk',
        'FinalShell','ToDesk','微软mstsc远程桌面','向日葵远程控制','CPU-Z','iOS驱动（含爱思助手）'],
      recommendData:[]
    }
  },
  methods:{
    generateRecommends(){
      //回到顶部
      scrollTo(0,0)
      //生成必备软件项目
      this.recommendData=[]
      this.$store.state.allData.forEach((itemI)=>{
        itemI.files.forEach((itemJ)=>{
          if(this.insideList(itemJ.name.split('_')[0])) {
            let info=itemJ.name.split('_')

            //处理author
            let author=info[2].split('.7z')[0]
            let botTag=false
            let displayAuthor=author
            if(author.includes("（bot）")){
              displayAuthor=author.slice(0,-5)
              botTag=true
            }

            this.recommendData.push({
              softName:info[0],
              softVer:info[1],
              softUrl:itemJ.url,
              softSize:this.getSizeString(itemJ.size),
              cateName:itemI.cateName,
              softAuthor:author,
              displayAuthor,
              botTag,
            })
          }
        })
      })
    },
    insideList(name){
      let found=false
      for(let i=0;i<this.recommendList.length;i++){
        if(this.recommendList[i]===name){
          found=true
          break
        }
      }
      return found
    },
    getSizeString(size){
      if(size<1024) return size.toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    gotoDetails(item){
      this.$router.push("/details?softName="+item.softName+"&softUrl="+item.softUrl+"&softVer="+item.softVer+"&softSize="+item.softSize+"&cateName="+item.cateName+"&softAuthor="+item.softAuthor)
    }
  },
  created() {
    //所有插件列表载入完成时生成推荐列表
    if(this.$store.state.allData.length!==0&&this.$store.state.allData.length===this.$store.state.cateData.length) {
      this.generateRecommends()
    }
    this.$root.eventHub.$on('all-data-loaded',()=>{
      this.generateRecommends()
    })
  }
}
</script>
