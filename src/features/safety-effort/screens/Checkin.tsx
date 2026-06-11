// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppTheme } from "@/providers/theme-provider";

// ─── Fix default Leaflet icon paths ───────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Preset locations ─────────────────────────────────────────────────────────
const PRESET_LOCATIONS = [
  { id: "BPI-04", name: "บจก. ผลิตภัณฑ์และวัตถุก่อสร้าง (สำนักงานใหญ่)", tag: "BPI-04", type: "บริษัท", lat: 13.7574, lng: 100.5408 },
  { id: "OBK-C2", name: "CPAC Solution Center", tag: "OBK-C2", type: "โรงงาน", lat: 13.7572, lng: 100.5405 },
  { id: "MRT-PS", name: "CPAC", tag: "MRT-PS", type: "ก่อสร้าง", lat: 13.7570, lng: 100.5412 },
];

const DEFAULT_CENTER = { lat: 14.0, lng: 100.57 };

const LOCATION_FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "factory", label: "โรงงาน" },
  { key: "office", label: "สำนักงาน" },
  { key: "site", label: "Site งาน" },
];

function normalizeLocationType(type, id = "") {
  const raw = String(type ?? "");
  const normalized = raw.toLowerCase();

  if (
    raw === "โรงงาน" ||
    normalized.includes("factory") ||
    id === "OBK-C2"
  ) {
    return "factory";
  }

  if (
    raw === "สำนักงาน" ||
    raw === "บริษัท" ||
    normalized.includes("office") ||
    normalized.includes("company") ||
    id === "BPI-04"
  ) {
    return "office";
  }

  if (
    raw === "Site งาน" ||
    raw === "ก่อสร้าง" ||
    normalized.includes("site") ||
    normalized.includes("construction") ||
    id === "MRT-PS"
  ) {
    return "site";
  }

  return "other";
}

function getLocationTypeLabel(type, id = "") {
  const kind = normalizeLocationType(type, id);

  if (kind === "factory") return "โรงงาน";
  if (kind === "office") return "สำนักงาน";
  if (kind === "site") return "Site งาน";
  return String(type ?? "");
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  background:   "var(--background)",
  background2:  "var(--secondary)",
  foreground:   "#0e0f12",
  foreground2:  "#33312c",
  foreground3:  "#767269",
  card:         "#ffffff",
  surface2:     "var(--secondary)",
  primary:      "var(--brand-accent)",
  primaryFg:    "var(--brand-accent-contrast)",
  primarySoft:  "var(--brand-soft)",
  danger:       "#d5301a",
  ok:           "#1f7a55",
  border:       "rgba(14,15,18,0.08)",
  borderStrong: "#0e0f12",
  radius:       "16px",
};

const yellow     = T.primary;
const yellowBg   = T.primarySoft;
const yellowBdr  = "var(--brand-accent)";
const yellowDark = "var(--brand-text)";
const navy       = "#1C2B4A";
const navyDeep   = "#0F172A";


// ─── Leaflet custom icons ─────────────────────────────────────────────────────
const makePin = (fill, size = 28, selected = false) => {
  const glowHtml = selected
    ? `<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:18px;height:6px;background:rgba(var(--brand-accent-rgb),0.4);border-radius:50%;box-shadow:0 0 10px 4px rgba(var(--brand-accent-rgb),0.8);animation:pulse-marker 1.5s infinite;"></div>`
    : `<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:12px;height:4px;background:rgba(0,0,0,0.15);border-radius:50%;"></div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${size}px;height:${size * 1.3}px;display:flex;flex-direction:column;align-items:center;animation: ${selected ? "marker-bounce 1s infinite alternate" : "none"};">
        ${glowHtml}
        <div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${fill};border:2.5px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.2);transform:rotate(-45deg);flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;z-index:2;">
          <div style="width:7px;height:7px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div>
        </div>
        <div style="width:2.5px;height:${size * 0.25}px;background:${fill};border-radius:0 0 2px 2px;margin-top:-2px;position:relative;z-index:1;"></div>
      </div>
      <style>
        @keyframes marker-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
        @keyframes pulse-marker {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
          50% { transform: translateX(-50%) scale(1.6); opacity: 0.2; }
        }
      </style>
    `,
    iconSize:    [size, size * 1.4],
    iconAnchor:  [size / 2, size * 1.4],
    popupAnchor: [0, -size * 1.4],
  });
};

const meIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:34px;height:34px;border-radius:50%;background:rgba(var(--brand-accent-rgb),0.2);animation:ci-me-pulse 2.2s ease-in-out infinite;"></div>
      <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(var(--brand-accent-rgb),0.4);animation:ci-me-pulse2 2.2s ease-in-out infinite;"></div>
      <div style="width:16px;height:16px;border-radius:50%;background:${yellow};border:3px solid #fff;box-shadow:0 3px 10px rgba(var(--brand-accent-rgb),0.6);position:relative;z-index:1;"></div>
    </div>
    <style>
      @keyframes ci-me-pulse{0%,100%{transform:scale(1);opacity:0.7;}50%{transform:scale(1.8);opacity:0.15;}}
      @keyframes ci-me-pulse2{0%,100%{transform:scale(1);opacity:0.6;}50%{transform:scale(1.4);opacity:0.05;}}
    </style>`,
  iconSize:   [34, 34],
  iconAnchor: [17, 17],
});

// ─── Map helper components ────────────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 14, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

function Recenter({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], zoom ?? map.getZoom());
    }
  }, [position, map, zoom]);
  return null;
}

function FitAll({ points }) {
  const map  = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    map.fitBounds(points, { padding: [60, 60] });
    done.current = true;
  }, []);
  return null;
}

// ─── Map View (top-level to prevent re-creation on each render) ─────────────
function CheckinMapView({ height = "100%", mapMounted, mapInstanceKey, mapCenter, userPos, allLocations, selected, setSelected, fitPoints }) {
  return (
    <div className="ci-map-wrap" style={{ height, width: "100%" }}>
      {mapMounted ? (
        <MapContainer
          key={mapInstanceKey}
          center={mapCenter}
          zoom={10}
          style={{ width: "100%", height: "100%" }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={meIcon}>
              <Popup>ตำแหน่งของคุณ</Popup>
            </Marker>
          )}
          {allLocations
            .filter(l => l.lat && l.lng)
            .map(loc => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={makePin(selected?.id === loc.id ? yellow : navy, selected?.id === loc.id ? 32 : 26, selected?.id === loc.id)}
                eventHandlers={{ click: () => setSelected(loc) }}
              >
                <Popup>
                  <b style={{ fontFamily: "'Sarabun',sans-serif" }}>{loc.name}</b><br />
                  <span style={{ fontSize: 12, color: T.foreground3 }}>
                    {loc.tag}{loc.dist != null ? ` · ${loc.dist.toFixed(1)} กม.` : ""}
                  </span>
                </Popup>
              </Marker>
            ))}
          <FlyTo target={selected} />
          <Recenter position={userPos} zoom={13} />
          <FitAll points={fitPoints} />
        </MapContainer>
      ) : (
        <div style={{ width: "100%", height: "100%", background: T.surface2 }} />
      )}
      {userPos && (
        <div className="ci-coords-badge">
          📍 {userPos.lat.toFixed(4)}°N &nbsp;·&nbsp; {userPos.lng.toFixed(4)}°E
        </div>
      )}
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const IcoBack = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoPin = ({ s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoFactory = ({ s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20V9l6-4v4l6-4v4l6-4v15H2z"/>
    <rect x="6" y="14" width="3" height="6"/><rect x="11" y="14" width="3" height="6"/>
  </svg>
);
const IcoCrane = ({ s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="5"  y1="6" x2="12" y2="3"/>
    <line x1="12" y1="3" x2="19" y2="6"/>
    <line x1="12" y1="10" x2="19" y2="7"/>
    <line x1="19" y1="6"  x2="19" y2="14"/>
    <rect x="7" y="14" width="5" height="7"/>
  </svg>
);
const IcoCheck = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoPlus = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoArrow = ({ c = "#fff" }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoLocate = ({ spin }) => (
  <svg
    width={13} height={13}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={spin ? { animation: "ci-spin 0.8s linear infinite" } : undefined}
  >
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    <circle cx="12" cy="12" r="8"/>
  </svg>
);
const IcoSearch = ({ s = 15, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.65" y1="16.65" x2="21" y2="21" />
  </svg>
);
const IcoX = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── TypeIcon ─────────────────────────────────────────────────────────────────
function TypeIcon({ type, selected, size = 16 }) {
  const c = selected ? T.primaryFg : T.foreground3;
  return type === "ก่อสร้าง"
    ? <IcoCrane s={size} c={c} />
    : <IcoFactory s={size} c={c} />;
}

// ─── Location card ────────────────────────────────────────────────────────────
function LocCard({ loc, isSelected, onClick }) {
  let typeClass = "type-others";
  if (loc.type === "โรงงาน") typeClass = "type-factory";
  else if (loc.type === "ก่อสร้าง") typeClass = "type-construction";
  else if (loc.type === "คลังสินค้า") typeClass = "type-warehouse";
  else if (loc.type === "สำนักงาน" || loc.type === "บริษัท") typeClass = "type-office";

  return (
    <div
      className={`ci-loc-card ${typeClass}${isSelected ? " sel" : ""}`}
      onClick={onClick}
    >
      <div className="ci-loc-icon">
        <TypeIcon type={loc.type} selected={isSelected} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ci-loc-name">{loc.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span className={`ci-tag ${isSelected ? "ci-tag-sel" : "ci-tag-def"}`}>{loc.tag}</span>
          <span className={`ci-type-badge ${typeClass}`}>{loc.type}</span>
        </div>
      </div>
      {loc.dist != null && (
        <div className="ci-dist">
          <svg style={{ marginRight: 3 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
          {loc.dist.toFixed(1)} km
        </div>
      )}
      <div className="ci-check-wrapper">
        {isSelected ? (
          <div className="ci-check-circle"><IcoCheck /></div>
        ) : (
          <div className="ci-check-circle-placeholder" />
        )}
      </div>
    </div>
  );
}

function FilteredTypeIcon({ type, id, selected, size = 16 }) {
  const c = selected ? T.primaryFg : T.foreground3;
  return normalizeLocationType(type, id) === "site"
    ? <IcoCrane s={size} c={c} />
    : <IcoFactory s={size} c={c} />;
}

function FilteredLocCard({ loc, isSelected, onClick }) {
  const typeKind = normalizeLocationType(loc.type, loc.id);
  const typeClass = `type-${typeKind}`;
  const typeLabel = getLocationTypeLabel(loc.type, loc.id);

  return (
    <div
      className={`ci-loc-card ${typeClass}${isSelected ? " sel" : ""}`}
      onClick={onClick}
    >
      <div className="ci-loc-icon">
        <FilteredTypeIcon type={loc.type} id={loc.id} selected={isSelected} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ci-loc-name">{loc.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span className={`ci-tag ${isSelected ? "ci-tag-sel" : "ci-tag-def"}`}>{loc.tag}</span>
          <span className={`ci-type-badge ${typeClass}`}>{typeLabel}</span>
        </div>
      </div>
      {loc.dist != null && (
        <div className="ci-dist">
          <svg style={{ marginRight: 3 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
          {loc.dist.toFixed(1)} km
        </div>
      )}
      <div className="ci-check-wrapper">
        {isSelected ? (
          <div className="ci-check-circle"><IcoCheck /></div>
        ) : (
          <div className="ci-check-circle-placeholder" />
        )}
      </div>
    </div>
  );
}

// ─── Map click picker (used inside AddModal) ──────────────────────────────────
function MapPicker({ position, onPick }) {
  const pinIcon = makePin(yellow, 28, false);
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return position
    ? <Marker position={[position.lat, position.lng]} icon={pinIcon} />
    : null;
}

// ─── Add-location modal ───────────────────────────────────────────────────────
function AddModal({ onAdd, onClose, userPos }) {
  const seed = userPos ?? DEFAULT_CENTER;
  const sanitizeModalType = value => {
    const label = getLocationTypeLabel(value);
    return label === "สำนักงาน" || label === "Site งาน" || label === "โรงงาน" ? label : "โรงงาน";
  };

  const [name,     setName]     = useState("");
  const [type,     setType]     = useState("โรงงาน");
  const [pinPos,   setPinPos]   = useState(seed);
  const [error,    setError]    = useState("");
  const [locating, setLocating] = useState(false);
  const [recenterTarget, setRecenterTarget] = useState(seed);

  useEffect(() => {
    setType(current => sanitizeModalType(current));
  }, []);

  function reLocate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPinPos(p);
        setRecenterTarget(p);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function handleSubmit() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("กรุณากรอกชื่อสถานที่");
      return;
    }
    onAdd({
      id:   `CUSTOM-${Date.now()}`,
      name: normalizedName,
      tag:  "CUSTOM",
      type: sanitizeModalType(type),
      lat:  pinPos.lat,
      lng:  pinPos.lng,
      dist: null,
    });
  }

  return (
    <div
      className="ci-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ci-modal" style={{ maxHeight: "98vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(14,15,18,0.15)" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.foreground, fontFamily: "'Prompt',sans-serif" }}>
              ระบุสถานที่ใหม่
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: T.foreground3 }}>
              แตะบนแผนที่เพื่อปักหมุดตำแหน่งที่ถูกต้อง
            </p>
          </div>
          <button className="ci-modal-close" onClick={onClose}><IcoX /></button>
        </div>

        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 10, border: `1px solid ${T.border}`, boxShadow: "0 6px 20px rgba(0,0,0,0.05)" }}>
          <MapContainer
            key="modal-map"
            center={[seed.lat, seed.lng]}
            zoom={15}
            style={{ width: "100%", height: 180 }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <MapPicker position={pinPos} onPick={setPinPos} />
            <Recenter position={recenterTarget} />
          </MapContainer>

          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
            borderRadius: 99, padding: "4px 12px", fontSize: 11, fontWeight: 700,
            color: yellowDark, pointerEvents: "none", whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: `1px solid rgba(var(--brand-accent-rgb),0.3)`,
          }}>
            แตะแผนที่เพื่อเลือกตำแหน่ง
          </div>

          <button
            onClick={reLocate}
            style={{
              position: "absolute", bottom: 8, right: 8, zIndex: 1000,
              display: "flex", alignItems: "center", gap: 5,
              background: "#ffffff", border: `1px solid ${T.border}`,
              borderRadius: 99, padding: "5px 12px", fontSize: 11, fontWeight: 700,
              color: T.foreground2, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <IcoLocate spin={locating} />
            {locating ? "กำลังระบุ…" : "ตำแหน่งฉัน"}
          </button>
        </div>

        <div style={{
          display: "flex", gap: 6, marginBottom: 10,
          padding: "6px 12px", borderRadius: 10,
          background: "var(--c-f4eedf)", border: `1px solid rgba(14,15,18,0.06)`,
          fontSize: 11, fontFamily: "'Prompt',monospace", color: T.foreground3, fontWeight: 700,
          letterSpacing: "0.02em",
        }}>
          <span>📍</span>
          <span>{pinPos.lat.toFixed(5)}°N &nbsp;·&nbsp; {pinPos.lng.toFixed(5)}°E</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
          <div>
            <label className="ci-label" style={{ marginBottom: 4 }}>ชื่อสถานที่</label>
            <input
              className="ci-input"
              placeholder="เช่น โรงงานลาดกระบัง"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              autoFocus
            />
          </div>
          <div>
            <label className="ci-label" style={{ marginBottom: 4 }}>ประเภท</label>
            <select
              className="ci-input"
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="โรงงาน">โรงงาน</option>
              <option value="สำนักงาน">สำนักงาน</option>
              <option value="Site งาน">Site งาน</option>
            </select>
          </div>
        </div>

        {error && (
          <p style={{ margin: "10px 0 0", fontSize: 13, color: T.danger, fontWeight: 700 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: T.radius,
              border: `1px solid ${T.border}`, background: "transparent",
              color: T.foreground3, fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2, padding: "12px", borderRadius: T.radius,
              border: "none", background: navyDeep, color: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", boxShadow: "0 6px 20px rgba(15,23,42,0.25)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1.5px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1";   e.currentTarget.style.transform = "none"; }}
          >
            เพิ่มสถานที่
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component styles ─────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&family=Sarabun:wght@300;400;500;600;700&display=swap');

  .ci, .ci * { box-sizing: border-box; }
  .ci {
    font-family: 'Sarabun', 'Prompt', sans-serif;
    background: linear-gradient(180deg, var(--secondary) 0%, ${T.background} 190px, ${T.background} 100%);
    color: ${T.foreground};
    min-height: 100%;
    -webkit-font-smoothing: antialiased;
  }

  .ci-workspace {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 400px);
    gap: 16px;
    background:
      linear-gradient(180deg, rgba(255,248,230,0.55), rgba(241,236,223,0)),
      ${T.background};
  }

  .ci-map-panel,
  .ci-side-panel {
    min-height: 0;
    overflow: hidden;
    border: 1px solid ${T.border};
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(34,25,11,0.06);
  }

  .ci-map-panel {
    position: relative;
  }

  .ci-side-panel {
    display: flex;
    flex-direction: column;
  }

  /* ── Compact & Elegant StepHeader ── */
  .ci-step-header-compact {
    background: linear-gradient(105deg, var(--brand-hero-start) 0%, var(--brand-hero-end) 48%, var(--brand-nav) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 12px 20px 20px;
    flex-shrink: 0;
    color: var(--brand-soft);
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(42,26,9,0.15);
    z-index: 10;
  }
  @media (min-width: 768px) {
    .ci-step-header-compact {
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 6px;
    }
  }
  .ci-step-header-compact::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(var(--brand-accent-rgb),0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--brand-accent-rgb),0.03) 1px, transparent 1px);
    background-size: 22px 22px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
  }
  .ci-step-header-compact::after {
    content: '';
    position: absolute;
    right: -40px; top: -40px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(var(--brand-accent-rgb),0.10) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .ci-step-header-compact > * {
    position: relative;
    z-index: 1;
  }

  .ci-hdr-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .ci-hdr-title {
    margin: 2px 0 0;
    font-size: 19px;
    font-weight: 900;
    color: #ffffff;
    font-family: 'Prompt', sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .ci-hero-badge-compact {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: rgba(255,248,230,0.85);
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .ci-hdr-mascot-compact {
    width: 46px;
    height: 46px;
    object-fit: contain;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
    animation: mascot-float 3s ease-in-out infinite;
    flex-shrink: 0;
  }

  .ci-hdr-divider {
    width: 1px;
    height: 24px;
    background: rgba(255,255,255,0.15);
  }

  @keyframes mascot-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  /* ── Custom Progress Stepper ── */
  .ci-stepper-container {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ci-stepper-item-wrap {
    display: flex;
    align-items: center;
  }
  .ci-stepper-line {
    width: 12px;
    height: 2px;
    background: rgba(255, 255, 255, 0.15);
    transition: all 0.3s;
  }
  .ci-stepper-line.active {
    background: var(--brand-accent);
    box-shadow: 0 0 6px var(--brand-accent);
  }
  .ci-stepper-node {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9.5px;
    font-weight: 900;
    font-family: 'Prompt', sans-serif;
    transition: all 0.3s;
  }
  .ci-stepper-node.active {
    background: var(--brand-accent);
    color: var(--c-1a1613);
    box-shadow: 0 0 8px rgba(var(--brand-accent-rgb), 0.6);
  }
  .ci-stepper-node.done {
    background: #1f7a55;
    color: #fff;
  }
  .ci-stepper-node.idle {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .ci-back-btn {
    width: 32px; height: 32px;
    border-radius: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    color: var(--brand-soft);
  }
  .ci-back-btn:hover {
    background: rgba(255,255,255,0.16);
    border-color: ${yellow};
    color: #fff;
    transform: translateX(-2px);
    box-shadow: 0 0 10px rgba(var(--brand-accent-rgb), 0.22);
  }

  .ci-locate-btn {
    display: flex; align-items: center; gap: 6px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.16);
    font-family: 'Prompt', 'Sarabun', inherit;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    font-weight: 700;
    font-size: 11px;
    padding: 6px 14px;
    letter-spacing: 0.01em;
  }
  .ci-locate-btn:hover {
    transform: translateY(-1.5px);
    box-shadow: 0 5px 14px rgba(var(--brand-accent-rgb),0.18);
    border-color: ${yellow};
  }
  .ci-locate-btn.active {
    border-color: ${yellow};
    background: ${yellow};
    color: ${T.primaryFg};
    box-shadow: 0 0 10px rgba(var(--brand-accent-rgb),0.4);
  }
  .ci-locate-btn.idle {
    background: rgba(255,255,255,0.08);
    color: var(--brand-soft);
    backdrop-filter: blur(8px);
  }

  .ci-panel-label {
    font-size: 10px; font-weight: 800; color: ${T.foreground3};
    text-transform: uppercase; letter-spacing: 0.12em;
    font-family: 'Prompt', sans-serif;
  }

  .ci-list::-webkit-scrollbar { width: 4px; }
  .ci-list::-webkit-scrollbar-track { background: transparent; }
  .ci-list::-webkit-scrollbar-thumb { background: rgba(14,15,18,0.12); border-radius: 99px; }

  /* ── Search & Filter Box ── */
  .ci-search-box {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    border-radius: 12px;
    border: 1px solid rgba(14,15,18,0.08);
    background: #ffffff;
    padding: 0 12px;
    color: ${T.foreground3};
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
    transition: all 0.2s;
  }
  .ci-search-box:focus-within {
    border-color: ${yellowBdr};
    box-shadow: 0 0 0 3px rgba(var(--brand-accent-rgb),0.15), inset 0 2px 4px rgba(0,0,0,0.01);
  }
  .ci-search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${T.foreground};
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
  }
  .ci-search-box input::placeholder {
    color: #a3a199;
    font-weight: 500;
  }
  .ci-search-clear {
    border: none;
    background: transparent;
    padding: 2px;
    cursor: pointer;
    color: ${T.foreground3};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.15s, color 0.15s;
  }
  .ci-search-clear:hover {
    background: rgba(14,15,18,0.06);
    color: ${T.foreground};
  }

  .ci-filter-row {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 10px 0 2px;
    scrollbar-width: none;
  }
  .ci-filter-row::-webkit-scrollbar { display: none; }
  .ci-filter-chip {
    border: 1px solid rgba(14,15,18,0.08);
    background: #ffffff;
    color: ${T.foreground3};
    border-radius: 8px;
    padding: 5px 12px;
    font-family: 'Prompt', 'Sarabun', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ci-filter-chip:hover:not(.active) {
    background: var(--c-f7f6f2);
    border-color: rgba(14,15,18,0.15);
    color: ${T.foreground};
  }
  .ci-filter-chip.active {
    background: linear-gradient(135deg, ${yellow} 0%, var(--brand-accent-strong) 100%);
    border-color: transparent;
    color: ${T.primaryFg};
    box-shadow: 0 4px 10px rgba(var(--brand-accent-rgb),0.22);
  }

  /* ── Ultra-compact tip style ── */
  .ci-side-tip-compact {
    margin: 10px 16px 4px;
    border: 1px solid rgba(var(--brand-accent-rgb), 0.24);
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(var(--brand-accent-rgb), 0.03);
    flex-shrink: 0;
  }

  /* ── Premium Location Card ── */
  .ci-loc-card {
    display: flex; align-items: center; gap: 14px;
    background: #ffffff;
    border: 1px solid rgba(14,15,18,0.06);
    border-radius: 16px;
    padding: 12px 14px;
    min-height: 74px;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .ci-loc-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px;
    background: transparent;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px 0 0 16px;
  }
  .ci-loc-card:hover {
    border-color: rgba(var(--brand-accent-rgb), 0.35);
    box-shadow: 0 8px 20px rgba(34,25,11,0.05);
    transform: translateY(-1.5px);
  }
  .ci-loc-card.sel {
    background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%);
    border-color: ${yellowBdr};
    box-shadow: 0 8px 24px rgba(var(--brand-accent-rgb),0.14);
  }
  .ci-loc-card.sel::before {
    background: ${yellow};
    box-shadow: 2px 0 8px rgba(var(--brand-accent-rgb),0.6);
  }

  .ci-loc-icon {
    border-radius: 12px; flex-shrink: 0;
    width: 42px; height: 42px; min-width: 42px; min-height: 42px;
    display: flex; align-items: center; justify-content: center;
    background: var(--c-f7f6f2);
    color: #767269;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(0,0,0,0.02);
  }
  .ci-loc-card.sel .ci-loc-icon {
    background: linear-gradient(135deg, ${yellow} 0%, var(--brand-accent-strong) 100%);
    color: ${T.primaryFg};
    box-shadow: 0 3px 10px rgba(var(--brand-accent-rgb),0.25);
    border-color: transparent;
  }
  .ci-loc-card:hover:not(.sel) .ci-loc-icon {
    background: var(--secondary);
    color: #0e0f12;
  }

  .ci-loc-name {
    font-size: 14px; font-weight: 800; color: ${T.foreground};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 2px; font-family: 'Prompt', sans-serif;
  }

  .ci-tag {
    font-size: 9.5px; font-weight: 700;
    border-radius: 5px; padding: 1.5px 6px;
    letter-spacing: 0.04em; font-family: 'Prompt', monospace;
    border: 1px solid transparent;
  }
  .ci-tag-sel {
    background: rgba(var(--brand-accent-rgb),0.12);
    color: ${yellowDark};
    border-color: rgba(var(--brand-accent-rgb),0.18);
  }
  .ci-tag-def {
    background: var(--background);
    color: #767269;
    border-color: rgba(14,15,18,0.06);
  }

  /* ── Location Badges ── */
  .ci-type-badge {
    font-size: 10.5px;
    font-weight: 700;
    font-family: 'Prompt', sans-serif;
    border-radius: 5px;
    padding: 1.5px 6px;
    letter-spacing: 0.01em;
  }
  .ci-type-badge.type-factory { background: var(--c-fff2e6); color: var(--c-e65c00); border: 1px solid var(--c-ffe0cc); }
  .ci-type-badge.type-site { background: var(--c-fefcee); color: var(--c-a16207); border: 1px solid var(--c-fef08a); }
  .ci-type-badge.type-construction { background: var(--c-fefcee); color: var(--c-a16207); border: 1px solid var(--c-fef08a); }
  .ci-type-badge.type-warehouse { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
  .ci-type-badge.type-office { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
  .ci-type-badge.type-others { background: #f5f5f5; color: #525252; border: 1px solid #e5e5e5; }

  .ci-dist {
    font-size: 11px; font-weight: 800; color: ${T.foreground3};
    font-family: 'Prompt', sans-serif; white-space: nowrap;
    margin-left: auto; margin-right: 10px; flex-shrink: 0;
    background: var(--c-f7f6f2);
    padding: 3px 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    border: 1px solid rgba(0,0,0,0.02);
  }
  .ci-loc-card.sel .ci-dist {
    color: ${yellowDark};
    background: var(--c-fffbeb);
    border-color: rgba(var(--brand-accent-rgb),0.15);
  }

  /* ── Bouncing Check Circle ── */
  .ci-check-wrapper {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    flex-shrink: 0;
  }
  .ci-check-circle {
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(135deg, ${yellow} 0%, var(--brand-accent-strong) 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(var(--brand-accent-rgb),0.3);
    animation: ci-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  .ci-check-circle-placeholder {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(14, 15, 18, 0.1);
    transition: border-color 0.2s;
  }
  .ci-loc-card:hover .ci-check-circle-placeholder {
    border-color: rgba(var(--brand-accent-rgb), 0.4);
  }

  @keyframes ci-pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .ci-add-btn {
    width: 100%; border-radius: 14px;
    border: 1.5px dashed rgba(14,15,18,0.15);
    background: rgba(255,255,255,0.6); color: ${T.foreground3};
    font-family: 'Prompt', 'Sarabun', inherit; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer; transition: all 0.2s; font-size: 13px;
    padding: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  }
  .ci-add-btn:hover {
    background: #ffffff;
    border-color: ${yellow};
    color: ${T.foreground};
    box-shadow: 0 6px 16px rgba(var(--brand-accent-rgb),0.08);
    transform: translateY(-1px);
  }

  .ci-preview {
    background: linear-gradient(135deg, #ffffff 0%, var(--brand-surface) 100%);
    border: 1px solid rgba(var(--brand-accent-rgb),0.35);
    border-radius: 16px;
    animation: ci-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 24px rgba(var(--brand-accent-rgb),0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }
  @keyframes ci-slide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .ci-cta {
    width: 100%; border-radius: 14px; border: none;
    font-family: 'Prompt', inherit; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative; overflow: hidden; letter-spacing: 0.02em;
    font-size: 15px;
  }
  .ci-cta.ready {
    background: linear-gradient(135deg, var(--brand-text) 0%, var(--c-1a1613) 100%);
    color: #fff;
    box-shadow: 0 10px 25px rgba(26, 22, 19, 0.25);
    padding: 14px;
  }
  .ci-cta.ready::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%); animation: ci-shimmer 2.5s infinite;
  }
  @keyframes ci-shimmer { to { transform: translateX(100%); } }
  .ci-cta.ready:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(26,22,19,0.32);
    background: linear-gradient(135deg, var(--c-3d2f24) 0%, var(--brand-text) 100%);
  }
  .ci-cta.ready:active { transform: scale(0.985) translateY(-1px); }
  .ci-cta.disabled {
    background: var(--c-e8e5dc);
    color: #9c988f;
    cursor: not-allowed;
    box-shadow: none;
    padding: 14px;
    border: 1px solid rgba(0,0,0,0.03);
  }

  @keyframes ci-spin { to { transform: rotate(360deg); } }

  .ci-coords-badge {
    position: absolute; bottom: 18px; left: 18px; z-index: 1000;
    background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px);
    border-radius: 999px; border: 1px solid rgba(14,15,18,0.08);
    padding: 7px 14px; font-size: 11px; color: ${T.foreground3};
    font-weight: 700; pointer-events: none;
    font-family: 'Prompt', monospace; letter-spacing: 0.03em;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }

  .ci-map-wrap { position: relative; overflow: hidden; background: ${T.surface2}; }
  .ci-map-wrap .leaflet-container { background: ${T.surface2}; }
  .ci-map-wrap::after {
    content: '';
    position: absolute;
    inset: 14px;
    border: 1.5px solid rgba(255,255,255,0.7);
    border-radius: 14px;
    pointer-events: none;
    z-index: 650;
    box-shadow: inset 0 0 15px rgba(0,0,0,0.03);
  }

  .ci-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(14,15,18,0.5); backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .ci-modal {
    width: min(100%, 680px); max-width: 680px;
    background: var(--c-fbf9f4); border-radius: 24px 24px 0 0;
    padding: 28px 28px 42px;
    font-family: 'Sarabun', sans-serif;
    animation: ci-modal-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    border-top: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.15);
  }
  @keyframes ci-modal-in {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  @media (min-width: 768px) {
    .ci-modal-overlay {
      align-items: center;
    }
    .ci-modal {
      border-radius: 24px;
      animation: ci-modal-in-desktop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 20px 50px rgba(0,0,0,0.18);
    }
  }
  @keyframes ci-modal-in-desktop {
    from { transform: scale(0.92) translateY(20px); opacity: 0; }
    to   { transform: scale(1) translateY(0);    opacity: 1; }
  }

  .ci-modal-close {
    width: 32px; height: 32px; border-radius: 10px;
    background: rgba(14,15,18,0.05); border: 1px solid transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; color: ${T.foreground3};
  }
  .ci-modal-close:hover { background: rgba(14,15,18,0.1); transform: rotate(90deg); color: ${T.foreground}; }

  .ci-input {
    width: 100%; padding: 12px 14px;
    border: 1px solid rgba(14,15,18,0.1); border-radius: 12px;
    font-size: 14px; font-family: 'Sarabun', inherit; color: ${T.foreground};
    background: #ffffff; outline: none;
    transition: all 0.2s;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
  }
  .ci-input:focus { border-color: ${yellow}; box-shadow: 0 0 0 3.5px rgba(var(--brand-accent-rgb),0.18), inset 0 2px 4px rgba(0,0,0,0.01); }

  .ci-label {
    font-size: 11px; font-weight: 800; color: ${T.foreground3};
    text-transform: uppercase; letter-spacing: 0.10em;
    display: block; margin-bottom: 6px; font-family: 'Prompt', sans-serif;
  }

  .ci-sidebar-section {
    padding: 14px 16px 12px;
    border-bottom: 1px solid rgba(14,15,18,0.06);
    flex-shrink: 0;
    background: linear-gradient(180deg, color-mix(in srgb, var(--brand-soft) 72%, transparent) 0%, color-mix(in srgb, var(--brand-surface) 92%, transparent) 100%);
  }

  .ci-footer-panel {
    flex-shrink: 0; border-top: 1px solid rgba(14,15,18,0.08);
    padding: 12px 16px 16px;
    background: color-mix(in srgb, var(--brand-surface) 85%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  @media (max-width: 767px) {
    .ci-workspace {
      display: block;
      padding: 0;
      overflow: visible;
    }
    .ci-map-panel,
    .ci-side-panel {
      border-radius: 0;
      border-left: 0;
      border-right: 0;
      box-shadow: none;
    }
    .ci-map-overlay {
      top: 12px;
      left: 12px;
      right: 12px;
    }
    .ci-hdr-flex {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
    .ci-hdr-divider {
      display: none;
    }
    .ci-hdr-mascot-compact {
      position: absolute;
      right: 0;
      top: -4px;
      width: 40px;
      height: 40px;
    }
    .ci-hdr-title {
      font-size: 17px;
    }
    .ci-hdr-flex > div:last-child {
      justify-content: space-between;
      width: 100%;
      margin-top: 2px;
      padding-top: 6px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
  }
`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function Checkin() {
  const { mascot, theme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const activity = location.state?.activity ?? null;

  const [selected,  setSelected]  = useState(null);
  const [userPos,   setUserPos]   = useState(null);
  const [locating,  setLocating]  = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [extraLocs, setExtraLocs] = useState([]);
  const [mapMounted, setMapMounted] = useState(false);
  const [width, setWidth] = useState(
    typeof window === "undefined" ? 1024 : window.innerWidth
  );

  // Instant Search and Quick Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ทั้งหมด");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    setMapMounted(true);
    return () => setMapMounted(false);
  }, []);


  const isMobile = width < 768;
  const center   = userPos ?? DEFAULT_CENTER;

  useEffect(() => { locateUser(); }, []);

  const allLocations = [...PRESET_LOCATIONS, ...extraLocs]
    .map(l => ({
      ...l,
      dist: (l.lat && l.lng)
        ? haversine(center.lat, center.lng, l.lat, l.lng)
        : null,
    }))
    .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999));

  // Compute filtered locations instantly based on query and quick type filters
  const filteredLocations = allLocations.filter(loc => {
    // Type filter
    if (selectedType !== "ทั้งหมด") {
      if (selectedType === "สำนักงาน" && loc.type !== "สำนักงาน" && loc.type !== "บริษัท") return false;
      if (selectedType !== "สำนักงาน" && loc.type !== selectedType) return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = loc.name.toLowerCase().includes(q);
      const tagMatch = loc.tag.toLowerCase().includes(q);
      const typeMatch = loc.type.toLowerCase().includes(q);
      return nameMatch || tagMatch || typeMatch;
    }
    return true;
  });

  const selectedTypeKey = LOCATION_FILTERS.some(filter => filter.key === selectedType) ? selectedType : "all";
  const visibleLocations = allLocations.filter(loc => {
    const typeKind = normalizeLocationType(loc.type, loc.id);

    if (selectedTypeKey !== "all" && typeKind !== selectedTypeKey) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const normalizedType = getLocationTypeLabel(loc.type, loc.id).toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.tag.toLowerCase().includes(q) ||
        normalizedType.includes(q)
      );
    }

    return true;
  });

  useEffect(() => {
    if (selected) {
      const fresh = allLocations.find(l => l.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [userPos, extraLocs]);

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(activity ? "/activity" : "/category");
  }

  function locateUser() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function handleAddLocation(loc) {
    setExtraLocs(prev => [...prev, loc]);
    setSelected(loc);
    setShowModal(false);
  }

  const mapCenter = [center.lat, center.lng];
  const fitPoints = allLocations.filter(l => l.lat && l.lng).map(l => [l.lat, l.lng]);
  const mapInstanceKey = isMobile ? "mobile" : "desktop";

  // ── Custom Stepper Progress Indicator (compact size)
  const StepPips = ({ current = 2, total = 4 }) => (
    <div className="ci-stepper-container">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const cls = n < current ? "done" : n === current ? "active" : "idle";
        return (
          <div key={n} className="ci-stepper-item-wrap">
            {n > 1 && <div className={`ci-stepper-line ${n <= current ? "active" : "idle"}`} />}
            <div className={`ci-stepper-node ${cls}`}>
              {n < current ? <IcoCheck /> : <span>{n}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Compact Sub-header (User Feedback Optimization)
  const StepHeader = () => (
    <div className="ci-step-header-compact">
      <div className="ci-hdr-flex">
        {/* Left cluster: Back and Titles */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button className="ci-back-btn" onClick={handleBack} aria-label="ย้อนกลับ">
            <IcoBack />
          </button>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)" }} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className="ci-hero-badge-compact">Step 2</span>
              <span className="ci-hero-badge-compact" style={{ background: "rgba(var(--brand-accent-rgb), 0.16)", color: "var(--brand-accent)" }}>Check-in</span>
            </div>
            <h1 className="ci-hdr-title">เช็คอินสถานที่ตรวจ</h1>
          </div>
        </div>

        {/* Right cluster: Stepper node and Locate actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button className={`ci-locate-btn ${locating ? "active" : "idle"}`} onClick={locateUser}>
            <IcoLocate spin={locating} />
            {locating ? "กำลังระบุ..." : "ระบุตำแหน่ง"}
          </button>

          <div className="ci-hdr-divider" />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <span style={{ fontSize: 9, color: "rgba(255,248,230,0.6)", fontWeight: 800, fontFamily: "'Prompt',sans-serif", letterSpacing: "0.05em" }}>
              SAFETY AUDIT
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StepPips current={2} />
              <span style={{ fontSize: 11, color: "var(--brand-accent)", fontWeight: 900, fontFamily: "'Prompt',sans-serif" }}>
                2 / 4
              </span>
            </div>
          </div>

          <img className="ci-hdr-mascot-compact" src={mascot("big")} alt={theme === "wangjai" ? "น้องวางใจ Safety mascot" : "SUEA tiger mascot"} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background:
            "repeating-linear-gradient(135deg, var(--brand-accent) 0 10px, #0e0f12 10px 20px)",
        }}
      />
    </div>
  );

  // ── Footer Panel (revamped action drawer)
  const FooterPanel = () => (
    <div className="ci-footer-panel">
      <button
        className="ci-add-btn"
        onClick={() => setShowModal(true)}
        style={{ marginBottom: 10 }}
      >
        <IcoPlus /> ระบุสถานที่อื่น
      </button>
      <button
        className={`ci-cta ${selected ? "ready" : "disabled"}`}
        disabled={!selected}
        onClick={() =>
          selected && navigate(activity ? "/linewalk" : "/activity", {
            state: {
              checkin: {
                id:   selected.id,
                name: selected.name,
                tag:  selected.tag,
                type: selected.type,
                dist: selected.dist,
              },
              ...(activity ? { activity, fromActivity: true } : {}),
            },
          })
        }
      >
        ถัดไป · เลือกวัน
        <IcoArrow c={selected ? "#fff" : T.foreground3} />
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="ci"
      style={{ height: isMobile ? "100%" : "auto", minHeight: "100%", background: T.background, display: "flex", flexDirection: "column" }}
    >
      <style>{STYLES}</style>

      {/* ── Desktop layout ──────────────────────────────────────────────── */}
      {!isMobile && (
        <div style={{
          width: "100%",
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: "24px 20px 40px",
        }}>
          <StepHeader />
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 370px",
            gap: 18,
          }}>
            <CheckinMapView height="clamp(380px, calc(100vh - 240px), 550px)" mapMounted={mapMounted} mapInstanceKey={mapInstanceKey} mapCenter={mapCenter} userPos={userPos} allLocations={allLocations} selected={selected} setSelected={setSelected} fitPoints={fitPoints} />

            {/* Right panel — this is the scrollable area on desktop */}
            <div style={{
              display: "flex", flexDirection: "column",
              border: `1px solid ${T.border}`,
              borderRadius: "20px",
              background: "var(--c-faf9f6)",
              boxShadow: "0 12px 30px rgba(34,25,11,0.06)",
              height: "clamp(380px, calc(100vh - 240px), 550px)",
              overflow: "hidden",
            }}>
              <div className="ci-sidebar-section">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <span className="ci-panel-label">ใกล้คุณที่สุด</span>
                    <div style={{ marginTop: 2, fontSize: 15, fontWeight: 800, color: T.foreground, fontFamily: "'Prompt',sans-serif" }}>
                      เลือกสถานที่ตรวจ
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: T.foreground3, fontFamily: "'Prompt',sans-serif", fontWeight: 700, background: "var(--secondary)", padding: "3px 8px", borderRadius: "6px" }}>
                    {visibleLocations.length} สถานที่
                  </span>
                  <span style={{ display: "none" }}>
                    {filteredLocations.length} สถานที่
                  </span>
                </div>

                {/* Sleek Search Box */}
                <div className="ci-search-box">
                  <IcoSearch s={16} c={T.foreground3} />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ หรือ รหัสสถานที่..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="ci-search-clear" aria-label="ล้างคำค้นหา">
                      <IcoX />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="ci-filter-row">
                  {LOCATION_FILTERS.map(type => (
                    <button
                      key={type.key}
                      className={`ci-filter-chip ${selectedTypeKey === type.key ? "active" : ""}`}
                      onClick={() => setSelectedType(type.key)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <div className="ci-filter-row" style={{ display: "none" }}>
                  {["ทั้งหมด", "โรงงาน", "ก่อสร้าง", "สำนักงาน", "บริษัท"].map(type => (
                    <button
                      key={type}
                      className={`ci-filter-chip ${selectedType === type ? "active" : ""}`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>


              {/* ↓ onScroll forwarded to App.jsx for scroll-hide behaviour */}
              <div
                className="ci-list"
                style={{
                  flex: 1, overflowY: "auto",
                  padding: "10px 16px 12px",
                  display: "flex", flexDirection: "column", gap: 9,
                }}
              >
                {filteredLocations.length > 0 ? (
                    visibleLocations.map(loc => (
                      <FilteredLocCard
                      key={loc.id}
                      loc={loc}
                      isSelected={selected?.id === loc.id}
                      onClick={() => setSelected(loc)}
                    />
                  ))
                ) : (
                  <div style={{
                    padding: "36px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
                    color: T.foreground3, fontSize: 13, fontWeight: 600
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.5 }}>
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                    <span>ไม่พบสถานที่ที่ค้นหา</span>
                  </div>
                )}

              </div>

              <FooterPanel />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile layout ───────────────────────────────────────────────── */}
      {isMobile && (
        // ↓ onScroll forwarded to App.jsx for scroll-hide behaviour
        <div
          id="ci-mobile-scroll-area"
          className="ci-list"
          style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", background: "var(--c-faf9f6)" }}
        >
          <StepHeader />

          <div style={{ flexShrink: 0, height: 230 }}>
            <CheckinMapView height="230px" mapMounted={mapMounted} mapInstanceKey={mapInstanceKey} mapCenter={mapCenter} userPos={userPos} allLocations={allLocations} selected={selected} setSelected={setSelected} fitPoints={fitPoints} />
          </div>

          <div style={{ flexShrink: 0, padding: "12px 18px 10px", borderBottom: `1px solid rgba(14,15,18,0.06)`, background: "#ffffff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <span className="ci-panel-label">ใกล้คุณที่สุด</span>
                <div style={{ marginTop: 3, fontSize: 15, fontWeight: 800, color: T.foreground, fontFamily: "'Prompt',sans-serif" }}>
                  เลือกสถานที่ตรวจ
                </div>
              </div>
              <span style={{ fontSize: 11, color: T.foreground3, fontFamily: "'Prompt',sans-serif", fontWeight: 700, background: "var(--secondary)", padding: "3px 8px", borderRadius: "6px" }}>
                {visibleLocations.length} สถานที่
              </span>
              <span style={{ display: "none" }}>
                {filteredLocations.length} สถานที่
              </span>
            </div>

            {/* Sleek Search Box */}
            <div className="ci-search-box" style={{ marginTop: 10 }}>
              <IcoSearch s={16} c={T.foreground3} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสสถานที่..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="ci-search-clear" aria-label="ล้างคำค้นหา">
                  <IcoX />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="ci-filter-row" style={{ paddingBottom: 0 }}>
              {LOCATION_FILTERS.map(type => (
                <button
                  key={type.key}
                  className={`ci-filter-chip ${selectedTypeKey === type.key ? "active" : ""}`}
                  onClick={() => setSelectedType(type.key)}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div className="ci-filter-row" style={{ paddingBottom: 0, display: "none" }}>
              {["ทั้งหมด", "โรงงาน", "ก่อสร้าง", "สำนักงาน", "บริษัท"].map(type => (
                <button
                  key={type}
                  className={`ci-filter-chip ${selectedType === type ? "active" : ""}`}
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
            {visibleLocations.length > 0 ? (
              visibleLocations.map(loc => (
                <FilteredLocCard
                  key={loc.id}
                  loc={loc}
                  isSelected={selected?.id === loc.id}
                  onClick={() => setSelected(loc)}
                />
              ))
            ) : (
              <div style={{
                padding: "36px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
                color: T.foreground3, fontSize: 13, fontWeight: 600
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                <span>ไม่พบสถานที่ที่ค้นหา</span>
              </div>
            )}

          </div>

          <FooterPanel />
        </div>
      )}

      {showModal && (
        <AddModal
          onAdd={handleAddLocation}
          onClose={() => setShowModal(false)}
          userPos={userPos}
        />
      )}
    </div>
  );
}
// @ts-nocheck

