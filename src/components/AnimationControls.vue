<template>
  <div id="challenge-form">
    <div id="animation-controls">
      <button
        type="button"
        class="btn btn-primary"
        id="start-animation"
        :disabled="!trackFetched"
        @click="toggleAnimation"
      >
        {{ animationToggled ? "Stop" : "Start" }} animation
      </button>
      <label for="speed">
        &nbsp;<span :class="!trackFetched ? 'grey-color' : 'black-color'"
          >speed:</span
        >&nbsp;
        <input
          id="speed"
          type="range"
          min="2"
          max="1000"
          step="2"
          v-model="speedValue"
          :disabled="!trackFetched"
        />
      </label>
    </div>
    <div id="ship-info">
      <label for="mmsiOrImo">
        MMSI or IMO:
        <input
          type="number"
          id="mmsiOrImo"
          :class="trackFetched ? 'grey-color' : 'black-color'"
          name="mmsiOrImo"
          min="10"
          max="100"
          v-model="mmsiOrImo"
          @change="resetError"
          :disabled="trackFetched"
        />
      </label>
      &nbsp;&nbsp;
      <label for="days">
        Days:
        <input
          type="number"
          id="days"
          :class="trackFetched ? 'grey-color' : 'black-color'"
          name="days"
          min="1"
          max="190"
          v-model="days"
          @change="resetError"
          :disabled="trackFetched"
        />
      </label>
      &nbsp;&nbsp;
      <input
        type="button"
        class="btn btn-primary"
        value="Search"
        :disabled="trackFetched || mmsiOrImo == ''"
        @click="fetchVesselTrack"
      />
      &nbsp;&nbsp;
      <input
        type="button"
        class="btn btn-primary"
        value="Reset"
        :disabled="!trackFetched"
        @click="resetTrack"
      />
    </div>
  </div>
  <Info
    :displayModalValue="displayModalValue"
    :modalMessage="modalMessage"
    :isError="errorOnResponse"
    :errorMessage="'Try different input...'"
  />
</template>

<script>
import Info from "./Info.vue";
export default {
  components: { Info },
  emits: ["speedValueChanged", "trackReset", "toggleAnimation", "trackFetched"],
  data() {
    return {
      mmsiOrImo: "239923000",
      days: 1,
      trackFetched: false,
      speedValue: 10,
      animationToggled: false,
      displayModalValue: "none",
      modalMessage: "Fetching historical track...",
      errorOnResponse: false,
    };
  },
  computed: {
    theRequest() {
      return `/exportvesseltrack/<apiKey>?v=3&protocol=json&days=${this.days}&mmsi=${this.mmsiOrImo}`;
    },
  },
  watch: {
    speedValue: function (newVal) {
      this.$emit("speedValueChanged", newVal);
    },
  },
  methods: {
    resetTrack() {
      this.$emit("trackReset");
      this.$store.commit("setTrack", {
        track: null,
      });
      this.trackFetched = false;
    },
    toggleAnimation() {
      this.animationToggled = !this.animationToggled;
      this.$emit("toggleAnimation");
    },
    fetchVesselTrack() {
      this.displayModalValue = "block";
      this.$http
        .get(
          `https://services.marinetraffic.com/api${this.theRequest.replace(
            "<apiKey>",
            "cf8f05df0b57bfae43e762cc61fd381239c4c042"
          )}`
        )
        .then((response) => {
          this.$store.commit("setTrack", {
            track: response.data.map(function (l) {
              return new Array(l[4], l[5], l[8], l[9]);
            }),
          });
          this.$emit("trackFetched");
          this.trackFetched = true;
          this.displayModalValue = "none";
        })
        .catch((error) => {
          this.errorOnResponse = true;
          this.modalMessage = error.response.data.errors[0].detail;
        });
    },
  },
};
</script>

<style scoped>
.grey-color {
  color: grey;
}
.black-color {
  color: black;
}
#animation-controls {
  padding: 20px;
}
#ship-info {
  padding: 20px;
}
#challenge-form {
  width: 40%;
  height: 170px;
  border: 2px black;
  background-color: white;
  position: absolute;
  bottom: 40px;
  left: 30%;
}
</style>
