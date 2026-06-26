// Images des exercices préchargés (servies depuis /public/exercises).
export const EXERCISE_IMAGE: Record<string, string> = {
  "Développé couché": "/exercises/developpe-couche.jpg",
  "Développé incliné": "/exercises/developpe-incline.jpg",
  "Écarté haltères": "/exercises/ecarte-halteres.jpg",
  "Dips": "/exercises/dips.jpg",
  "Tractions": "/exercises/tractions.jpg",
  "Tirage vertical": "/exercises/tirage-vertical.jpg",
  "Rowing barre": "/exercises/rowing-barre.jpg",
  "Rowing haltère": "/exercises/rowing-haltere.jpg",
  "Développé militaire": "/exercises/developpe-militaire.jpg",
  "Élévations latérales": "/exercises/elevations-laterales.jpg",
  "Oiseau": "/exercises/oiseau.jpg",
  "Curl barre": "/exercises/curl-barre.jpg",
  "Curl haltères": "/exercises/curl-halteres.jpg",
  "Curl marteau": "/exercises/curl-marteau.jpg",
  "Barre au front": "/exercises/barre-au-front.jpg",
  "Extension poulie": "/exercises/extension-poulie.jpg",
  "Squat": "/exercises/squat.jpg",
  "Presse à cuisses": "/exercises/presse-a-cuisses.jpg",
  "Fentes": "/exercises/fentes.jpg",
  "Soulevé de terre jambes tendues": "/exercises/souleve-de-terre-jambes-tendues.jpg",
  "Leg curl": "/exercises/leg-curl.jpg",
  "Leg extension": "/exercises/leg-extension.jpeg",
  "Mollets debout": "/exercises/mollets-debout.jpg",
  "Crunch": "/exercises/crunch.jpg",
  "Relevés de jambes": "/exercises/releves-de-jambes.jpg",
};

export function exerciseImage(name: string): string | null {
  return EXERCISE_IMAGE[name] ?? null;
}
