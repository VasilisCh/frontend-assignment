<template>
  <div id="challenge-form">
    <div id="animation-controls">
      <button id="start-animation" :disabled="!trackFetched" @click="toggleAnimation">
        {{ animationToggled ? 'Stop' : 'Start' }} animation
      </button>
      <label for="speed">
        &nbsp;<span :class="!trackFetched ? 'grey-color' : 'black-color'">speed:</span>&nbsp;
        <input id="speed" type="range" min="2" max="100" step="2" v-model="speedValue" :disabled="!trackFetched">
      </label>
    </div>
    <div id="ship-info">
      <label for="mmsiOrImo">
        MMSI or IMO:
        <input
          type="number"
          id="mmsiOrImo"
          name="mmsiOrImo"
          min="10"
          max="100"
          v-model="mmsiOrImo"
          @change="resetError"
        />
      </label>
      <label for="shipId">
        ShipID:
        <input
          type="number"
          id="shipId"
          name="shipId"
          v-model="shipId"
          @change="resetError"
        />
      </label>
      <label for="days">
        Days:
        <input
          type="number"
          id="days"
          name="days"
          min="1"
          max="190"
          v-model="days"
          @change="resetError"
        />
      </label>
      &nbsp;&nbsp;
      <input
        type="button"
        value="Search"
        :disabled="shipId == '' || mmsiOrImo == ''"
        @click="fetchVesselTrack"
      />
      <div v-if="errorMessage" class="error-text">
        {{ errorMessage }}
      </div>
    </div>
    <div>
      <div>The request:</div>
      {{ theRequest }}
    </div>
  </div>
</template>

<script>
var convert = require('xml-js');

export default {
  data() {
    return {
      mmsiOrImo: '239923000',
      shipId: '9241786',
      days: 1,
      errorMessage: null,
      trackFetched: false,
      speedValue: 10,
      animationToggled: false
    }
  },
  computed: {
    theRequest() {
      return `/exportvesseltrack/<apiKey>?v=3&protocol=json&days=${this.days}&shipid=${this.shipId}&mmsi=${this.mmsiOrImo}`;
    }
  },
  watch: {
    speedValue: function(newVal) {
      this.$emit('speedValueChanged', newVal);
    }
  },
  methods: {
    toggleAnimation() {
      this.animationToggled = !this.animationToggled;
      this.$emit('toggleAnimation');
    },
    fetchVesselTrack() {
      this.$http.get(
        `https://services.marinetraffic.com/api${this.theRequest.replace('<apiKey>', 'cf8f05df0b57bfae43e762cc61fd381239c4c042')}`
      ).then((response) => {
        this.resetError();
        this.$store.commit('setTrack', { track: response.data });
        this.$emit('trackFetched');
        this.trackFetched = true;
      }).catch((error)=>{
        const jsonError = convert.xml2js(error.response.data, {compact: true, spaces: 2});
        this.errorMessage = jsonError.RESPONSE.STATUS.ERROR._attributes.DESCRIPTION;
      })
    },
    resetError() {
      this.errorMessage = null;
    }
  }
}
</script>

<style scoped>
.error-text {
  color: red;
  font-size: 10pt;
}
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
#challenge-form{
  width: 60%;
  height: 220px;
  border: 2px black;
  background-color: white;
  position: absolute;
  bottom: 20px;
  left: 20%;
}
</style>
