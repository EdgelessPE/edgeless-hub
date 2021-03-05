<template>
  <div>
    <a-back-top />
    <a-page-header
        :title="cateName"
        :sub-title="'共'+processedData.length+'个插件包'"
        @back="() => $router.go(-1)"
    />
    <a-list :grid="{ gutter: 16, column: 4 }" :data-source="processedData">
      <a-list-item slot="renderItem" slot-scope="item, index">
        <a-card :title="item.softName">
          {{'版本号：'+item.softVer}}
          <br/>
          {{'打包者：'+item.softAuthor}}
          <br/>
          {{'大小：'+item.softSize}}
          <CateButton slot="actions" :name="item.softName" :url="item.softUrl" :version_online="item.softVer" :key="item.softName"/>
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
import CateButton from "@/components/CateButton";
export default {
name: "Cate",
  components: {CateButton},
  data(){
    return{
      processedData:["233"]
    }
  },
  computed:{
    cateName:function (){
      return this.$route.query.name
    }
  },
  methods:{
    getCateData(){
      let ret=[]
      for(let i=0;i<this.$store.state.allData.length;i++){
        if(this.$store.state.allData[i].cateName===this.cateName) {
          ret=this.$store.state.allData[i].files
          break
        }
      }
      return ret
    },
    prepData(){
      let raw=this.getCateData()
      this.processedData=[]
      raw.forEach((item)=>{
        let info=item.name.split('_')
        this.processedData.push({
          'softName':info[0],
          'softVer':info[1],
          'softAuthor':info[2].split('.7z')[0],
          'softUrl':item.url,
          'softSize':this.getSizeString(item.size)
        })
      })
    },
    getSizeString(size){
      if(size<1024) return size.toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    }
  },
  watch:{
    cateName(){
      this.prepData()
    }
  },
  created() {
    this.prepData()
  }
}
</script>

<style scoped>

</style>