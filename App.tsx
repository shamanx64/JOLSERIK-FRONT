import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type LatLng, type Region } from "react-native-maps";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";

type Audience = "heat" | "stroller" | "mobile";
type RouteId = "safest" | "comfortable" | "fastest";

type RouteOption = {
  id: RouteId;
  title: string;
  subtitle: string;
  color: string;
  coordinates: LatLng[];
  distanceKm: string;
  durationMin: number;
};

type Place = {
  name: string;
  coordinate: LatLng;
};

const ALMATY_REGION: Region = {
  latitude: 43.238949,
  longitude: 76.889709,
  latitudeDelta: 0.16,
  longitudeDelta: 0.16,
};

const LANDMARKS: Place[] = [
  { name: "Panfilov Park", coordinate: { latitude: 43.2613, longitude: 76.9454 } },
  { name: "Abay Square", coordinate: { latitude: 43.2382, longitude: 76.9458 } },
  { name: "Mega Alma-Ata", coordinate: { latitude: 43.2016, longitude: 76.8926 } },
  { name: "Almaty Central Stadium", coordinate: { latitude: 43.2386, longitude: 76.9275 } },
  { name: "Sayran Bus Station", coordinate: { latitude: 43.2265, longitude: 76.8622 } },
  { name: "Green Bazaar", coordinate: { latitude: 43.2634, longitude: 76.9426 } },
  { name: "Kok Tobe Lower Park", coordinate: { latitude: 43.2328, longitude: 76.9756 } },
  { name: "Esentai Mall", coordinate: { latitude: 43.2186, longitude: 76.9273 } },
];

const AUDIENCE_COPY: Record<Audience, { title: string; helper: string; recommended: RouteId }> = {
  heat: {
    title: "Heat sensitive",
    helper: "Prefers greener and more shaded segments with lower heat stress.",
    recommended: "safest",
  },
  stroller: {
    title: "Stroller",
    helper: "Prioritizes gentler inclines and more comfortable rolling segments.",
    recommended: "comfortable",
  },
  mobile: {
    title: "Mobile",
    helper: "Optimizes for speed when stairs and hills are acceptable.",
    recommended: "fastest",
  },
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolvePlace(query: string) {
  const normalized = normalize(query);

  if (!normalized) {
    return null;
  }

  return (
    LANDMARKS.find((place) => normalize(place.name) === normalized) ??
    LANDMARKS.find((place) => normalize(place.name).includes(normalized))
  );
}

function interpolate(start: LatLng, end: LatLng, factor: number): LatLng {
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * factor,
    longitude: start.longitude + (end.longitude - start.longitude) * factor,
  };
}

function offsetPoint(start: LatLng, end: LatLng, factor: number, magnitude: number): LatLng {
  const anchor = interpolate(start, end, factor);
  const dx = end.longitude - start.longitude;
  const dy = end.latitude - start.latitude;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 0.0001);

  return {
    latitude: anchor.latitude + (dx / length) * magnitude,
    longitude: anchor.longitude - (dy / length) * magnitude,
  };
}

function haversineKm(start: LatLng, end: LatLng) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2) *
      Math.cos(startLatitude) *
      Math.cos(endLatitude);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function polylineDistanceKm(points: LatLng[]) {
  return points.slice(1).reduce((sum, point, index) => sum + haversineKm(points[index], point), 0);
}

function nearestPlace(coordinate: LatLng, candidates: Place[]) {
  return candidates.reduce((best, candidate) => {
    const candidateDistance = haversineKm(coordinate, candidate.coordinate);
    const bestDistance = haversineKm(coordinate, best.coordinate);
    return candidateDistance < bestDistance ? candidate : best;
  });
}

function buildRoutes(start: LatLng, end: LatLng): RouteOption[] {
  const shadeAnchors = LANDMARKS.filter((place) =>
    ["Panfilov Park", "Abay Square", "Kok Tobe Lower Park"].includes(place.name)
  );

  const comfortAnchors = LANDMARKS.filter((place) =>
    ["Mega Alma-Ata", "Esentai Mall", "Almaty Central Stadium", "Sayran Bus Station"].includes(place.name)
  );

  const safestAnchor = nearestPlace(interpolate(start, end, 0.5), shadeAnchors).coordinate;
  const comfortableAnchor = nearestPlace(interpolate(start, end, 0.45), comfortAnchors).coordinate;

  const safestCoordinates = [
    start,
    interpolate(start, safestAnchor, 0.55),
    safestAnchor,
    interpolate(safestAnchor, end, 0.45),
    end,
  ];

  const comfortableCoordinates = [
    start,
    offsetPoint(start, comfortableAnchor, 0.45, 0.012),
    comfortableAnchor,
    offsetPoint(comfortableAnchor, end, 0.55, -0.01),
    end,
  ];

  const fastestCoordinates = [
    start,
    interpolate(start, end, 0.35),
    interpolate(start, end, 0.7),
    end,
  ];

  const safestDistance = polylineDistanceKm(safestCoordinates);
  const comfortableDistance = polylineDistanceKm(comfortableCoordinates);
  const fastestDistance = polylineDistanceKm(fastestCoordinates);

  return [
    {
      id: "safest",
      title: "Safest",
      subtitle: "Lower heat stress, greener corridor, easier recovery stops.",
      color: "#2dd4bf",
      coordinates: safestCoordinates,
      distanceKm: safestDistance.toFixed(1),
      durationMin: Math.round((safestDistance / 4.2) * 60),
    },
    {
      id: "comfortable",
      title: "Comfortable",
      subtitle: "Smoother stroller-friendly path with gentler turns and grade.",
      color: "#84cc16",
      coordinates: comfortableCoordinates,
      distanceKm: comfortableDistance.toFixed(1),
      durationMin: Math.round((comfortableDistance / 4.6) * 60),
    },
    {
      id: "fastest",
      title: "Fastest",
      subtitle: "Direct connection when stairs and hills are acceptable.",
      color: "#f97316",
      coordinates: fastestCoordinates,
      distanceKm: fastestDistance.toFixed(1),
      durationMin: Math.round((fastestDistance / 5.4) * 60),
    },
  ];
}

export default function App() {
  const mapRef = useRef<MapView | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'map'>('login');
  const [audience, setAudience] = useState<Audience>("heat");
  const [from, setFrom] = useState("Panfilov Park");
  const [to, setTo] = useState("Mega Alma-Ata");
  const [startPoint, setStartPoint] = useState<Place | null>(resolvePlace("Panfilov Park") ?? null);
  const [endPoint, setEndPoint] = useState<Place | null>(resolvePlace("Mega Alma-Ata") ?? null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [hasBuiltRoutes, setHasBuiltRoutes] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId>(AUDIENCE_COPY.heat.recommended);

  const recommendedRouteId = AUDIENCE_COPY[audience].recommended;
  const activeRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];

  const etaText = useMemo(() => {
    if (!activeRoute) {
      return "";
    }

    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + activeRoute.durationMin);

    return eta.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [activeRoute]);

  useEffect(() => {
    setSelectedRouteId(recommendedRouteId);
  }, [recommendedRouteId]);

  useEffect(() => {
    if (!startPoint || !endPoint || !hasBuiltRoutes || routes.length === 0) {
      return;
    }

    const visibleRoutes = journeyStarted
      ? routes.filter((route) => route.id === selectedRouteId)
      : routes;

    const allCoordinates = [startPoint.coordinate, endPoint.coordinate, ...visibleRoutes.flatMap((route) => route.coordinates)];

    mapRef.current?.fitToCoordinates(allCoordinates, {
      edgePadding: { top: 120, right: 60, bottom: 360, left: 60 },
      animated: true,
    });
  }, [endPoint, hasBuiltRoutes, journeyStarted, routes, selectedRouteId, startPoint]);

  const examples = useMemo(() => LANDMARKS.slice(0, 6), []);

  function submitRouteSearch() {
    const resolvedStart = resolvePlace(from);
    const resolvedEnd = resolvePlace(to);

    if (!resolvedStart || !resolvedEnd) {
      Alert.alert(
        "Unknown place",
        "Use one of the suggested Almaty landmarks or type a closer match such as Panfilov Park, Mega Alma-Ata, or Abay Square."
      );
      return;
    }

    if (resolvedStart.name === resolvedEnd.name) {
      Alert.alert("Choose two different places", "Start point and destination cannot be the same.");
      return;
    }

    setStartPoint(resolvedStart);
    setEndPoint(resolvedEnd);
    setRoutes(buildRoutes(resolvedStart.coordinate, resolvedEnd.coordinate));
    setHasBuiltRoutes(true);
    setJourneyStarted(false);
    setSelectedRouteId(AUDIENCE_COPY[audience].recommended);
  }

  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onLogin={() => setCurrentScreen('map')}
        onNavigateToRegister={() => setCurrentScreen('register')}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onRegister={() => setCurrentScreen('map')}
        onNavigateToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={ALMATY_REGION} showsCompass showsScale>
        {startPoint ? (
          <Marker coordinate={startPoint.coordinate} title="A" description={startPoint.name} pinColor="#2563eb" />
        ) : null}
        {endPoint ? (
          <Marker coordinate={endPoint.coordinate} title="B" description={endPoint.name} pinColor="#dc2626" />
        ) : null}

        {hasBuiltRoutes
          ? routes
              .filter((route) => !journeyStarted || route.id === selectedRouteId)
              .map((route) => (
              <Polyline
                key={route.id}
                coordinates={route.coordinates}
                strokeColor={route.color}
                strokeWidth={route.id === selectedRouteId ? 7 : 5}
                lineCap="round"
                lineJoin="round"
              />
              ))
          : null}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>GPS Navigator</Text>
        </View>
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Almaty accessibility routes</Text>
          <Text style={styles.legendText}>A to B with safety, comfort, and speed alternatives.</Text>
        </View>
      </View>

      <View style={styles.bottomPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomPanelContent}>
          <View style={styles.grabber} />

          <Text style={styles.panelTitle}>Plan your route</Text>
          <Text style={styles.panelSubtitle}>
            Full-screen Almaty map with route options for heat-sensitive people, stroller users, and mobile users.
          </Text>

          {hasBuiltRoutes && !journeyStarted ? (
            <View style={styles.routesSection}>
              {routes.map((route, index) => {
                const selected = route.id === selectedRouteId;
                const recommended = route.id === recommendedRouteId;

                return (
                  <Pressable
                    key={route.id}
                    style={[styles.routeCard, selected && styles.routeCardSelected]}
                    onPress={() => {
                      setSelectedRouteId(route.id);
                      setJourneyStarted(false);
                    }}
                  >
                    <View style={styles.routeHeader}>
                      <View style={styles.routeTitleRow}>
                        <View style={[styles.routeNumber, { backgroundColor: route.color }]}>
                          <Text style={styles.routeNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.routeCopy}>
                          <Text style={styles.routeTitle}>{route.title}</Text>
                          <Text style={styles.routeSubtitle}>{route.subtitle}</Text>
                        </View>
                      </View>
                      {recommended ? (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>Recommended</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.routeStats}>
                      <Text style={styles.routeStat}>Distance: {route.distanceKm} km</Text>
                      <Text style={styles.routeStat}>Time: {route.durationMin} min</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                style={[styles.primaryButton, styles.startButton]}
                onPress={() => setJourneyStarted(true)}
              >
                <Text style={styles.primaryButtonText}>Start the journey</Text>
              </Pressable>
            </View>
          ) : null}

          {hasBuiltRoutes && journeyStarted && activeRoute ? (
            <View style={styles.startedJourneyCard}>
              <Text style={styles.startedJourneyTitle}>Journey started</Text>
              <Text style={styles.startedJourneyText}>
                Your {activeRoute.title.toLowerCase()} route will take {activeRoute.durationMin} mins and {activeRoute.distanceKm} kms.
              </Text>
              <Text style={styles.startedJourneyEta}>Your ETA will be {etaText}.</Text>
            </View>
          ) : null}

          <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="From where?"
            placeholderTextColor="#7c8f88"
            style={styles.input}
          />
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="To where?"
            placeholderTextColor="#7c8f88"
            style={styles.input}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exampleRow}>
            {examples.map((place) => (
              <Pressable
                key={place.name}
                style={styles.exampleChip}
                onPress={() => {
                  if (!from.trim()) {
                    setFrom(place.name);
                    return;
                  }

                  if (!to.trim()) {
                    setTo(place.name);
                    return;
                  }

                  setTo(place.name);
                }}
              >
                <Text style={styles.exampleChipText}>{place.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.audienceRow}>
            {(
              [
                { id: "heat", label: "Heat sensitive" },
                { id: "stroller", label: "Stroller" },
                { id: "mobile", label: "Mobile" },
              ] as const
            ).map((option) => {
              const active = audience === option.id;

              return (
                <Pressable
                  key={option.id}
                  style={[styles.audienceChip, active && styles.audienceChipActive]}
                  onPress={() => setAudience(option.id)}
                >
                  <Text style={[styles.audienceChipText, active && styles.audienceChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.audienceHelper}>{AUDIENCE_COPY[audience].helper}</Text>

          <Pressable style={styles.primaryButton} onPress={submitRouteSearch}>
            <Text style={styles.primaryButtonText}>Build 3 routes</Text>
          </Pressable>

          {hasBuiltRoutes && startPoint && endPoint && activeRoute ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Active route: {activeRoute.title}</Text>
              <Text style={styles.summaryText}>
                {startPoint.name} to {endPoint.name} with {activeRoute.distanceKm} km and about {activeRoute.durationMin} minutes.
                {journeyStarted ? " Other route overlays are now hidden." : ""}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#d9e6e1",
  },
  topOverlay: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    gap: 10,
  },
  timePill: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(14, 26, 24, 0.84)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timeText: {
    color: "#f6fbf9",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  legendCard: {
    maxWidth: 270,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  legendTitle: {
    color: "#11201c",
    fontSize: 16,
    fontWeight: "800",
  },
  legendText: {
    color: "#49635a",
    lineHeight: 18,
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(248, 252, 250, 0.98)",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: "50%",
  },
  bottomPanelContent: {
    paddingBottom: 8,
  },
  grabber: {
    alignSelf: "center",
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#c9d7d2",
    marginBottom: 12,
  },
  panelTitle: {
    color: "#11201c",
    fontSize: 24,
    fontWeight: "800",
  },
  panelSubtitle: {
    color: "#5a746b",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4e0db",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    color: "#11201c",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    fontSize: 15,
  },
  exampleRow: {
    gap: 8,
    paddingVertical: 6,
  },
  exampleChip: {
    borderRadius: 999,
    backgroundColor: "#e9f1ee",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleChipText: {
    color: "#35534a",
    fontWeight: "600",
  },
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  audienceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4e0db",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  audienceChipActive: {
    backgroundColor: "#163f35",
    borderColor: "#163f35",
  },
  audienceChipText: {
    color: "#27483f",
    fontWeight: "700",
  },
  audienceChipTextActive: {
    color: "#f5fbf8",
  },
  audienceHelper: {
    color: "#5a746b",
    marginTop: 10,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#163f35",
    alignItems: "center",
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#f7fcfa",
    fontSize: 15,
    fontWeight: "800",
  },
  routesSection: {
    marginBottom: 16,
    gap: 10,
  },
  startButton: {
    marginTop: 2,
  },
  routeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8e3de",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 10,
  },
  routeCardSelected: {
    borderColor: "#173f35",
    shadowColor: "#173f35",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  routeTitleRow: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  routeNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  routeNumberText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  routeCopy: {
    flex: 1,
    gap: 3,
  },
  routeTitle: {
    color: "#11201c",
    fontSize: 17,
    fontWeight: "800",
  },
  routeSubtitle: {
    color: "#5a746b",
    lineHeight: 18,
  },
  recommendedBadge: {
    borderRadius: 999,
    backgroundColor: "#eef9df",
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  recommendedBadgeText: {
    color: "#5e7f1a",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  routeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  routeStat: {
    color: "#28473e",
    fontWeight: "700",
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: "#163f35",
    padding: 16,
    gap: 6,
  },
  summaryTitle: {
    color: "#f5fbf8",
    fontSize: 16,
    fontWeight: "800",
  },
  summaryText: {
    color: "#d8ede6",
    lineHeight: 20,
  },
  startedJourneyCard: {
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: "#e8f4ef",
    borderWidth: 1,
    borderColor: "#cfe0d9",
    padding: 16,
    gap: 6,
  },
  startedJourneyTitle: {
    color: "#163f35",
    fontSize: 16,
    fontWeight: "800",
  },
  startedJourneyText: {
    color: "#27483f",
    lineHeight: 20,
  },
  startedJourneyEta: {
    color: "#163f35",
    fontWeight: "800",
  },
});
