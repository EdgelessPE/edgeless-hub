<template>
 <a-row>
   <a-col span="19"/>

   <a-col span="4" v-if="!searchBarCollapsed">
     <a-input-search placeholder="搜索" class="search-bar" @search="onSearch" />
   </a-col>

   <a-col span="3" v-if="searchBarCollapsed"/>
   <a-col span="1" v-if="searchBarCollapsed" @click="()=>{this.searchBarCollapsed=!this.searchBarCollapsed;console.log(this.searchBarCollapsed)}">
     <a-avatar icon="search"/>
   </a-col>

   <a-col span="1"/>
   <a-col span="1">
     <a-avatar icon="download"/>
   </a-col>
 </a-row>
</template>

<script>
export default {
name: "TopBar",
  methods:{
    onSearch(){
      this.searchBarCollapsed=true
    }
  },
  data(){
    return {
      searchBarCollapsed:true
    }
  }
}
</script>

<style scoped>
.search-bar{
  width: 90%;
  height: 90%;

}
</style>