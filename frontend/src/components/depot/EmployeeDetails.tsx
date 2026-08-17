import { useState, useEffect } from "react";
import { Award, Download, Eye, EyeOff, FileDown, FileText, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calcAge, calcRetirementDate, fmtDate, maskValue, toISO } from "@/lib/retirement";
import { exportEmployeePdf } from "@/lib/exporters";

import { apiClient } from "@/lib/apiClient";
import type { Employee, ServiceEvent } from "@/lib/types";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

export function EmployeeDetails({
  employee,
  open,
  onOpenChange,
  events,
  hasDar,
  hasReward,
}: {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: ServiceEvent[];
  hasDar: boolean;
  hasReward: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [fullEmployee, setFullEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!open || !employee) return;
    setFullEmployee(employee);
    apiClient.getEmployee(employee.id).then(setFullEmployee).catch(console.error);
  }, [open, employee]);

  if (!fullEmployee) return null;

  const calculated = calcRetirementDate(fullEmployee.dob);
  const promotions = events
    .filter((e) => e.employeeId === fullEmployee.id && e.type === "Promotion")
    .sort((a, b) => a.date.localeCompare(b.date));

  const timeline = [
    {
      title: promotions[0]?.from ?? fullEmployee.designation,
      subtitle: "Joining designation",
      date: fullEmployee.doa,
    },
    ...promotions.map((p) => ({
      title: p.to,
      subtitle: `Promoted from ${p.from}`,
      date: p.date,
    })),
    { title: fullEmployee.designation, subtitle: "Current designation", date: "" },
  ];

  const toggleReveal = () => {

    setRevealed((r) => !r);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setRevealed(false);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[240px_1fr]">
          <div className="space-y-3">
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted">
              {fullEmployee.photo ? (
                <img
                  src={fullEmployee.photo.startsWith("data:") ? fullEmployee.photo : `http://localhost:5000${fullEmployee.photo}`}
                  alt={fullEmployee.name}
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{fullEmployee.name}</h3>
              <p className="text-sm text-muted-foreground">
                {fullEmployee.designation} · {fullEmployee.batch}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Token {fullEmployee.tokenNo} · HRMS {fullEmployee.hrmsId}
              </p>
            </div>
            <Badge variant={fullEmployee.status === "Active" ? "default" : "secondary"}>
              {fullEmployee.status}
            </Badge>
            <div className="rounded-xl bg-amber-soft p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-accent">
                Retirement date (FR-56)
              </p>
              <p className="text-lg font-semibold text-navy">
                {fullEmployee.actualRetirementDate
                  ? fmtDate(fullEmployee.actualRetirementDate)
                  : calculated
                    ? fmtDate(toISO(calculated))
                    : "—"}
              </p>
              {fullEmployee.actualRetirementDate && calculated ? (
                <p className="text-xs text-muted-foreground">
                  Early retirement · calculated date was {fmtDate(toISO(calculated))}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {hasDar ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
                  <ShieldAlert className="size-3.5" /> Disciplinary record on file
                </span>
              ) : null}
              {hasReward ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                  <Award className="size-3.5" /> Reward on file
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-3 text-sm font-semibold text-navy">Personal & Contact</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Gender" value={fullEmployee.gender} />
                <Info
                  label="Date of Birth"
                  value={`${fmtDate(fullEmployee.dob)} (age ${calcAge(fullEmployee.dob)})`}
                />
                <Info label="Date of Appointment" value={fmtDate(fullEmployee.doa)} />
                <Info label="Qualification" value={fullEmployee.qualification} />
                <Info label="Phone" value={fullEmployee.phone} />
                <Info label="Email" value={fullEmployee.email} />
                <Info label="Blood Group" value={fullEmployee.bloodGroup} />
                <Info label="Emergency Contact" value={fullEmployee.emergencyContact} />
                <div className="sm:col-span-2">
                  <Info label="Address" value={fullEmployee.address} />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-navy">Identity</h4>
                <Button variant="ghost" size="sm" onClick={toggleReveal}>
                  {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {revealed ? "Hide" : "Reveal"}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Info
                  label="Aadhaar"
                  value={revealed ? fullEmployee.aadhaar : maskValue(fullEmployee.aadhaar)}
                />
                <Info
                  label="PAN"
                  value={revealed ? fullEmployee.pan : maskValue(fullEmployee.pan)}
                />
                <Info label="PF Number" value={fullEmployee.pfNumber} />
              </div>
            </section>

            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-3 text-sm font-semibold text-navy">Documents</h4>
              {fullEmployee.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <ul className="space-y-2">
                  {fullEmployee.documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="font-medium">{d.name || d.fileName}</span>
                      <span className="text-xs text-muted-foreground">{d.fileName}</span>
                      {d.dataUrl ? (
                        <span className="ml-auto flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={d.dataUrl} target="_blank" rel="noreferrer">
                              <Eye className="size-4" /> View
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={d.dataUrl} download={d.fileName || d.name}>
                              <Download className="size-4" /> Download
                            </a>
                          </Button>
                        </span>
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground">
                          No file attached
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-4 text-sm font-semibold text-navy">
                Designation History / Promotion Timeline
              </h4>
              <ol className="relative space-y-5 border-l border-border pl-5">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] top-1 grid size-3 place-items-center rounded-full bg-navy ring-4 ring-card" />
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.subtitle}
                      {t.date ? ` · ${fmtDate(t.date)}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-info/40 text-info hover:bg-info-soft hover:text-info"
            onClick={() => exportEmployeePdf(fullEmployee)}
          >
            <FileDown className="size-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
