import * as Vue from "vue";
import App from "./App.vue";
import axios from "axios";
import VueAxios from "vue-axios";
import { createStore } from "vuex";

const store = createStore({
  state() {
    return {
      track: null,
    };
  },
  mutations: {
    setTrack(state, payload) {
      state.track = payload.track;
    },
  }
});

const app = Vue.createApp(App);
app.use(store);
app.use(VueAxios, axios);
app.mount("#app");
