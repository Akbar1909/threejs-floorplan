import React from "react";
import Map from "react-map-gl";

const MapBox = () => {
  return (
    <Map
      initialViewState={{
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
      }}
      style={{ width: 800, height: 600 }}
      mapStyle="mapbox://styles/mapbox/streets-v9"
      mapboxAccessToken="pk.eyJ1IjoiYWtiYXIxOTA5IiwiYSI6ImNsaTA0MzNvMDBjNHozZnVueWtlazFuZWsifQ.3OuOtycqcGpaeX0pqdbmOw"
    />
  );
};

export default MapBox;
