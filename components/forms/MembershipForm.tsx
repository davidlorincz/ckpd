"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { operationFocus, org, regions } from "@/lib/site";

const memberTypes = [
  { value: "pilot", label: "Individuální pilot", fee: "900 Kč / rok" },
  { value: "student", label: "Student / do 18 let / škola", fee: "0–300 Kč / rok" },
  { value: "firma", label: "Firemní člen — provozovatel do 5 pilotů", fee: "8 000 Kč / rok" },
  { value: "korporat", label: "Firemní člen — korporát / výrobce", fee: "25 000 Kč / rok" },
] as const;

const firmTypes = ["firma", "korporat"];

const schema = z
  .object({
    memberType: z.enum(["pilot", "student", "firma", "korporat"], {
      message: "Vyber typ členství.",
    }),
    name: z.string().min(3, "Vyplň jméno, nebo název firmy."),
    ico: z.string().optional(),
    email: z.string().email("Vyplň platný e-mail."),
    phone: z
      .string()
      .min(9, "Vyplň telefonní číslo.")
      .regex(/^[+0-9 ]+$/, "Telefon může obsahovat jen číslice, mezery a +."),
    uclOperator: z.string().optional(),
    region: z.string().min(1, "Vyber kraj."),
    focus: z.array(z.string()).min(1, "Vyber alespoň jedno zaměření."),
    agreeStatutes: z.literal(true, {
      message: "Bez souhlasu se stanovami a etickým kodexem to nejde.",
    }),
    publicListing: z.boolean(),
    agreeGdpr: z.literal(true, {
      message: "Bez souhlasu se zpracováním údajů přihlášku nezpracujeme.",
    }),
  })
  .superRefine((data, ctx) => {
    if (firmTypes.includes(data.memberType)) {
      const ico = (data.ico ?? "").replace(/\s/g, "");
      if (!/^\d{8}$/.test(ico)) {
        ctx.addIssue({
          code: "custom",
          path: ["ico"],
          message: "U firemního členství vyplň osmimístné IČO.",
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-[2px] border border-hairline bg-paper px-3.5 py-2.5 text-[15.5px] text-ink placeholder:text-ink-2/60 focus:border-deep";
const labelCls = "mb-1.5 block text-[14px] font-medium text-ink";
const errCls = "mt-1.5 text-[13.5px] text-[#9e2b25]";

function Err({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null;
}

/**
 * Přihláška do komory (PRD § 5). Verze 1 = pouze UI: validace běží, odeslání
 * zatím není napojené na evidenci členů. Po zprovoznění Airtable + Resend
 * nahradit onSubmit voláním server action.
 */
export function MembershipForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { focus: [], publicListing: false },
  });

  const memberType = watch("memberType");
  const isFirm = firmTypes.includes(memberType ?? "");

  if (submitted) {
    return (
      <div className="border border-hairline bg-paper-2 p-8 text-center">
        <p className="font-serif text-[22px] text-ink">
          Příjem přihlášek zatím nebyl spuštěn.
        </p>
        <p className="measure mx-auto mt-3 text-[15.5px] leading-relaxed text-ink-2">
          Evidenci členů právě dokončujeme. Nech nám na sebe kontakt na{" "}
          <a
            href={`mailto:${org.email}`}
            className="text-brass underline-offset-4 hover:underline"
          >
            {org.email}
          </a>{" "}
          a ozveme se, jakmile bude přihláška aktivní.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(() => setSubmitted(true))} noValidate>
      <fieldset>
        <legend className={cn(labelCls, "text-[15px]")}>Typ členství</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {memberTypes.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex cursor-pointer items-baseline gap-3 border border-hairline bg-paper px-4 py-3 transition-colors has-checked:border-deep has-checked:bg-paper-2",
              )}
            >
              <input
                type="radio"
                value={t.value}
                {...register("memberType")}
                className="translate-y-[1px] accent-[#10393f]"
              />
              <span>
                <span className="block text-[15px] font-medium text-ink">
                  {t.label}
                </span>
                <span className="tnum block text-[13.5px] text-ink-2">
                  {t.fee}
                </span>
              </span>
            </label>
          ))}
        </div>
        <Err msg={errors.memberType?.message} />
      </fieldset>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className={isFirm ? "" : "sm:col-span-2"}>
          <label htmlFor="mf-name" className={labelCls}>
            {isFirm ? "Název firmy" : "Jméno a příjmení"}
          </label>
          <input
            id="mf-name"
            type="text"
            autoComplete={isFirm ? "organization" : "name"}
            className={inputCls}
            {...register("name")}
          />
          <Err msg={errors.name?.message} />
        </div>

        {isFirm && (
          <div>
            <label htmlFor="mf-ico" className={labelCls}>
              IČO
            </label>
            <input
              id="mf-ico"
              type="text"
              inputMode="numeric"
              className={inputCls}
              {...register("ico")}
            />
            <Err msg={errors.ico?.message} />
          </div>
        )}

        <div>
          <label htmlFor="mf-email" className={labelCls}>
            E-mail
          </label>
          <input
            id="mf-email"
            type="email"
            autoComplete="email"
            className={inputCls}
            {...register("email")}
          />
          <Err msg={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="mf-phone" className={labelCls}>
            Telefon
          </label>
          <input
            id="mf-phone"
            type="tel"
            autoComplete="tel"
            className={inputCls}
            {...register("phone")}
          />
          <Err msg={errors.phone?.message} />
        </div>

        <div>
          <label htmlFor="mf-ucl" className={labelCls}>
            Registrační číslo operátora ÚCL{" "}
            <span className="font-normal text-ink-2">(nepovinné)</span>
          </label>
          <input
            id="mf-ucl"
            type="text"
            placeholder="CZExxxxxxxxxxxx"
            className={inputCls}
            {...register("uclOperator")}
          />
        </div>

        <div>
          <label htmlFor="mf-region" className={labelCls}>
            Kraj
          </label>
          <select
            id="mf-region"
            className={cn(inputCls, "appearance-none")}
            defaultValue=""
            {...register("region")}
          >
            <option value="" disabled>
              Vyber kraj…
            </option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Err msg={errors.region?.message} />
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
                className="translate-y-[1px] accent-[#10393f]"
              />
              {f}
            </label>
          ))}
        </div>
        <Err msg={errors.focus?.message} />
      </fieldset>

      <div className="mt-8 space-y-3 border-t border-hairline pt-6">
        <label className="flex cursor-pointer items-baseline gap-3 text-[14.5px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            {...register("agreeStatutes")}
            className="translate-y-[1px] accent-[#10393f]"
          />
          <span>
            Souhlasím se stanovami komory a s{" "}
            <a
              href="/eticky-kodex"
              className="text-brass underline-offset-4 hover:underline"
            >
              etickým kodexem
            </a>
            . <span className="text-ink">(povinné)</span>
          </span>
        </label>
        <Err msg={errors.agreeStatutes?.message} />

        <label className="flex cursor-pointer items-baseline gap-3 text-[14.5px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            {...register("publicListing")}
            className="translate-y-[1px] accent-[#10393f]"
          />
          <span>
            Souhlasím se zveřejněním svého jména v seznamu členů.{" "}
            <span className="text-ink-2/70">(nepovinné)</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-baseline gap-3 text-[14.5px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            {...register("agreeGdpr")}
            className="translate-y-[1px] accent-[#10393f]"
          />
          <span>
            Souhlasím se{" "}
            <a
              href="/ochrana-osobnich-udaju"
              className="text-brass underline-offset-4 hover:underline"
            >
              zpracováním osobních údajů
            </a>{" "}
            pro účely vyřízení přihlášky a vedení evidence členů.{" "}
            <span className="text-ink">(povinné)</span>
          </span>
        </label>
        <Err msg={errors.agreeGdpr?.message} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          className="rounded-[2px] bg-deep px-7 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
        >
          Odeslat přihlášku
        </button>
        <p className="text-[13.5px] leading-snug text-ink-2">
          O přijetí rozhoduje Rada komory. Pokyny k platbě přijdou e-mailem —
          přihláška není platbou.
        </p>
      </div>
    </form>
  );
}
