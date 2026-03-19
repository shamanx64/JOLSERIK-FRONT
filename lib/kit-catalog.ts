export type KitTrack = "smart-city" | "urban-adjacent";
export type ReviewStatus = "ready-for-review";

export type KitCatalogEntry = {
  slug: string;
  title: string;
  track: KitTrack;
  domain: string;
  styleFamily: string;
  branch: string;
  worktreePath: string;
  port: number;
  reviewStatus: ReviewStatus;
  summary: string;
  differentiators: string[];
};

export const kitCatalog: KitCatalogEntry[] = [
  {
    slug: "smart-city-glass-control-v2",
    title: "Glass Control",
    track: "smart-city",
    domain: "Citizen operations",
    styleFamily: "Glassmorphism",
    branch: "codex/smart-city-glass-control-v2",
    worktreePath: ".worktrees/smart-city-glass-control-v2",
    port: 4200,
    reviewStatus: "ready-for-review",
    summary:
      "Dark civic glass control room with frosted panels, bright telemetry, and fast operational feedback.",
    differentiators: ["Frosted telemetry chrome", "Dense command surface", "Dark-mode-first civic tone"],
  },
  {
    slug: "smart-city-stone-signal-v2",
    title: "Stone Signal",
    track: "smart-city",
    domain: "Public infrastructure",
    styleFamily: "Neumorphism",
    branch: "codex/smart-city-stone-signal-v2",
    worktreePath: ".worktrees/smart-city-stone-signal-v2",
    port: 4201,
    reviewStatus: "ready-for-review",
    summary:
      "Restrained tactile kit built on slate and stone surfaces with accessible soft-depth controls.",
    differentiators: ["Soft relief surfaces", "Tactile filter rail", "Muted mineral palette"],
  },
  {
    slug: "smart-city-district-bento-v2",
    title: "District Bento",
    track: "smart-city",
    domain: "Neighborhood services",
    styleFamily: "Bento grid",
    branch: "codex/smart-city-district-bento-v2",
    worktreePath: ".worktrees/smart-city-district-bento-v2",
    port: 4202,
    reviewStatus: "ready-for-review",
    summary:
      "Warm civic bento system for district-level services, events, and neighborhood operations.",
    differentiators: ["Asymmetric card layout", "Warm neutral canvas", "High-signal module grouping"],
  },
  {
    slug: "smart-city-civic-current-v2",
    title: "Civic Current",
    track: "smart-city",
    domain: "Utility and transit accounts",
    styleFamily: "Modern",
    branch: "codex/smart-city-civic-current-v2",
    worktreePath: ".worktrees/smart-city-civic-current-v2",
    port: 4203,
    reviewStatus: "ready-for-review",
    summary:
      "Crisp modern product system for operational public-service accounts with clear action hierarchy.",
    differentiators: ["Product-grade clarity", "Blue/slate utility language", "Balanced mobile density"],
  },
  {
    slug: "smart-city-quiet-bureau-v2",
    title: "Quiet Bureau",
    track: "smart-city",
    domain: "Public service forms",
    styleFamily: "Minimalism",
    branch: "codex/smart-city-quiet-bureau-v2",
    worktreePath: ".worktrees/smart-city-quiet-bureau-v2",
    port: 4204,
    reviewStatus: "ready-for-review",
    summary:
      "Paper-toned bureaucratic minimalism focused on clarity, typographic hierarchy, and public-service trust.",
    differentiators: ["Typography-first layout", "Quiet editorial spacing", "Low-noise service forms"],
  },
  {
    slug: "urban-mobility-studio-v2",
    title: "Mobility Studio",
    track: "urban-adjacent",
    domain: "Urban mobility platform",
    styleFamily: "Editorial mobility",
    branch: "codex/urban-mobility-studio-v2",
    worktreePath: ".worktrees/urban-mobility-studio-v2",
    port: 4205,
    reviewStatus: "ready-for-review",
    summary:
      "Editorial transport interface with kinetic hierarchy, route urgency, and hard-contrast control surfaces.",
    differentiators: ["Directional rhythm", "Transit-style typographic tension", "High-contrast cards"],
  },
  {
    slug: "urban-climate-orbit-v2",
    title: "Climate Orbit",
    track: "urban-adjacent",
    domain: "Climate resilience platform",
    styleFamily: "Scientific eco-tech",
    branch: "codex/urban-climate-orbit-v2",
    worktreePath: ".worktrees/urban-climate-orbit-v2",
    port: 4206,
    reviewStatus: "ready-for-review",
    summary:
      "Calm dark resilience kit with orbital data motifs and science-forward reporting structures.",
    differentiators: ["Orbital data framing", "Calm scientific palette", "Analytical reporting surfaces"],
  },
  {
    slug: "urban-grid-forge-v2",
    title: "Grid Forge",
    track: "urban-adjacent",
    domain: "Energy orchestration",
    styleFamily: "Industrial premium",
    branch: "codex/urban-grid-forge-v2",
    worktreePath: ".worktrees/urban-grid-forge-v2",
    port: 4207,
    reviewStatus: "ready-for-review",
    summary:
      "Industrial utility kit with forged materials, dense alarms, and controlled brutalist restraint.",
    differentiators: ["Heavy control-room surfaces", "Restrained alarm language", "Operational density"],
  },
  {
    slug: "urban-care-mesh-v2",
    title: "Care Mesh",
    track: "urban-adjacent",
    domain: "Digital care coordination",
    styleFamily: "Humane clinical",
    branch: "codex/urban-care-mesh-v2",
    worktreePath: ".worktrees/urban-care-mesh-v2",
    port: 4208,
    reviewStatus: "ready-for-review",
    summary:
      "Soft clinical system with trust-building forms, calmer alerts, and care-team orchestration patterns.",
    differentiators: ["Humane rounded surfaces", "Care-team messaging focus", "Clinical but warm"],
  },
  {
    slug: "urban-campus-wave-v2",
    title: "Campus Wave",
    track: "urban-adjacent",
    domain: "Public education platform",
    styleFamily: "Contemporary campus",
    branch: "codex/urban-campus-wave-v2",
    worktreePath: ".worktrees/urban-campus-wave-v2",
    port: 4209,
    reviewStatus: "ready-for-review",
    summary:
      "Contemporary campus kit with collaborative modules, optimistic structure, and practical academic tools.",
    differentiators: ["Collaborative learning cards", "Layered module rhythm", "Optimistic civic-education tone"],
  },
];

export const trackLabels: Record<KitTrack, string> = {
  "smart-city": "Smart City",
  "urban-adjacent": "Urban-adjacent",
};
