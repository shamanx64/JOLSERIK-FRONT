export function renderLayout(title, summary) {
  return `import type { Metadata } from "next";
import {
  DM_Sans,
  Fraunces,
  IBM_Plex_Sans,
  Outfit,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
} from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const plusJakartaSans = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "${title} UI Kit",
  description: "${summary.replace(/"/g, '\\"')}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={\`\${spaceGrotesk.variable} \${plusJakartaSans.variable} \${fraunces.variable} \${sora.variable} \${ibmPlexSans.variable} \${dmSans.variable} \${outfit.variable} antialiased\`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
`;
}

export function renderPage(kit) {
  return `"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  BellRing,
  Bookmark,
  Command as CommandIcon,
  Compass,
  Menu,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const page = ${JSON.stringify(kit, null, 2)} as const;

type Tone = "primary" | "accent" | "success" | "warning";
const toneClasses: Record<Tone, string> = {
  primary: "bg-[color:var(--kit-primary)] text-[color:var(--kit-primary-ink)]",
  accent: "bg-[color:var(--kit-accent)] text-[color:var(--kit-primary-ink)]",
  success: "bg-[color:var(--kit-success)] text-[color:var(--kit-primary-ink)]",
  warning: "bg-[color:var(--kit-warning)] text-[color:var(--kit-primary-ink)]",
};

function themeVars() {
  return {
    ["--kit-canvas" as string]: page.theme.canvas,
    ["--kit-panel" as string]: page.theme.panel,
    ["--kit-panel-strong" as string]: page.theme.panelStrong,
    ["--kit-ink" as string]: page.theme.ink,
    ["--kit-mute" as string]: page.theme.mute,
    ["--kit-line" as string]: page.theme.line,
    ["--kit-primary" as string]: page.theme.primary,
    ["--kit-primary-ink" as string]: page.theme.primaryInk,
    ["--kit-secondary" as string]: page.theme.secondary,
    ["--kit-accent" as string]: page.theme.accent,
    ["--kit-success" as string]: page.theme.success,
    ["--kit-warning" as string]: page.theme.warning,
    ["--kit-radius" as string]: page.theme.radius,
    ["--kit-shadow" as string]: page.theme.shadow,
  } as CSSProperties;
}

function panel(extra?: string) {
  return cn(
    "rounded-[var(--kit-radius)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] text-[color:var(--kit-ink)] shadow-[var(--kit-shadow)] backdrop-blur-sm",
    extra
  );
}

export default function Home() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>(page.toggles[0]);
  const [selectValue, setSelectValue] = useState<string>(page.form.selectOptions[0]);
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const vars = useMemo(() => themeVars(), []);
  const invalid = title.trim().length > 0 && title.trim().length < 5;
  const layout = page.layout as string;

  const rail = (
    <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-0 bg-[color:var(--kit-secondary)] text-[color:var(--kit-ink)]">{page.style}</Badge>
          <Badge variant="outline" className="border-[color:var(--kit-line)] text-[color:var(--kit-mute)]">{page.domain}</Badge>
        </div>
        <CardTitle className="text-4xl leading-tight">{page.title}</CardTitle>
        <CardDescription className="text-base leading-7 text-[color:var(--kit-mute)]">{page.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {page.nav.map((item) => (
            <Badge key={item} variant="outline" className="border-[color:var(--kit-line)] bg-transparent text-[color:var(--kit-ink)]">{item}</Badge>
          ))}
        </div>
        <div className="grid gap-3">
          {page.metrics.slice(0, 3).map(([label, value, trend, tone]) => (
            <div key={label} className="rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--kit-mute)]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
                <Badge className={cn("border-0", toneClasses[tone as Tone])}>{trend}</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="border-0 bg-[color:var(--kit-primary)] text-[color:var(--kit-primary-ink)]" onClick={() => setCommandOpen(true)}>
            <Search data-icon="inline-start" />
            Open command
          </Button>
          <Button variant="outline" className="border-[color:var(--kit-line)] bg-transparent" onClick={() => toast.success(page.alert.title, { description: page.alert.body })}>
            <BellRing data-icon="inline-start" />
            Toast
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const sections = {
    rail,
    foundations: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[color:var(--kit-mute)]"><Sparkles className="size-3.5" />Foundations</div>
          <CardTitle className="text-2xl">Tokens, type, and surfaces</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">The visual system sets the tone before components begin to compose.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {page.palette.map(([label, value]) => (
              <div key={label} className="rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-3">
                <div className="h-16 rounded-[calc(var(--kit-radius)-18px)]" style={{ backgroundColor: value }} />
                <p className="mt-3 text-sm font-medium">{label}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--kit-mute)]">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--kit-mute)]">Tone</p>
            <p className="text-3xl font-semibold">System typography</p>
            <p className="text-sm leading-6 text-[color:var(--kit-mute)]">Each worktree keeps the same inventory but uses its own rhythm, emphasis, and visual confidence.</p>
          </div>
        </CardContent>
      </Card>
    ),
    actions: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <CardTitle className="text-2xl">Actions</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">Buttons, tabs, and segmented choices establish interaction hierarchy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Button className="border-0 bg-[color:var(--kit-primary)] text-[color:var(--kit-primary-ink)]"><Send data-icon="inline-start" />Primary</Button>
            <Button variant="outline" className="border-[color:var(--kit-line)] bg-transparent">Secondary</Button>
            <Button variant="secondary" className="bg-[color:var(--kit-secondary)] text-[color:var(--kit-ink)]">Support</Button>
          </div>
          <Tabs defaultValue={page.tabs[0]} className="grid gap-4">
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-[calc(var(--kit-radius)-16px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-1">
              {page.tabs.map((tab) => <TabsTrigger key={tab} value={tab} className="rounded-[calc(var(--kit-radius)-20px)] data-[state=active]:bg-[color:var(--kit-primary)] data-[state=active]:text-[color:var(--kit-primary-ink)]">{tab}</TabsTrigger>)}
            </TabsList>
            {page.tabs.map((tab) => <TabsContent key={tab} value={tab} className="rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-4 text-sm leading-6 text-[color:var(--kit-mute)]">{tab} view documents state treatment and internal grouping.</TabsContent>)}
          </Tabs>
          <ToggleGroup type="single" value={selectedMode} onValueChange={(value) => value && setSelectedMode(value)} variant="outline" className="flex-wrap">
            {page.toggles.map((item) => <ToggleGroupItem key={item} value={item}>{item}</ToggleGroupItem>)}
          </ToggleGroup>
        </CardContent>
      </Card>
    ),
    forms: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <CardTitle className="text-2xl">Forms</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">Inputs, validation, and choice controls share one system language.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={invalid || undefined}>
              <FieldLabel htmlFor="kit-title">{page.form.titleLabel}</FieldLabel>
              <FieldContent>
                <Input id="kit-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={invalid} placeholder={page.form.titlePlaceholder} className="border-[color:var(--kit-line)] bg-[color:var(--kit-panel)]" />
                <FieldDescription>Short labels scan better across mobile and dense dashboards.</FieldDescription>
                <FieldError>{invalid ? page.form.validationMessage : undefined}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="kit-mode">{page.form.selectLabel}</FieldLabel>
              <FieldContent>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger id="kit-mode" className="w-full border-[color:var(--kit-line)] bg-[color:var(--kit-panel)]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectGroup><SelectLabel>Options</SelectLabel>{page.form.selectOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="kit-notes">{page.form.noteLabel}</FieldLabel>
              <FieldContent>
                <Textarea id="kit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={page.form.notePlaceholder} className="min-h-28 border-[color:var(--kit-line)] bg-[color:var(--kit-panel)]" />
              </FieldContent>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field orientation="horizontal"><Checkbox checked={checked} onCheckedChange={(value) => setChecked(Boolean(value))} /><FieldContent><FieldLabel>Ready for review</FieldLabel><FieldDescription>Use a checkbox for explicit confirmation.</FieldDescription></FieldContent></Field>
              <Field orientation="horizontal"><Switch checked={enabled} onCheckedChange={setEnabled} /><FieldContent><FieldLabel>Notify subscribers</FieldLabel><FieldDescription>Use a switch for persistent settings.</FieldDescription></FieldContent></Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    ),
    navigation: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <CardTitle className="text-2xl">Navigation</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">Top chrome, breadcrumbs, and a sidebar shell show how orientation works.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Breadcrumb>
            <BreadcrumbList>
              {page.breadcrumbs.map((item, index) => (
                <div key={item} className="contents">
                  <BreadcrumbItem>{index === page.breadcrumbs.length - 1 ? <BreadcrumbPage>{item}</BreadcrumbPage> : item}</BreadcrumbItem>
                  {index < page.breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-4">
            <div className="flex flex-wrap gap-2">
              {page.nav.map((item) => <Button key={item} variant="outline" className="border-[color:var(--kit-line)] bg-transparent">{item}</Button>)}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-4">
              <div className="flex items-center gap-3 text-sm font-medium"><Menu className="size-4 text-[color:var(--kit-mute)]" />Sidebar shell</div>
              <div className="mt-4 flex flex-col gap-2">
                {page.nav.map((item, index) => (
                  <div key={item} className={cn("rounded-[calc(var(--kit-radius)-18px)] border px-3 py-2 text-sm", index === 0 ? "border-transparent bg-[color:var(--kit-primary)] text-[color:var(--kit-primary-ink)]" : "border-[color:var(--kit-line)]")}>{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-[calc(var(--kit-radius)-14px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] p-4 text-sm leading-6 text-[color:var(--kit-mute)]">
              Command access, breadcrumbing, and product navigation are documented together so the kit can be judged as a real system rather than isolated widgets.
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    feedback: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <CardTitle className="text-2xl">Feedback</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">Alerts, overlays, empty states, and loading surfaces inherit the same tone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-[color:var(--kit-line)] bg-[color:var(--kit-panel)]">
            <Activity className="size-4 text-[color:var(--kit-primary)]" />
            <AlertTitle>{page.alert.title}</AlertTitle>
            <AlertDescription>{page.alert.body}</AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" className="border-[color:var(--kit-line)] bg-transparent">Open modal</Button></DialogTrigger>
              <DialogContent className="border-[color:var(--kit-line)] bg-[color:var(--kit-panel-strong)] text-[color:var(--kit-ink)]">
                <DialogHeader>
                  <DialogTitle>{page.title} modal</DialogTitle>
                  <DialogDescription className="text-[color:var(--kit-mute)]">This overlay previews how confirmations and detail views inherit the kit language.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild><Button variant="outline" className="border-[color:var(--kit-line)] bg-transparent">Open sheet</Button></SheetTrigger>
              <SheetContent className="border-[color:var(--kit-line)] bg-[color:var(--kit-panel-strong)] text-[color:var(--kit-ink)]">
                <SheetHeader>
                  <SheetTitle>{page.title} side panel</SheetTitle>
                  <SheetDescription className="text-[color:var(--kit-mute)]">Side panels work for detail, command help, or review notes.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
          <Empty className="border-[color:var(--kit-line)] bg-[color:var(--kit-panel)]">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Bookmark className="size-4" /></EmptyMedia>
              <EmptyTitle>{page.empty.title}</EmptyTitle>
              <EmptyDescription>{page.empty.body}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button className="border-0 bg-[color:var(--kit-primary)] text-[color:var(--kit-primary-ink)]">{page.empty.cta}</Button></EmptyContent>
          </Empty>
          <div className="grid gap-3">
            <Skeleton className="h-4 w-36 bg-[color:var(--kit-secondary)]" />
            <Skeleton className="h-20 rounded-[calc(var(--kit-radius)-14px)] bg-[color:var(--kit-secondary)]" />
            <Skeleton className="h-20 rounded-[calc(var(--kit-radius)-14px)] bg-[color:var(--kit-secondary)]" />
          </div>
        </CardContent>
      </Card>
    ),
    data: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <CardTitle className="text-2xl">Data</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">Metrics, chart shells, and tables prove the kit can carry analytical work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {page.metrics.map(([label, value, trend, tone]) => (
              <Card key={label} className={panel("bg-[color:var(--kit-panel)]")}>
                <CardHeader className="pb-3"><CardDescription className="text-[color:var(--kit-mute)]">{label}</CardDescription></CardHeader>
                <CardContent className="flex items-end justify-between gap-4"><div className="text-3xl font-semibold">{value}</div><Badge className={cn("border-0", toneClasses[tone as Tone])}>{trend}</Badge></CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className={panel("bg-[color:var(--kit-panel)]")}>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Chart shell</CardTitle></CardHeader>
              <CardContent className="flex min-h-56 items-end gap-3">
                {page.bars.map(([label, value, tone]) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-3">
                    <div className={cn("w-full rounded-t-[18px]", toneClasses[tone as Tone])} style={{ height: String(Math.max(24, value * 1.6)) + "px" }} />
                    <div className="text-center"><p className="text-sm font-medium">{label}</p><p className="text-xs text-[color:var(--kit-mute)]">{value}%</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className={panel("overflow-hidden bg-[color:var(--kit-panel)]")}>
              <Table>
                <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>State</TableHead><TableHead>Metric</TableHead><TableHead>Owner</TableHead></TableRow></TableHeader>
                <TableBody>
                  {page.table.map(([name, state, metric, owner]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell><TableCell>{state}</TableCell><TableCell>{metric}</TableCell><TableCell className="text-[color:var(--kit-mute)]">{owner}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </CardContent>
      </Card>
    ),
    composition: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader>
          <CardTitle className="text-2xl">Composition</CardTitle>
          <CardDescription className="text-[color:var(--kit-mute)]">Primitives become stronger domain modules here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {page.composition.map(([title, value, detail]) => (
            <Card key={title} className={panel("bg-[color:var(--kit-panel)]")}>
              <CardHeader className="pb-3"><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">{title}</CardTitle><Badge className={cn("border-0", toneClasses.primary)}>{value}</Badge></div></CardHeader>
              <CardContent className="text-sm leading-6 text-[color:var(--kit-mute)]">{detail}</CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    ),
    command: (
      <Card className={panel("bg-[color:var(--kit-panel-strong)]")}>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><CommandIcon className="size-4 text-[color:var(--kit-mute)]" />Command entry</CardTitle><CardDescription className="text-[color:var(--kit-mute)]">Search, jump, and compare without leaving the surface.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {page.commands.map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-[calc(var(--kit-radius)-16px)] border border-[color:var(--kit-line)] bg-[color:var(--kit-panel)] px-3 py-2 text-sm"><span>{item}</span><CommandShortcut>{String(index + 1).padStart(2, "0")}</CommandShortcut></div>
          ))}
        </CardContent>
      </Card>
    ),
  };

  const layoutGroups: Record<string, string[][]> = {
    glass: [["rail", "command"], ["foundations", "actions"], ["navigation", "forms"], ["feedback", "data"], ["composition"]],
    stone: [["rail", "navigation", "command"], ["foundations", "forms"], ["actions", "data"], ["feedback", "composition"]],
    bento: [["foundations", "actions"], ["composition"], ["data"], ["rail", "forms", "navigation", "feedback", "command"]],
    current: [["rail", "actions"], ["foundations", "navigation"], ["forms", "feedback"], ["data", "composition"], ["command"]],
    bureau: [["rail", "command"], ["foundations"], ["forms", "navigation"], ["actions"], ["feedback", "data"], ["composition"]],
    mobility: [["rail", "navigation"], ["actions", "data"], ["composition", "feedback"], ["foundations", "forms"], ["command"]],
    orbit: [["rail", "navigation", "command"], ["foundations", "data"], ["forms", "actions"], ["composition"], ["feedback"]],
    forge: [["rail"], ["data", "actions"], ["forms", "navigation"], ["feedback", "composition"], ["command"]],
    care: [["rail", "feedback", "navigation", "command"], ["foundations", "actions"], ["forms"], ["data", "composition"]],
    campus: [["rail", "foundations", "navigation", "feedback", "command"], ["composition", "data"], ["forms"], ["actions"]],
  };

  return (
    <div style={{ ...vars, backgroundImage: page.theme.backgroundArt }} className="min-h-screen bg-[color:var(--kit-canvas)] text-[color:var(--kit-ink)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className={panel("bg-[color:var(--kit-panel-strong)]")}>
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-[color:var(--kit-mute)]">
                <Badge variant="outline" className="border-[color:var(--kit-line)] bg-transparent">{page.eyebrow}</Badge>
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kit-line)] px-3 py-1 text-xs uppercase tracking-[0.22em]"><Compass className="size-3.5" />Independent kit</div>
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{page.title}</h1>
                <p className="max-w-3xl text-base leading-7 text-[color:var(--kit-mute)]">{page.summary}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="border-0 bg-[color:var(--kit-primary)] text-[color:var(--kit-primary-ink)]" onClick={() => setCommandOpen(true)}><Search data-icon="inline-start" />Open command</Button>
                <Button variant="outline" className="border-[color:var(--kit-line)] bg-transparent" onClick={() => setSheetOpen(true)}><Menu data-icon="inline-start" />Open sheet</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {page.metrics.slice(0, 2).map(([label, value, trend, tone]) => (
                <Card key={label} className={panel("bg-[color:var(--kit-panel)]")}><CardHeader className="pb-3"><CardDescription className="text-[color:var(--kit-mute)]">{label}</CardDescription></CardHeader><CardContent className="flex items-end justify-between gap-4"><div className="text-3xl font-semibold">{value}</div><Badge className={cn("border-0", toneClasses[tone as Tone])}>{trend}</Badge></CardContent></Card>
              ))}
            </div>
          </CardContent>
        </header>
        <div className={cn("grid gap-6", layout === "glass" || layout === "forge" ? "xl:grid-cols-[18rem_minmax(0,1fr)]" : layout === "stone" ? "xl:grid-cols-[16rem_minmax(0,1fr)_16rem]" : layout === "orbit" || layout === "bureau" ? "xl:grid-cols-[minmax(0,1fr)_18rem]" : layout === "care" ? "xl:grid-cols-[0.92fr_1.08fr]" : "xl:grid-cols-[1.1fr_0.9fr]")}>
          {layoutGroups[layout as keyof typeof layoutGroups].map((group, index) => (
            <div key={index} className="space-y-6">
              {group.map((section) => <div key={section}>{sections[section as keyof typeof sections]}</div>)}
            </div>
          ))}
        </div>
      </div>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command className="rounded-none bg-[color:var(--kit-panel-strong)] text-[color:var(--kit-ink)]">
          <CommandInput placeholder={"Search " + page.title + " patterns"} />
          <CommandList>
            <CommandEmpty>No matching commands.</CommandEmpty>
            <CommandGroup heading="Quick jump">
              {page.commands.map((item, index) => <CommandItem key={item} onSelect={() => setCommandOpen(false)}>{item}<CommandShortcut>{String(index + 1).padStart(2, "0")}</CommandShortcut></CommandItem>)}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
`;
}
