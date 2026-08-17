import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/depot/AppShell";
import { ExportButtons } from "@/components/depot/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees, useBatches, useDesignations } from "@/hooks/useAppData";
import { useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";

export const Route = createFileRoute("/app/designations")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Designation & Batch Management — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Create, rename and remove depot designations and working batches used across employee records.",
      },
      { property: "og:title", content: "Designation & Batch Management" },
      {
        property: "og:description",
        content: "Master lists of designations and batches for the SBC Coaching Depot.",
      },
    ],
  }),
  component: MasterDataPage,
});

type Kind = "designation" | "batch";

interface Row {
  name: string;
  count: number;
}

function MasterPanel({
  kind,
  items,
  counts,
  onSave,
  onDelete,
}: {
  kind: Kind;
  items: string[];
  counts: Record<string, number>;
  onSave: (oldName: string | null, name: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const label = kind === "designation" ? "Designation" : "Batch";

  const rows: Row[] = items.map((n) => ({ name: n, count: counts[n] ?? 0 }));

  const submit = async () => {
    const value = name.trim();
    if (!value) {
      setError(`${label} name is required.`);
      return;
    }
    if (items.some((i) => i.toLowerCase() === value.toLowerCase() && i !== editing)) {
      setError(`This ${label.toLowerCase()} already exists.`);
      return;
    }
    setIsLoading(true);
    try {
      await onSave(editing, value);
      setOpen(false);
      setError("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}s ({items.length})</h3>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            title={`${label}s`}
            rows={rows}
            pdf={false}
            columns={[
              { header: label, value: (r: Row) => r.name },
              { header: "Employees", value: (r: Row) => r.count },
            ]}
          />
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setName("");
              setError("");
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Add {label}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Name</th>
              <th className="py-2 pr-3 font-medium">Employees</th>
              <th className="py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3 font-medium">{row.name}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{row.count}</td>
                <td className="py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${row.name}`}
                    onClick={() => {
                      setEditing(row.name);
                      setName(row.name);
                      setError("");
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${row.name}`}
                    onClick={async () => setToDelete(row.name)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${label}` : `Add ${label}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-name`}>{label} name</Label>
            <Input
              id={`${kind}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "designation" ? "Sr.Tech" : "Batch K"}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={isLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              This {label.toLowerCase()} will be removed from the dropdowns used on the
              employee form. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await onDelete(toDelete);
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MasterDataPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: batches = [] } = useBatches();
  const { data: designations = [] } = useDesignations();

  const designationCounts = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => (map[e.designation] = (map[e.designation] ?? 0) + 1));
    return map;
  }, [employees]);

  const batchCounts = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => (map[e.batch] = (map[e.batch] ?? 0) + 1));
    return map;
  }, [employees]);

  const saveDesignation = async (oldName: string | null, name: string) => {
    try {
      if (oldName) {
        await apiClient.updateDesignation(oldName, name);

      } else {
        await apiClient.createDesignation(name);

      }
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success(`Designation ${oldName ? "updated" : "added"}`);
    } catch (e) { toast.error("Error saving designation"); }
  };

  const saveBatch = async (oldName: string | null, name: string) => {
    try {
      if (oldName) {
        await apiClient.updateBatch(oldName, name);

      } else {
        await apiClient.createBatch(name);

      }
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast.success(`Batch ${oldName ? "updated" : "added"}`);
    } catch (e) { toast.error("Error saving batch"); }
  };

  const deleteDesignation = async (name: string) => {
    if ((designationCounts[name] ?? 0) > 0) {
      toast.error(
        `Cannot delete "${name}" — ${designationCounts[name]} employee(s) currently hold this designation.`,
      );
      return;
    }
    try {
      await apiClient.deleteDesignation(name);
      queryClient.invalidateQueries({ queryKey: ["designations"] });

      toast.success("Designation deleted");
    } catch (e) { toast.error("Error deleting designation"); }
  };

  const deleteBatch = async (name: string) => {
    if ((batchCounts[name] ?? 0) > 0) {
      toast.error(
        `Cannot delete "${name}" — ${batchCounts[name]} employee(s) are currently in this batch.`,
      );
      return;
    }
    try {
      await apiClient.deleteBatch(name);
      queryClient.invalidateQueries({ queryKey: ["batches"] });

      toast.success("Batch deleted");
    } catch (e) { toast.error("Error deleting batch"); }
  };

  return (
    <AppShell
      title="Designation & Batch Management"
      subtitle="Master lists that feed the employee form dropdowns"
    >
      <Tabs defaultValue="designations" className="lg:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="designations" className="flex-1">
            Designations
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex-1">
            Batches
          </TabsTrigger>
        </TabsList>
        <TabsContent value="designations" className="mt-4">
          <MasterPanel
            kind="designation"
            items={designations}
            counts={designationCounts}
            onSave={saveDesignation}
            onDelete={deleteDesignation}
          />
        </TabsContent>
        <TabsContent value="batches" className="mt-4">
          <MasterPanel
            kind="batch"
            items={batches}
            counts={batchCounts}
            onSave={saveBatch}
            onDelete={deleteBatch}
          />
        </TabsContent>
      </Tabs>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <MasterPanel
          kind="designation"
          items={designations}
          counts={designationCounts}
          onSave={saveDesignation}
          onDelete={deleteDesignation}
        />
        <MasterPanel
          kind="batch"
          items={batches}
          counts={batchCounts}
          onSave={saveBatch}
          onDelete={deleteBatch}
        />
      </div>
    </AppShell>
  );
}
