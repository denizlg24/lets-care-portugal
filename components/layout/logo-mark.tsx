import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import imagem from "@/public/imagem.png";

/**
 * Alpha mask that feathers the rectangular logo image inward from all four
 * borders (keeping the image's aspect), then breaks that fade up with fractal
 * noise so the edges dissolve into grain instead of a clean soft rectangle.
 *
 * Shape: an inset opaque rect blurred with feGaussianBlur so every border
 * fades evenly. The fade lives in the *alpha* channel (opaque white ->
 * transparent) so the mask behaves the same whether the browser resolves it as
 * an alpha mask (WebKit) or a luminance mask (Firefox/Chrome).
 */
const MASK_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 112' preserveAspectRatio='none'>
  <defs>
    <filter id='grain' x='-20%' y='-20%' width='140%' height='140%' color-interpolation-filters='sRGB'>
      <feGaussianBlur in='SourceGraphic' stdDeviation='9 6' result='soft'/>
      <feTurbulence type='fractalNoise' baseFrequency='0.07' numOctaves='2' seed='11' stitchTiles='stitch' result='noise'/>
      <feColorMatrix in='noise' type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.33 0.33 0.33 0 -0.5' result='grain'/>
      <feComposite in='soft' in2='grain' operator='arithmetic' k1='0' k2='1' k3='0.28' k4='0' result='mixed'/>
      <feComposite in='mixed' in2='soft' operator='in'/>
    </filter>
  </defs>
  <rect x='20' y='12' width='160' height='88' fill='#fff' filter='url(#grain)'/>
</svg>`;

const MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(MASK_SVG)}")`;

const maskStyle: CSSProperties = {
  maskImage: MASK_URL,
  WebkitMaskImage: MASK_URL,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

interface LogoMarkProps {
  className?: string;
  priority?: boolean;
}

export function LogoMark({ className, priority }: LogoMarkProps) {
  return (
    <Image
      src={imagem}
      alt="LeTs Care Portugal"
      priority={priority}
      style={maskStyle}
      className={cn("h-auto w-full select-none", className)}
    />
  );
}
