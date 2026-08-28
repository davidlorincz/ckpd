"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { operationFocus, regions } from "@/lib/site";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";

/**
 * Profil člena v evidenci. Stejná pole jako původní přihláška
 * (components/forms/MembershipForm.tsx), ale bez výběru varianty a souhlasů
 * — ty se řeší při registraci a v sekci Členství a platby.
 */
const schema = z
  .object({
    name: z.string().min(3, "Vyplň jméno, nebo název firmy."),
    ico: z.string().optional(),
    phone: z.string().optional(),
    uclOperator: z.string().optional(),
    region: z.string().optional(),
    focus: z.array(z.string()),
    profile: z.string().max(90, "Popis se vejde do 90 znaků.").optional(),
    publicListing: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const ico = (data.ico ?? "").replace(/\s/g, "");
    if (ico.length > 0 && !/^\d{8}$/.test(ico)) {
      ctx.addIssue({ code: "custom", path: ["ico"], message: "IČO má osm číslic." });
    }
    const phone = (data.phone ?? "").trim();
    if (phone.length > 0 && !/^[+0-9 ]{9,}$/.test(phone)) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Telefon může obsahovat jen číslice, mezery a +.",
      });
    }
  });

type FormData = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-[2px] border border-hairline bg-paper px-3.5 py-2.5 text-[15.5px] text-ink placeholder:text-ink-2/60 focus:border-deep";
const labelCls = "mb-1.5 block text-[14px] font-medium text-ink";

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1.5 text-[13.5px] text-destructive">{msg}</p> : null;
}

export function ProfileForm() {
  const member = useQuery(api.members.getSelf);
  const updateProfile = useMutation(api.members.updateProfile);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { focus: [], publicListing: false },
  });

  // Předvyplnit JEN jednou, jakmile data poprvé dorazí.
  //
  // `useQuery` je živá subscription: každá změna členského záznamu (potvrzení
  // platby, přidělení členského čísla, sjednocení e-mailu) sem pošle nový
  // objekt. Kdyby se z něj formulář plnil pokaždé, přepsalo by to rozepsané
  // údaje uprostřed psaní a tlačítko Uložit by zšedlo — přesně to se dělo.
  // Nový výchozí stav se nastaví až po úspěšném uložení (`reset(data)` níž).
  const seeded = useRef(false);
  useEffect(() => {
    if (!member || seeded.current) return;
    seeded.current = true;
    reset({
      name: member.name ?? "",
      ico: member.ico ?? "",
      phone: member.phone ?? "",
      uclOperator: member.uclOperator ?? "",
      region: member.region ?? "",
      focus: member.focus ?? [],
      profile: member.profile ?? "",
      publicListing: member.publicListing ?? false,
    });
  }, [member, reset]);

  if (member === undefined) return <MemberSkeleton />;

  // Členský záznam ještě nevznikl (zakládá ho EnsureMember v layoutu).
  // Bez téhle větve by tu byla prázdná stránka bez vysvětlení.
  if (member === null) {
    return (
      <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
        <h2 className="text-[20px]">Zakládáme tvůj profil</h2>
        <p className="measure mt-3 text-[15.5px] leading-relaxed text-ink-2">
          Chvilku to trvá. Když se nic nestane, načti stránku znovu — a pokud
          ani to nepomůže, ozvi se nám na {" "}
          <a
            href="mailto:info@ckpd.cz"
            className="text-brass underline-offset-4 hover:underline"
          >
            info@ckpd.cz
          </a>
          .
        </p>
      </section>
    );
  }

  async function onSubmit(data: FormData) {
    try {
      await updateProfile(data);
      toast.success("Profil uložen.");
      reset(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uložení se nepovedlo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
        <h2 className="text-[20px] sm:text-[24px]">Profil</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
          E-mail <span className="text-ink">{member.email}</span> je tvůj
          přihlašovací údaj — mění se v nastavení účtu.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-name" className={labelCls}>
              Jméno a příjmení / název firmy
            </label>
            <input id="pf-name" type="text" autoComplete="name" className={inputCls} {...register("name")} />
            <Err msg={errors.name?.message} />
          </div>

          <div>
            <label htmlFor="pf-ico" className={labelCls}>
              IČO <span className="font-normal text-ink-2">(nepovinné)</span>
            </label>
            <input id="pf-ico" type="text" inputMode="numeric" className={inputCls} {...register("ico")} />
            <Err msg={errors.ico?.message} />
          </div>

          <div>
            <label htmlFor="pf-phone" className={labelCls}>
              Telefon
            </label>
            <input id="pf-phone" type="tel" autoComplete="tel" className={inputCls} {...register("phone")} />
            <Err msg={errors.phone?.message} />
          </div>

          <div>
            <label htmlFor="pf-ucl" className={labelCls}>
              Registrační číslo operátora ÚCL{" "}
              <span className="font-normal text-ink-2">(nepovinné)</span>
            </label>
            <input
              id="pf-ucl"
              type="text"
              placeholder="CZExxxxxxxxxxxx"
              className={inputCls}
              {...register("uclOperator")}
            />
          </div>

          <div>
            <label htmlFor="pf-region" className={labelCls}>
              Kraj
            </label>
            <select id="pf-region" className={cn(inputCls, "appearance-none")} {...register("region")}>
              <option value="">Nevyplněno</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pf-profile" className={labelCls}>
              Krátký popis{" "}
              <span className="font-normal text-ink-2">(do veřejného seznamu)</span>
            </label>
            <input
              id="pf-profile"
              type="text"
              placeholder="inspekce fotovoltaik, Brno"
              className={inputCls}
              {...register("profile")}
            />
            <Err msg={errors.profile?.message} />
          </div>
        </div>

        <fieldset className="mt-7">
          <legend className={cn(labelCls, "text-[15px]")}>
            Zaměření provozu{" "}
            <span className="font-normal text-ink-2">(vyber vše, co sedí)</span>
          </legend>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
            {operationFocus.map((f) => (
              <label
                key={f}
                className="flex cursor-pointer items-baseline gap-2.5 py-1 text-[15px] text-ink"
              >
                <input
                  type="checkbox"
                  value={f}
                  {...register("focus")}
                  className="translate-y-[1px] accent-[#2626ff]"
                />
                {f}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
        <h2 className="text-[20px] sm:text-[24px]">Zveřejnění</h2>
        <label className="mt-5 flex cursor-pointer items-baseline gap-3 text-[14.5px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            {...register("publicListing")}
            className="translate-y-[1px] accent-[#2626ff]"
          />
          <span>
            Souhlasím s uvedením svého jména ve veřejném seznamu členů.{" "}
            <span className="text-ink-2/70">
              (nepovinné, ale doporučené — každé jméno přidává komoře váhu)
            </span>
          </span>
        </label>
        <p className="measure mt-4 text-[13.5px] leading-relaxed text-ink-2">
          Souhlas ovlivňuje i ověřování partnery: bez něj jim komora potvrdí
          jen to, že členství platí, ale jméno nesdělí. Odvolat ho jde kdykoli
          a projeví se okamžitě.
        </p>
      </section>

      <div className="flex items-center gap-5">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-[2px] bg-action px-7 py-3 text-[15px] font-medium text-white transition-colors hover:bg-action-2 disabled:opacity-50"
        >
          {isSubmitting ? "Ukládám…" : "Uložit změny"}
        </button>
        {!isDirty && (
          <p className="text-[13.5px] text-ink-2">Nic k uložení.</p>
        )}
      </div>
    </form>
  );
}
