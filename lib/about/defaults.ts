/**
 * Fallback collage shown next to the mission text. Each slot of
 * `AboutSettings.missionImages` with an empty `image` renders the default at
 * the same position. Shared by the public page and the admin editor preview.
 */
export const DEFAULT_MISSION_IMAGES = [
  {
    src: "/about/active_ageing.png",
    alt: "Envelhecimento ativo — pessoas mais velhas em atividade",
  },
  {
    src: "/about/imagem_co_housing.png",
    alt: "Co-housing — habitação colaborativa para pessoas mais velhas",
  },
  {
    src: "/about/imagem_burnout.png",
    alt: "Apoio a cuidadores em situação de burnout",
  },
  {
    src: "/about/annabel_podevyn_f_ubz_hf_da_vmc_unsplash.jpg",
    alt: "Cuidado e proximidade entre gerações",
  },
] as const;

export const MISSION_IMAGE_SLOTS = DEFAULT_MISSION_IMAGES.length;
