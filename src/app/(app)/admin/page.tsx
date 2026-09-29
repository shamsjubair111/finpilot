"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BadgeCheck, Crown, RefreshCw, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmitButton } from "@/components/shared/submit-button";
import { useFinance } from "@/components/providers/finance-provider";
import { api } from "@/lib/api-client";
import { PLANS } from "@/lib/plans";

interface Stats {
  totalUsers: number;
  new7: number;
  new30: number;
  verified: number;
  onboarded: number;
  proActive: number;
  paidActive: number;
  trialOrFreePro: number;
  churned30: number;
  activeUsers30: number;
  revenue30: Record<string, number>;
  signups: { date: string; count: number }[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  plan: "free" | "pro";
  planExpiresAt: string | null;
  verified: boolean;
  onboarded: boolean;
  transactions: number;
  accounts: number;
  grants: { days: number; amount: number; currency: string; reference: string | null; createdAt: string }[];
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

export default function AdminPage() {
  const { user } = useFinance();
  if (!user.isAdmin)
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">This page doesn&apos;t exist.</CardContent>
      </Card>
    );
  return <AdminDashboard />;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<AdminUser | null>(null);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), ...(search ? { q: search } : {}) });
    const res = await api<{ users: AdminUser[]; total: number }>(`/admin/users?${params}`);
    setUsers(res.users);
    setTotal(res.total);
  }, [page, search]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s] = await Promise.all([api<Stats>("/admin/stats"), loadUsers()]);
      setStats(s);
    } catch (err) {
      toast.error("Couldn't load admin data", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  useEffect(() => {
    // Fetch on mount and whenever the page or search changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  async function revoke(u: AdminUser) {
    if (!window.confirm(`Move ${u.email} to the Free plan now?`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body: { action: "revoke" } });
      toast.success("Moved to Free");
      loadAll();
    } catch (err) {
      toast.error("Couldn't change plan", { description: err instanceof Error ? err.message : undefined });
    }
  }

  const maxSignups = Math.max(1, ...(stats?.signups.map((s) => s.count) ?? [1]));
  const revenue = stats ? Object.entries(stats.revenue30) : [];
  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        subtitle="Users, plans and revenue across Sanchay."
        actions={
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading} className="gap-1.5">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers} hint={`+${stats.new7} this week · +${stats.new30} in 30 days`} />
            <StatCard label="Active (added a transaction, 30 days)" value={stats.activeUsers30} hint={pct(stats.activeUsers30, stats.totalUsers)} />
            <StatCard label="Paying Pro users" value={stats.paidActive} hint={`${stats.trialOrFreePro} more on trial or free Pro`} />
            <StatCard
              label="Revenue, last 30 days"
              value={revenue.length ? revenue.map(([c, a]) => `${c} ${a.toLocaleString()}`).join(" · ") : "0"}
              hint={`Churned payers (30 days): ${stats.churned30}`}
            />
            <StatCard label="Email verified" value={pct(stats.verified, stats.totalUsers)} hint={`${stats.verified} users`} />
            <StatCard label="Finished onboarding" value={pct(stats.onboarded, stats.totalUsers)} hint={`${stats.onboarded} users`} />
            <StatCard label="Pro price" value={`৳${PLANS.pro.priceMonthly}/mo`} hint={`৳${PLANS.pro.priceYearly}/yr`} />
            <StatCard label="Est. MRR from paying users" value={`৳${(stats.paidActive * PLANS.pro.priceMonthly).toLocaleString()}`} hint="Paying users × monthly price" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signups, last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-1">
                {stats.signups.map((s) => (
                  <div key={s.date} className="group relative flex-1" title={`${s.date}: ${s.count}`}>
                    <div className="rounded-t bg-primary/70 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(2, (s.count / maxSignups) * 128)}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{stats.signups[0]?.date}</span>
                <span>{stats.signups.at(-1)?.date}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" /> Users
            </CardTitle>
            <CardDescription>{total} total. Record a bKash or bank payment with “Give Pro”.</CardDescription>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(query.trim());
            }}
          >
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" className="h-9 w-56" />
            <Button type="submit" size="sm" variant="outline" aria-label="Search">
              <Search className="size-4" />
            </Button>
          </form>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="flex items-center gap-1 font-medium">
                      {u.name}
                      {u.verified && <BadgeCheck className="size-3.5 text-primary" aria-label="Email verified" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{format(new Date(u.createdAt), "d MMM yyyy")}</TableCell>
                  <TableCell>
                    {u.plan === "pro" ? (
                      <div>
                        <Badge className="gap-1"><Crown className="size-3" /> Pro{u.grants.some((g) => g.amount > 0) ? "" : " (trial)"}</Badge>
                        {u.planExpiresAt && <p className="mt-1 text-xs text-muted-foreground">until {format(new Date(u.planExpiresAt), "d MMM yyyy")}</p>}
                      </div>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {u.transactions} txns · {u.accounts} accts
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setGranting(u)}>Give Pro</Button>
                      {u.plan === "pro" && (
                        <Button size="sm" variant="ghost" onClick={() => revoke(u)}>Revoke</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!users.length && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CouponsCard />

      <ErrorsCard />

      <GrantDialog user={granting} onClose={() => setGranting(null)} onDone={loadAll} />
    </div>
  );
}

function GrantDialog({ user, onClose, onDone }: { user: AdminUser | null; onClose: () => void; onDone: () => void }) {
  const [days, setDays] = useState("30");
  const [amount, setAmount] = useState(String(PLANS.pro.priceMonthly));
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);

  function preset(d: number, a: number) {
    setDays(String(d));
    setAmount(String(a));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPending(true);
    try {
      const res = await api<{ planExpiresAt: string }>(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: { action: "grant", days: Number(days), amount: Number(amount) || 0, currency: "BDT", reference },
      });
      toast.success("Pro granted", { description: `${user.email} is on Pro until ${format(new Date(res.planExpiresAt), "d MMM yyyy")}.` });
      setReference("");
      onClose();
      onDone();
    } catch (err) {
      toast.error("Couldn't grant Pro", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Give Pro to {user?.name}</DialogTitle>
            <DialogDescription>Days are added after any Pro time they already have. Set the amount to 0 for a free extension.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => preset(30, PLANS.pro.priceMonthly)}>1 month · ৳{PLANS.pro.priceMonthly}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => preset(365, PLANS.pro.priceYearly)}>1 year · ৳{PLANS.pro.priceYearly}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => preset(14, 0)}>14 days free</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="grant-days">Days</Label>
              <Input id="grant-days" type="number" min={1} max={3660} value={days} onChange={(e) => setDays(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grant-amount">Amount received (৳)</Label>
              <Input id="grant-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grant-ref">Payment reference</Label>
            <Input id="grant-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="bKash TrxID, bank ref…" maxLength={120} />
          </div>
          {user && user.grants.length > 0 && (
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="mb-1 font-medium">Previous grants</p>
              {user.grants.slice(0, 5).map((g, i) => (
                <p key={i} className="text-muted-foreground">
                  {format(new Date(g.createdAt), "d MMM yyyy")} · {g.days} days · {g.currency} {g.amount}
                  {g.reference && ` · ${g.reference}`}
                </p>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
            <SubmitButton pending={pending} disabled={!Number(days)}>Give Pro</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ErrorRow {
  id: string;
  source: string;
  message: string;
  stack: string | null;
  path: string | null;
  createdAt: string;
}

function ErrorsCard() {
  const [data, setData] = useState<{ count24h: number; events: ErrorRow[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    api<{ count24h: number; events: ErrorRow[] }>("/admin/errors").then(setData).catch(() => setData({ count24h: 0, events: [] }));
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Errors (last 7 days)</CardTitle>
        <CardDescription>{data ? `${data.count24h} in the last 24 hours. Uptime check: /api/health` : "Loading…"}</CardDescription>
      </CardHeader>
      <CardContent className="divide-y text-sm">
        {data?.events.length === 0 && <p className="py-4 text-muted-foreground">No errors recorded. 🎉</p>}
        {data?.events.map((e) => (
          <div key={e.id} className="py-2">
            <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(open === e.id ? null : e.id)}>
              <span className="min-w-0">
                <Badge variant={e.source === "server" ? "destructive" : "secondary"} className="mr-2">{e.source}</Badge>
                <span className="break-words">{e.message}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{format(new Date(e.createdAt), "d MMM, HH:mm")}</span>
            </button>
            {open === e.id && (
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-2 text-[11px]">{[e.path, e.stack].filter(Boolean).join("\n\n")}</pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface CouponRow {
  id: string;
  code: string;
  percentOff: number;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  active: boolean;
}

function CouponsCard() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("20");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const load = useCallback(() => api<CouponRow[]>("/admin/coupons").then(setCoupons).catch(() => {}), []);
  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/admin/coupons", { method: "POST", body: { code, percentOff: Number(percent), maxUses: maxUses ? Number(maxUses) : null, expiresAt: expires || null } });
      toast.success("Coupon created");
      setCode("");
      load();
    } catch (err) {
      toast.error("Couldn't create coupon", { description: err instanceof Error ? err.message : undefined });
    }
  }

  async function toggle(c: CouponRow) {
    await api(`/admin/coupons/${c.id}`, { method: "PATCH", body: { active: !c.active } }).catch(() => toast.error("Couldn't update coupon"));
    load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Promo codes</CardTitle>
        <CardDescription>Percentage off Pro checkout. 100% codes grant Pro without payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={create} className="grid gap-2 sm:grid-cols-[1fr_6rem_7rem_10rem_auto]">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" className="uppercase" required aria-label="Code" />
          <Input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} aria-label="Percent off" />
          <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max uses" aria-label="Max uses" />
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} aria-label="Expires" />
          <Button type="submit" disabled={!code}>Create</Button>
        </form>
        <div className="divide-y text-sm">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className={c.active ? "" : "text-muted-foreground line-through"}>
                <span className="font-mono font-medium">{c.code}</span> · {c.percentOff}% off · used {c.uses}
                {c.maxUses ? `/${c.maxUses}` : ""}
                {c.expiresAt ? ` · until ${format(new Date(c.expiresAt), "d MMM yyyy")}` : ""}
              </span>
              <Button size="sm" variant="ghost" onClick={() => toggle(c)}>{c.active ? "Deactivate" : "Activate"}</Button>
            </div>
          ))}
          {!coupons.length && <p className="py-2 text-muted-foreground">No codes yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
