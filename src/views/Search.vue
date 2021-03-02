<template>
  <div>
    <a-page-header
        :title="'搜索：'+input"
        :sub-title="'共找到'+result.length+'个结果'"
        @back="() => $router.go(-1)"
    />
    <a-list :grid="{ gutter: 16, column: 4 }" :data-source="result">
      <a-list-item slot="renderItem" slot-scope="item, index">
        <a-card :title="item.softName">
          {{'版本号：'+item.softVer}}
          <br/>
          {{'打包者：'+item.softAuthor}}
          <br/>
          {{'分类：'+item.cate}}
          <br/>
          {{'大小：'+item.softSize}}
          <CateButton  slot="actions" :name="item.softName" :url="item.softUrl" :version_online="item.softVer" :key="item.softName"/>
        </a-card>
      </a-list-item>
    </a-list>
  </div>

</template>

<script>
import CateButton from "@/components/CateButton";
export default {
name: "Search",
  data(){
  return{
    input:'',
    result:[]
  }
  },
  components:{
    CateButton
  },
  methods:{
    generateResult(){
      this.result=[]
      this.$store.state.allData.forEach((cateItem)=>{
        cateItem.files.forEach((jItem)=>{
          if(jItem.name.toLowerCase().indexOf(this.input)!==-1) {
            let info=jItem.name.split('_')
            this.result.push({
              'cate': cateItem.cateName,
              'softName':info[0],
              'softVer':info[1],
              'softAuthor':info[2].split('.7z')[0],
              'softUrl':jItem.url,
              'softSize':this.getSizeString(jItem.size)
            })
          }
        })
      })
    },
    getSizeString(size){
      if(size<1024) return size.toFixed(2)+"B"
      else if(size<1024*1024) return (size/1024).toFixed(2)+"KB"
      else if(size<1024*1024*1024) return (size/(1024*1024)).toFixed(2)+"MB"
      else return (size/(1024*1024*1024)).toFixed(2)+"GB"
    },
    updateResult(){
      this.input=this.$route.query.keyword.toLowerCase()
      this.generateResult()
    }
  },
  created() {
    this.updateResult()
  },
  watch:{
  '$route': 'updateResult'
  }
}
</script>