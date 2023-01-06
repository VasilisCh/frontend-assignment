<template>
  <div ref="map-root" style="height: 98vh;">
  </div>
</template>

<script>
  import View from 'ol/View'
  import Map from 'ol/Map'
  import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
  import XYZ from 'ol/source/XYZ';
  import Cluster from 'ol/source/Cluster';
  import 'ol/ol.css';
  import {
    Style,
    Circle,
    Circle as CircleStyle,
    Fill,
    Stroke,
    Text
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
      this.myMap = new Map({
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
        view: new View({
          zoom: 0,
          center: [0, 0],
          constrainResolution: true
        }),
      });
      this.$http.get(
        `https://services.marinetraffic.com/api/exportvesseltrack/cf8f05df0b57bfae43e762cc61fd381239c4c042?v=1&msgtype=simple&protocol=json&MAXLAT=37.98&MINLON=23.60&MAXLON=23.70&days=1&MINLAT=37.90`
      ).then((response) => {
        const vesselLocations = response.data.map(function(l) {
          return new Array(Number(l[3]), Number(l[4]));
        });
        const transformedLocations = new LineString(vesselLocations)
          .transform('EPSG:4326', 'EPSG:3857');
        const allRouteCoords = transformedLocations.getCoordinates();

        const features = allRouteCoords.map(function(l) {
          return new Feature({
            geometry: new Point(l)
          });
        });
        var vectorSource = new VectorSource({
            features: features
        });

        const clusterSource = new Cluster({
          distance: 40,
          minDistance: 20,
          source: vectorSource,
        });

        const clusters = new VectorLayer({
          source: clusterSource,
          style: function (feature) {
            const size = feature.get('features').length;
            let style = new Style({
              image: new CircleStyle({
                radius: 10,
                stroke: new Stroke({
                  color: '#fff',
                }),
                fill: new Fill({
                  color: '#3399CC',
                }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: '#fff',
                }),
              }),
            });
            return style;
          },
        });
        this.myMap.addLayer(clusters);
      }).catch((error)=>{
        console.error(error);
      })
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