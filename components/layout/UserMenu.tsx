"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  CreditCardIcon,
  FileTextIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hasClerk } from "@/lib/env";
import { SHOW_MEMBER_AREA } from "@/lib/flags";
import { memberNavItems } from "@/lib/memberNav";
import { tierLabels } from "@/lib/membership";
import type { HeaderSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const ctaClass =
  "shrink-0 whitespace-nowrap rounded-[2px] border border-deep px-4 py-2 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper";

const signInClass =
  "shrink-0 whitespace-nowrap text-[15px] font-medium text-ink-2 transition-colors hover:text-ink";

/**
 * Kdo už účet má, se do něj musí dostat.
 *
 * Do přihlášení dřív z webu nevedla jediná cesta — hlavička nabízela jen
 * „Stát se členem". Odkaz je textový, aby zvýrazněné CTA zůstalo jedno, a
 * nedostává linku aktivního stavu jako položky rozcestníku: patří do zóny
 * účtu a na `/prihlaseni` se hlavička stejně nevykresluje.
 * Ukazuje se i s vypnutou členskou sekcí: přes `/prihlaseni` chodí i vstup
 * do administrace.
 */
function SignInLink() {
  return (
    <Link href="/prihlaseni" className={signInClass}>
      Přihlásit se
    </Link>
  );
}

const icons: Record<string, typeof UserRoundIcon> = {
  "/muj-ucet": UserRoundIcon,
  "/muj-ucet/predplatne": CreditCardIcon,
  "/muj-ucet/faktury": FileTextIcon,
  "/muj-ucet/profil": SettingsIcon,
};

/**
 * Účet v hlavičce: jedna ikona místo čtyř prvků.
 *
 * Dřív tu vedle sebe stály „Můj účet“, „Administrace“, zelený štítek EDIT
 * a „Odhlásit“ — na 1024 px se hlavička lámala na dva řádky. Všechno se
 * složilo sem; EDIT nebyl přepínač, jen indikátor „jsi admin, texty jdou
 * editovat“, takže z něj zbyla zelená tečka na ikoně a řádek v menu.
 */
export function UserMenu({ session }: { session: HeaderSession }) {
  // Bez Clerku není kam přihlašovat ani koho registrovat.
  if (!hasClerk) {
    return (
      <Link href="/clenstvi#varianty" className={ctaClass}>
        Stát se členem
      </Link>
    );
  }

  // Menu účtu má smysl jen se zapnutou členskou sekcí — jinak jsou všechny
  // jeho odkazy 404. Zároveň se tím Clerk hooky nenamontují, proto to dělí
  // hranice komponent.
  if (!session.signedIn || !SHOW_MEMBER_AREA) {
    return (
      <>
        {!session.signedIn && <SignInLink />}
        <Link
          href={SHOW_MEMBER_AREA ? "/registrace" : "/clenstvi#varianty"}
          className={ctaClass}
        >
          Stát se členem
        </Link>
      </>
    );
  }
  return <UserMenuInner session={session} />;
}

function UserMenuInner({ session }: { session: HeaderSession }) {
  const { user } = useUser();
  const clerk = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName ?? user?.username ?? email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Můj účet"
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-[2px] border border-hairline text-deep transition-colors",
          "hover:border-deep hover:bg-deep hover:text-paper",
          "data-popup-open:border-deep data-popup-open:bg-deep data-popup-open:text-paper",
        )}
      >
        <UserRoundIcon className="size-[18px]" strokeWidth={1.75} />
        {session.admin && (
          // editace textů je zapnutá — dřív to hlásil zelený štítek EDIT
          <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-paper bg-action" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {/* identita není položka menu — nemá být fokusovatelná */}
        <div className="px-2.5 py-2">
          <p className="truncate text-[15px] font-medium leading-snug text-ink">
            {name ?? " "}
          </p>
          <p className="truncate text-[13px] leading-snug text-ink-2">
            {email ?? " "}
          </p>
          {session.tier && (
            <span className="mt-2 inline-block rounded-[2px] bg-paper-2 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brass">
              {tierLabels[session.tier]}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {memberNavItems.map((item) => {
            const Icon = icons[item.href] ?? UserRoundIcon;
            return (
              <DropdownMenuLinkItem
                key={item.href}
                render={<Link href={item.href} />}
              >
                <Icon strokeWidth={1.75} />
                {("menuLabel" in item && item.menuLabel) || item.label}
              </DropdownMenuLinkItem>
            );
          })}
        </DropdownMenuGroup>

        {session.admin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Správa</DropdownMenuLabel>
              <DropdownMenuLinkItem render={<Link href="/admin" />}>
                <ShieldIcon strokeWidth={1.75} />
                <span className="flex-1">Administrace</span>
                <span className="flex items-center gap-1.5 text-[12px] text-action">
                  <span className="size-1.5 rounded-full bg-action" />
                  editace zapnutá
                </span>
              </DropdownMenuLinkItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => clerk.signOut()}>
          <LogOutIcon strokeWidth={1.75} />
          Odhlásit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
