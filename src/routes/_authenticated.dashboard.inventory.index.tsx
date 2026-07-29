import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listInventory, upsertInventoryItem, deleteInventoryItem } from "@/lib/inventory.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Pencil, Trash2, Package, Search, AlertTriangle } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const inventoryOptions = queryOptions({
  queryKey: ["inventory"],
  queryFn: () => listInventory(),
});

export const Route = createFileRoute("/_authenticated/dashboard/inventory/")({
  head: () => ({ meta: [{ title: "Inventory — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(inventoryOptions),
  component: InventoryPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

type Item = Awaited<ReturnType<typeof listInventory>>[number];

function InventoryPage() {
  const { data } = useSuspenseQuery(inventoryOptions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const filtered = data.filter((i) =>
    [i.name, i.sku, i.category].join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  const lowCount = data.filter(
    (i) => Number(i.current_stock) <= Number(i.low_stock_threshold),
  ).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Keep stock accurate. Get alerted before you run out."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> Add item
          </Button>
        }
      />

      {lowCount > 0 && (
        <Card className="mb-4 border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>
              {lowCount} item{lowCount > 1 ? "s" : ""} below threshold — restock soon.
            </span>
          </CardContent>
        </Card>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No items yet"
          description="Add your first product or service to track stock and pricing."
          action={{
            label: "Add item",
            onClick: () => {
              setEditing(null);
              setOpen(true);
            },
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items…"
                  className="pl-9"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const low = Number(i.current_stock) <= Number(i.low_stock_threshold);
                  return (
                    <TableRow key={i.id}>
                      <TableCell>
                        <div className="font-medium">{i.name}</div>
                        {i.category && (
                          <div className="text-xs text-muted-foreground">{i.category}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{i.sku ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatINR(i.cost_price)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(i.selling_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={low ? "destructive" : "secondary"}>
                          {i.current_stock} {i.unit ?? ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(i);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton id={i.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ItemDialog open={open} onOpenChange={setOpen} item={editing} />
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteInventoryItem);
  const m = useMutation({
    mutationFn: del,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item removed");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Delete this item?")) m.mutate({ data: { id } });
      }}
    >
      {m.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 text-destructive" />
      )}
    </Button>
  );
}

function ItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Item | null;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertInventoryItem);
  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(item ? "Item updated" : "Item added");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        id: item?.id,
        name: String(f.get("name") ?? ""),
        sku: String(f.get("sku") ?? ""),
        category: String(f.get("category") ?? ""),
        unit: String(f.get("unit") ?? "pcs"),
        cost_price: Number(f.get("cost_price") ?? 0),
        selling_price: Number(f.get("selling_price") ?? 0),
        current_stock: Number(f.get("current_stock") ?? 0),
        low_stock_threshold: Number(f.get("low_stock_threshold") ?? 5),
        description: String(f.get("description") ?? ""),
        is_active: true,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={item?.name ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={item?.sku ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={item?.category ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost_price">Cost price (₹)</Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.cost_price ?? 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="selling_price">Selling price (₹)</Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.selling_price ?? 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_stock">Stock</Label>
              <Input
                id="current_stock"
                name="current_stock"
                type="number"
                min="0"
                defaultValue={item?.current_stock ?? 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                placeholder="pcs, kg, hr…"
                defaultValue={item?.unit ?? "pcs"}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="low_stock_threshold">Low-stock alert at</Label>
              <Input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                min="0"
                defaultValue={item?.low_stock_threshold ?? 5}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={item?.description ?? ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
