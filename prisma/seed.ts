import prisma from "../src/lib/prisma";

const SYSTEM_PRESETS = [
  // Yoga
  {
    name: "Медитация",
    category: "yoga",
    presetData: {
      type: "BINARY",
      period: "DAILY",
      target: 1,
      xpReward: 10,
      penalty: -2,
      targetUnit: null,
      allowPartial: false,
      allowNegative: false,
    },
  },
  {
    name: "Йога-практика",
    category: "yoga",
    presetData: {
      type: "QUANTITATIVE",
      period: "WEEKLY",
      target: 3,
      targetUnit: "тренировок",
      xpReward: 15,
      penalty: -3,
      allowPartial: true,
      allowNegative: false,
    },
  },
  
  // Fitness
  {
    name: "Тренировки",
    category: "fitness",
    presetData: {
      type: "QUANTITATIVE",
      period: "WEEKLY",
      target: 3,
      targetUnit: "тренировок",
      xpReward: 20,
      penalty: -5,
      allowPartial: true,
      allowNegative: false,
    },
  },
  {
    name: "Шаги в день",
    category: "fitness",
    presetData: {
      type: "QUANTITATIVE",
      period: "DAILY",
      target: 10000,
      targetUnit: "шагов",
      xpReward: 10,
      penalty: -2,
    },
  },
  
  // Programming
  {
    name: "Обучение программированию",
    category: "programming",
    presetData: {
      type: "QUANTITATIVE",
      period: "DAILY",
      target: 2,
      targetUnit: "часов",
      xpReward: 20,
      penalty: -5,
    },
  },
  {
    name: "Практика кода",
    category: "programming",
    presetData: {
      type: "QUANTITATIVE",
      period: "WEEKLY",
      target: 5,
      xpReward: 25,
      penalty: -5,
      targetUnit: "часов",
    },
  },
  
  // Reading
  {
    name: "Страницы в день",
    category: "reading",
    presetData: {
      type: "QUANTITATIVE",
      period: "DAILY",
      target: 30,
      targetUnit: "страниц",
      xpReward: 10,
      penalty: -2,
    },
  },
  {
    name: "Книга в месяц",
    category: "reading",
    presetData: {
      type: "QUANTITATIVE",
      period: "MONTHLY",
      target: 1,
      targetUnit: "книг",
      xpReward: 50,
      penalty: -5,
    },
  },
  
  // Nutrition
  {
    name: "План питания",
    category: "nutrition",
    presetData: {
      type: "BINARY",
      period: "DAILY",
      target: 1,
      xpReward: 10,
      penalty: -2,
    },
  },
];

async function seedPresets() {
  for (const preset of SYSTEM_PRESETS) {
    await prisma.goalPreset.create({
      data: {
        ...preset,
        userId: null,
        isSystem: true,
      },
    });
  }
}

seedPresets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
