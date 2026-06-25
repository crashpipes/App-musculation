import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Bibliothèque d'exercices populaires préchargés (partagés, isPreset = true, userId = null)
const PRESET_EXERCISES: { name: string; muscleGroup: string }[] = [
  // Pectoraux
  { name: "Développé couché", muscleGroup: "Pectoraux" },
  { name: "Développé incliné", muscleGroup: "Pectoraux" },
  { name: "Écarté haltères", muscleGroup: "Pectoraux" },
  { name: "Dips", muscleGroup: "Pectoraux" },
  // Dos
  { name: "Tractions", muscleGroup: "Dos" },
  { name: "Tirage vertical", muscleGroup: "Dos" },
  { name: "Rowing barre", muscleGroup: "Dos" },
  { name: "Rowing haltère", muscleGroup: "Dos" },
  // Épaules
  { name: "Développé militaire", muscleGroup: "Épaules" },
  { name: "Élévations latérales", muscleGroup: "Épaules" },
  { name: "Oiseau", muscleGroup: "Épaules" },
  // Bras
  { name: "Curl barre", muscleGroup: "Bras" },
  { name: "Curl haltères", muscleGroup: "Bras" },
  { name: "Curl marteau", muscleGroup: "Bras" },
  { name: "Barre au front", muscleGroup: "Bras" },
  { name: "Extension poulie", muscleGroup: "Bras" },
  // Jambes
  { name: "Squat", muscleGroup: "Jambes" },
  { name: "Presse à cuisses", muscleGroup: "Jambes" },
  { name: "Fentes", muscleGroup: "Jambes" },
  { name: "Soulevé de terre jambes tendues", muscleGroup: "Jambes" },
  { name: "Leg curl", muscleGroup: "Jambes" },
  { name: "Leg extension", muscleGroup: "Jambes" },
  { name: "Mollets debout", muscleGroup: "Jambes" },
  // Abdominaux
  { name: "Crunch", muscleGroup: "Abdominaux" },
  { name: "Relevés de jambes", muscleGroup: "Abdominaux" },
  { name: "Planche", muscleGroup: "Abdominaux" }
];

async function main() {
  for (const ex of PRESET_EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, isPreset: true }
    });
    if (!existing) {
      await prisma.exercise.create({
        data: { name: ex.name, muscleGroup: ex.muscleGroup, isPreset: true }
      });
    }
  }
  console.log(`Seed terminé : ${PRESET_EXERCISES.length} exercices préchargés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
