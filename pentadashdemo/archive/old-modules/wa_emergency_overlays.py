# wa_emergency_overlays.py
import requests
from bs4 import BeautifulSoup
from shapely.geometry import Point, mapping
import geojson

# --- Settings
# Define color codes for overlays
SOURCE_COLORS = {
    "bushfire": "#FF3232",          # Emergency WA - Red
    "dea_hotspot": "#FF8800",       # DEA Hotspots - Orange
    "myfirewatch": "#FFD700",       # Landgate - Yellow
    "nbn": "#3388ff",               # NBN Outage - Blue
    "power": "#6BC143"              # Western Power - Green
}
# Map center for Perth
PERTH_CENTER = (115.8575, -31.9536)

# --- GeoJSON Conversion Utilities
def point_feature(lon, lat, props, layer):
    # Standard circle overlay point
    props.update({
        "layer": layer,
        "marker-color": SOURCE_COLORS[layer]
    })
    return geojson.Feature(geometry=Point((lon, lat)), properties=props)


def features_to_collection(features):
    return geojson.FeatureCollection(features)

# --- Data Fetchers

def fetch_bushfire_incidents(layer="bushfire"):
    url = "https://emergency.wa.gov.au/data/map.incidents.json"
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
        features = []
        for f in data["features"]:
            coords = f["geometry"]["coordinates"]
            title = f["properties"]["incident_name"]
            severity = f["properties"].get("alert_level", "Unknown")
            # Circle overlay, color by severity/alert type, center on incident point
            feat = point_feature(coords[0], coords[1],
                {"title": title, "severity": severity}, layer)
            features.append(feat)
        return features_to_collection(features)
    except Exception as e:
        return features_to_collection([])

def fetch_dea_hotspots(layer="dea_hotspot"):
    url = ("https://hotspots.dea.ga.gov.au/geoserver/wfs?"
           "service=WFS&version=1.1.0&request=GetFeature&typeName=hotspot:hotspots"
           "&outputFormat=json")
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
        features = []
        for f in data["features"]:
            lon, lat = f["geometry"]["coordinates"]
            props = {
                "sat_sensor": f["properties"]["satellite_sensor"],
                "acq_time": f["properties"]["acquisition_time"],
                "f_radiative_power": f["properties"].get("fire_radiative_power"),
                "confidence": f["properties"].get("confidence"),
            }
            features.append(point_feature(lon, lat, props, layer))
        return features_to_collection(features)
    except Exception as e:
        return features_to_collection([])

def fetch_myfirewatch_hotspots(layer="myfirewatch"):
    # Landgate MyFireWatch does not expose direct GeoJSON, so sample the web overlay with fallback
    # If you have a GIS backend and access to their WMS, prefer direct WMS overlay on frontend.
    # Here, we provide a stub that can be replaced with a scrape or WMS tile integration.
    # Return empty collection as placeholder
    return features_to_collection([])

def scrape_nbn_outage(layer="nbn"):
    url = "https://www.nbnco.com.au/support/network-status"
    try:
        html = requests.get(url, timeout=10).text
        soup = BeautifulSoup(html, "lxml")
        features = []
        for row in soup.select("#outage-table tr")[1:]:
            cells = row.find_all("td")
            if len(cells) < 3: continue
            suburb = cells[0].text.strip()
            status = cells[1].text.strip()
            eta = cells[2].text.strip()
            # Actual suburb coordinates would need geocoding (not supplied in HTML).
            # Placeholder: Use center of Perth for demo--replace with postcode centroid lookup!
            features.append(point_feature(
                PERTH_CENTER[0], PERTH_CENTER[1],
                {"suburb": suburb, "status": status, "eta": eta}, layer))
        return features_to_collection(features)
    except Exception as e:
        return features_to_collection([])

def scrape_western_power_outage(layer="power"):
    url = "https://www.westernpower.com.au/outages/"
    try:
        html = requests.get(url, timeout=10).text
        soup = BeautifulSoup(html, "lxml")
        features = []
        for div in soup.select(".outage-item"):
            area = div.select_one(".suburb").text.strip() if div.select_one(".suburb") else ""
            customers = div.select_one(".customers-affected").text.strip() if div.select_one(".customers-affected") else ""
            restore_time = div.select_one(".estimated-restoration").text.strip() if div.select_one(".estimated-restoration") else ""
            # Replace coord logic as appropriate (requires suburb geocoding, static for demo)
            features.append(point_feature(
                PERTH_CENTER[0], PERTH_CENTER[1],
                {"area": area, "customers": customers, "restore_time": restore_time}, layer))
        return features_to_collection(features)
    except Exception as e:
        return features_to_collection([])

# --- Main unified fetch function

def fetch_all_feeds():
    """ Returns a dict of {'layer': GeoJSON FeatureCollection} """
    return {
        "bushfire": fetch_bushfire_incidents(),
        "dea_hotspot": fetch_dea_hotspots(),
        "myfirewatch": fetch_myfirewatch_hotspots(),
        "nbn": scrape_nbn_outage(),
        "power": scrape_western_power_outage()
    }

# --- (Optional) Utility: Layer meta for dashboard filter menu

LAYER_META = {
    "bushfire": {"label": "Bushfires (DFES)", "color": SOURCE_COLORS["bushfire"]},
    "dea_hotspot": {"label": "Satellite Hotspots (DEA)", "color": SOURCE_COLORS["dea_hotspot"]},
    "myfirewatch": {"label": "WA MyFireWatch", "color": SOURCE_COLORS["myfirewatch"]},
    "nbn": {"label": "NBN Outages", "color": SOURCE_COLORS["nbn"]},
    "power": {"label": "Western Power Outages", "color": SOURCE_COLORS["power"]}
}

# --- Example CLI test
if __name__ == "__main__":
    import json
    feeds = fetch_all_feeds()
    for layer, fc in feeds.items():
        print(f"--- {layer} ---")
        print(json.dumps(fc, indent=2))
