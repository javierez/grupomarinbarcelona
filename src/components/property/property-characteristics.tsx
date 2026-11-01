"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  buildCharacteristicGroups,
  type CharGroup,
  type Chip,
  type InfoRow,
} from "./characteristics-data";
import { isAccount139 } from "~/lib/account-overrides/139";

export type CharacteristicsLayout = "sections" | "flat";
export type CharacteristicsStyle =
  | "default"
  | "boxed"
  | "emphasized"
  | "twotone";

interface PropertyCharacteristicsProps {
  property: any;
  layout?: CharacteristicsLayout;
  style?: CharacteristicsStyle;
}

/** Renders a set of "label: value" rows according to the selected style. */
function InfoRows({
  rows,
  style,
}: {
  rows: InfoRow[];
  style: CharacteristicsStyle;
}) {
  if (rows.length === 0) return null;

  if (style === "boxed") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-lg border border-border/60 p-4"
          >
            <span className="block text-[11px] font-medium uppercase tracking-eyebrow text-muted-foreground">
              {r.label}
            </span>
            <span className="mt-1 block text-lg font-medium tracking-tight text-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (style === "emphasized") {
    return (
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="border-b border-border/40 pb-3">
            <span className="block text-[11px] font-medium uppercase tracking-eyebrow text-muted-foreground">
              {r.label}
            </span>
            <span className="mt-1 block text-base font-semibold tracking-tight text-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (style === "twotone") {
    return (
      <div className="overflow-hidden rounded-lg border border-border/60">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              "flex items-center justify-between px-4 py-3",
              i % 2 === 1 ? "bg-muted/40" : "bg-background",
            )}
          >
            <span className="text-sm font-medium text-muted-foreground">
              {r.label}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // default — today's layout
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between border-b border-border/60 px-2 py-3.5"
        >
          <span className="font-medium">{r.label}</span>
          <span className="text-sm">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Renders feature chips (icon + label). Consistent across styles. */
function Chips({ chips }: { chips: Chip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {chips.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-transparent p-3"
          >
            <Icon className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-medium text-foreground">
              {c.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** One titled group: heading + its rows + its chips. */
function GroupBlock({
  group,
  style,
}: {
  group: CharGroup;
  style: CharacteristicsStyle;
}) {
  const Icon = group.icon;
  return (
    <div>
      {group.title && (
        <h3 className="mb-5 flex items-center gap-2 text-base font-medium uppercase tracking-eyebrow text-muted-foreground">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {group.title}
        </h3>
      )}
      <InfoRows rows={group.rows} style={style} />
      {group.rows.length > 0 && group.chips.length > 0 ? (
        <div className="mt-4">
          <Chips chips={group.chips} />
        </div>
      ) : (
        <Chips chips={group.chips} />
      )}
    </div>
  );
}

export function PropertyCharacteristics({
  property,
  layout = "sections",
  style = "default",
}: PropertyCharacteristicsProps) {
  const [showAll, setShowAll] = useState(false);
  const groups = buildCharacteristicGroups(property);
  // Account 139: keep the per-type sections but show them all up front, with no
  // "Ver más características" toggle.
  const expanded = isAccount139();

  if (groups.length === 0) return null;

  return (
    <div>
      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Detalles
      </span>
      <h2 className="mb-8 text-2xl font-medium tracking-tight text-foreground">
        Características
      </h2>

      {layout === "flat" ? (
        <FlatLayout groups={groups} style={style} />
      ) : (
        <SectionsLayout
          groups={groups}
          style={style}
          showAll={showAll}
          onToggle={() => setShowAll((v) => !v)}
          expanded={expanded}
        />
      )}
    </div>
  );
}

/** All detail rows in one block, all feature chips in another. No titles/toggle. */
function FlatLayout({
  groups,
  style,
}: {
  groups: CharGroup[];
  style: CharacteristicsStyle;
}) {
  const rows = groups.flatMap((g) => g.rows);
  const chips = groups.flatMap((g) => g.chips);
  return (
    <div className="space-y-6">
      <InfoRows rows={rows} style={style} />
      <Chips chips={chips} />
    </div>
  );
}

/** Today's grouped layout: `always` groups, then the rest behind a toggle. */
function SectionsLayout({
  groups,
  style,
  showAll,
  onToggle,
  expanded = false,
}: {
  groups: CharGroup[];
  style: CharacteristicsStyle;
  showAll: boolean;
  onToggle: () => void;
  /** Show every group up front with no toggle (the "rest" is never hidden). */
  expanded?: boolean;
}) {
  const always = groups.filter((g) => g.always);
  const rest = groups.filter((g) => !g.always);

  // Expanded: render all groups, no "Ver más características" button.
  if (expanded) {
    return (
      <div className="space-y-6">
        {groups.map((g) => (
          <GroupBlock key={g.key} group={g} style={style} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {always.map((g) => (
        <GroupBlock key={g.key} group={g} style={style} />
      ))}

      {rest.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onToggle}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>{showAll ? "Mostrar menos" : "Ver más características"}</span>
            {showAll ? (
              <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        </div>
      )}

      {showAll &&
        rest.map((g) => <GroupBlock key={g.key} group={g} style={style} />)}
    </div>
  );
}
