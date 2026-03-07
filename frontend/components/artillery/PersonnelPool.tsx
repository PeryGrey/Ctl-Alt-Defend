"use client";
import { Card, CardContent } from "@/_shadcn/components/ui/card";
import { Button } from "@/_shadcn/components/ui/button";
import { Badge } from "@/_shadcn/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_shadcn/components/ui/select";
import type { Personnel, Weapon } from "@/engine/types";

interface PersonnelPoolProps {
  personnel: Personnel[];
  weapons: Weapon[];
  onAssign: (
    id: 0 | 1 | 2,
    weaponId: string,
    mode: "firing" | "maintaining",
  ) => void;
  onUnassign: (id: 0 | 1 | 2) => void;
}

const MODE_LABELS: Record<Personnel["mode"], string> = {
  idle: "Idle",
  firing: "Firing",
  maintaining: "Maintaining",
};

const LANE_SHORT: Record<string, string> = {
  moat_left: "Moat L",
  bridge_left: "Bridge L",
  bridge_right: "Bridge R",
  moat_right: "Moat R",
};

export function PersonnelPool({
  personnel,
  weapons,
  onAssign,
  onUnassign,
}: PersonnelPoolProps) {
  const activeWeapons = weapons.filter((w) => w.exists);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
        Personnel
      </p>
      {personnel.map((person) => (
        <Card key={person.id}>
          <CardContent className="py-3 px-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">
                Soldier {person.id + 1}
              </span>
              <Badge
                variant={
                  person.mode === "firing"
                    ? "default"
                    : person.mode === "maintaining"
                    ? "secondary"
                    : "outline"
                }
              >
                {MODE_LABELS[person.mode]}
              </Badge>
            </div>

            {person.weaponId ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Weapon:{" "}
                  <span className="font-mono">{person.weaponId.slice(-4)}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={person.mode === "firing" ? "default" : "outline"}
                    className="flex-1 h-9"
                    onClick={() =>
                      onAssign(person.id, person.weaponId!, "firing")
                    }
                  >
                    Fire
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      person.mode === "maintaining" ? "default" : "outline"
                    }
                    className="flex-1 h-9"
                    onClick={() =>
                      onAssign(person.id, person.weaponId!, "maintaining")
                    }
                  >
                    Maintain
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-3"
                    onClick={() => onUnassign(person.id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                onValueChange={(weaponId) =>
                  onAssign(person.id, weaponId, "firing")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Assign to weapon…" />
                </SelectTrigger>
                <SelectContent>
                  {activeWeapons.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No weapons available
                    </SelectItem>
                  )}
                  {activeWeapons.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {LANE_SHORT[w.laneId] ?? w.laneId} slot {w.slot + 1} ·{" "}
                      {w.id.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
