import { LatLngLiteral, LatLngTuple } from "leaflet";
import { getNearestPointViaElementsArray } from "../util.ts";

const timeout = 120;
const maxSize = 2073741824;

export const QueryTypes = {
  river: 'way["natural"="water"]["water"="lake"]',
  lake: 'relation["natural"="water"]["water"="lake"]',
  primaryRoad: 'way["highway"="primary"]',
  secondaryRoad: 'way["highway"="secondary"]',
  tertiary: 'way["highway"="tertiary"]',
};

export type QueryResponse = {
  queryResponse: string;
};

export type BoundaryType = {
  start: [number, number]; // y, x
  end: [number, number]; // y, x
};

export const constructQuery = (boundary: string): string => {
  const query = `
  [out:json][maxsize:${maxSize}][timeout:${timeout}];
  (
    way["highway"~"^(motorway|trunk|pedestrian|primary|secondary|tertiary|unclassified|service|residential|living_street)$"](poly:"${boundary}");
  );
  out geom;
  `;

  return query;
};

export const postQuery = async (query: string): Promise<any> => {
  console.time("Query Time");
  /*
  console.group("Overpass Query");
  console.warn("Started Query");
  console.debug(query);
  */

  var result = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    // The body contains the query
    body: "data=" + encodeURIComponent(query),
  }).then((data) => data.json())
  .catch((error) => {
    console.log(error)
    return null;
  });

  console.timeEnd();

  /*
  console.log(JSON.stringify(result, null, 2));
  console.groupEnd();
  */
  
  return (result.elements.length != 0) ? result : null;
};

export const snapJsonCoordinates = (
  map,
  geoData: any,
  coordinates: LatLngTuple[]
): LatLngTuple[] => {
  let snappedPoints: LatLngTuple[] = [];

  coordinates.map((coordinate) => {
    const fixedPoint = getNearestPointViaElementsArray(map, geoData.elements, coordinate);
    snappedPoints.push([fixedPoint.lat, fixedPoint.lng]);
  });

  return snappedPoints;
};
