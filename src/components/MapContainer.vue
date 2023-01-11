<template>
  <div ref="map-root" style="height: 98vh">
    <div id="popup"></div>
  </div>
  <Info
    :displayModalValue="displayModalValue"
    :modalMessage="modalMessage"
    :isError="errorOnResponse"
    :errorMessage="'Try refreshing the page or click on X to continue with a track search...'"
  />
</template>

<script>
import Info from "./Info.vue";
import View from "ol/View";
import OlMap from "ol/Map";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import XYZ from "ol/source/XYZ";
import Cluster from "ol/source/Cluster";
import "ol/ol.css";
import {
  Style,
  Circle,
  Circle as CircleStyle,
  Fill,
  Stroke,
  Text,
} from "ol/style.js";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import { LineString } from "ol/geom";
import { getVectorContext } from "ol/render.js";
import { boundingExtent } from "ol/extent.js";
import Overlay from "ol/Overlay.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { Popover } from "bootstrap/dist/js/bootstrap.esm.min.js";

const key = "4q1O73skryrt6BnvYvzR";
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

var lastTime,
  distance = 0,
  routeCoords,
  route,
  position,
  vectorLayer,
  geoMarker;

var styles = {
  geoMarker: new Style({
    image: new Circle({
      radius: 7,
      snapToPixel: false,
      fill: new Fill({
        color: "black",
      }),
      stroke: new Stroke({
        color: "white",
        width: 2,
      }),
    }),
  }),
};

export default {
  name: "MapContainer",
  components: { Info },
  data() {
    return {
      myMap: null,
      modalMessage: "Fetching vessels for the port of Piraeus...",
      displayModalValue: "block",
      errorOnResponse: false,
    };
  },
  props: {
    track: {
      type: Object,
      required: false,
    },
    toggleAnimation: {
      type: Boolean,
      required: false,
    },
    animationSpeed: {
      type: Number,
      required: false,
    },
  },
  watch: {
    toggleAnimation(newValue) {
      if (newValue) this.startAnimation();
      else this.stopAnimation();
    },
    track: function (newVal) {
      if (newVal === null) {
        this.myMap.removeLayer(vectorLayer);
        return;
      }
      const locations = newVal.map(function (l) {
        return new Array(l[0], l[1]);
      });
      route = new LineString(locations).transform("EPSG:4326", "EPSG:3857");

      routeCoords = route.getCoordinates();
      var routeLength = routeCoords.length;

      var routeFeature = new Feature({
        type: "route",
        geometry: route,
      });
      geoMarker = new Feature({
        type: "geoMarker",
        geometry: new Point(routeCoords[0]),
      });
      var startMarker = new Feature({
        type: "icon",
        geometry: new Point(routeCoords[0]),
        latitude: newVal[0][0],
        longitude: newVal[0][1],
        timestamp: newVal[0][2],
        shipid: newVal[0][3],
      });
      position = startMarker.getGeometry().clone();
      var endMarker = new Feature({
        type: "icon",
        geometry: new Point(routeCoords[routeLength - 1]),
        latitude: newVal[routeLength - 1][0],
        longitude: newVal[routeLength - 1][1],
        timestamp: newVal[routeLength - 1][2],
        shipid: newVal[routeLength - 1][3],
      });
      var vectorSource = new VectorSource({
        features: [routeFeature, geoMarker, startMarker, endMarker],
      });
      vectorLayer = new VectorLayer({
        source: vectorSource,
      });
      this.myMap.addLayer(vectorLayer);
    },
  },
  mounted() {
    this.myMap = new OlMap({
      target: this.$refs["map-root"],
      layers: [
        new TileLayer({
          source: new XYZ({
            attributions: attributions,
            url:
              "https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=" + key,
            tileSize: 512,
          }),
        }),
      ],
      view: new View({
        zoom: 0,
        center: [0, 0],
        constrainResolution: true,
      }),
    });
    this.myMap.on("pointermove", (e) => {
      const pixel = this.myMap.getEventPixel(e.originalEvent);
      const hit = this.myMap.hasFeatureAtPixel(pixel);
      this.myMap.getTarget().style.cursor = hit ? "pointer" : "";
    });

    const element = document.getElementById("popup");
    const popup = new Overlay({
      element: element,
      positioning: "bottom-center",
      stopEvent: false,
    });
    this.myMap.addOverlay(popup);

    let popover;
    function disposePopover() {
      if (popover) {
        popover.dispose();
        popover = undefined;
      }
    }
    this.$http
      .get(
        `https://services.marinetraffic.com/api/exportvesseltrack/cf8f05df0b57bfae43e762cc61fd381239c4c042?v=1&msgtype=simple&protocol=json&MAXLAT=37.98&MINLON=23.60&MAXLON=23.70&days=1&MINLAT=37.90`
      )
      .then((response) => {
        const uniqueData = [
          ...new Map(response.data.map((m) => [m[8], m])).values(),
        ];
        const vesselLocations = uniqueData.map(function (l) {
          return new Array(Number(l[3]), Number(l[4]));
        });
        const transformedLocations = new LineString(vesselLocations).transform(
          "EPSG:4326",
          "EPSG:3857"
        );
        const allRouteCoords = transformedLocations.getCoordinates();

        const features = allRouteCoords.map(function (l, index) {
          return new Feature({
            geometry: new Point(l),
            latitude: response.data[index][3],
            longitude: response.data[index][4],
            timestamp: response.data[index][7],
            shipid: response.data[index][8],
          });
        });
        var vectorSource = new VectorSource({
          features: features,
        });

        const clusterSource = new Cluster({
          distance: 40,
          minDistance: 20,
          source: vectorSource,
        });

        const clusters = new VectorLayer({
          source: clusterSource,
          style: function (feature) {
            const size = feature.get("features").length;
            let style = new Style({
              image: new CircleStyle({
                radius: 10,
                stroke: new Stroke({
                  color: "#fff",
                }),
                fill: new Fill({
                  color: "#3399CC",
                }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: "#fff",
                }),
              }),
            });
            return style;
          },
        });
        this.myMap.addLayer(clusters);
        this.myMap.on("click", (evt) => {
          const feature = this.myMap.forEachFeatureAtPixel(
            evt.pixel,
            function (feature) {
              return feature;
            }
          );
          disposePopover();
          if (!feature) {
            return;
          }
          if (feature.values_.features?.length > 1) {
            clusters.getFeatures(evt.pixel).then((clickedFeatures) => {
              if (clickedFeatures.length) {
                const features = clickedFeatures[0].get("features");
                if (features.length > 1) {
                  const extent = boundingExtent(
                    features.map((r) => r.getGeometry().getCoordinates())
                  );
                  this.myMap
                    .getView()
                    .fit(extent, { duration: 1000, padding: [50, 50, 50, 50] });
                }
              }
            });
          } else {
            popup.setPosition(evt.coordinate);
            popover = new Popover(element, {
              placement: "top",
              html: true,
              content: `
                <b>latitude:</b> ${
                  feature.values_.features
                    ? feature.values_.features[0].values_.latitude
                    : feature.values_.latitude
                }<br>
                <b>longitude:</b> ${
                  feature.values_.features
                    ? feature.values_.features[0].values_.longitude
                    : feature.values_.longitude
                }<br>
                <b>timestamp:</b> ${
                  feature.values_.features
                    ? feature.values_.features[0].values_.timestamp
                    : feature.values_.timestamp
                }<br>
                <b>shipid:</b> ${
                  feature.values_.features
                    ? feature.values_.features[0].values_.shipid
                    : feature.values_.shipid
                }
              `,
            });
            popover.show();
          }
        });
        this.displayModalValue = "none";
      })
      .catch((error) => {
        this.errorOnResponse = true;
        this.modalMessage = error.response.data.errors[0].detail;
      });
  },
  methods: {
    stopAnimation() {
      geoMarker.setGeometry(position);
      vectorLayer.un("postrender", this.moveFeature);
    },
    startAnimation() {
      lastTime = Date.now();
      vectorLayer.on("postrender", this.moveFeature);
      geoMarker.setGeometry(null);
    },
    moveFeature: function (event) {
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
    },
  },
};
</script>