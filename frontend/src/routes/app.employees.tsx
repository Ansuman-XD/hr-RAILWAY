import { useMemo, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookmarkCheck,
  BookmarkPlus,
  Eye,
  FilterX,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/depot/AppShell";
import { ExportButtons } from "@/components/depot/ExportButtons";
import { EmployeeForm } from "@/components/depot/EmployeeForm";
import { EmployeeDetails } from "@/components/depot/EmployeeDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmployees, useBatches, useDesignations, useDar, useRewards, useEvents } from "@/hooks/useAppData";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { apiClient } from "@/lib/apiClient";
import { uid } from "@/lib/storage";

export interface SavedEmployeeFilter {
  search: string;
  designation: string;
  batch: string;
  gender: string;
  status: string;
  ageMin: string;
  ageMax: string;
}
import { parseSpreadsheet } from "@/lib/exporters";
import { calcAge, calcRetirementDate, fmtDate, toISO } from "@/lib/retirement";
import type { Employee } from "@/lib/types";

export const Route = createFileRoute("/app/employees")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Employees — SBC Coaching Depot" },
      {
        name: "description",
        content:
          "Search, filter, add, import and export the complete staff register of the SBC Coaching Depot.",
      },
      { property: "og:title", content: "Employees — SBC Coaching Depot" },
      {
        property: "og:description",
        content: "Complete staff register with service, identity and document records.",
      },
    ],
  }),
  component: EmployeesPage,
});

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCode}`;
}

function EmployeesPage() {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees();
  const { data: batches = [] } = useBatches();
  const { data: designations = [] } = useDesignations();
  const { data: dar = [] } = useDar();
  const { data: rewards = [] } = useRewards();
  const { data: events = [] } = useEvents();

  const darByEmployee = useMemo(() => {
    return dar.reduce<Record<string, number>>((acc, r) => {
      acc[r.employeeId] = (acc[r.employeeId] ?? 0) + 1;
      return acc;
    }, {});
  }, [dar]);

  const rewardsByEmployee = useMemo(() => {
    return rewards.reduce<Record<string, number>>((acc, r) => {
      acc[r.employeeId] = (acc[r.employeeId] ?? 0) + 1;
      return acc;
    }, {});
  }, [rewards]);
  const [savedFilter, setSavedFilter] = useState<SavedEmployeeFilter | null>(() => {
    try {
      const item = window.localStorage.getItem("sbc-employee-filter");
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  });
  const [search, setSearch] = useState(savedFilter?.search ?? "");
  const [designation, setDesignation] = useState(savedFilter?.designation ?? "all");
  const [batch, setBatch] = useState(savedFilter?.batch ?? "all");
  const [gender, setGender] = useState(savedFilter?.gender ?? "all");
  const [status, setStatus] = useState(savedFilter?.status ?? "all");
  const [ageMin, setAgeMin] = useState(savedFilter?.ageMin ?? "");
  const [ageMax, setAgeMax] = useState(savedFilter?.ageMax ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [detail, setDetail] = useState<Employee | null>(null);
  const [importRows, setImportRows] = useState<Record<string, string>[] | null>(null);

  const saveFilter = () => {
    const next: SavedEmployeeFilter = {
      search,
      designation,
      batch,
      gender,
      status,
      ageMin,
      ageMax,
    };
    try {
      window.localStorage.setItem("sbc-employee-filter", JSON.stringify(next));
    } catch {}
    setSavedFilter(next);
    toast.success("Filter saved — reapply it any time with “Apply Saved”");
  };

  const applySavedFilter = () => {
    if (!savedFilter) return;
    setSearch(savedFilter.search);
    setDesignation(savedFilter.designation);
    setBatch(savedFilter.batch);
    setGender(savedFilter.gender);
    setStatus(savedFilter.status);
    setAgeMin(savedFilter.ageMin);
    setAgeMax(savedFilter.ageMax);
    toast.success("Saved filter applied");
  };

  const clearFilter = () => {
    setSearch("");
    setDesignation("all");
    setBatch("all");
    setGender("all");
    setStatus("all");
    setAgeMin("");
    setAgeMax("");
    toast.success("Filters cleared");
  };



  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const age = calcAge(e.dob);
      if (q) {
        const hay = `${e.name} ${e.tokenNo} ${e.hrmsId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (designation !== "all" && e.designation !== designation) return false;
      if (batch !== "all" && e.batch !== batch) return false;
      if (gender !== "all" && e.gender !== gender) return false;
      if (status !== "all" && e.status !== status) return false;
      if (ageMin && age < Number(ageMin)) return false;
      if (ageMax && age > Number(ageMax)) return false;
      return true;
    });
  }, [employees, search, designation, batch, gender, status, ageMin, ageMax]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Approximate row height in px
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : rowVirtualizer.getTotalSize();

  const columns = [
    { header: "Name", value: (e: Employee) => e.name },
    { header: "Token No.", value: (e: Employee) => e.tokenNo },
    { header: "HRMS-ID", value: (e: Employee) => e.hrmsId },
    { header: "Designation", value: (e: Employee) => e.designation },
    { header: "Batch", value: (e: Employee) => e.batch },
    { header: "Gender", value: (e: Employee) => e.gender },
    { header: "Blood Group", value: (e: Employee) => e.bloodGroup ?? "—" },
    { header: "Phone", value: (e: Employee) => e.phone },
    { header: "Email", value: (e: Employee) => e.email ?? "—" },
    { header: "Age", value: (e: Employee) => calcAge(e.dob) },
    { header: "Date of Birth", value: (e: Employee) => fmtDate(e.dob) },
    { header: "Date of Appointment", value: (e: Employee) => fmtDate(e.doa) },
    {
      header: "Retirement Date",
      value: (e: Employee) => {
        const rd = calcRetirementDate(e.dob);
        return rd ? fmtDate(toISO(rd)) : "—";
      },
    },
    { header: "Status", value: (e: Employee) => e.status },
  ];

  const confirmImport = async () => {
    if (!importRows) return;
    const pick = (row: Record<string, string>, keys: string[]) => {
      for (const k of Object.keys(row)) {
        if (keys.some((key) => k.toLowerCase().replace(/[^a-z]/g, "").includes(key)))
          return String(row[k] ?? "");
      }
      return "";
    };
    const parseExcelDate = (s: string) => {
      if (!s) return "";
      const str = String(s).trim();
      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      // Handle DD-MM-YYYY or DD/MM/YYYY
      const dmYMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmYMatch) {
        const [, d, m, y] = dmYMatch;
        return `${y}-${(m || "").padStart(2, '0')}-${(d || "").padStart(2, '0')}`;
      }
      // Excel serial date fallback (numbers as string)
      if (!isNaN(Number(str)) && Number(str) > 10000) {
        const d = new Date((Number(str) - (25567 + 2)) * 86400 * 1000);
        return d.toISOString().slice(0, 10);
      }
      // Native JS parsing fallback
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
      return "";
    };
    try {
      const localBatches = new Set(batches.map(b => b.toLowerCase()));
      const localDesignations = new Set(designations.map(d => d.toLowerCase()));
      
      const newBatches = new Set<string>();
      const newDesignations = new Set<string>();
      const newEmployees: Employee[] = [];

      for (const row of importRows) {
        let batchName = pick(row, ["batch"]).trim();
        let designationName = pick(row, ["designation"]).trim();

        if (batchName && !localBatches.has(batchName.toLowerCase())) {
          newBatches.add(batchName);
          localBatches.add(batchName.toLowerCase());
        } else if (!batchName) {
          batchName = batches[0] || "";
        }

        if (designationName && !localDesignations.has(designationName.toLowerCase())) {
          newDesignations.add(designationName);
          localDesignations.add(designationName.toLowerCase());
        } else if (!designationName) {
          designationName = designations[0] || "";
        }

        const rec: Employee = {
          id: uid("emp"),
          photo: "",
          name: pick(row, ["name"]),
          gender: (pick(row, ["gender"]) || "Male") as Employee["gender"],
          tokenNo: pick(row, ["token"]),
          hrmsId: pick(row, ["hrms"]),
          batch: batchName,
          designation: designationName,
          phone: pick(row, ["phone"]),
          email: pick(row, ["email", "mail"]),
          bloodGroup: pick(row, ["blood"]),
          emergencyContact: pick(row, ["emergency"]),
          address: pick(row, ["address"]),
          aadhaar: pick(row, ["aadhaar"]),
          pan: pick(row, ["pan"]).toUpperCase(),
          pfNumber: pick(row, ["pf"]),
          dob: parseExcelDate(pick(row, ["dateofbirth", "dob"])),
          doa: parseExcelDate(pick(row, ["dateofappointment", "doa", "joining"])),
          qualification: pick(row, ["qualification"]),
          documents: [],
          status: "Active",
        };
        newEmployees.push(rec);
      }
      
      await apiClient.bulkImport({
        employees: newEmployees,
        batches: Array.from(newBatches),
        designations: Array.from(newDesignations)
      });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["designations"] });

      toast.success(`${importRows.length} employee(s) imported`);
      setImportRows(null);
    } catch (e) {
      toast.error("Error during import");
      console.error(e);
    }
  };

  return (
    <AppShell
      title="Employees"
      subtitle={`${filtered.length} of ${employees.length} records`}
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / token / HRMS-ID"
              className="h-9 w-56 pl-9"
            />
          </div>
          <Select value={designation} onValueChange={setDesignation}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Designation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All designations</SelectItem>
              {designations.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={batch} onValueChange={setBatch}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              {["Male", "Female", "Other"].map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["Active", "Transferred", "Retired (Early)"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value.replace(/\D/g, ""))}
              placeholder="Min age"
              className="h-9 w-[90px]"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value.replace(/\D/g, ""))}
              placeholder="Max age"
              className="h-9 w-[90px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={saveFilter}
            className="border-amber-accent/50 text-amber-accent hover:bg-amber-soft hover:text-amber-accent"
          >
            <BookmarkPlus className="size-4" /> Save Filter
          </Button>
          {savedFilter ? (
            <Button variant="secondary" size="sm" onClick={applySavedFilter}>
              <BookmarkCheck className="size-4" /> Apply Saved
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={clearFilter}>
            <FilterX className="size-4" /> Clear
          </Button>





          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ExportButtons title="Employees" columns={columns} rows={filtered} />
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="size-4" /> Import
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const rows = await parseSpreadsheet(file);
                    if (rows.length === 0) {
                      toast.error("No rows found in that file.");
                      return;
                    }
                    setImportRows(rows);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add Employee
            </Button>
          </div>
        </>
      }
    >
      <TooltipProvider delayDuration={150}>
        <div ref={parentRef} className="card-surface overflow-auto p-4" style={{ height: "calc(100vh - 200px)" }}>
          <table className="w-full min-w-[960px] text-sm relative">
            <thead className="sticky top-0 z-10 bg-card shadow-sm">
              <tr className="border-b border-border bg-navy/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium bg-card">Employee</th>
                <th className="py-2 pr-3 font-medium bg-card">HRMS-ID</th>
                <th className="py-2 pr-3 font-medium bg-card">Designation</th>
                <th className="py-2 pr-3 font-medium bg-card">Batch</th>
                <th className="py-2 pr-3 font-medium bg-card">Age</th>
                <th className="py-2 pr-3 font-medium bg-card">Status</th>
                <th className="py-2 text-right font-medium bg-card">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualItems.map((virtualRow) => {
                const e = filtered[virtualRow.index];
                if (!e) return null;
                return (
                  <tr
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="size-9 overflow-hidden rounded-full bg-muted">
                          {e.photo ? (
                            <img
                              src={e.photo.startsWith("data:") ? e.photo : `http://localhost:5000${e.photo}`}
                              alt={e.name}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        {darByEmployee[e.id] ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-danger ring-2 ring-card"
                            aria-label="Record marker"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-medium">{e.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Token {e.tokenNo || "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.email || "No email on record"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">{e.hrmsId}</td>
                  <td className="py-2.5 pr-3">{e.designation}</td>
                  <td className="py-2.5 pr-3">{e.batch}</td>
                  <td className="py-2.5 pr-3">{calcAge(e.dob)}</td>
                  <td className="py-2.5 pr-3">
                    <Badge variant={e.status === "Active" ? "default" : "secondary"}>
                      {e.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${e.name}`}
                          onClick={() => {
                            setEditing(e);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Details for ${e.name}`}
                          onClick={() => setDetail(e)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Employee Details</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-success hover:bg-success-soft hover:text-success"
                          disabled={!e.phone}
                          aria-label={`WhatsApp ${e.name}`}
                          onClick={() =>
                            window.open(whatsappHref(e.phone), "_blank", "noopener")
                          }
                        >
                          <MessageCircle className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {e.phone ? `WhatsApp ${e.phone}` : "No phone number"}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No employees match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </TooltipProvider>


      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        designations={designations}
        batches={batches}
      />

      <EmployeeDetails
        employee={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        events={events}
        hasDar={!!(detail && darByEmployee[detail.id])}
        hasReward={!!(detail && rewardsByEmployee[detail.id])}
      />

      <Dialog open={!!importRows} onOpenChange={(o) => !o && setImportRows(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import preview — {importRows?.length ?? 0} row(s)</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  {Object.keys(importRows?.[0] ?? {}).map((k) => (
                    <th key={k} className="whitespace-nowrap px-2 py-2 text-left">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(importRows ?? []).slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {Object.keys(importRows?.[0] ?? {}).map((k) => (
                      <td key={k} className="whitespace-nowrap px-2 py-1.5">
                        {String(row[k] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportRows(null)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
