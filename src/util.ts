import { LatLngLiteral, LatLngTuple } from "leaflet";
import GeometryUtil from "leaflet-geometryutil";

export function anglePointWithDistance(
  map,
  point: LatLngLiteral,
  centerPoint: LatLngLiteral,
  angle: number,
  distance: number
): LatLngLiteral {
  const rotated_point = GeometryUtil.rotatePoint(
    map,
    point,
    angle,
    centerPoint
  );

  return GeometryUtil.destinationOnSegment(map, centerPoint, rotated_point, distance);
}

export function distanceSegment(map, start: LatLngLiteral, end: LatLngLiteral, distance: number): LatLngLiteral {
  return GeometryUtil.destinationOnSegment(map, start, end, distance);
}

export function getDirection (startLatLng: LatLngLiteral, endLatLng: LatLngLiteral): LatLngLiteral {
    return {lat: endLatLng.lat - startLatLng.lat, lng: endLatLng.lng - startLatLng.lng};
  };

export function addLatLng(a: LatLngLiteral, b: LatLngLiteral): LatLngLiteral {
  return { lat: a.lat + b.lat, lng: a.lng + b.lng };
}

export function subLatLng(a: LatLngLiteral, b: LatLngLiteral): LatLngLiteral {
  return { lat: a.lat - b.lat, lng: a.lng - b.lng };
}

export function centerLatLng(a: LatLngLiteral, b: LatLngLiteral): LatLngLiteral {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}
