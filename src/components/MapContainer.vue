<template>
  <div ref="map-root" style="height: 98vh;">
  </div>
</template>

<script>
  import View from 'ol/View'
  import Map from 'ol/Map'
  import TileLayer from 'ol/layer/Tile'
  import XYZ from 'ol/source/XYZ.js';

  // importing the OpenLayers stylesheet is required for having
  // good looking buttons!
  import 'ol/ol.css'

  const key = '4q1O73skryrt6BnvYvzR';
  const attributions =
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

  export default {
    name: 'MapContainer',
    mounted() {
      // this is where we create the OpenLayers map
      new Map({
        // the map will be created using the 'map-root' ref
        target: this.$refs['map-root'],
        layers: [
          new TileLayer({
            source: new XYZ({
              attributions: attributions,
              url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + key,
              tileSize: 512,
            }),
          }),
        ],

        // the map view will initially show the whole world
        view: new View({
          zoom: 0,
          center: [0, 0],
          constrainResolution: true
        }),
      });
      // this.$http.get(
      //   'https://services.marinetraffic.com/api/exportvesseltrack/6ae24e8d813980080846d7d4858c00ce80e4cc13?v=3&shipid=9241786&mmsi=239923000&days=1'
      // ).then((response) => {
      //   console.log(response.data)
      // })
    },
  }
</script>