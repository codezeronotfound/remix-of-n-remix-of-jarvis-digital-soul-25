import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Trash2, Plus, Satellite, Activity, Globe2, RefreshCw, Crosshair } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Fix default marker icons for Leaflet in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Quake { id: string; mag: number; place: string; time: number; lat: number; lon: number; depth: number; }
interface IssPos { lat: number; lon: number; alt: number; vel: number; ts: number; }
interface SavedPin { id: string; name: string; lat: number; lon: number; }

const STORAGE_KEY = "jarvis_saved_pins_v1";

// ISS icon
const issIcon = L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 6px hsl(190 100% 55%));">🛰️</div>`,
  className: "iss-icon",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FlyTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, Math.max(map.getZoom(), 5), { duration: 1.2 }); }, [pos]);
  return null;
}

export default function SatelliteMapModule() {
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [iss, setIss] = useState<IssPos | null>(null);
  const [issTrail, setIssTrail] = useState<[number, number][]>([]);
  const [pins, setPins] = useState<SavedPin[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [showQuakes, setShowQuakes] = useState(true);
  const [showIss, setShowIss] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [search, setSearch] = useState("");
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch quakes (USGS - free, no key)
  const fetchQuakes = async () => {
    try {
      const r = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson");
      const data = await r.json();
      const list: Quake[] = (data.features || []).map((f: any) => ({
        id: f.id,
        mag: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        depth: f.geometry.coordinates[2],
      }));
      setQuakes(list);
    } catch (e) { console.error(e); }
  };

  // Fetch ISS position (wheretheiss.at - free, no key)
  const fetchIss = async () => {
    try {
      const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
      const d = await r.json();
      const pos: IssPos = { lat: d.latitude, lon: d.longitude, alt: d.altitude, vel: d.velocity, ts: Date.now() };
      setIss(pos);
      setIssTrail((t) => [...t.slice(-50), [pos.lat, pos.lon]]);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchQuakes(), fetchIss()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
    const issInt = setInterval(fetchIss, 5000);
    const qInt = setInterval(fetchQuakes, 60_000);
    return () => { clearInterval(issInt); clearInterval(qInt); };
  }, []);

  // Persist pins
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pins)); }, [pins]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`);
      const data = await r.json();
      if (!data.length) { toast({ title: "Not found", description: "Try another location.", variant: "destructive" }); return; }
      const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
      setFlyTo([lat, lon]);
      const newPin: SavedPin = { id: crypto.randomUUID(), name: data[0].display_name.split(",")[0], lat, lon };
      setPins((p) => [newPin, ...p].slice(0, 50));
      toast({ title: "Pin added", description: newPin.name });
    } catch { toast({ title: "Search failed", variant: "destructive" }); }
  };

  const removePin = (id: string) => setPins((p) => p.filter((x) => x.id !== id));

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyTo([pos.coords.latitude, pos.coords.longitude]),
      () => toast({ title: "Location denied", variant: "destructive" })
    );
  };

  const quakeColor = (m: number) => m >= 6 ? "#ef4444" : m >= 5 ? "#f97316" : m >= 4 ? "#eab308" : "#22c55e";

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-primary/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Satellite className="w-3 h-3" />ISS LIVE</div>
          <div className="text-lg font-mono mt-1">
            {iss ? `${iss.lat.toFixed(2)}°, ${iss.lon.toFixed(2)}°` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">{iss ? `${iss.alt.toFixed(0)} km · ${iss.vel.toFixed(0)} km/h` : ""}</div>
        </Card>
        <Card className="p-3 border-destructive/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" />SIGNIFICANT QUAKES (7d)</div>
          <div className="text-2xl font-bold mt-1">{quakes.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />SAVED PINS</div>
          <div className="text-2xl font-bold mt-1">{pins.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe2 className="w-3 h-3" />LAST SYNC</div>
          <div className="text-sm font-mono mt-1">{lastUpdate ? lastUpdate.toLocaleTimeString("en-IN") : "—"}</div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 flex gap-2 min-w-[200px]">
          <Input
            placeholder="Search any location… e.g. Bengaluru"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-9"
          />
          <Button size="sm" onClick={handleSearch}><Plus className="w-4 h-4" /></Button>
        </div>
        <Button size="sm" variant="outline" onClick={goToMyLocation}><Crosshair className="w-4 h-4 mr-1" />Me</Button>
        <Button size="sm" variant="outline" onClick={refreshAll} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
        <div className="flex items-center gap-2 text-xs">
          <Switch id="q" checked={showQuakes} onCheckedChange={setShowQuakes} /><Label htmlFor="q">Quakes</Label>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Switch id="i" checked={showIss} onCheckedChange={setShowIss} /><Label htmlFor="i">ISS</Label>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Switch id="p" checked={showPins} onCheckedChange={setShowPins} /><Label htmlFor="p">Pins</Label>
        </div>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden border-primary/30 p-0">
        <div className="h-[500px] w-full">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%", background: "hsl(220 30% 8%)" }}
            scrollWheelZoom
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Dark">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OSM &copy; CARTO'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Street">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OSM" />
              </LayersControl.BaseLayer>
              <LayersControl.Overlay name="Weather (clouds)">
                <TileLayer
                  url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02"
                  opacity={0.6}
                />
              </LayersControl.Overlay>
            </LayersControl>

            {showIss && iss && (
              <Marker position={[iss.lat, iss.lon]} icon={issIcon}>
                <Popup>
                  <strong>ISS · Live</strong><br />
                  Lat {iss.lat.toFixed(3)}, Lon {iss.lon.toFixed(3)}<br />
                  Alt {iss.alt.toFixed(0)} km · {iss.vel.toFixed(0)} km/h
                </Popup>
              </Marker>
            )}

            {showQuakes && quakes.map((q) => (
              <CircleMarker
                key={q.id}
                center={[q.lat, q.lon]}
                radius={Math.max(4, q.mag * 2)}
                pathOptions={{ color: quakeColor(q.mag), fillColor: quakeColor(q.mag), fillOpacity: 0.5 }}
              >
                <Popup>
                  <strong>M {q.mag} · {q.place}</strong><br />
                  Depth {q.depth.toFixed(0)} km<br />
                  {new Date(q.time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </Popup>
              </CircleMarker>
            ))}

            {showPins && pins.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lon]}>
                <Popup>
                  <strong>{p.name}</strong><br />
                  {p.lat.toFixed(3)}, {p.lon.toFixed(3)}<br />
                  <button onClick={() => removePin(p.id)} style={{ color: "#ef4444" }}>Remove</button>
                </Popup>
              </Marker>
            ))}

            <FlyTo pos={flyTo} />
          </MapContainer>
        </div>
      </Card>

      {/* Recent quakes list */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
            <span>RECENT SIGNIFICANT QUAKES</span>
            <Badge variant="outline">Auto-refresh 60s</Badge>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {quakes.slice(0, 12).map((q) => (
              <button
                key={q.id}
                onClick={() => setFlyTo([q.lat, q.lon])}
                className="w-full text-left p-2 rounded hover:bg-accent/30 transition border border-border/30"
              >
                <div className="flex items-center gap-2">
                  <Badge style={{ background: quakeColor(q.mag), color: "white" }}>M {q.mag}</Badge>
                  <span className="text-sm truncate flex-1">{q.place}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(q.time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </div>
              </button>
            ))}
            {!quakes.length && <div className="text-xs text-muted-foreground">No data yet…</div>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-3">SAVED LOCATIONS</div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pins.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded border border-border/30">
                <button onClick={() => setFlyTo([p.lat, p.lon])} className="flex-1 text-left">
                  <div className="text-sm">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.lat.toFixed(2)}, {p.lon.toFixed(2)}</div>
                </button>
                <Button size="icon" variant="ghost" onClick={() => removePin(p.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {!pins.length && <div className="text-xs text-muted-foreground">Search a location to pin it.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
