"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ACCENTS, type AccentKey } from "./village-accents";

// O WebGL só existe no navegador: carrega a cena sem SSR.
const VillageScene = dynamic(() => import("./village-scene"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-[2rem]" />,
});

/** Diorama 3D do vilarejo, com troca da cor dos telhados e enfeites. */
export function Village() {
  const [accent, setAccent] = useState<AccentKey>("cobre");

  return (
    <div className="relative">
      <div className="h-[340px] w-full cursor-grab active:cursor-grabbing sm:h-[420px] md:h-[480px]">
        <VillageScene accent={accent} />
      </div>
      <div className="mx-auto -mt-2 flex w-fit items-center gap-2 rounded-full bg-cream/10 p-1.5 pl-4 backdrop-blur">
        <span className="eyebrow text-cream/60">Enfeites</span>
        {(Object.keys(ACCENTS) as AccentKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setAccent(key)}
            aria-label={ACCENTS[key].label}
            aria-pressed={accent === key}
            title={ACCENTS[key].label}
            className={`size-8 cursor-pointer rounded-full transition ${
              accent === key ? "ring-2 ring-gold-soft ring-offset-2 ring-offset-pine-800" : "opacity-80 hover:opacity-100"
            }`}
            style={{ background: ACCENTS[key].color }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-cream/45">Arraste para girar o vilarejo</p>
    </div>
  );
}
