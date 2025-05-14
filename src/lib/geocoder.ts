/**
 * Service for geocoding addresses using the RGV911 geocoder
 */

// Base URL for the geocoder service
const GEOCODER_URL = 'https://gis.rgv911.org/server/rest/services/Geocoder/GeocodeServer';

// Interface for geocoding results
export interface GeocodeResult {
  address: string;
  location: {
    x: number; // longitude
    y: number; // latitude
  };
  score: number;
}

/**
 * Search for an address using the RGV911 geocoder
 * @param address The address to search for
 * @returns Array of geocode results
 */
export async function searchAddress(address: string): Promise<GeocodeResult[]> {
  try {
    // Format the URL for the findAddressCandidates operation
    const url = `${GEOCODER_URL}/findAddressCandidates?f=json&outSR=4326&SingleLine=${encodeURIComponent(address)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the candidates into our GeocodeResult interface
    if (data.candidates && Array.isArray(data.candidates)) {
      return data.candidates.map((candidate: any) => ({
        address: candidate.address,
        location: {
          x: candidate.location.x,
          y: candidate.location.y
        },
        score: candidate.score
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching for address:', error);
    return [];
  }
}
