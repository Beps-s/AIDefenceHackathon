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
    way["highway"="tertiary"](poly:"${boundary}");
    way["natural"="water"]["water"="lake"](poly:"${boundary}");
    relation["natural"="water"]["water"="lake"](poly:"${boundary}");
  );
  out geom;
  `;

  return query;
};

export const postQuery = async (query: string): Promise<QueryResponse> => {
  
  console.group("Overpass Query");
  console.warn("Started Query");
  console.debug(query);
  console.time();
  

  var result = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    // The body contains the query
    body: "data=" + encodeURIComponent(query),
  }).then((data) => data.json());

  
  console.timeEnd();
  console.log(JSON.stringify(result, null, 2));
  console.groupEnd();
  

  return {
    queryResponse: JSON.stringify(result, null, 2),
  };
};
