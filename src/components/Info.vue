<template>
  <div
    class="modal"
    tabindex="-1"
    role="dialog"
    :style="`display: ${displayModal}`"
  >
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ isError ? `Error: ${modalMessage}` : modalMessage }}
          </h5>
          <button
            v-if="isError"
            type="button"
            class="close"
            @click="displayModal = 'none'"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="isError">
            {{ errorMessage }}
          </div>
          <div v-else class="progress">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              aria-valuenow="100"
              aria-valuemin="0"
              aria-valuemax="100"
              style="width: 100%"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      displayModal: this.displayModalValue,
    };
  },
  watch: {
    displayModalValue(newValue) {
      this.displayModal = newValue;
    },
  },
  props: {
    displayModalValue: {
      type: String,
      required: true,
    },
    modalMessage: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String,
      required: true,
    },
    isError: {
      type: Boolean,
      required: true,
    },
  },
};
</script>
