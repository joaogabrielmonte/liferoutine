export type AIWorkoutInput = {
  gender: 'homem' | 'mulher';
  objective: 'massa' | 'emagrecimento' | 'definicao' | 'saude';
  experience: 'iniciante' | 'intermediario' | 'avancado';
  preferredTime: string;
  notes?: string;
};

export type GeneratedWorkoutSplit = {
  id: string;
  name: string;
  category: string;
  exercises: string[];
};

export function generateAIWorkoutPlan(input: AIWorkoutInput): {
  greeting: string;
  splits: GeneratedWorkoutSplit[];
  advice: string;
} {
  const isMale = input.gender === 'homem';
  const isMassa = input.objective === 'massa';
  const isEmagrecimento = input.objective === 'emagrecimento';
  const isBeginner = input.experience === 'iniciante';

  let greeting = `Olá! Sou seu **Personal Trainer IA**. Analisei suas preferências:\n`;
  greeting += `• **Gênero:** ${isMale ? 'Masculino' : 'Feminino'}\n`;
  greeting += `• **Objetivo:** ${isMassa ? 'Ganho de Massa Muscular (Hipertrofia)' : isEmagrecimento ? 'Emagrecimento & Definição' : 'Condicionamento & Saúde'}\n`;
  greeting += `• **Nível:** ${input.experience.toUpperCase()}\n`;
  if (input.notes) {
    greeting += `• **Ajustes do Personal:** "${input.notes}"\n`;
  }

  let splits: GeneratedWorkoutSplit[] = [];

  if (isBeginner) {
    splits = [
      {
        id: `ai-${Date.now()}-1`,
        name: 'Treino A (IA) - Membros Superiores Completo',
        category: 'Iniciante / Push-Pull',
        exercises: [
          'Supino Reto na Máquina (3x12)',
          'Puxada Frontal Aberta (3x12)',
          'Desenvolvimento com Halteres (3x10)',
          'Rosca Direta no Pulley (3x12)',
          'Tríceps Pulley (3x12)',
        ],
      },
      {
        id: `ai-${Date.now()}-2`,
        name: 'Treino B (IA) - Membros Inferiores & Core',
        category: 'Iniciante / Legs',
        exercises: [
          'Leg Press 45º (3x12)',
          'Cadeira Extensora (3x15)',
          'Cadeira Flexora (3x12)',
          'Panturrilha em Pé (3x15)',
          'Abdominal Supra no Solo (3x20)',
        ],
      },
    ];
  } else if (!isMale) {
    // Female Intermediate / Advanced Split
    splits = [
      {
        id: `ai-${Date.now()}-1`,
        name: 'Treino A (IA) - Glúteos & Isquiotibiais (Foco)',
        category: 'Hipertrofia Feminina',
        exercises: [
          'Elevação Pélvica com Barra (4x10)',
          'Agachamento Sumô (4x12)',
          'Stiff com Halteres (4x10)',
          'Cadeira Abdutora (3x15 - Drop na última)',
          'Glúteo na Polia Alta (3x12 por perna)',
        ],
      },
      {
        id: `ai-${Date.now()}-2`,
        name: 'Treino B (IA) - Membros Superiores & Costas',
        category: 'Definição & Postura',
        exercises: [
          'Puxada Alta Articulada (4x10)',
          'Remada Baixa Neutra (3x12)',
          'Desenvolvimento Arnold (3x10)',
          'Elevação Lateral (4x12)',
          'Prancha Isométrica (3x45s)',
        ],
      },
      {
        id: `ai-${Date.now()}-3`,
        name: 'Treino C (IA) - Quadríceps, Panturrilha & Cardio',
        category: 'Quadríceps & Cardio',
        exercises: [
          'Agachamento Livre com Barra (4x10)',
          'Leg Press 45º Pé Baixo (4x12)',
          'Cadeira Extensora (3x15)',
          'Panturrilha no Leg Press (4x15)',
          isEmagrecimento ? 'Esteira HIIT 20 min (1 min forte / 1 min leve)' : 'Caminhada Inclinada 15 min',
        ],
      },
    ];
  } else {
    // Male Intermediate / Advanced Split
    splits = [
      {
        id: `ai-${Date.now()}-1`,
        name: 'Treino A (IA) - Peito, Ombros Frontais & Tríceps',
        category: 'Push Hipertrofia',
        exercises: [
          'Supino Inclinado com Halteres (4x10)',
          'Supino Reto com Barra (4x8)',
          'Crossover na Polia Média (3x12)',
          'Desenvolvimento Militar com Halteres (4x10)',
          'Elevação Lateral na Polia (4x12)',
          'Tríceps Testa com Barra W (4x10)',
        ],
      },
      {
        id: `ai-${Date.now()}-2`,
        name: 'Treino B (IA) - Costas, Trapézio & Bíceps',
        category: 'Pull Hipertrofia',
        exercises: [
          'Puxada Alta Pegada Pronada (4x10)',
          'Remada Curvada com Barra (4x8)',
          'Remada Unilateral com Halter (3x12)',
          'Encolhimento com Halteres (4x15)',
          'Rosca Direta com Barra W (4x10)',
          'Rosca Martelo com Halteres (3x12)',
        ],
      },
      {
        id: `ai-${Date.now()}-3`,
        name: 'Treino C (IA) - Pernas Completo & Core',
        category: 'Legs Hipertrofia',
        exercises: [
          'Agachamento Livre (4x8)',
          'Leg Press 45º (4x12)',
          'Cadeira Extensora (3x15)',
          'Mesa Flexora (4x10)',
          'Panturrilha Gêmeos em Pé (4x15)',
          'Abdominal Infra Paralelas (3x15)',
        ],
      },
    ];
  }

  const advice = isMassa
    ? `💡 **Dica da IA:** Mantenha um superávit calórico leve (200-300 kcal), consuma 1.8g-2.0g de proteína por kg e durma de 7 a 8 horas por noite.`
    : isEmagrecimento
    ? `💡 **Dica da IA:** Foque em um déficit calórico moderado, priorize a ingestão de água (35ml/kg) e descanse 45 a 60 segundos entre as séries para manter o batimento elevado.`
    : `💡 **Dica da IA:** Excelente escolha para longevidade! Mantenha a constância de 3 a 4 treinos semanais.`;

  return { greeting, splits, advice };
}
