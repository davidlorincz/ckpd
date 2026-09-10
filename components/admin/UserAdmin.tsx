"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  listUsers,
  setAdminRole,
  type AdminUserRow,
} from "@/app/admin/actions";
import { SkillBadge } from "@/components/credentials/SkillBadge";
import {
  AdminTable,
  Badge,
  Th,
  adminButtonClass,
  adminGhostButtonClass,
  adminInputClass,
  adminLinkButtonClass,
  czDate,
} from "@/components/admin/ui";
import { hasConvex } from "@/lib/env";
import {
  statusPresentation,
  tierLabels,
  type MembershipStatus,
  type MembershipTier,
} from "@/lib/membership";
import { skillByKey, type CredentialState } from "@/lib/skills";
import { cn } from "@/lib/utils";

/**
 * Sjednocená tabulka uživatelů.
 *
 * Všichni jsou uživatelé — a jsou ve dvou zdrojích, z nichž každý zná někoho,
 * koho ten druhý nemá:
 *
 *  - Clerk drží účty. Kdo se zaregistroval a nikdy neotevřel `/muj-ucet`,
 *    nemá řádek v evidenci: ten vzniká lazy až tam (`members.ensureSelf`).
 *  - Convex drží evidenci členů. Testovací členové (`clerkUserId` s prefixem
 *    `seed_`) žádný Clerk účet nemají vůbec.
 *
 * Spojuje se to tady, přes `clerkUserId` ↔ Clerk `id`, a co chybí, se
 * přizná čipem — ne aby to ze seznamu tiše vypadlo.
 *
 * Ověřovací kód v datech seznamu není. Je to sdílené tajemství a vydává se
 * po jednom, až si o něj admin řekne (`members.adminVerificationCode`).
 */

type MemberRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.members.adminDirectory>>
>[number];

type Row = {
  key: string;
  clerkId: string | null;
  memberId: Id<"members"> | null;
  name: string;
  email: string;
  isAdmin: boolean;
  member: MemberRow | null;
  clerk: AdminUserRow | null;
};

type Filter = "vsichni" | "clenove" | "bez-clenstvi" | "admini";

const filters: { key: Filter; label: string }[] = [
  { key: "vsichni", label: "Všichni" },
  { key: "clenove", label: "Aktivní členové" },
  { key: "bez-clenstvi", label: "Bez členství" },
  { key: "admini", label: "Admini" },
];

export function UserAdmin() {
  if (!hasConvex) {
    return <p className="text-[15px] text-ink-2">Evidence členů zatím neběží.</p>;
  }
  return <UserAdminInner />;
}

function UserAdminInner() {
  const members = useQuery(api.members.adminDirectory);
  const [clerkUsers, setClerkUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("vsichni");
  const [open, setOpen] = useState<string | null>(null);

  const loadClerk = () => {
    startTransition(async () => {
      try {
        setClerkUsers(await listUsers());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Načtení účtů selhalo.");
      }
    });
  };

  useEffect(loadClerk, []);

  const rows = useMemo<Row[]>(() => {
    if (!members || !clerkUsers) return [];

    const byClerkId = new Map(members.map((m) => [m.clerkUserId, m]));
    const seen = new Set<string>();

    const fromClerk: Row[] = clerkUsers.map((u) => {
      const member = byClerkId.get(u.id) ?? null;
      if (member) seen.add(member._id);
      return {
        key: u.id,
        clerkId: u.id,
        memberId: member?._id ?? null,
        name: member?.name || u.name,
        email: u.email || member?.email || "",
        isAdmin: u.isAdmin,
        member,
        clerk: u,
      };
    });

    // Členové bez Clerk účtu — seed data i účty smazané v Clerku.
    const orphans: Row[] = members
      .filter((m) => !seen.has(m._id))
      .map((m) => ({
        key: m._id,
        clerkId: null,
        memberId: m._id,
        name: m.name,
        email: m.email,
        isAdmin: false,
        member: m,
        clerk: null,
      }));

    return [...fromClerk, ...orphans].sort((a, b) =>
      a.name.localeCompare(b.name, "cs"),
    );
  }, [members, clerkUsers]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "clenove" && !r.member?.active) return false;
      if (filter === "bez-clenstvi" && r.member?.active) return false;
      if (filter === "admini" && !r.isAdmin) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle) ||
        (r.member?.memberNumber ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filter]);

  const toggleAdmin = (row: Row) => {
    if (!row.clerkId) return;
    startTransition(async () => {
      try {
        await setAdminRole(row.clerkId!, !row.isAdmin);
        toast.success(
          row.isAdmin
            ? `${row.email}: admin odebrán`
            : `${row.email}: admin udělen`,
        );
        setClerkUsers(await listUsers());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Změna role selhala.");
      }
    });
  };

  const loading = members === undefined || clerkUsers === null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="min-w-[260px] flex-1 sm:max-w-sm">
          <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
            Hledat
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="jméno, e-mail nebo CKPD-2026-0142"
            className={adminInputClass}
          />
        </label>

        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "rounded-[2px] border px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                filter === f.key
                  ? "border-deep bg-deep text-paper"
                  : "border-hairline text-ink-2 hover:border-deep hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-[14px] text-destructive">{error}</p>}

      {loading ? (
        <div className="mt-6 h-64 animate-pulse border border-hairline bg-paper-2" />
      ) : (
        <>
          <p className="mt-6 text-[13.5px] text-ink-2">
            {visible.length === rows.length
              ? `${rows.length} uživatelů`
              : `${visible.length} z ${rows.length} uživatelů`}
          </p>

          <div className="mt-2 border border-hairline bg-paper">
            <AdminTable
              minWidth={900}
              head={
                <>
                  <Th className="pl-4">Uživatel</Th>
                  <Th>Členství</Th>
                  <Th>Členské číslo</Th>
                  <Th>Certifikace</Th>
                  <Th className="pr-4 text-right">Role</Th>
                </>
              }
            >
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-[14.5px] text-ink-2">
                    Nikdo neodpovídá hledání.
                  </td>
                </tr>
              )}
              {visible.map((row) => (
                <Fragment key={row.key}>
                  <tr
                    onClick={() => setOpen(open === row.key ? null : row.key)}
                    className={cn(
                      "cursor-pointer border-b border-hairline transition-colors hover:bg-paper-2",
                      open === row.key && "bg-paper-2",
                    )}
                  >
                    <td className="py-3 pl-4 pr-4">
                      <p className="text-[15px] font-medium text-ink">{row.name}</p>
                      <p className="text-[13.5px] text-ink-2">{row.email || "—"}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <MembershipCell row={row} />
                    </td>
                    <td className="tnum py-3 pr-4 font-mono text-[13.5px] text-ink-2">
                      {row.member?.memberNumber ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <CredentialChips row={row} />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {row.isAdmin ? (
                        <Badge tone="brass">Admin</Badge>
                      ) : (
                        <span className="text-[13.5px] text-ink-2">—</span>
                      )}
                    </td>
                  </tr>

                  {open === row.key && (
                    <tr className="border-b border-hairline bg-paper-2">
                      <td colSpan={5} className="px-4 py-5">
                        <RowDetail
                          row={row}
                          pending={pending}
                          onToggleAdmin={() => toggleAdmin(row)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </AdminTable>
          </div>
        </>
      )}
    </section>
  );
}

/** Varianta a stav členství. Bez řádku v evidenci se to přizná. */
function MembershipCell({ row }: { row: Row }) {
  if (!row.member) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge>bez evidence</Badge>
      </span>
    );
  }

  const status = row.member.status as MembershipStatus;
  const presentation = statusPresentation[status];

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {row.member.tier && (
        <Badge className="border border-hairline bg-paper-2 text-deep">
          {tierLabels[row.member.tier as MembershipTier]}
        </Badge>
      )}
      <Badge className={presentation.badge}>{presentation.label}</Badge>
      {!row.clerkId && <Badge>bez účtu</Badge>}
    </span>
  );
}

function CredentialChips({ row }: { row: Row }) {
  const list = row.member?.credentials ?? [];
  if (list.length === 0) {
    return <span className="text-[13.5px] text-ink-2">—</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {list.map((c) => (
        <SkillBadge
          key={c.code}
          label={skillByKey(c.skill)?.short ?? c.label}
          validUntil={c.validUntil}
          state={c.state as CredentialState}
        />
      ))}
    </span>
  );
}

const stateLabels: Record<CredentialState, string> = {
  valid: "platné",
  expiring: "končí platnost",
  expired: "vypršelo",
  revoked: "odebráno",
};

function RowDetail({
  row,
  pending,
  onToggleAdmin,
}: {
  row: Row;
  pending: boolean;
  onToggleAdmin: () => void;
}) {
  const m = row.member;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[14px]">
        <Fact label="Účet vznikl" value={czDate(row.clerk?.createdAt)} />
        <Fact
          label="Naposledy přihlášen"
          value={czDate(row.clerk?.lastSignInAt)}
        />
        <Fact label="Členem od" value={czDate(m?.memberSince)} />
        <Fact
          label="Členství do"
          value={
            m?.currentPeriodEnd
              ? `${czDate(m.currentPeriodEnd)}${m.cancelAtPeriodEnd ? " (zrušeno k datu)" : ""}`
              : "—"
          }
        />
        <Fact label="Kraj" value={m?.region ?? "—"} />
        <Fact
          label="Ve veřejném seznamu"
          value={m?.publicListing ? "ano" : "ne"}
        />
        <Fact label="Stanovy" value={czDate(m?.agreeStatutesAt)} />
        <Fact label="Zpracování údajů" value={czDate(m?.agreeGdprAt)} />

        <dt className="text-ink-2">Ověřovací kód</dt>
        <dd>
          {m?.hasVerificationCode && m ? (
            <VerificationCode memberId={m._id} />
          ) : (
            <span className="text-ink-2">
              {m ? "zatím nepřidělen" : "—"}
            </span>
          )}
        </dd>

        <dt className="text-ink-2">Původ členství</dt>
        <dd className="text-ink">
          {m
            ? m.billingProvider === "manual"
              ? "uděleno komorou"
              : m.billingProvider === "stripe"
                ? "platba kartou"
                : "ukázková platba"
            : "—"}
        </dd>

        <dt className="text-ink-2">Role</dt>
        <dd>
          {row.clerkId ? (
            <button
              type="button"
              onClick={onToggleAdmin}
              disabled={pending}
              className={adminGhostButtonClass}
            >
              {row.isAdmin ? "Odebrat admina" : "Udělit admina"}
            </button>
          ) : (
            <span className="text-ink-2">
              bez Clerk účtu — roli nelze udělit
            </span>
          )}
        </dd>
      </dl>

      <div className="space-y-6">
        <MembershipControls member={m} />

        <div>
        <p className="text-[13px] uppercase tracking-wider text-ink-2">
          Certifikace
        </p>
        {!m || m.credentials.length === 0 ? (
          <p className="mt-2 text-[14px] text-ink-2">Žádné certifikace.</p>
        ) : (
          <div className="mt-2 border border-hairline bg-paper px-3">
            <AdminTable
              minWidth={420}
              head={
                <>
                  <Th>Obor</Th>
                  <Th>Kód</Th>
                  <Th>Vydáno</Th>
                  <Th>Platné do</Th>
                  <Th>Stav</Th>
                </>
              }
            >
              {m.credentials.map((c) => (
                <tr key={c.code} className="border-b border-hairline last:border-b-0">
                  <td className="py-2.5 pr-4 text-[14px] text-ink">{c.label}</td>
                  <td className="py-2.5 pr-4 font-mono text-[12.5px] text-ink-2">
                    {c.code}
                  </td>
                  <td className="tnum py-2.5 pr-4 text-[13.5px] text-ink-2">
                    {czDate(c.issuedAt)}
                  </td>
                  <td className="tnum py-2.5 pr-4 text-[13.5px] text-ink-2">
                    {czDate(c.validUntil)}
                  </td>
                  <td className="py-2.5 text-[13.5px] text-ink-2">
                    {stateLabels[c.state as CredentialState]}
                    {c.revokedReason && (
                      <span className="block text-[12.5px]">
                        {c.revokedReason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="whitespace-nowrap text-ink-2">{label}</dt>
      <dd className="tnum text-ink">{value}</dd>
    </>
  );
}

/**
 * Ověřovací kód se natáhne až na vyžádání — do seznamu se nikdy neposílá.
 * Zobrazuje se jako v účtu člena: rozmazaný, dokud si ho admin nevyžádá.
 */
function VerificationCode({ memberId }: { memberId: Id<"members"> }) {
  const [asked, setAsked] = useState(false);
  const code = useQuery(
    api.members.adminVerificationCode,
    asked ? { memberId } : "skip",
  );

  if (!asked) {
    return (
      <button
        type="button"
        onClick={() => setAsked(true)}
        className={adminLinkButtonClass}
      >
        Zobrazit
      </button>
    );
  }
  if (code === undefined) {
    return <span className="text-ink-2">Načítám…</span>;
  }
  return (
    <span className="select-all font-mono text-[13px] text-ink">
      {code ?? "—"}
    </span>
  );
}

const grantableTiers: { key: MembershipTier; label: string }[] = [
  { key: "zakladni", label: "Základní" },
  { key: "pro", label: "PRO" },
  { key: "cestne", label: "Čestné" },
];

/**
 * Ruční udělení a odebrání členství.
 *
 * Prochází stejným jádrem jako platba, takže udělený člen dostane skutečné
 * členské číslo i ověřovací kód platný v partnerském API — a odemkne se mu
 * nejen DIGI univerzita, ale i veřejný seznam a vydávání certifikací.
 *
 * Bez řádku v evidenci není komu členství přiřadit. Ten vzniká sám při
 * prvním otevření účtu, tak to UI i napíše.
 */
function MembershipControls({ member }: { member: MemberRow | null }) {
  const grant = useMutation(api.billing.adminGrantMembership);
  const revoke = useMutation(api.billing.adminRevokeMembership);

  const [tier, setTier] = useState<MembershipTier>("zakladni");
  const [until, setUntil] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!member) {
    return (
      <div>
        <p className="text-[13px] uppercase tracking-wider text-ink-2">
          Členství
        </p>
        <p className="mt-2 text-[14px] text-ink-2">
          Zatím nemá záznam v evidenci — vznikne mu sám, jakmile poprvé otevře
          svůj účet. Do té doby není komu členství přiřadit.
        </p>
      </div>
    );
  }

  async function handleGrant() {
    if (!member) return;
    setBusy(true);
    try {
      // Poledne UTC, ať se datum neposune přes půlnoc v jiné zóně.
      const periodEnd = until ? Date.parse(`${until}T12:00:00Z`) : undefined;
      if (until && Number.isNaN(periodEnd)) {
        toast.error("Datum nedává smysl.");
        return;
      }
      await grant({
        memberId: member._id,
        tier,
        periodEnd,
        note: note.trim() || undefined,
      });
      toast.success(
        `Uděleno: ${tierLabels[tier]}${until ? ` do ${czDate(periodEnd)}` : " bez omezení"}`,
      );
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Udělení selhalo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    if (!member) return;
    if (
      !confirm(
        "Odebrat členství? Stav přejde na „Ukončené“, členské číslo zůstane. Ověřovací API i veřejný seznam ho přestanou uznávat okamžitě.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await revoke({ memberId: member._id, note: note.trim() || undefined });
      toast.success("Členství odebráno.");
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Odebrání selhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[13px] uppercase tracking-wider text-ink-2">Členství</p>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className="min-w-[130px]">
          <span className="mb-1 block text-[12.5px] text-ink-2">Varianta</span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as MembershipTier)}
            disabled={busy}
            className={adminInputClass}
          >
            {grantableTiers.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[150px]">
          <span className="mb-1 block text-[12.5px] text-ink-2">
            Platnost do (nepovinné)
          </span>
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            disabled={busy}
            className={adminInputClass}
          />
        </label>

        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-[12.5px] text-ink-2">
            Poznámka (nepovinná)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            placeholder="rozhodnutí Rady, platba převodem…"
            className={adminInputClass}
          />
        </label>

        <button
          type="button"
          onClick={() => void handleGrant()}
          disabled={busy}
          className={adminButtonClass}
        >
          {member.active ? "Změnit" : "Udělit"}
        </button>

        {member.active && (
          <button
            type="button"
            onClick={() => void handleRevoke()}
            disabled={busy}
            className={adminGhostButtonClass}
          >
            Odebrat členství
          </button>
        )}
      </div>

      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
        Bez data platí bez časového omezení. Udělením vznikne členské číslo
        i ověřovací kód pro partnery.
      </p>

      {member.lastGrant && (
        <p className="mt-2 text-[12.5px] text-ink-2">
          Poslední zásah: {member.lastGrant.action === "grant" ? "uděleno" : "odebráno"}{" "}
          {czDate(member.lastGrant.at)}
          {member.lastGrant.note ? ` — ${member.lastGrant.note}` : ""}
        </p>
      )}
    </div>
  );
}
