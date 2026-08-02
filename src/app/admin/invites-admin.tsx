"use client";

import { useEffect, useState } from "react";
import { Card, SectionHeading } from "@/components/dashboard/card";

interface Invite {
  id: number;
  token: string;
  label: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}

export function InvitesAdmin({ secret }: { secret: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  // Bumped after a create/revoke to trigger a refetch — the effect below
  // owns the actual fetch, so no named function containing setState calls
  // is ever invoked directly from an effect body (matches the pattern in
  // src/lib/use-fetch-json.ts).
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/invites", { headers: { Authorization: `Bearer ${secret}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load invites (${res.status})`);
        return res.json() as Promise<Invite[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setInvites(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [secret, refreshKey]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) throw new Error(`Failed to create invite (${res.status})`);
      setLabel("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/invites/${id}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!res.ok) throw new Error(`Failed to revoke invite (${res.status})`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function inviteUrl(token: string): string {
    return `${window.location.origin}/invite/${token}`;
  }

  async function handleCopy(invite: Invite) {
    await navigator.clipboard.writeText(inviteUrl(invite.token));
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId((id) => (id === invite.id ? null : id)), 1500);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-series-blue">
          Strava Visualiser
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">
          Invite links
        </h1>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <Card>
        <SectionHeading title="New invite" subtitle="Generate a link for one person" />
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label, e.g. Mom"
            className="flex-1 rounded-lg border border-white/10 bg-surface-raised/70 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-series-blue"
          />
          <button
            type="submit"
            disabled={creating || !label.trim()}
            className="rounded-lg bg-series-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-series-blue/90 disabled:opacity-50"
          >
            {creating ? "Generating…" : "Generate"}
          </button>
        </form>
      </Card>

      <Card>
        <SectionHeading title="Existing invites" accent="aqua" />
        {loading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-text-muted">No invites yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/10">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-text-primary">
                      {invite.label}
                      {invite.revokedAt ? (
                        <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                          Revoked
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-text-muted">
                      Created {formatDate(invite.createdAt)} · Last used{" "}
                      {formatDate(invite.lastUsedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!invite.revokedAt ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopy(invite)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                        >
                          {copiedId === invite.id ? "Copied!" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(invite.id)}
                          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10"
                        >
                          Revoke
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
