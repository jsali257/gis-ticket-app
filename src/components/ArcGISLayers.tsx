"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Import esri-leaflet dynamically to avoid SSR issues
let EsriLeaflet: any;

interface ArcGISLayersProps {
  url: string;
  layers: number[];
  opacity?: number;
}

/**
 * Component to add ArcGIS MapServer layers to a Leaflet map
 */
const ArcGISLayers = ({ url, layers, opacity = 0.7 }: ArcGISLayersProps) => {
  const map = useMap();

  useEffect(() => {
    // Dynamically import esri-leaflet on the client side
    const loadEsriLeaflet = async () => {
      if (!EsriLeaflet) {
        EsriLeaflet = await import('esri-leaflet');
      }

      // Create layers for each specified layer ID
      const mapLayers: L.Layer[] = [];

      // Add each layer to the map
      layers.forEach(layerId => {
        try {
          const layer = EsriLeaflet.dynamicMapLayer({
            url,
            layers: [layerId],
            opacity
          });
          
          layer.addTo(map);
          mapLayers.push(layer);
        } catch (error) {
          console.error(`Error adding layer ${layerId}:`, error);
        }
      });

      // Clean up function to remove layers when component unmounts
      return () => {
        mapLayers.forEach(layer => {
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        });
      };
    };

    loadEsriLeaflet();
  }, [map, url, layers, opacity]);

  // This component doesn't render anything visible
  return null;
};

export default ArcGISLayers;
