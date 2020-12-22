import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Cate from "@/views/Cate"
import Down from "../views/Down.vue"

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
  }
]

const router = new VueRouter({
  routes
})

export default router
