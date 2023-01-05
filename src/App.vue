<template>
  <map-container/>
  <animation-controls />
</template>

<script>
import MapContainer from './components/MapContainer.vue'
import AnimationControls from './components/AnimationControls.vue'

export default {
  name: 'App',
  components: {
    MapContainer,
    AnimationControls
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
