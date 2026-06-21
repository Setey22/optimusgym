export type Exercise = {
  number: number;
  title: string;
  tip: string;
};

export const baseExercises: Exercise[] = [
  { number: 1, title: "Press de banca", tip: "Mantén los pies firmes y baja la barra controladamente." },
  { number: 2, title: "Press inclinado con mancuernas", tip: "No bloquees los codos arriba, mantén tensión constante." },
  { number: 3, title: "Aperturas con mancuernas", tip: "Codos ligeramente flexionados, enfócate en el estiramiento." },
  { number: 4, title: "Remo con barra", tip: "Mantén la espalda recta y lleva los codos hacia atrás." },
  { number: 5, title: "Jalón al pecho en polea", tip: "Pecho arriba y hombros hacia atrás al jalar." },
  { number: 6, title: "Remo sentado en polea", tip: "Aprieta los omóplatos al final del movimiento." },
  { number: 7, title: "Press militar", tip: "Contrae el core y evita arquear la zona lumbar." },
  { number: 8, title: "Elevaciones laterales", tip: "Sube los brazos hasta la altura de los hombros." },
  { number: 9, title: "Curl de bíceps", tip: "No balancees el cuerpo." },
  { number: 10, title: "Extensión de tríceps", tip: "Mantén los codos pegados al cuerpo." },
  { number: 11, title: "Sentadilla", tip: "Baja controlado y mantén el torso firme." },
  { number: 12, title: "Peso muerto rumano", tip: "Cadera hacia atrás y espalda neutra." },
  { number: 13, title: "Prensa", tip: "No bloquees las rodillas al subir." },
  { number: 14, title: "Zancadas", tip: "Paso firme y rodilla alineada." },
  { number: 15, title: "Abdominales", tip: "Controla la respiración y no tires del cuello." },
];

export type Gender = "hombres" | "damas";

export function getRoutine(_gender: Gender, _level: number, day: 1 | 2): Exercise[] {
  // Mock: rotate slightly per day so it feels distinct
  if (day === 2) {
    return [...baseExercises.slice(7), ...baseExercises.slice(0, 7)].map((e, i) => ({ ...e, number: i + 1 }));
  }
  return baseExercises;
}
