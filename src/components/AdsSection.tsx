import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { publicUrl } from "@/lib/media";

type Ad = {
  id: string;
  image_url: string;
  link_url: string;
  audience: "hombres" | "damas" | "both";
  position: number;
};

export default function AdsSection({ gender }: { gender: "hombres" | "damas" }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ads")
        .select("id,image_url,link_url,audience,position")
        .eq("is_active", true)
        .in("audience", [gender, "both"])
        .order("position", { ascending: true })
        .limit(3);
      if (!cancel) {
        if (error) console.error("ads load error", error);
        setAds((data ?? []) as Ad[]);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [gender]);

  if (loading || ads.length === 0) return null;

  return (
    <section className="px-4 md:px-8 mt-10 mb-4">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Espacios
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => {
          const src = publicUrl("ad-images", ad.image_url) ?? ad.image_url;
          return (
            <a
              key={ad.id}
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block rounded-2xl overflow-hidden border border-border bg-white hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/9] w-full bg-surface">
                <img src={src} alt="Espacio publicitario" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
