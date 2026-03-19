# Smart City UI Kits v2

This repository is the comparison hub for ten fully independent UI-kit docs sites. The base branch catalogs the kits, defines the shared inventory contract, and lists the local worktrees and preview ports. Each actual kit runs in its own `.worktrees/<slug>` directory on its own `codex/<slug>` branch.

## Base Branch

- Branch: `codex/ui-kit-base`
- Purpose: comparison hub, inventory contract, and review rubric
- Review spec: [docs/plans/2026-03-19-smart-city-ui-kits-v2-design.md](docs/plans/2026-03-19-smart-city-ui-kits-v2-design.md)

## Running A Kit

From any worktree:

```bash
npm run dev -- --port <port>
```

Suggested ports:

| Kit | Track | Style | Branch | Worktree | Port |
| --- | --- | --- | --- | --- | --- |
| Glass Control | Smart City | Glassmorphism | `codex/smart-city-glass-control-v2` | `.worktrees/smart-city-glass-control-v2` | `4200` |
| Stone Signal | Smart City | Neumorphism | `codex/smart-city-stone-signal-v2` | `.worktrees/smart-city-stone-signal-v2` | `4201` |
| District Bento | Smart City | Bento grid | `codex/smart-city-district-bento-v2` | `.worktrees/smart-city-district-bento-v2` | `4202` |
| Civic Current | Smart City | Modern | `codex/smart-city-civic-current-v2` | `.worktrees/smart-city-civic-current-v2` | `4203` |
| Quiet Bureau | Smart City | Minimalistic | `codex/smart-city-quiet-bureau-v2` | `.worktrees/smart-city-quiet-bureau-v2` | `4204` |
| Mobility Studio | Urban-adjacent | Editorial mobility | `codex/urban-mobility-studio-v2` | `.worktrees/urban-mobility-studio-v2` | `4205` |
| Climate Orbit | Urban-adjacent | Scientific eco-tech | `codex/urban-climate-orbit-v2` | `.worktrees/urban-climate-orbit-v2` | `4206` |
| Grid Forge | Urban-adjacent | Industrial premium | `codex/urban-grid-forge-v2` | `.worktrees/urban-grid-forge-v2` | `4207` |
| Care Mesh | Urban-adjacent | Humane clinical | `codex/urban-care-mesh-v2` | `.worktrees/urban-care-mesh-v2` | `4208` |
| Campus Wave | Urban-adjacent | Contemporary campus | `codex/urban-campus-wave-v2` | `.worktrees/urban-campus-wave-v2` | `4209` |

## Shared Inventory

Every kit must cover the same reviewable inventory:

- Foundations: color, typography, spacing, radius, elevation
- Actions: button set, badges, tabs, toggle group
- Forms: input, textarea, select, checkbox, switch, validation states
- Navigation: top nav, sidebar shell, breadcrumb, command entry
- Feedback: alert, toast, empty state, skeleton, modal or sheet
- Data: stat cards, table, chart shell
- Composition: 2-3 larger example modules

## Review Rubric

- Distinct layout logic, not token swaps on the same docs frame
- Clear focus states and readable contrast
- No colorful gradients on white backgrounds
- Production-worthy tone for the domain
- Full inventory coverage
