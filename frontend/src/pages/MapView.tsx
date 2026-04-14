import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.heat';
import api from '../api';
import { auth } from '../firebase';
import WeatherCard from '../components/WeatherCard';
import CleanlinessScoreCard from '../components/CleanlinessScoreCard';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for different status
const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = createIcon('red'); // User Location
const greenIcon = createIcon('green'); // Resolved
const orangeIcon = createIcon('orange'); // Reported
const violetIcon = createIcon('violet'); // Emergency
const blueIcon = createIcon('blue'); // Dustbins
const blackIcon = createIcon('black'); // Dumping Yard
const goldIcon = createIcon('gold'); // Hazardous Waste

const defaultCenter: [number, number] = [16.5449, 81.5212]; // Default to Bhimavaram based on screenshot

// Helper to update map center when geolocation is found (only once)
const RecenterAutomatically = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
      if (lat !== defaultCenter[0] || lng !== defaultCenter[1]) {
        map.setView([lat, lng], 14);
      }
    }, [lat, lng, map]);
    return null;
}

const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        // @ts-ignore - leaflet.heat adds this to L
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);
        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);
    return null;
};

const RoutingLayer = ({ start, end }: { start: [number, number], end: [number, number] }) => {
    const [route, setRoute] = useState<any>(null);

    useEffect(() => {
        if (!start || !end) return;
        
        const fetchRoute = async () => {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson&overview=full`
                );
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    setRoute(data.routes[0].geometry);
                }
            } catch (err) {
                console.error("Routing Error:", err);
            }
        };

        fetchRoute();
    }, [start, end]);

    if (!route) return null;

    return (
        <Polyline 
            positions={route.coordinates.map((coord: any) => [coord[1], coord[0]])} 
            color="#4285F4" // Google Maps Blue
            weight={6}
            opacity={0.8}
            lineJoin="round"
        />
    );
};

const MapView = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [dustbins, setDustbins] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>(defaultCenter);
  const [showDustbins, setShowDustbins] = useState(false);
  const [selectedBin, setSelectedBin] = useState<any>(null);
  const [dumpingYard, setDumpingYard] = useState<any>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const from = L.latLng(lat1, lon1);
    const to = L.latLng(lat2, lon2);
    const dist = from.distanceTo(to);
    return dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${Math.round(dist)} m`;
  };

  useEffect(() => {
    // 1. Watch User Location Live
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Only update if moved slightly to save performance
          setCenter([latitude, longitude]);
        },
        () => console.warn('Geolocation permission denied'),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    // 2. Fetch Reports
    const fetchReports = async () => {
      try {
         const res = await api.get('/reports');
         
         // Generate stable deterministic "random" coordinates based on ID
         // This prevents markers from jumping when the map re-renders
         const stableReports = res.data.map((r: any) => {
            // Use actual coordinates if they were saved, otherwise use offset simulation
            if (r.lat && r.lng) {
                return r;
            }

            const idNum = parseInt(r.id.replace(/\D/g, '')) || 1;
            // Use ID to create a deterministic offset
            const latOffset = ((idNum % 71) / 71 - 0.5) * 0.02;
            const lngOffset = ((idNum % 79) / 79 - 0.5) * 0.02;
            
            return {
              ...r,
              lat: center[0] + latOffset,
              lng: center[1] + lngOffset,
            };
         });
         setReports(stableReports);
      } catch (err) {
         console.error(err);
      }
    };

    const fetchDustbins = async () => {
        try {
           const res = await api.get('/dustbins');
           if (res.data && res.data.length > 0) {
              const stableBins = res.data.map((b: any) => ({
                 ...b,
                 lat: center[0] + (b.lat_offset || 0),
                 lng: center[1] + (b.lng_offset || 0),
              }));
              setDustbins(stableBins);
           } else {
              // Fallback Mock Dustbins (closer offsets: ~100-300m)
              const mockBins = [
                { id: 'b1', name: 'Neighborhood Bin', location: 'Corner St', lat: center[0] + 0.0015, lng: center[1] + 0.0012 },
                { id: 'b2', name: 'Community Recycle', location: 'Lane 4', lat: center[0] - 0.0011, lng: center[1] + 0.0021 },
                { id: 'b3', name: 'Smart Bin', location: 'Near Park', lat: center[0] + 0.0008, lng: center[1] - 0.0018 },
              ];
              setDustbins(mockBins);
           }
        } catch (err) {
           const mockBins = [
            { id: 'b1', name: 'Neighborhood Bin', location: 'Corner St', lat: center[0] + 0.0015, lng: center[1] + 0.0012 },
            { id: 'b2', name: 'Community Recycle', location: 'Lane 4', lat: center[0] - 0.0011, lng: center[1] + 0.0021 },
            { id: 'b3', name: 'Smart Bin', location: 'Near Park', lat: center[0] + 0.0008, lng: center[1] - 0.0018 },
           ];
           setDustbins(mockBins);
        }

        // Set the Dumping Yard (Fixed location in the town outskirts)
        setDumpingYard({
            name: "Central Dumping & Processing Yard",
            location: "Outskirts Industrial Zone",
            lat: center[0] + 0.012,
            lng: center[1] + 0.015
        });
    };

    fetchReports();
    fetchDustbins();
  }, [center]);

  const [showHeatMap, setShowHeatMap] = useState(false);

  const handlePickupRequest = async (reportId: string) => {
    try {
      await api.post('/pickup', { reportId, userId: auth.currentUser?.uid });
      alert('Pickup request sent successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Live CleanMap</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowDustbins(!showDustbins)} 
            className={showDustbins ? 'btn-green' : 'btn-blue'}
            style={{ marginBottom: '1rem' }}
          >
            {showDustbins ? 'Hide Bins' : 'Show Nearest Bins'}
          </button>
          <button 
            onClick={() => setShowHeatMap(!showHeatMap)} 
            className={showHeatMap ? 'btn-saffron' : 'btn-blue'}
            style={{ marginBottom: '1rem' }}
          >
            {showHeatMap ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>
        </div>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '700px', zIndex: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
          <WeatherCard lat={center[0]} lon={center[1]} />
        </div>
        {showHeatMap && (
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
             <span className="badge emergency" style={{ padding: '0.5rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '2px solid white' }}>
               🔥 LIVE WASTE DENSITY HEATMAP
             </span>
          </div>
        )}
        
        {/* Cleanliness Score Overlay */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, width: '320px', transition: 'all 0.3s ease' }}>
          <CleanlinessScoreCard lat={center[0]} lng={center[1]} />
        </div>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} attributionControl={false}>
          <TileLayer
            attribution=''
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <RecenterAutomatically lat={center[0]} lng={center[1]} />

          {showHeatMap && (
            <HeatmapLayer points={reports.map(r => [r.lat, r.lng, 1])} />
          )}

          <Marker position={center} icon={redIcon}>
            <Popup>
               <div style={{ textAlign: 'center' }}>
                 <strong>You are here</strong><br/>
                 Current Location
               </div>
            </Popup>
          </Marker>

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
          >
            {reports.map((report) => (
              <Marker 
                key={report.id} 
                position={[report.lat, report.lng]}
                icon={
                  report.status === 'Resolved' ? greenIcon :
                  report.isEmergency ? violetIcon :
                  report.isHazardous ? goldIcon :
                  orangeIcon
                }
              >
                <Popup>
                  <div style={{ padding: '0.25rem', minWidth: '150px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-blue)', fontSize: '1rem' }}>
                      {report.isHazardous && <span title="Hazardous to Animals">⚠️ </span>}
                      {report.type.toUpperCase()}
                    </h3>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}><strong>Location:</strong> {report.location}</p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>{report.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className={`badge ${report.status === 'Resolved' ? 'resolved' : 'saffron'}`}>
                        {report.status}
                      </span>
                      {report.isEmergency && <span className="badge emergency">EMERGENCY</span>}
                      {report.isHazardous && (
                        <span className="badge" style={{ background: '#FFF7ED', color: '#9A3412', border: '1px solid #FFEDD5' }}>
                          ⚠️ HAZARDOUS
                        </span>
                      )}
                    </div>
                    {report.status !== 'Resolved' && (
                      <button 
                        onClick={() => handlePickupRequest(report.id)} 
                        className="btn-green" 
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                      >
                        Request Cleanup Pickup
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {showDustbins && dustbins.map((bin) => (
            <Marker 
              key={bin.id} 
              position={[bin.lat, bin.lng]} 
              icon={blueIcon}
              eventHandlers={{
                click: () => setSelectedBin(bin)
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center', padding: '0.25rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-saffron)' }}>🗑️ {bin.name}</h3>
                  <p style={{ margin: '0', fontSize: '0.85rem' }}><strong>Location:</strong> {bin.location}</p>
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#F3F4F6', borderRadius: '8px', fontWeight: 'bold' }}>
                     📏 {calculateDistance(center[0], center[1], bin.lat, bin.lng)} away
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {dumpingYard && (
            <Marker position={[dumpingYard.lat, dumpingYard.lng]} icon={blackIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>🏭 DUMPING YARD</h3>
                  <p style={{ fontSize: '0.85rem' }}>{dumpingYard.name}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#6B7280' }}>Final Waste Processing Center</p>
                </div>
              </Popup>
            </Marker>
          )}

          {selectedBin && (
            <RoutingLayer 
              start={center} 
              end={[selectedBin.lat, selectedBin.lng]} 
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
