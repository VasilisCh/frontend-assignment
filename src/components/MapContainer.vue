<template>
  <div ref="map-root" style="height: 98vh;">
  </div>
</template>

<script>
  import View from 'ol/View'
  import Map from 'ol/Map'
  import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
  import XYZ from 'ol/source/XYZ';
  import 'ol/ol.css';
  import {
    Style,
    Circle,
    Fill,
    Stroke
  } from 'ol/style.js';
  import Feature from 'ol/Feature';
  import Point from 'ol/geom/Point';
  import VectorSource from 'ol/source/Vector';
  import { LineString } from 'ol/geom';
  import {getVectorContext} from 'ol/render.js';

  const key = '4q1O73skryrt6BnvYvzR';
  const attributions =
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

  var lastTime, distance = 0, routeCoords, route, position, vectorLayer, geoMarker;

  var styles = {
  'geoMarker': new Style({
    image: new Circle({
      radius: 7,
      snapToPixel: false,
      fill: new Fill({
        color: 'black'
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2
      })
    })
  })
};

  export default {
    name: 'MapContainer',
    data () {
      return {
        myMap: null
      };
    },
    props: {
      track: {
        type: Object,
        required: false
      },
      toggleAnimation: {
        type: Boolean,
        required: false
      },
      animationSpeed: {
        type: Number,
        required: false
      }
    },
    watch: {
      toggleAnimation(newValue) {
        if(newValue) this.startAnimation();
        else this.stopAnimation();
      },
      track: function(newVal) {
        const locations = newVal;
        route = new LineString(locations)
          .transform('EPSG:4326', 'EPSG:3857');

        routeCoords = route.getCoordinates();
        var routeLength = routeCoords.length;

        var routeFeature = new Feature({
          type: 'route',
          geometry: route
        });
        geoMarker = new Feature({
          type: 'geoMarker',
          geometry: new Point(routeCoords[0])
        });
        var startMarker = new Feature({
          type: 'icon',
          geometry: new Point(routeCoords[0])
        });
        position = startMarker.getGeometry().clone();
        var endMarker = new Feature({
          type: 'icon',
          geometry: new Point(routeCoords[routeLength - 1])
        });
        var vectorSource = new VectorSource({
            features: [routeFeature, geoMarker, startMarker, endMarker]
        });
        vectorLayer = new VectorLayer({
          source: vectorSource,
        });
        this.myMap.addLayer(vectorLayer);
      }
    },
    mounted() {
      // this is where we create the OpenLayers map
      this.myMap = new Map({
        // the map will be created using the 'map-root' ref
        target: this.$refs['map-root'],
        layers: [
          new TileLayer({
            source: new XYZ({
              attributions: attributions,
              url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + key,
              tileSize: 512,
            }),
          })
        ],

        // the map view will initially show the whole world
        view: new View({
          zoom: 0,
          center: [0, 0],
          constrainResolution: true
        }),
      });
    },
    methods: {
      stopAnimation() {
        geoMarker.setGeometry(position);
        vectorLayer.un('postrender', this.moveFeature);
      },
      startAnimation() {
        lastTime = Date.now();
        vectorLayer.on('postrender', this.moveFeature);
        geoMarker.setGeometry(null);
      },
      moveFeature: function(event) {
        const speed = this.animationSpeed;
        const time = event.frameState.time;
        const elapsedTime = time - lastTime;
        distance = (distance + (speed * elapsedTime) / 1e6) % 2;
        lastTime = time;

        const currentCoordinate = route.getCoordinateAt(
          distance > 1 ? 2 - distance : distance
        );
        position.setCoordinates(currentCoordinate);
        const vectorContext = getVectorContext(event);
        vectorContext.setStyle(styles.geoMarker);
        vectorContext.drawGeometry(position);
        this.myMap.render();
      }
    }
  }
</script>