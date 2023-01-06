<template>
  <map-container
    :track="fetchedTrack"
    :toggleAnimation="animationToggled"
    :animationSpeed="speed"
  />
  <animation-controls
    @trackFetched="fetchedTrack = $store.state.track"
    @speedValueChanged="setSpeed"
    @toggleAnimation="animationToggled = !animationToggled"
  />
</template>

<script>
import MapContainer from "./components/MapContainer.vue";
import AnimationControls from "./components/AnimationControls.vue";

export default {
  name: "App",
  components: {
    MapContainer,
    AnimationControls,
  },
  data() {
    return {
      fetchedTrack: null,
      speed: 0,
      animationToggled: false
    }
  },
  methods: {
    setSpeed(newValue) {
      this.speed = Number(newValue);
    }
  }
};
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
