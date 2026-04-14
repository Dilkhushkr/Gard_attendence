/**
 * Device GPS + Google Maps link (check-in / check-out).
 * Reverse geocode uses BigDataCloud client API only (no API key).
 */

export function buildGoogleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function getTrackedLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        resolve({
          latitude: lat,
          longitude: lng,
          mapUrl: buildGoogleMapsUrl(lat, lng)
        });
      },
      () => reject(new Error("Please allow location access and try again")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * Prefer neighbourhood / gate / layout names (e.g. "Kudlu Gate") before city.
 */
// export async function reverseGeocodeToLabel(latitude, longitude) {
//   const url =
//     `https://api.bigdatacloud.net/data/reverse-geocode-client` +
//     `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
//   const response = await fetch(url);
//   if (!response.ok) throw new Error("Could not resolve location");
//   const data = await response.json();

//   const informative = data.localityInfo?.informative || [];
//   const admin = data.localityInfo?.administrative || [];

//   const orderedInformative = [...informative]
//     .filter((x) => x?.name && String(x.name).trim())
//     .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
//     .map((x) => String(x.name).trim());

//   const adminNames = admin
//     .filter((x) => x?.name && String(x.name).trim())
//     .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
//     .map((x) => String(x.name).trim());

//   const coarse = new Set(
//     [data.city, data.principalSubdivision, data.countryName]
//       .filter(Boolean)
//       .map((s) => s.toLowerCase())
//   );

//   const fineFirst = [];
//   for (const name of orderedInformative) {
//     const lower = name.toLowerCase();
//     if (coarse.has(lower)) continue;
//     fineFirst.push(name);
//   }

//   const gateOrArea = fineFirst.find(
//     (n) =>
//       /gate|nagar|layout|phase|block|colony|sector|extension|cross|main\s+road|street/i.test(n)
//   );

//   const rawParts = [
//     gateOrArea,
//     ...fineFirst.filter((n) => n !== gateOrArea),
//     data.locality,
//     ...adminNames.filter((n) => !coarse.has(n.toLowerCase())),
//     data.city,
//     data.principalSubdivision,
//     data.postcode,
//     data.countryName
//   ].filter(Boolean);

//   const seen = new Set();
//   const parts = rawParts.filter((part) => {
//     const key = String(part).trim().toLowerCase();
//     if (!key || seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });

//   return parts.length ? parts.join(", ") : "Exact address unavailable";
// }
// export async function reverseGeocodeToLabel(latitude, longitude) {
//   const url =
//     `https://api.bigdatacloud.net/data/reverse-geocode-client` +
//     `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

//   const response = await fetch(url);
//   if (!response.ok) throw new Error("Could not resolve location");

//   const data = await response.json();

//   console.log("Reverse geocode data:", data);

//   // ✅ Extract only useful fields
//   const area =
//     data.locality ||
//     data.city ||
//     data.principalSubdivision ||
//     "";

//   const city = data.city || "";
//   const state = data.principalSubdivision || "";
//   const country = data.countryName || "";

//   // ✅ Build clean address
//   // const parts = [area, city, state, country]
//   //   .filter((p) => p && p.trim());
  
//   const parts = [area, city, state, country]
//   .filter((p) => p && p.trim())
//   .filter((value, index, self) => self.indexOf(value) === index); // remove duplicates

//   return parts.length ? parts.join(", ") : "Exact address unavailable";
// } 


// export async function reverseGeocodeToLabel(latitude, longitude) {
//   const url =
//     `https://nominatim.openstreetmap.org/reverse` +
//     `?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`;
//     //                                                              ^^^^^^^^
//     //                               zoom=18 means building level precision

//   const response = await fetch(url, {
//     headers: {
//       "Accept-Language": "en",
//       "User-Agent": "YourAppName/1.0" // Nominatim requires this
//     }
//   });

//   if (!response.ok) throw new Error("Could not resolve location");

//   const data = await response.json();

//   console.log("Nominatim data:", data);

//   const address = data.address;

//   // Extract from most specific to least specific
//   const parts = [
//     address.amenity,          // AKI Tech Park, café, hospital name
//     address.building,         // Building name if available
//     address.road,             // Street name
//     address.suburb,           // Whitefield
//     address.city_district,    // Area district
//     address.city || address.town || address.village,          // Bengaluru
//     address.state,            // Karnataka
//   ].filter((p) => p && p.trim())
//    .filter((value, index, self) => self.indexOf(value) === index);

//   console.log("Parsed parts:", parts);

//   return parts.length ? parts.join(", ") : "Exact address unavailable";
// }




export async function reverseGeocodeToLabel(latitude, longitude) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not resolve location");

  const data = await response.json();

  console.log("Reverse geocode data:", data);

  const administrative = data.localityInfo?.administrative || [];

  // Sort by adminLevel descending — highest number = most specific
  const sorted = [...administrative].sort((a, b) => (b.adminLevel || 0) - (a.adminLevel || 0));

  // Pick the 2 most specific admin names (e.g. "Bengaluru South taluk", "Bengaluru")
  const topTwo = sorted.slice(0, 2).map(item => item.name);

  const parts = [
    ...topTwo,                        // Most specific area names
    data.principalSubdivision,        // Karnataka
  ].filter((p) => p && p.trim())
   .filter((value, index, self) => self.indexOf(value) === index);

  console.log("Parsed parts:", parts);

  return parts.length ? parts.join(", ") : "Exact address unavailable";
}