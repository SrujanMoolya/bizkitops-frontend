import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAppointments,
  listServices,
  upsertAppointment,
  upsertService,
  updateAppointmentStatus,
  deleteAppointment,
  deleteService,
} from "@/lib/appointments.functions";
import { listCustomers } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Loader2,
  Calendar,
  Clock,
  CircleDollarSign,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  BookOpen,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/format";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const appointmentsOptions = queryOptions({
  queryKey: ["appointments"],
  queryFn: () => listAppointments(),
});

const servicesOptions = queryOptions({
  queryKey: ["services"],
  queryFn: () => listServices(),
});

const customersOptions = queryOptions({
  queryKey: ["customers"],
  queryFn: () => listCustomers(),
});

export const Route = createFileRoute("/_authenticated/dashboard/appointments/")({
  head: () => ({ meta: [{ title: "Appointments — BizkitOps" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(appointmentsOptions),
      context.queryClient.ensureQueryData(servicesOptions),
      context.queryClient.ensureQueryData(customersOptions),
    ]);
  },
  component: AppointmentsPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

type Appointment = Awaited<ReturnType<typeof listAppointments>>[number];
type Service = Awaited<ReturnType<typeof listServices>>[number];

function AppointmentsPage() {
  const { data: appointments } = useSuspenseQuery(appointmentsOptions);
  const { data: services } = useSuspenseQuery(servicesOptions);
  const { data: customers } = useSuspenseQuery(customersOptions);

  const [activeTab, setActiveTab] = useState("bookings");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Booking Modal State
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Appointment | null>(null);

  // Service Modal State
  const [serviceOpen, setServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Filter Bookings
  const filteredBookings = appointments.filter((app) => {
    const matchesSearch = [app.customer_name, app.service_name, app.notes]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Services (Only active/true)
  const activeServices = services.filter((s) => s.is_active);

  const qc = useQueryClient();
  const statusFn = useServerFn(updateAppointmentStatus);
  const statusMutation = useMutation({
    mutationFn: statusFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const changeStatus = (id: string, newStatus: string) => {
    statusMutation.mutate({ data: { id, status: newStatus } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Schedule bookings, define services catalog, and let clients self-book online."
        action={
          activeTab === "bookings" ? (
            <Button
              onClick={() => {
                setEditingBooking(null);
                setBookingOpen(true);
              }}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Book Appointment
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingService(null);
                setServiceOpen(true);
              }}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookings">Bookings Agenda</TabsTrigger>
          <TabsTrigger value="services">Services Catalog</TabsTrigger>
        </TabsList>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer or service..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "scheduled" ? "default" : "outline"}
                onClick={() => setStatusFilter("scheduled")}
                size="sm"
                className="gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Scheduled
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
                className="gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                onClick={() => setStatusFilter("cancelled")}
                size="sm"
                className="gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Cancelled
              </Button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No bookings found"
              description="Schedule a new appointment directly or check other status filters."
              action={{
                label: "Book Appointment",
                onClick: () => {
                  setEditingBooking(null);
                  setBookingOpen(true);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings.map((app) => {
                let badgeClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                if (app.status === "completed") {
                  badgeClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                } else if (app.status === "cancelled") {
                  badgeClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                }

                return (
                  <Card
                    key={app.id}
                    className="shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge
                            variant="outline"
                            className={`capitalize font-semibold text-[10px] ${badgeClass}`}
                          >
                            {app.status}
                          </Badge>
                          <h4 className="font-bold text-base mt-2 text-foreground">
                            {app.customer_name}
                          </h4>
                        </div>
                        <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(app.appointment_date)}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 pb-3 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span>{app.service_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span>
                          {app.start_time} {app.end_time ? ` - ${app.end_time}` : ""}
                        </span>
                      </div>
                      {app.notes && (
                        <p className="mt-2 bg-muted p-2 rounded-lg text-muted-foreground leading-relaxed whitespace-pre-line truncate">
                          {app.notes}
                        </p>
                      )}
                    </CardContent>

                    <div className="p-3 border-t bg-muted/20 flex items-center justify-between gap-1">
                      <div className="flex gap-1">
                        {app.status === "scheduled" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                              onClick={() => changeStatus(app.id, "completed")}
                              title="Mark Completed"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                              onClick={() => changeStatus(app.id, "cancelled")}
                              title="Cancel Booking"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingBooking(app);
                            setBookingOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <DeleteBookingButton id={app.id} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SERVICES CATALOG TAB */}
        <TabsContent value="services" className="space-y-4 pt-2">
          {activeServices.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No services created"
              description="Define your business services (pricing, duration) to start booking them."
              action={{
                label: "Add Service",
                onClick: () => {
                  setEditingService(null);
                  setServiceOpen(true);
                },
              }}
            />
          ) : (
            <div className="border rounded-xl bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeServices.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold text-sm">{s.name}</TableCell>
                      <TableCell className="flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {s.duration_minutes}{" "}
                        mins
                      </TableCell>
                      <TableCell className="font-semibold text-sm">{formatINR(s.price)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {s.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingService(s);
                              setServiceOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteServiceButton id={s.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Form Dialog */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        booking={editingBooking}
        services={activeServices}
        customers={customers}
      />

      {/* Service Form Dialog */}
      <ServiceDialog open={serviceOpen} onOpenChange={setServiceOpen} service={editingService} />
    </div>
  );
}

// Delete Booking Button component
function DeleteBookingButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteAppointment);
  const m = useMutation({
    mutationFn: del,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Booking deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-destructive hover:bg-destructive/10"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Delete this appointment?")) m.mutate({ data: { id } });
      }}
    >
      {m.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// Delete Service Button component
function DeleteServiceButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteService);
  const m = useMutation({
    mutationFn: del,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service removed from catalog");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:bg-destructive/10"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Remove this service from active catalog?")) m.mutate({ data: { id } });
      }}
    >
      {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

// Dialog to add or edit bookings
function BookingDialog({
  open,
  onOpenChange,
  booking,
  services,
  customers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: Appointment | null;
  services: Service[];
  customers: Awaited<ReturnType<typeof listCustomers>>;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertAppointment);
  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(booking ? "Booking updated" : "Appointment scheduled");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    booking?.customer_id ?? "custom",
  );
  const [customName, setCustomName] = useState<string>(booking?.customer_name ?? "");
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    booking?.service_id ?? "custom",
  );
  const [customServiceName, setCustomServiceName] = useState<string>(booking?.service_name ?? "");

  const handleCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    if (val !== "custom") {
      const c = customers.find((cust) => cust.id === val);
      if (c) setCustomName(c.name);
    } else {
      setCustomName("");
    }
  };

  const handleServiceChange = (val: string) => {
    setSelectedServiceId(val);
    if (val !== "custom") {
      const s = services.find((serv) => serv.id === val);
      if (s) setCustomServiceName(s.name);
    } else {
      setCustomServiceName("");
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    m.mutate({
      data: {
        id: booking?.id,
        customer_id: selectedCustomerId === "custom" ? null : selectedCustomerId,
        customer_name: customName.trim(),
        service_id: selectedServiceId === "custom" ? null : selectedServiceId,
        service_name: customServiceName.trim(),
        appointment_date: String(f.get("appointment_date") ?? ""),
        start_time: String(f.get("start_time") ?? ""),
        end_time: String(f.get("end_time") || "") || null,
        status: String(f.get("status") ?? "scheduled"),
        notes: String(f.get("notes") ?? ""),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Appointment" : "Book Appointment"}</DialogTitle>
          <DialogDescription>Schedule a service booking for a client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Customer select */}
            <div className="space-y-1.5">
              <Label>Select Client</Label>
              <Select defaultValue={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose existing client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">-- Custom Client Name --</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId === "custom" && (
              <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                <Label htmlFor="customer_name">Client Name</Label>
                <Input
                  id="customer_name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter custom client name"
                  required
                />
              </div>
            )}

            {/* Service select */}
            <div className="space-y-1.5">
              <Label>Select Service</Label>
              <Select defaultValue={selectedServiceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">-- Custom Service --</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} mins - {formatINR(s.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedServiceId === "custom" && (
              <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                <Label htmlFor="service_name">Service Name</Label>
                <Input
                  id="service_name"
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="Enter custom service name"
                  required
                />
              </div>
            )}

            {/* Date & Time slots */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="appointment_date">Date</Label>
                <Input
                  id="appointment_date"
                  name="appointment_date"
                  type="date"
                  required
                  defaultValue={booking?.appointment_date ?? new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                  defaultValue={booking?.start_time ?? "10:00"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">End Time (Optional)</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  defaultValue={booking?.end_time ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={booking?.status ?? "scheduled"} name="status">
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Booking Notes / Requirements</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Special requests or instructions..."
                defaultValue={booking?.notes ?? ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Dialog to add or edit services catalog
function ServiceDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: Service | null;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertService);
  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(service ? "Service updated" : "Service added to catalog");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        id: service?.id,
        name: String(f.get("name") ?? ""),
        description: String(f.get("description") ?? ""),
        duration_minutes: Number(f.get("duration_minutes") ?? 30),
        price: Number(f.get("price") ?? 0),
        is_active: true,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add Service Offer"}</DialogTitle>
          <DialogDescription>Define a service option that clients can book.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Service Title</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Consulting Session, Haircut, Plumbing"
                defaultValue={service?.name ?? ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  required
                  defaultValue={service?.duration_minutes ?? 30}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  required
                  defaultValue={service?.price ?? 0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe what is included in this service..."
                defaultValue={service?.description ?? ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
