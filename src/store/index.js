import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    cateData:[],
    allData:[],
    tasks:[],
    stationUrl:'https://pineapple.edgeless.top/api/list/1',
    theme:'light',
    downloadDir:'D:',
    aria2cUri:'http://localhost:6800/jsonrpc'
  },
  mutations: {
    setCateData(state,d){
      state.cateData=d
    },
    appendAllData(state,d){
      state.allData.push(d)
    },
    clearData(state){
      state.allData=[]
      state.cateData=[]
    },
    updateTask(state,payload){
      state.tasks[payload.index]=payload.data
    }
  },
  getters:{
  },
  actions: {
  },
  modules: {
  }
})
