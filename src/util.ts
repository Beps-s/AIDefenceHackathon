import { Polygon } from "leaflet";
import { LatLngExpression, LatLngLiteral } from "leaflet";
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

export function centroid (arr) { 
    return arr.reduce(function (x,y) {
        return [x[0] + y[0]/arr.length, x[1] + y[1]/arr.length] 
    }, [0,0]) 
}

export function getNearestPointViaElementsArray(map, elements: any[], point: LatLngExpression): LatLngLiteral {
  let nearestPoint: LatLngLiteral = elements[0].geometry[0];
  let oldDistance: number = GeometryUtil.distance(map, point, nearestPoint);

  elements.map(element => {
    element.geometry.map(nextPoint => {
      const distance = GeometryUtil.distance(map, point, nextPoint);
      if (distance < oldDistance) {
        oldDistance = distance;
        nearestPoint = nextPoint;
      }
    })
  })
  
  
  return { lat: nearestPoint.lat, lng: nearestPoint.lon};
}

export function getRandomPointsInPolygon(points: LatLngExpression[], amount: number): LatLngTuble[] {
  const polygon = new Polygon(points);
  var bounds = polygon.getBounds();

  // bounds
  var x_max = bounds.getEast();
  var x_min = bounds.getWest();
  var y_max = bounds.getSouth();
  var y_min = bounds.getNorth();
  
  let randomPoints: LatLngTuble = [];
  for (const i of Array(amount).keys()) {
    // random latitude & longitude
    var lat = x_min + (Math.random() * (x_max - x_min));
    var lng = y_min + (Math.random() * (y_max - y_min));
    randomPoints.push([ lat, lng ]);
  }

  return randomPoints;
}