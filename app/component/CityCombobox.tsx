"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchRegions } from "@/lib/regions";

const MAX_LIST_HEIGHT = 256; // px — matches the old max-h-64
const GAP = 8; // px — the old mt-2 between the input and the list

// Either `top` or `bottom` is set, depending on which side the list opens on.
type Rect = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

// "Domisili" field: a text input with a filtered suggestion list of every kota /
// kabupaten in Indonesia. Free text still submits — profiles saved before this
// list existed keep working, and nobody gets stuck on a missing entry.
//
// The list is portalled to <body> and positioned fixed against the input's own
// rect: the dashboard's <main> is overflow-hidden (for the blurred blobs) and
// the profile card is backdrop-blur-xl, so an in-flow absolute dropdown gets
// clipped by the first and trapped in the second's stacking context.
export default function CityCombobox({
  id,
  value,
  onChange,
  placeholder,
  className,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Only filtered while the list is open, so the 514-entry scan stays off the
  // path of an untouched form.
  const matches = useMemo(() => (open ? searchRegions(value) : []), [open, value]);

  // Anchors the list to the input, flipping above it when the space below is
  // too small — which is what happens on a phone with the keyboard up.
  const measure = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP;
    const above = r.top - GAP;
    const flip = below < 160 && above > below;

    setRect({
      ...(flip
        ? { bottom: window.innerHeight - r.top + GAP }
        : { top: r.bottom + GAP }),
      left: r.left,
      width: r.width,
      maxHeight: Math.min(MAX_LIST_HEIGHT, Math.max(flip ? above : below, 120)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
  }, [open, measure, matches.length]);

  useEffect(() => {
    if (!open) return;

    // Capture phase so scrolling any ancestor — not just the window — re-anchors.
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, measure]);

  // Keeps the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (label: string) => {
    onChange(label);
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        return (next + matches.length) % Math.max(matches.length, 1);
      });
      return;
    }
    if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault(); // pick the suggestion instead of submitting the form
      choose(matches[active].label);
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const list =
    open && rect && matches.length > 0 ? (
      <ul
        id={`${id}-list`}
        ref={listRef}
        role="listbox"
        style={{
          position: "fixed",
          left: rect.left,
          width: rect.width,
          maxHeight: rect.maxHeight,
          top: rect.top,
          bottom: rect.bottom,
        }}
        className="z-[9999] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#1B198F] shadow-2xl py-1"
      >
        {matches.map((r, i) => (
          <li key={r.label} role="option" aria-selected={i === active}>
            <button
              type="button"
              // onMouseDown fires before the input's blur, so the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r.label)}
              onMouseEnter={() => setActive(i)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === active ? "bg-[#A9DB1B] text-[#1B198F] font-semibold" : "text-white/80"
              }`}
            >
              {r.name}
              <span
                className={`block text-xs ${
                  i === active ? "text-[#1B198F]/70" : "text-white/40"
                }`}
              >
                {r.province}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-list`}
        placeholder={placeholder}
        className={className}
      />
      {/* `rect` is only ever set from a client effect, so this never runs on the server. */}
      {list ? createPortal(list, document.body) : null}
    </>
  );
}
