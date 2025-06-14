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

/*
export function smoothPolygon(polygon_vertices, num_iterations = 3, smoothing_factor = 1.0) {
    let smoothed_vertices = polygon_vertices;
    let num_vertices = smoothed_vertices.length;

    for (let iter = 0; 0 < num_iterations; iter++) {
        let temp_vertices: any[] = []
        for (let i = 0; i < num_vertices - 1; i++) {
          console.log((i));
          
            let prev_index = (i - 1 + num_vertices) % num_vertices
            let next_index = (i + 1) % num_vertices

            let current_vertex = smoothed_vertices[i]
            let prev_vertex = smoothed_vertices[prev_index]
            let next_vertex = smoothed_vertices[next_index]

            // Calculate the target position (average of neighbors, or self + neighbors)
            // This is a simple 3-point average including the current point
            // For pure Laplacian, it's often just the average of neighbors.
            let target_x = (prev_vertex.lat + current_vertex.lat + next_vertex.lat) / 3.0
            let target_y = (prev_vertex.lng + current_vertex.lng + next_vertex.lng) / 3.0

            // Apply smoothing factor to control how much the point moves towards the target
            let new_x = current_vertex.lat + (target_x - current_vertex.lat) * smoothing_factor
            let new_y = current_vertex.lng + (target_y - current_vertex.lng) * smoothing_factor

            temp_vertices.push([new_x, new_y])
            }
            
        smoothed_vertices = temp_vertices
      }

    return smoothed_vertices
}
*/