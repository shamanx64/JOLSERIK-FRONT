export type InventorySection = {
  id: string;
  title: string;
  outcome: string;
  items: string[];
};

export const componentInventory: InventorySection[] = [
  {
    id: "foundations",
    title: "Foundations",
    outcome: "Tokenize the visual system before styling individual screens.",
    items: ["Color scale", "Typography pair", "Spacing rhythm", "Radius system", "Elevation model"],
  },
  {
    id: "actions",
    title: "Actions",
    outcome: "Expose clear hierarchy for primary, secondary, and utility interaction states.",
    items: ["Buttons", "Badges", "Tabs", "Toggle group"],
  },
  {
    id: "forms",
    title: "Forms",
    outcome: "Demonstrate input clarity, validation, and operator-friendly density.",
    items: ["Input", "Textarea", "Select", "Checkbox", "Switch", "Validation states"],
  },
  {
    id: "navigation",
    title: "Navigation",
    outcome: "Show how the kit organizes discovery, orientation, and quick actions.",
    items: ["Top navigation", "Sidebar shell", "Breadcrumb", "Command entry"],
  },
  {
    id: "feedback",
    title: "Feedback",
    outcome: "Prove alerts, empty states, and overlays feel native to the kit instead of bolted on.",
    items: ["Alert", "Toast", "Empty state", "Skeleton", "Modal or sheet"],
  },
  {
    id: "data",
    title: "Data",
    outcome: "Keep analytics readable without flattening the visual identity.",
    items: ["Stat cards", "Table", "Chart shell"],
  },
  {
    id: "composition",
    title: "Composition",
    outcome: "Combine primitives into 2-3 larger examples that feel implementation-ready.",
    items: ["Composite card set", "Operational module", "Scenario summary"],
  },
];

export const reviewRubric = [
  "Distinct layout logic rather than token swaps on the same frame.",
  "Readable contrast, visible focus states, and comfortable interaction sizing.",
  "No colorful gradients on white backgrounds.",
  "Production-worthy tone for the domain, not a disconnected style exercise.",
  "Inventory completeness across foundations, actions, forms, navigation, feedback, data, and composition.",
];
