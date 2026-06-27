import logo from "@/assets/logo-g23.jpg.asset.json";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  /** Wrap in a black circle for use over light backgrounds (logo only works on black). */
  wrapDark?: boolean;
};

export function BrandLogo({ size = 40, className, wrapDark = false }: Props) {
  const img = (
    <img
      src={logo.url}
      alt="G23"
      width={size}
      height={size}
      className={cn("block object-contain", wrapDark ? "" : className)}
      style={{ width: size, height: size }}
    />
  );
  if (!wrapDark) return img;
  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-full bg-ink", className)}
      style={{ padding: Math.max(6, Math.round(size * 0.12)) }}
    >
      {img}
    </div>
  );
}

export default BrandLogo;
