import { ArrowRight, FolderTree, MonitorSmartphone, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { componentInventory, reviewRubric } from "@/lib/component-inventory";
import { kitCatalog, trackLabels } from "@/lib/kit-catalog";

const operatingSteps = [
  {
    title: "1. Open a worktree",
    detail: "Use the branch and local path shown on each card. Every v2 kit runs as its own isolated docs site.",
  },
  {
    title: "2. Start the preview",
    detail: "Run `npm run dev -- --port <port>` from the selected worktree to compare the kits side by side.",
  },
  {
    title: "3. Review against the rubric",
    detail: "Judge them on layout logic, appropriateness, contrast, and how convincingly the components compose.",
  },
];

export function ComparisonHub() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,white_45%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Comparison hub</Badge>
                <Badge variant="outline">10 independent v2 kits</Badge>
              </div>
              <div className="space-y-4">
                <CardTitle className="max-w-3xl text-4xl leading-tight sm:text-5xl">
                  Smart City + urban-adjacent UI kit review center
                </CardTitle>
                <CardDescription className="max-w-3xl text-base leading-7 text-slate-600">
                  The base branch now acts as the catalog and evaluation surface. The actual kits live in isolated
                  worktrees and share only the inventory contract and low-level shadcn primitives.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {operatingSteps.map((step) => (
                <Card key={step.title} className="border-slate-200 bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-slate-600">{step.detail}</CardContent>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <a href="#kit-directory">
                  Review the kit directory
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#inventory">Inspect the shared inventory</a>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Workflow className="size-5" />
                Review rubric
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-300">
                Each kit should feel like a plausible final direction, not a light restyle of the same docs frame.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewRubric.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-100"
                >
                  <span className="mr-3 inline-flex size-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <FolderTree className="size-5" />
                Worktree commands
              </CardTitle>
              <CardDescription>
                Every worktree is local and isolated under `.worktrees/`. Use the assigned port from the directory below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-950 p-4 font-mono text-slate-100">
                <p>cd .worktrees/&lt;slug&gt;</p>
                <p>npm run dev -- --port &lt;port&gt;</p>
              </div>
              <Separator />
              <p className="leading-6">
                Base branch purpose: catalog, rubric, and shared inventory contract. Worktree purpose: individual kit docs
                experience with its own page architecture, copy, and theme tokens.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <MonitorSmartphone className="size-5" />
                Validation focus
              </CardTitle>
              <CardDescription>
                Manual review should happen on small mobile and desktop widths after `lint` and `build`.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Accessibility</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Focus states, readable contrast, keyboard flow.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Distinctness</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Layout, chrome, motion, and documentation IA.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Completeness</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Shared inventory covered end to end.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Appropriateness</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Every kit suits its domain and stays production-credible.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="kit-directory" className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Kit directory</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Ten worktrees, ten reviewable directions</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {kitCatalog.map((kit) => (
              <Card key={kit.slug} className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={kit.track === "smart-city" ? "default" : "secondary"}>
                      {trackLabels[kit.track]}
                    </Badge>
                    <Badge variant="outline">{kit.styleFamily}</Badge>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{kit.title}</CardTitle>
                    <CardDescription className="text-sm leading-6 text-slate-600">{kit.summary}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Domain</p>
                      <p className="mt-2 font-medium text-slate-900">{kit.domain}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Port</p>
                      <p className="mt-2 font-medium text-slate-900">{kit.port}</p>
                    </div>
                  </div>
                  <div className="space-y-2 leading-6 text-slate-600">
                    <p>
                      <span className="font-medium text-slate-900">Branch:</span> {kit.branch}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Worktree:</span> {kit.worktreePath}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Status:</span> {kit.reviewStatus}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2 text-slate-700">
                    {kit.differentiators.map((item) => (
                      <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="inventory" className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Inventory contract</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Shared component coverage across all kits</h2>
          </div>
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Section</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="w-[340px]">Required items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {componentInventory.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell className="align-top font-semibold text-slate-900">{section.title}</TableCell>
                      <TableCell className="align-top text-sm leading-6 text-slate-600">{section.outcome}</TableCell>
                      <TableCell className="align-top text-sm leading-6 text-slate-700">
                        {section.items.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
