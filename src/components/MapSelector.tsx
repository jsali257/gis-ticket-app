"use client";

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { searchAddress, GeocodeResult } from '@/lib/geocoder';
import * as EsriLeaflet from 'esri-leaflet';
import ArcGISLayers from './ArcGISLayers';

// Use a div element as a custom marker to avoid the need for external image files
const createCustomMarkerIcon = () => {
  return L.divIcon({
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      background: #2563eb;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -12px 0 0 -12px;
    ">
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        position: absolute;
        left: 8px;
        top: 8px;
      "></div>
    </div>`,
    className: "",
    iconSize: [24, 40],
    iconAnchor: [12, 40]
  });
};

type MapSelectorProps = {
  initialPosition?: [number, number];
  onPositionChange: ((lat: number, lng: number) => void) | ((position: [number, number]) => void);
  readOnly?: boolean; // If true, the map is read-only (for display only)
};

// Component to center map on a specific location
function SetViewOnClick({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

function LocationMarker({ onPositionChange, readOnly = false, initialPosition }: { onPositionChange: ((lat: number, lng: number) => void) | ((position: [number, number]) => void), readOnly?: boolean, initialPosition?: [number, number] }) {
  const [position, setPosition] = useState<L.LatLng | null>(initialPosition ? L.latLng(initialPosition[0], initialPosition[1]) : null);
  
  const map = useMapEvents({
    click(e) {
      if (!readOnly) {
        setPosition(e.latlng);
        // Handle both function signatures
        try {
          // Try the (lat, lng) signature first
          (onPositionChange as (lat: number, lng: number) => void)(e.latlng.lat, e.latlng.lng);
        } catch (error) {
          // Fall back to the position array signature
          (onPositionChange as (position: [number, number]) => void)([e.latlng.lat, e.latlng.lng]);
        }
      }
    },
  });

  useEffect(() => {
    // Update position if initialPosition changes
    if (initialPosition) {
      setPosition(L.latLng(initialPosition[0], initialPosition[1]));
    }
  }, [initialPosition]);

  return position === null ? null : (
    <Marker position={position} icon={createCustomMarkerIcon()} />
  );
}

const MapSelector = ({ initialPosition = [26.2034, -98.2300], onPositionChange, readOnly = false }: MapSelectorProps) => {
  // Default to Hidalgo County, TX area if no initial position is provided
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialPosition);
  const [mapKey, setMapKey] = useState(Date.now()); // Used to force re-render the map
  
  // Handle address search
  const handleSearch = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching for address:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle selecting a search result
  const handleSelectResult = (result: GeocodeResult) => {
    const newPosition: [number, number] = [result.location.y, result.location.x];
    setMapCenter(newPosition);
    
    // Handle both function signatures
    try {
      // Try the (lat, lng) signature first
      (onPositionChange as (lat: number, lng: number) => void)(newPosition[0], newPosition[1]);
    } catch (error) {
      // Fall back to the position array signature
      (onPositionChange as (position: [number, number]) => void)(newPosition);
    }
    
    setSearchResults([]);
    setSearchQuery('');
    setMapKey(Date.now()); // Force map re-render to center on new position with higher zoom
  };
  
  useEffect(() => {
    // Update map center when initialPosition changes
    if (initialPosition) {
      setMapCenter(initialPosition);
    }
  }, [initialPosition]);
  
  return (
    <div className="w-full rounded-md overflow-hidden border border-gray-300">
      {!readOnly && (
        <div className="p-2 bg-white border-b border-gray-300">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for an address..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
            />
            <button
              type="button"
              disabled={isSearching}
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <ul>
                {searchResults.map((result, index) => (
                  <li 
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="font-medium">{result.address}</div>
                    <div className="text-xs text-gray-500">Score: {result.score}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="h-96">
        <MapContainer 
          key={mapKey}
          center={mapCenter} 
          zoom={readOnly ? 18 : 16} 
          style={{ height: '100%', width: '100%' }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite Imagery">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a> | Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.Overlay checked name="Address Points">
              <ArcGISLayers 
                url="https://gis.rgv911.org/server/rest/services/RGV911_OPS_MIL1/MapServer" 
                layers={[0]} 
                opacity={0.8}
              />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Road Centerlines">
              <ArcGISLayers 
                url="https://gis.rgv911.org/server/rest/services/RGV911_OPS_MIL1/MapServer" 
                layers={[1]} 
                opacity={0.8}
              />
            </LayersControl.Overlay>
          </LayersControl>
          
          <LocationMarker 
            onPositionChange={onPositionChange} 
            readOnly={readOnly}
            initialPosition={mapCenter}
          />
          <SetViewOnClick coords={mapCenter} />
        </MapContainer>
      </div>
      
      {!readOnly && (
        <div className="p-2 text-sm text-gray-500">
          Click on the map to set the property location or search for an address above
        </div>
      )}
    </div>
  );
};

export default MapSelector;
