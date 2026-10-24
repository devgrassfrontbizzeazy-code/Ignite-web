/**
 * Location Data & Google Maps Address Services for Field Sales Lead Creation.
 */

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const STATE_CITIES = {
  Haryana: [
    "Gurugram",
    "Faridabad",
    "Panchkula",
    "Panipat",
    "Ambala",
    "Karnal",
    "Rohtak",
    "Hisar",
    "Sonipat",
    "Yamunanagar",
    "Bahadurgarh",
    "Rewari",
    "Palwal",
    "Bhiwani",
    "Sirsa",
  ],
  "Uttar Pradesh": [
    "Noida",
    "Greater Noida",
    "Ghaziabad",
    "Lucknow",
    "Kanpur",
    "Agra",
    "Varanasi",
    "Meerut",
    "Prayagraj",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Mathura",
  ],
  Delhi: [
    "New Delhi",
    "South Delhi",
    "West Delhi",
    "North Delhi",
    "East Delhi",
    "Central Delhi",
    "Dwarka",
    "Rohini",
  ],
  Punjab: [
    "Mohali (SAS Nagar)",
    "Chandigarh",
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Hoshiarpur",
    "Mohali",
  ],
  Chandigarh: ["Chandigarh"],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Navi Mumbai",
    "Solapur",
    "Kolhapur",
  ],
  Karnataka: [
    "Bengaluru",
    "Mysuru",
    "Hubballi-Dharwad",
    "Mangaluru",
    "Belagavi",
    "Davangere",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhiwadi",
    "Alwar",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Secunderabad",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Asansol",
    "Siliguri",
  ],
  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
  ],
};

const generateSectors = (start, end, prefix = "Sector ") => {
  const list = [];
  for (let i = start; i <= end; i++) {
    list.push(`${prefix}${i}`);
  }
  return list;
};

export const CITY_SECTORS = {
  gurugram: [
    ...generateSectors(1, 115),
    "DLF Cyber City",
    "DLF Phase 1",
    "DLF Phase 2",
    "DLF Phase 3",
    "DLF Phase 4",
    "DLF Phase 5",
    "Udyog Vihar Phase 1",
    "Udyog Vihar Phase 2",
    "Udyog Vihar Phase 3",
    "Udyog Vihar Phase 4",
    "Udyog Vihar Phase 5",
    "Sushant Lok 1",
    "Sushant Lok 2",
    "Sushant Lok 3",
    "South City 1",
    "South City 2",
    "Sohna Road",
    "Golf Course Road",
    "Golf Course Extension",
    "MG Road",
    "Palam Vihar",
    "Manesar IMT",
  ],
  gurgaon: [
    ...generateSectors(1, 115),
    "DLF Cyber City",
    "DLF Phase 1",
    "DLF Phase 2",
    "DLF Phase 3",
    "DLF Phase 4",
    "DLF Phase 5",
    "Udyog Vihar Phase 1",
    "Udyog Vihar Phase 2",
    "Udyog Vihar Phase 3",
    "Udyog Vihar Phase 4",
    "Udyog Vihar Phase 5",
    "Sushant Lok 1",
    "Sushant Lok 2",
    "Sushant Lok 3",
    "South City 1",
    "South City 2",
    "Sohna Road",
    "Golf Course Road",
    "Golf Course Extension",
    "MG Road",
    "Palam Vihar",
    "Manesar IMT",
  ],
  noida: [
    ...generateSectors(1, 168),
    "Sector 18 Market",
    "Sector 62 IT Park",
    "Noida Expressway",
    "Film City",
  ],
  "greater noida": [
    "Sector 1",
    "Sector 2",
    "Sector 3",
    "Sector 4",
    "Sector 10",
    "Sector 12",
    "Sector 16",
    "Alpha 1",
    "Alpha 2",
    "Beta 1",
    "Beta 2",
    "Gamma 1",
    "Gamma 2",
    "Delta 1",
    "Delta 2",
    "Delta 3",
    "Omega 1",
    "Omega 2",
    "Knowledge Park 1",
    "Knowledge Park 2",
    "Knowledge Park 3",
    "Knowledge Park 4",
    "Knowledge Park 5",
    "Techzone 1",
    "Techzone 2",
    "Techzone 4",
    "Pari Chowk",
    "Ecotech",
  ],
  chandigarh: [
    ...generateSectors(1, 63),
    "IT Park",
    "Industrial Area Phase 1",
    "Industrial Area Phase 2",
  ],
  panchkula: [
    ...generateSectors(1, 32),
    "MDC Sector 4",
    "MDC Sector 5",
    "MDC Sector 6",
    "Industrial Area Phase 1",
    "Industrial Area Phase 2",
  ],
  mohali: [
    ...generateSectors(48, 127),
    "Phase 1",
    "Phase 2",
    "Phase 3A",
    "Phase 3B1",
    "Phase 3B2",
    "Phase 4",
    "Phase 5",
    "Phase 6",
    "Phase 7",
    "Phase 8",
    "Phase 8B",
    "Phase 9",
    "Phase 10",
    "Phase 11",
    "Industrial Area Phase 7",
    "Industrial Area Phase 8",
    "Aerocity",
    "IT City",
  ],
  "mohali (sas nagar)": [
    ...generateSectors(48, 127),
    "Phase 1",
    "Phase 2",
    "Phase 3A",
    "Phase 3B1",
    "Phase 3B2",
    "Phase 4",
    "Phase 5",
    "Phase 6",
    "Phase 7",
    "Phase 8",
    "Phase 8B",
    "Phase 9",
    "Phase 10",
    "Phase 11",
    "Aerocity",
    "IT City",
  ],
  faridabad: [
    ...generateSectors(1, 89),
    "NIT 1",
    "NIT 2",
    "NIT 3",
    "NIT 4",
    "NIT 5",
    "Greenfield Colony",
    "Neharpar",
    "Ballabgarh",
  ],
  dwarka: generateSectors(1, 29),
  rohini: generateSectors(1, 38),
};

export const getSectorsForCity = (cityName) => {
  if (!cityName) return [];
  const normalized = cityName.trim().toLowerCase();

  for (const [key, sectors] of Object.entries(CITY_SECTORS)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      return sectors;
    }
  }

  return [];
};

export const parseGoogleAddressComponents = (components = []) => {
  let houseNumber = "";
  let street = "";
  let sector = "";
  let city = "";
  let state = "";
  let country = "India";
  let pincode = "";
  let landmark = "";

  for (const c of components) {
    const types = c.types || [];
    const name = c.longText || c.long_name || "";

    if (
      types.includes("premise") ||
      types.includes("subpremise") ||
      types.includes("street_number")
    ) {
      houseNumber = houseNumber ? `${houseNumber}, ${name}` : name;
    } else if (types.includes("route")) {
      street = street ? `${street}, ${name}` : name;
    } else if (types.includes("landmark") || types.includes("point_of_interest")) {
      landmark = name;
    } else if (types.includes("sublocality_level_1")) {
      if (/sector/i.test(name)) {
        sector = name;
      } else if (!sector) {
        sector = name;
      } else {
        street = street ? `${street}, ${name}` : name;
      }
    } else if (
      types.includes("sublocality_level_2") ||
      types.includes("neighborhood")
    ) {
      if (/sector/i.test(name) && !sector) {
        sector = name;
      } else {
        street = street ? `${street}, ${name}` : name;
      }
    } else if (types.includes("sublocality_level_3")) {
      street = street ? `${street}, ${name}` : name;
    } else if (types.includes("locality")) {
      city = name;
    } else if (
      !city &&
      (types.includes("administrative_area_level_3") ||
        types.includes("administrative_area_level_2"))
    ) {
      city = name;
    } else if (types.includes("administrative_area_level_1")) {
      state = name;
    } else if (types.includes("country")) {
      country = name;
    } else if (types.includes("postal_code")) {
      pincode = name;
    }
  }

  if (landmark && !street.includes(landmark)) {
    street = street ? `${street} (near ${landmark})` : `near ${landmark}`;
  }

  return {
    houseNumber,
    street,
    sector,
    city,
    state,
    country,
    pincode,
  };
};

export const searchGooglePlaces = async (input, apiKey, countryCode = "in") => {
  if (!input || !input.trim() || !apiKey) return [];

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input: input.trim(),
          includedRegionCodes: countryCode ? [countryCode] : ["in"],
        }),
      }
    );

    const data = await response.json();
    if (!data?.suggestions) return [];

    return data.suggestions.map((item) => {
      const pred = item.placePrediction;
      return {
        placeId: pred?.placeId || pred?.place?.replace("places/", ""),
        primaryText: pred?.structuredFormat?.mainText?.text || pred?.text?.text,
        secondaryText: pred?.structuredFormat?.secondaryText?.text || "",
        fullText: pred?.text?.text || "",
      };
    });
  } catch (err) {
    console.error("Google Places search error:", err);
    return [];
  }
};

export const reverseGeocodeGoogle = async (lat, lng, apiKey) => {
  if (lat == null || lng == null || !apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();

    if (data?.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const first = data.results[0];
      const parsed = parseGoogleAddressComponents(first.address_components || []);

      // If pincode is missing from first result, search across all results
      if (!parsed.pincode) {
        for (const res of data.results) {
          const pinComp = (res.address_components || []).find((c) =>
            (c.types || []).includes("postal_code")
          );
          if (pinComp) {
            parsed.pincode = pinComp.long_name || pinComp.short_name || "";
            break;
          }
          const pinMatch = (res.formatted_address || "").match(/\b([1-9][0-9]{5})\b/);
          if (pinMatch) {
            parsed.pincode = pinMatch[1];
            break;
          }
        }
      }

      if (!parsed.city) {
        for (const res of data.results) {
          const cityComp = (res.address_components || []).find(
            (c) =>
              (c.types || []).includes("locality") ||
              (c.types || []).includes("administrative_area_level_2")
          );
          if (cityComp) {
            parsed.city = cityComp.long_name || cityComp.short_name || "";
            break;
          }
        }
      }

      if (!parsed.state) {
        for (const res of data.results) {
          const stateComp = (res.address_components || []).find((c) =>
            (c.types || []).includes("administrative_area_level_1")
          );
          if (stateComp) {
            parsed.state = stateComp.long_name || stateComp.short_name || "";
            break;
          }
        }
      }

      if (!parsed.sector) {
        for (const res of data.results) {
          const sectorComp = (res.address_components || []).find(
            (c) =>
              (c.types || []).includes("sublocality_level_1") ||
              (c.types || []).includes("sublocality_level_2") ||
              (c.types || []).includes("neighborhood")
          );
          if (sectorComp) {
            parsed.sector = sectorComp.long_name || sectorComp.short_name || "";
            break;
          }
        }
      }

      return {
        ...parsed,
        formattedAddress: first.formatted_address || "",
        latitude: lat,
        longitude: lng,
      };
    }
  } catch (err) {
    console.error("Google Reverse Geocoding error:", err);
  }

  return null;
};

export const getGooglePlaceDetails = async (placeId, apiKey) => {
  if (!placeId || !apiKey) return null;

  try {
    const rawId = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
    const response = await fetch(
      `https://places.googleapis.com/v1/${rawId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,addressComponents,location",
        },
      }
    );

    const data = await response.json();
    if (!data) return null;

    const parsed = parseGoogleAddressComponents(data.addressComponents || []);
    const lat = data.location?.latitude ?? null;
    const lng = data.location?.longitude ?? null;

    // 1. If pincode is missing from address components, inspect formattedAddress string
    if (!parsed.pincode && data.formattedAddress) {
      const pinMatch = data.formattedAddress.match(/\b([1-9][0-9]{5})\b/);
      if (pinMatch) {
        parsed.pincode = pinMatch[1];
      }
    }

    // 2. If pincode is still missing and coordinates exist, use reverse geocode fallback
    if (!parsed.pincode && lat != null && lng != null) {
      try {
        const rev = await reverseGeocodeGoogle(lat, lng, apiKey);
        if (rev?.pincode) {
          parsed.pincode = rev.pincode;
        }
        if (!parsed.sector && rev?.sector) {
          parsed.sector = rev.sector;
        }
        if (!parsed.city && rev?.city) {
          parsed.city = rev.city;
        }
        if (!parsed.state && rev?.state) {
          parsed.state = rev.state;
        }
        if (!parsed.country && rev?.country) {
          parsed.country = rev.country;
        }
      } catch (revErr) {
        console.warn("Reverse geocode fallback failed for place details:", revErr);
      }
    }

    return {
      ...parsed,
      formattedAddress: data.formattedAddress || "",
      latitude: lat,
      longitude: lng,
    };
  } catch (err) {
    console.error("Google Place Details error:", err);
    return null;
  }
};

export const forwardGeocodeGoogle = async (addressString, apiKey) => {
  if (!addressString || !addressString.trim() || !apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addressString.trim()
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data?.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
      const loc = data.results[0].geometry?.location;
      const lat = loc?.lat ?? null;
      const lng = loc?.lng ?? null;

      const parsed = parseGoogleAddressComponents(
        data.results[0].address_components || []
      );

      let pincode = parsed.pincode;
      if (!pincode) {
        for (const res of data.results) {
          const pinComp = (res.address_components || []).find((c) =>
            (c.types || []).includes("postal_code")
          );
          if (pinComp) {
            pincode = pinComp.long_name || pinComp.short_name || "";
            break;
          }
          const pinMatch = (res.formatted_address || "").match(/\b([1-9][0-9]{5})\b/);
          if (pinMatch) {
            pincode = pinMatch[1];
            break;
          }
        }
      }

      if (!pincode && lat != null && lng != null) {
        try {
          const rev = await reverseGeocodeGoogle(lat, lng, apiKey);
          if (rev?.pincode) {
            pincode = rev.pincode;
          }
          if (!parsed.city && rev?.city) parsed.city = rev.city;
          if (!parsed.state && rev?.state) parsed.state = rev.state;
          if (!parsed.sector && rev?.sector) parsed.sector = rev.sector;
        } catch {
          // ignore
        }
      }

      return {
        ...parsed,
        pincode: pincode || parsed.pincode,
        latitude: lat,
        longitude: lng,
        formattedAddress: data.results[0].formatted_address || "",
      };
    }
  } catch (err) {
    console.error("Google Forward Geocoding error:", err);
  }

  return null;
};
