import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type LatLng, type Region } from "react-native-maps";
import LoginScreen from "./components/LoginScreen";
import ProfileScreen from "./components/ProfileScreen";
import RegisterScreen from "./components/RegisterScreen";
import { getMe, listSessions, login, logout, logoutAll, refreshTokens, register } from "./lib/api/auth";
import { clearStoredTokens, getStoredAccessToken, setAuthFailureHandler } from "./lib/api/client";
import { getProfile, updateProfile } from "./lib/api/profile";
import { getHealth } from "./lib/api/system";
import type { SessionResponse, UserResponse } from "./lib/api/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEADER_HEIGHT = 48;

type Audience = "heat" | "stroller" | "mobile";
type RouteId = "safest" | "comfortable" | "fastest";
type Screen = "login" | "register" | "map" | "profile";

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

type UserProfile = {
  id?: string;
  name: string;
  full_name?: string;
  email: string;
  role?: string;
};

type RouteInputDialog = {
  title: string;
  message: string;
};

const ALMATY_REGION: Region = {
  latitude: 43.238949,
  longitude: 76.889709,
  latitudeDelta: 0.16,
  longitudeDelta: 0.16,
};

const LANDMARKS: Place[] = [
  { name: "Парк Панфиловцев", coordinate: { latitude: 43.2613, longitude: 76.9454 } },
  { name: "Площадь Абая", coordinate: { latitude: 43.2382, longitude: 76.9458 } },
  { name: "Мега Алма-Ата", coordinate: { latitude: 43.2016, longitude: 76.8926 } },
  { name: "Центральный стадион Алматы", coordinate: { latitude: 43.2386, longitude: 76.9275 } },
  { name: "Автовокзал Сайран", coordinate: { latitude: 43.2265, longitude: 76.8622 } },
  { name: "Зеленый базар", coordinate: { latitude: 43.2634, longitude: 76.9426 } },
  { name: "Нижний парк Кок-Тобе", coordinate: { latitude: 43.2328, longitude: 76.9756 } },
  { name: "Есентай Молл", coordinate: { latitude: 43.2186, longitude: 76.9273 } },
];

const AUDIENCE_COPY: Record<Audience, { title: string; helper: string; recommended: RouteId }> = {
  heat: {
    title: "Чувствительность к жаре",
    helper: "Предпочитает более зеленые и тенистые участки с меньшей тепловой нагрузкой.",
    recommended: "safest",
  },
  stroller: {
    title: "Коляска",
    helper: "Отдает приоритет более плавным подъемам и комфортным участкам для движения.",
    recommended: "comfortable",
  },
  mobile: {
    title: "Мобильный",
    helper: "Оптимизирует маршрут по скорости, если лестницы и подъемы допустимы.",
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

function formatDurationHours(durationMin: number) {
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;

  if (hours === 0) {
    return `${minutes} мин`;
  }

  if (minutes === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${minutes} мин`;
}

function nearestPlace(coordinate: LatLng, candidates: Place[]) {
  return candidates.reduce((best, candidate) => {
    const candidateDistance = haversineKm(coordinate, candidate.coordinate);
    const bestDistance = haversineKm(coordinate, best.coordinate);
    return candidateDistance < bestDistance ? candidate : best;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildRoutes(start: LatLng, end: LatLng): RouteOption[] {
  const shadeAnchors = LANDMARKS.filter((place) =>
    ["Парк Панфиловцев", "Площадь Абая", "Нижний парк Кок-Тобе"].includes(place.name)
  );

  const comfortAnchors = LANDMARKS.filter((place) =>
    ["Мега Алма-Ата", "Есентай Молл", "Центральный стадион Алматы", "Автовокзал Сайран"].includes(place.name)
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
      title: "Самый безопасный",
      subtitle: "Меньше тепловой нагрузки, больше зелени и удобных мест для передышки.",
      color: "#2dd4bf",
      coordinates: safestCoordinates,
      distanceKm: safestDistance.toFixed(1),
      durationMin: Math.round((safestDistance / 4.2) * 60),
    },
    {
      id: "comfortable",
      title: "Комфортный",
      subtitle: "Более плавный маршрут для коляски с мягкими поворотами и уклоном.",
      color: "#84cc16",
      coordinates: comfortableCoordinates,
      distanceKm: comfortableDistance.toFixed(1),
      durationMin: Math.round((comfortableDistance / 4.6) * 60),
    },
    {
      id: "fastest",
      title: "Самый быстрый",
      subtitle: "Более прямой путь, если лестницы и подъемы приемлемы.",
      color: "#f97316",
      coordinates: fastestCoordinates,
      distanceKm: fastestDistance.toFixed(1),
      durationMin: Math.round((fastestDistance / 5.4) * 60),
    },
  ];
}

function createGuestProfile(): UserProfile {
  return {
    name: "Guest",
    full_name: "Guest",
    email: "guest@example.com",
  };
}

function toUserProfile(user: UserResponse): UserProfile {
  return {
    id: user.id,
    name: user.full_name,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };
}

function readErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return fallback;
}

export default function App() {
  const { height: windowHeight } = useWindowDimensions();
  const statusBarInset = StatusBar.currentHeight ?? 0;
  const mapRef = useRef<MapView | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("map");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [authRedirectScreen, setAuthRedirectScreen] = useState<Exclude<Screen, "login" | "register">>("profile");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Гость",
    email: "guest@example.com",
  });
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const bottomPanelScrollRef = useRef<ScrollView | null>(null);
  const routeSummaryOpacity = useRef(new Animated.Value(0)).current;
  const routeSummaryTranslateY = useRef(new Animated.Value(-12)).current;
  const bottomPanelTranslateY = useRef(new Animated.Value(0)).current;
  const sheetOffsetRef = useRef(0);
  const scrollDragLastOffsetY = useRef(0);
  const [audience, setAudience] = useState<Audience>("heat");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [startPoint, setStartPoint] = useState<Place | null>(resolvePlace("Парк Панфиловцев") ?? null);
  const [endPoint, setEndPoint] = useState<Place | null>(resolvePlace("Мега Алма-Ата") ?? null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [hasBuiltRoutes, setHasBuiltRoutes] = useState(false);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId>(AUDIENCE_COPY.heat.recommended);
  const [sheetSnapLevel, setSheetSnapLevel] = useState<"collapsed" | "half" | "full">("half");
  const sheetSnapLevelRef = useRef<"collapsed" | "half" | "full">("half");
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(0);
  const [routeInputDialog, setRouteInputDialog] = useState<RouteInputDialog | null>(null);

  const recommendedRouteId = AUDIENCE_COPY[audience].recommended;
  const activeRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const showStartedJourneySummary = journeyStarted && !!activeRoute;
  const bottomSheetPeekHeight = SHEET_HEADER_HEIGHT;
  const bottomSheetHalfVisibleHeight = Math.min(Math.max(windowHeight * 0.44, 300), windowHeight * 0.56);
  const bottomSheetFullHeight = Math.min(windowHeight - statusBarInset - 28, windowHeight * 0.88);
  const snapOffsets = useMemo(
    () => ({
      collapsed: Math.max(bottomSheetFullHeight - bottomSheetPeekHeight, 0),
      half: Math.max(bottomSheetFullHeight - bottomSheetHalfVisibleHeight, 0),
      full: 0,
    }),
    [bottomSheetFullHeight, bottomSheetHalfVisibleHeight]
  );
  const backdropOpacity = bottomPanelTranslateY.interpolate({
    inputRange: [snapOffsets.full, snapOffsets.collapsed],
    outputRange: [0.3, 0],
    extrapolate: "clamp",
  });

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
    setAuthFailureHandler(() => {
      setIsAuthenticated(false);
      setUserProfile(createGuestProfile());
      setSessions([]);
      setProfileError(null);
      setCurrentScreen("map");
    });

    return () => {
      setAuthFailureHandler(null);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await getHealth();
        if (isMounted) {
          setSystemNotice(null);
        }
      } catch {
        if (isMounted) {
          setSystemNotice("Backend unavailable. Local route preview still works, but auth and profile actions may fail.");
        }
      }

      const accessToken = await getStoredAccessToken();

      if (!accessToken) {
        if (isMounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        const me = await getMe();

        if (isMounted) {
          setUserProfile(toUserProfile(me));
          setIsAuthenticated(true);
        }
      } catch (error) {
        const status = error && typeof error === "object" && "status" in error ? (error as { status?: number }).status : undefined;

        if (status === 0) {
          if (isMounted) {
            setIsBootstrapping(false);
          }
          return;
        }

        try {
          const refreshed = await refreshTokens();

          if (isMounted) {
            setUserProfile(toUserProfile(refreshed.user));
            setIsAuthenticated(true);
          }
        } catch (refreshError) {
          const refreshStatus =
            refreshError && typeof refreshError === "object" && "status" in refreshError
              ? (refreshError as { status?: number }).status
              : undefined;

          if (refreshStatus !== 0) {
            await clearStoredTokens();
          }
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (currentScreen !== "profile" || !isAuthenticated) {
      return;
    }

    let isMounted = true;

    async function loadProfileScreenData() {
      setIsLoadingSessions(true);
      setProfileError(null);

      const [profileResult, sessionsResult] = await Promise.allSettled([getProfile(), listSessions()]);

      if (!isMounted) {
        return;
      }

      if (profileResult.status === "fulfilled") {
        setUserProfile(toUserProfile(profileResult.value));
      } else if (readErrorMessage(profileResult.reason, "").length > 0) {
        setProfileError(readErrorMessage(profileResult.reason, "Unable to load your profile."));
      }

      if (sessionsResult.status === "fulfilled") {
        setSessions(sessionsResult.value.items);
      } else {
        setSessions([]);
        setProfileError((currentError) => currentError ?? readErrorMessage(sessionsResult.reason, "Unable to load sessions."));
      }

      setIsLoadingSessions(false);
    }

    void loadProfileScreenData();

    return () => {
      isMounted = false;
    };
  }, [currentScreen, isAuthenticated]);

  useEffect(() => {
    bottomPanelTranslateY.setValue(snapOffsets.half);
    sheetOffsetRef.current = snapOffsets.half;
    sheetSnapLevelRef.current = "half";
    setSheetSnapLevel("half");
    bottomPanelScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [bottomPanelTranslateY, snapOffsets.half]);

  useEffect(() => {
    setSheetVisibleHeight(bottomSheetFullHeight - snapOffsets.half);
  }, [bottomSheetFullHeight, snapOffsets.half]);

  useEffect(() => {
    let lastReportedHeight = -1;
    const listenerId = bottomPanelTranslateY.addListener(({ value }) => {
      const nextVisibleHeight = Math.round(bottomSheetFullHeight - value);

      if (Math.abs(nextVisibleHeight - lastReportedHeight) >= 6) {
        lastReportedHeight = nextVisibleHeight;
        setSheetVisibleHeight(nextVisibleHeight);
      }
    });

    return () => {
      bottomPanelTranslateY.removeListener(listenerId);
    };
  }, [bottomPanelTranslateY, bottomSheetFullHeight]);

  useEffect(() => {
    if (showStartedJourneySummary) {
      bottomPanelScrollRef.current?.scrollTo({ y: 0, animated: false });
      routeSummaryOpacity.setValue(0);
      routeSummaryTranslateY.setValue(-12);

      Animated.parallel([
        Animated.timing(routeSummaryOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(routeSummaryTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    routeSummaryOpacity.setValue(0);
    routeSummaryTranslateY.setValue(-12);
  }, [routeSummaryOpacity, routeSummaryTranslateY, showStartedJourneySummary]);

  function animateSheetTo(targetValue: number, velocity = 0) {
    const nextTarget = clamp(targetValue, snapOffsets.full, snapOffsets.collapsed);
    const nextSnapLevel =
      nextTarget === snapOffsets.full ? "full" : nextTarget === snapOffsets.half ? "half" : "collapsed";

    Animated.spring(bottomPanelTranslateY, {
      toValue: nextTarget,
      velocity,
      tension: 80,
      friction: 14,
      useNativeDriver: true,
    }).start(() => {
      sheetOffsetRef.current = nextTarget;
      sheetSnapLevelRef.current = nextSnapLevel;
      setSheetSnapLevel(nextSnapLevel);
      if (nextSnapLevel !== "full") {
        bottomPanelScrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }

  function getSnapTarget(currentOffset: number, velocityY: number) {
    const orderedSnapPoints = [snapOffsets.full, snapOffsets.half, snapOffsets.collapsed];

    if (velocityY <= -0.7) {
      const moreOpen = orderedSnapPoints.find((point) => point < currentOffset - 8);
      return moreOpen ?? snapOffsets.full;
    }

    if (velocityY >= 0.7) {
      const moreClosed = [...orderedSnapPoints].reverse().find((point) => point > currentOffset + 8);
      return moreClosed ?? snapOffsets.collapsed;
    }

    return orderedSnapPoints.reduce((nearest, point) =>
      Math.abs(point - currentOffset) < Math.abs(nearest - currentOffset) ? point : nearest
    );
  }

  const bottomPanelPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => sheetSnapLevelRef.current !== "full",
        onStartShouldSetPanResponderCapture: () => sheetSnapLevelRef.current !== "full",

        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (sheetSnapLevelRef.current !== "full") {
            return Math.abs(gestureState.dy) > 4;
          }
          const scrollIsAtTop = scrollDragLastOffsetY.current <= 0;
          const isDraggingDown = gestureState.dy > 6;
          return scrollIsAtTop && isDraggingDown;
        },

        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          if (sheetSnapLevelRef.current !== "full") {
            return Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.1;
          }
          return false;
        },

        onPanResponderGrant: () => {
          bottomPanelTranslateY.stopAnimation((value) => {
            sheetOffsetRef.current = typeof value === "number" ? value : 0;
          });
        },

        onPanResponderMove: (_, gestureState) => {
          const rawValue = sheetOffsetRef.current + gestureState.dy;
          const nextValue =
            rawValue < snapOffsets.full
              ? snapOffsets.full - (snapOffsets.full - rawValue) * 0.22
              : rawValue > snapOffsets.collapsed
                ? snapOffsets.collapsed + (rawValue - snapOffsets.collapsed) * 0.22
                : rawValue;
          bottomPanelTranslateY.setValue(nextValue);
        },

        onPanResponderRelease: (_, gestureState) => {
          const currentValue = clamp(sheetOffsetRef.current + gestureState.dy, snapOffsets.full, snapOffsets.collapsed);
          sheetOffsetRef.current = currentValue;
          animateSheetTo(getSnapTarget(currentValue, gestureState.vy), gestureState.vy);
        },
      }),
    [bottomPanelTranslateY, snapOffsets.collapsed, snapOffsets.full, snapOffsets.half]
  );

  useEffect(() => {
    if (!startPoint || !endPoint || !hasBuiltRoutes || routes.length === 0) {
      return;
    }

    const visibleRoutes = journeyStarted
      ? routes.filter((route) => route.id === selectedRouteId)
      : routes;

    const allCoordinates = [startPoint.coordinate, endPoint.coordinate, ...visibleRoutes.flatMap((route) => route.coordinates)];
    const bottomPadding = Math.max(sheetVisibleHeight + 24, 88);

    mapRef.current?.fitToCoordinates(allCoordinates, {
      edgePadding: {
        top: showStartedJourneySummary ? 180 : 120,
        right: 60,
        bottom: showStartedJourneySummary ? Math.max(bottomPadding - 32, 96) : bottomPadding,
        left: 60,
      },
      animated: true,
    });
  }, [endPoint, hasBuiltRoutes, journeyStarted, routes, selectedRouteId, sheetVisibleHeight, showStartedJourneySummary, startPoint]);

  const examples = useMemo(() => LANDMARKS.slice(0, 6), []);

  function deriveNameFromEmail(email: string) {
    const emailPrefix = email.trim().split("@")[0];
    return emailPrefix || "Пользователь";
  }

  function openProfileEntry() {
    if (isBootstrapping) {
      return;
    }

    if (isAuthenticated) {
      setCurrentScreen("profile");
      return;
    }

    setAuthRedirectScreen("profile");
    setCurrentScreen("login");
  }

  function handleLogin({ email }: { email: string }) {
    const normalizedEmail = email.trim() || "guest@example.com";

    setUserProfile((currentProfile) => ({
      name: currentProfile.name === "Гость" ? deriveNameFromEmail(normalizedEmail) : currentProfile.name,
      email: normalizedEmail,
    }));
    setIsAuthenticated(true);
    setCurrentScreen(authRedirectScreen);
  }

  function handleRegister({ name, email }: { name: string; email: string }) {
    const normalizedName = name.trim() || "Пользователь";
    const normalizedEmail = email.trim() || "guest@example.com";

    setUserProfile({
      name: normalizedName,
      email: normalizedEmail,
    });
    setIsAuthenticated(true);
    setCurrentScreen(authRedirectScreen);
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setUserProfile({
      name: "Гость",
      email: "guest@example.com",
    });
    setCurrentScreen("map");
  }

  async function handleLoginRequest({ email, password }: { email: string; password: string }) {
    const payload = await login(email.trim(), password);

    setUserProfile(toUserProfile(payload.user));
    setIsAuthenticated(true);
    setProfileError(null);
    setSessions([]);
    setCurrentScreen(authRedirectScreen);
  }

  async function handleRegisterRequest({
    full_name,
    email,
    password,
  }: {
    full_name: string;
    email: string;
    password: string;
  }) {
    await register(full_name.trim(), email.trim(), password);

    const payload = await login(email.trim(), password);

    setUserProfile(toUserProfile(payload.user));
    setIsAuthenticated(true);
    setProfileError(null);
    setSessions([]);
    setCurrentScreen(authRedirectScreen);
  }

  async function handleLogoutRequest() {
    await logout();
    setIsAuthenticated(false);
    setUserProfile(createGuestProfile());
    setSessions([]);
    setProfileError(null);
    setCurrentScreen("map");
  }

  async function handleLogoutAllRequest() {
    await logoutAll();
    setIsAuthenticated(false);
    setUserProfile(createGuestProfile());
    setSessions([]);
    setProfileError(null);
    setCurrentScreen("map");
  }

  async function handleProfileSave(full_name: string) {
    const nextProfile = await updateProfile(full_name.trim());

    setUserProfile(toUserProfile(nextProfile));
  }

  function submitRouteSearch() {
    const resolvedStart = resolvePlace(from);
    const resolvedEnd = resolvePlace(to);

    if (!resolvedStart || !resolvedEnd) {
      setRouteInputDialog({
        title: "Неизвестное место",
        message:
          "Используйте одну из предложенных точек Алматы или введите более близкое совпадение, например Парк Панфиловцев, Мега Алма-Ата или Площадь Абая.",
      });
      return;
    }

    if (resolvedStart.name === resolvedEnd.name) {
      setRouteInputDialog({
        title: "Выберите две разные точки",
        message: "Точка отправления и пункт назначения не могут совпадать.",
      });
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
        onLogin={handleLoginRequest}
        onNavigateToRegister={() => setCurrentScreen('register')}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onRegister={handleRegisterRequest}
        onNavigateToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === "profile") {
    return (
      <ProfileScreen
        full_name={userProfile.full_name ?? userProfile.name}
        email={userProfile.email}
        sessions={sessions}
        isLoadingSessions={isLoadingSessions}
        profileError={profileError}
        onSaveProfile={handleProfileSave}
        onBack={() => setCurrentScreen("map")}
        onLogout={handleLogoutRequest}
        onLogoutAll={handleLogoutAllRequest}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={ALMATY_REGION}
        showsCompass
        showsScale
        mapPadding={{
          top: statusBarInset + 12,
          right: 16,
          bottom: Math.max(sheetVisibleHeight + 16, 56),
          left: 16,
        }}
      >
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
        <Pressable style={styles.avatarButton} onPress={openProfileEntry}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {isBootstrapping ? "..." : isAuthenticated ? (userProfile.full_name ?? userProfile.name).trim().charAt(0).toUpperCase() || "U" : "?"}
            </Text>
            {isAuthenticated && (
              <View style={{
                position: "absolute",
                top: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#22c55e",
                borderWidth: 1.5,
                borderColor: "#ffffff",
              }} />
            )}
          </View>
        </Pressable>

        {showStartedJourneySummary && activeRoute ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.routeSummaryBanner,
              styles.routeSummaryBannerInline,
              {
                opacity: routeSummaryOpacity,
                transform: [{ translateY: routeSummaryTranslateY }],
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={styles.routeSummaryTime}>{formatDurationHours(activeRoute.durationMin)}</Text>
              <Text style={{ color: "#163f35", fontSize: 14, fontWeight: "600" }}>
                · {activeRoute.distanceKm} км
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {systemNotice ? (
        <View style={[styles.systemNoticeBanner, { top: statusBarInset + 72 }]}>
          <Text style={styles.systemNoticeText}>{systemNotice}</Text>
        </View>
      ) : null}

      <Animated.View
        pointerEvents={sheetSnapLevel === "collapsed" ? "none" : "auto"}
        style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => animateSheetTo(snapOffsets.collapsed)} />
      </Animated.View>

      <Animated.View
        {...bottomPanelPanResponder.panHandlers}
        style={[
          styles.bottomPanel,
          { height: bottomSheetFullHeight, transform: [{ translateY: bottomPanelTranslateY }] },
        ]}
      >
        <View style={styles.sheetHeader}>
          <View style={styles.grabber} />
        </View>

        <ScrollView
          ref={bottomPanelScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bottomPanelContent}
          scrollEnabled={sheetSnapLevel === "full"}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollDragLastOffsetY.current = e.nativeEvent.contentOffset.y;
          }}
        >
          <View style={styles.sheetHeaderSpacer} />

          <Text style={styles.panelTitle}>Планирование маршрута</Text>
          <Text style={styles.panelSubtitle}>
            Выберите начальную и конечную точки для построения оптимального пути.
          </Text>

          {hasBuiltRoutes && !journeyStarted ? (
            <View style={styles.routesSection}>
              {routes.map((route, index) => {
                const selected = route.id === selectedRouteId;
                const recommended = route.id === recommendedRouteId;

                return (
                  <Pressable
                    key={route.id}
                    style={[
                      styles.routeCard,
                      selected && styles.routeCardSelected,
                      { borderLeftWidth: 4, borderLeftColor: route.color },
                    ]}
                    onPress={() => {
                      setSelectedRouteId(route.id);
                      setJourneyStarted(false);
                      animateSheetTo(snapOffsets.half);
                    }}
                  >
                    <View style={styles.routeHeader}>
                      <View style={styles.routeTitleRow}>
                        <View style={[styles.routeNumber, { backgroundColor: route.color }]}>
                          <Text style={styles.routeNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.routeCopy}>
                          <Text style={styles.routeTitle}>{route.title === 'Safest' ? 'Безопасный' : route.title === 'Comfortable' ? 'Комфортный' : 'Быстрый'}</Text>
                          <Text style={styles.routeSubtitle}>{route.subtitle}</Text>
                        </View>
                      </View>
                      {recommended ? (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>Рекомендуется</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.routeStats}>
                      <Text style={styles.routeStat}>Расстояние: {route.distanceKm} км</Text>
                      <Text style={styles.routeStat}>Время: {formatDurationHours(route.durationMin)}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                style={[styles.primaryButton, styles.startButton]}
                onPress={() => {
                  setJourneyStarted(true);
                  animateSheetTo(snapOffsets.collapsed);
                }}
              >
                <Text style={styles.primaryButtonText}>Начать маршрут</Text>
              </Pressable>
            </View>
          ) : null}

          {hasBuiltRoutes && journeyStarted && activeRoute ? (
            <View style={styles.startedJourneyCard}>
              <Text style={styles.startedJourneyTitle}>Маршрут начат</Text>
              <Text style={styles.startedJourneyText}>
                Ваш маршрут «{activeRoute.title.toLowerCase()}» займет {formatDurationHours(activeRoute.durationMin)} и составит {activeRoute.distanceKm} км.
              </Text>
              <Text style={styles.startedJourneyEta}>Ожидаемое время прибытия: {etaText}.</Text>
            </View>
          ) : null}

          <View style={{ borderLeftWidth: 3, borderColor: "#2563eb", borderRadius: 14, marginBottom: 8 }}>
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="Откуда?"
              placeholderTextColor="#7c8f88"
              style={[styles.input, { marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
            />
          </View>
          
          <View style={{ borderLeftWidth: 3, borderColor: "#dc2626", borderRadius: 14, marginBottom: 8 }}>
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="Куда?"
              placeholderTextColor="#7c8f88"
              style={[styles.input, { marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
            />
          </View>

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
                { id: "heat", label: "Тень" },
                { id: "stroller", label: "Коляска" },
                { id: "mobile", label: "Скорость" },
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
            <Text style={styles.primaryButtonText}>Построить маршруты</Text>
          </Pressable>

          {hasBuiltRoutes && startPoint && endPoint && activeRoute ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Активный маршрут: {activeRoute.title}</Text>
              <Text style={styles.summaryText}>
                {startPoint.name} до {endPoint.name}, расстояние {activeRoute.distanceKm} км, примерное время {formatDurationHours(activeRoute.durationMin)}.
                {journeyStarted ? " Остальные линии маршрутов скрыты." : ""}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>

      <Modal
        transparent
        animationType="fade"
        visible={routeInputDialog !== null}
        onRequestClose={() => setRouteInputDialog(null)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{routeInputDialog?.title}</Text>
            <Text style={styles.dialogMessage}>{routeInputDialog?.message}</Text>
            <Pressable style={styles.dialogButton} onPress={() => setRouteInputDialog(null)}>
              <Text style={styles.dialogButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#d9e6e1",
  },
  topOverlay: {
    position: "absolute",
    top: (StatusBar.currentHeight ?? 0) + 10,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    zIndex: 6,
  },
  avatarButton: {
    borderRadius: 999,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1.5,
    borderColor: "rgba(22, 63, 53, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0e241f",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: {
    color: "#163f35",
    fontSize: 18,
    fontWeight: "800",
  },
  systemNoticeBanner: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255, 243, 242, 0.96)",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  systemNoticeText: {
    color: "#8a1c12",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  routeSummaryBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  routeSummaryBannerInline: {
    flex: 1,
  },
  routeSummaryTime: {
    color: "#163f35",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 21, 18, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "rgba(248, 252, 250, 0.98)",
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#0e241f",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  dialogTitle: {
    color: "#11201c",
    fontSize: 18,
    fontWeight: "800",
  },
  dialogMessage: {
    marginTop: 10,
    color: "#37524b",
    fontSize: 14,
    lineHeight: 20,
  },
  dialogButton: {
    alignSelf: "flex-end",
    marginTop: 18,
    minWidth: 88,
    borderRadius: 999,
    backgroundColor: "#163f35",
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
  },
  dialogButtonText: {
    color: "#f5fbf8",
    fontSize: 14,
    fontWeight: "700",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#081512",
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#f7faf8",
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(180, 210, 200, 0.5)",
  },
  bottomPanelContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  sheetHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: "rgba(248, 252, 250, 0.98)",
    paddingBottom: 12,
    paddingHorizontal: 0,
    paddingTop: 8,
    height: SHEET_HEADER_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHeaderSpacer: {
    height: SHEET_HEADER_HEIGHT,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#b0c4bc",
    marginTop: 6,
    marginBottom: 2,
  },
  panelTitle: {
    color: "#0d1c18",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.3,
  },
  panelSubtitle: {
    color: "#6b8278",
    marginTop: 3,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 0,
    borderRadius: 14,
    backgroundColor: "#eef4f1",
    color: "#11201c",
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 8,
    fontSize: 15,
  },
  exampleRow: {
    gap: 8,
    paddingVertical: 6,
  },
  exampleChip: {
    borderRadius: 999,
    backgroundColor: "#eef4f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleChipText: {
    color: "#3d5c52",
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
    backgroundColor: "#eef4f1",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 0,
  },
  audienceChipActive: {
    backgroundColor: "#163f35",
  },
  audienceChipText: {
    color: "#3d5c52",
    fontSize: 13,
    fontWeight: "600",
  },
  audienceChipTextActive: {
    color: "#ffffff",
  },
  audienceHelper: {
    color: "#5a746b",
    marginTop: 10,
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: "#163f35",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 4,
    shadowColor: "#163f35",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  routesSection: {
    marginBottom: 16,
    gap: 10,
  },
  startButton: {
    marginTop: 2,
  },
  routeCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#0e2420",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  routeCardSelected: {
    borderColor: "#163f35",
    backgroundColor: "#f2f9f6",
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
