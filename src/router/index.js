import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Cate from "@/views/Cate"
import Down from "../views/Down.vue"
import Search from "@/views/Search"
import Setting from "@/views/Setting";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path:'/cate',
    name:'Cate',
    component: Cate
  },
  {
    path:'/down',
    name:'Down',
    component: Down
  },
  {
    path:'/search',
    name:'Search',
    component: Search
  },
  {
    path:'/setting',
    name:'Setting',
    component: Setting
  }
]

const router = new VueRouter({
  routes
})

export default router
