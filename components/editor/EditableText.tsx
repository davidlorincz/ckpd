"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEditMode } from "@/contexts/EditModeContext";
import { useContentValue } from "@/contexts/ContentContext";
import { toast } from "sonner";

const ACCENT = "#2626ff";

type EditableTextProps = {
  /** dot-notation klíč, např. "home.hero.title" */
  k: string;
  /** výchozí text — žije v kódu, DB ho jen přepisuje */
  children: string;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  /** false pro texty uvnitř tlačítek/odkazů, kde by klik kolidoval */
  editable?: boolean;
};

/**
 * Klikací inline editace textu pro přihlášené adminy (port z HUBAI).
 * Pro běžné návštěvníky renderuje čistý fragment bez wrapperu —
 * nulový dopad na DOM i styly.
 */
/**
 * Bez nakonfigurovaného Convexu (chybí NEXT_PUBLIC_CONVEX_URL) renderuje
 * rovnou výchozí text — vnitřek s Convex hooky se vůbec nemontuje,
 * jinak by useMutation bez ConvexProvideru shodil build/prerender.
 */
export function EditableText(props: EditableTextProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <>{props.children}</>;
  }
  return <EditableTextInner {...props} />;
}

function EditableTextInner({
  k,
  children,
  className = "",
  as: Element = "span",
  editable = true,
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const override = useContentValue(k);
  const sourceValue = override || children;

  const canEdit = editable && isEditMode;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(sourceValue);
  const [originalValue, setOriginalValue] = useState(sourceValue);
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);
  const updateContent = useMutation(api.content.update);

  useEffect(() => {
    if (!isEditing) {
      setValue(sourceValue);
      setOriginalValue(sourceValue);
    }
  }, [sourceValue, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && measureRef.current) {
      setInputWidth(measureRef.current.offsetWidth + 4);
    }
  }, [isEditing, value]);

  const isMultiline = value.includes("\n") || value.length > 40;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (canEdit && !isEditing) {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
      }
    },
    [canEdit, isEditing],
  );

  const handleSave = useCallback(async () => {
    if (value === originalValue) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const previousValue = originalValue;
    setOriginalValue(value);
    setIsEditing(false);
    try {
      await updateContent({ key: k, value });
      toast.success("Uloženo");
    } catch (error) {
      setValue(previousValue);
      setOriginalValue(previousValue);
      const msg =
        error instanceof Error && error.message.includes("Zakázaná slovní zásoba")
          ? error.message.replace(/^.*Zakázaná/, "Zakázaná")
          : "Uložení se nepovedlo";
      toast.error(msg);
      console.error("Content update failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [value, originalValue, k, updateContent]);

  const handleCancel = useCallback(() => {
    setValue(originalValue);
    setIsEditing(false);
  }, [originalValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      } else if (e.key === "Enter" && !isMultiline) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Enter" && e.metaKey && isMultiline) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave, isMultiline],
  );

  // Návštěvník: čistý fragment, žádný wrapper — nezasahuje do layoutu ani stylů.
  if (!canEdit) {
    return <>{sourceValue}</>;
  }

  const inputStyles: React.CSSProperties = {
    all: "unset",
    font: "inherit",
    letterSpacing: "inherit",
    lineHeight: "inherit",
    textAlign: "inherit",
    background: "transparent",
    color: "inherit",
    caretColor: ACCENT,
  };

  return (
    <Element
      className={`${className} cursor-text ${
        isEditing
          ? "relative inline outline outline-2 outline-offset-2 outline-[rgba(38,38,255,0.7)]"
          : "rounded-[2px] outline-offset-2 hover:outline hover:outline-1 hover:outline-dashed hover:outline-[rgba(38,38,255,0.55)]"
      }`}
      onClick={handleClick}
    >
      {isEditing ? (
        <>
          {isMultiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              style={{
                ...inputStyles,
                resize: "vertical",
                minHeight: "80px",
                width: "100%",
                display: "block",
              }}
              rows={Math.max(2, value.split("\n").length)}
            />
          ) : (
            <>
              <span
                ref={measureRef}
                style={{
                  position: "absolute",
                  visibility: "hidden",
                  whiteSpace: "pre",
                  font: "inherit",
                  letterSpacing: "inherit",
                }}
                aria-hidden="true"
              >
                {value || " "}
              </span>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                style={{
                  ...inputStyles,
                  width: inputWidth ? `${inputWidth}px` : "auto",
                  minWidth: "1ch",
                }}
              />
            </>
          )}
          <span className="absolute -right-14 top-1/2 z-50 flex -translate-y-1/2 gap-1">
            <span
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              className="cursor-pointer select-none rounded bg-green-600/90 p-1 text-xs leading-none text-white hover:bg-green-600"
              title="Uložit (Enter)"
            >
              ✓
            </span>
            <span
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCancel();
              }}
              className="cursor-pointer select-none rounded bg-red-600/90 p-1 text-xs leading-none text-white hover:bg-red-600"
              title="Zrušit (Esc)"
            >
              ✗
            </span>
          </span>
          {isSaving && (
            <span className="absolute -top-6 left-0 rounded bg-ink/90 px-2 py-0.5 text-xs text-white">
              Ukládám…
            </span>
          )}
        </>
      ) : (
        value
      )}
    </Element>
  );
}

/** Krátký alias pro hromadné obalování textů: <E k="home.hero.title">…</E> */
export const E = EditableText;
