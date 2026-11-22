/**
 * Respuestas sociales breves de Clippy.
 *
 * Este módulo no diagnostica, no hace terapia ni genera conversaciones clínicas.
 * Las expresiones personales se procesan en memoria y no se envían a Gemini:
 * no se guardan en MongoDB ni se muestran junto a productos.
 */
import type { ClippyTurn } from './clippy.conversation';

export type ClippySocialKind = 'encouragement' | 'urgent';
export interface ClippySocialReply { kind: ClippySocialKind; answer: string }

// Igualamos variantes del español (tildes, mayúsculas y espacios repetidos).
const normalize = (value: string): string => value.toLocaleLowerCase('es-CL')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').trim();

// Una señal explícita de peligro tiene prioridad sobre cualquier otro tema.
// No se activan alarmas por expresiones ambiguas como «me muero de risa».
const IMMEDIATE_RISK = /\b(?:quiero (?:morir|matarme|suicidarme)|me quiero (?:morir|matar)|me voy a (?:matar|suicidar)|no quiero (?:seguir viviendo|vivir mas)|quitarme la vida|hacerme dano|autolesionarme|suicidarme|suicidio)\b/;

// Señales de malestar cotidiano. Exigimos expresiones personales, no palabras
// sueltas: «ropa triste» o «estilo oscuro» no son una consulta emocional.
const SADNESS = /\b(?:estoy|ando|me siento|sigo|he estado)\s+(?:muy\s+|super\s+|re\s+)?(?:triste|bajonead[oa]|desanimad[oa]|deprimid[oa]|decaid[oa]|mal|fatal|p[eé]simo|sin animo|sol[oa]|angustiad[oa])\b|\b(?:tengo (?:mucha )?pena|(?:hoy (?:fue|ha sido)|tuve) un dia (?:horrible|pesimo|terrible)|me siento (?:sin fuerzas|hech[oa] pedazos)|se me vino el mundo encima)\b/;
const STRESS = /\b(?:estoy|ando|me siento)\s+(?:muy\s+|super\s+)?(?:estresad[oa]|frustrad[oa]|ansios[oa]|agotad[oa]|abrumad[oa]|preocupad[oa]|nervios[oa])\b|\b(?:todo me sale mal|no me resulta nada|estoy hasta el cuello|tuve un dia pesado)\b/;
const INSECURITY = /\b(?:me siento|me veo)\s+(?:muy\s+)?(?:fe[oa]|horrible|insegur[oa])\b|\b(?:odio mi cuerpo|no me gusta mi cuerpo|me veo mal)\b/;
const NEUTRAL_FOLLOWUP = /^(?:no se|no se que hacer|no tengo ganas|no tengo animo|sigo igual|igual mal|gracias|muchas gracias|eso|pucha|uf|bueno|ya|si|no)[.!\s]*$/;

// No se utiliza para historiales médicos ni para deducir diagnósticos:
// únicamente impide repetir un consejo que acaba de darse.
const SAD_ANSWERS = [
  '¡Oh, vaya! 🥺 Hay días en los que las cosas simplemente no salen como esperamos. Te mando un abracito virtual. 💛 A veces una buena canción, un poquito de aire fresco o descansar un momento puede ayudar. ¡Ánimo, que un mal día no define toda tu semana!',
  'Pucha, ojalá las cosas mejoren prontito. 💛 No tienes que resolverlo todo de golpe. Date un respiro, cuídate un poquito y, si esto sigue pesando, apoyarte en alguien de confianza también puede hacer bien. ¡Te mando mucha buena energía! 🌷',
  'Ay, qué lata sentirse así. 💛 Ojalá hoy puedas regalarte una pausa, aunque sea cortita: tomar agua, escuchar algo que te guste o descansar un rato. No hace falta que todo salga perfecto hoy. 📎',
  'Uy, esos días pesan. 🌷 Te mando un poquito de ánimo desde este rincón de NoLimits. Un descanso, salir un momento a tomar aire o hablar con alguien querido puede hacer la tarde algo más llevadera. 💛',
] as const;

const STRESS_ANSWERS = [
  'Uff, cuando se juntan muchas cosas, todo parece más grande. 💛 Si puedes, haz una pausa cortita y ve de a una cosa a la vez. No tienes que resolverlo todo hoy. 📎',
  'Pucha, suena a un día pesado. 🌿 Un vaso de agua, unos minutos de descanso y ordenar qué es lo primero pueden ayudar a bajar un poquito las revoluciones. ¡Ánimo!',
  'Vaya, qué agotador sentirse así. 💛 Date permiso para descansar un momento; avanzar de a poquito también cuenta. Te mando buena energía desde NoLimits. 📎',
] as const;

const INSECURITY_ANSWERS = [
  'Ey, no tienes que verte de cierta manera para merecer sentirte bien contigo. 💛 La ropa debería acompañar tu estilo, no ponerte a prueba. Date un poquito de cariño hoy. 🌷',
  'Pucha, a veces somos demasiado duros con nosotros mismos. 💛 Tu valor no depende de una talla, una foto ni de cómo te queda una prenda. Ojalá te trates con la misma amabilidad que darías a un amigo. 📎',
  'Te mando un abrazo virtual. 🌼 No hace falta cumplir un ideal para tener estilo. Lo importante es que te sientas cómodo y auténtico, a tu ritmo. 💛',
] as const;

const FOLLOWUP_ANSWERS = [
  'Está bien no tener todas las respuestas ahora. 💛 Si el día se siente pesado, una pausa y un poquito de descanso también son una forma de cuidarte. Te mando ánimo. 📎',
  'Pucha, espero que pronto tengas un ratito más tranquilo. 🌷 Anda de a poco y, si lo necesitas, busca compañía en alguien de confianza. No tienes que cargar con todo de una vez. 💛',
  'No pasa nada si hoy solo puedes ir paso a paso. 💛 Ojalá una canción, un descanso o algo sencillo que te guste haga este rato un poquito más llevadero. 📎',
] as const;

const URGENT_ANSWER = 'Siento mucho que estés pasando por algo tan difícil. 💛 Tu seguridad es lo primero: si podrías hacerte daño, busca ahora a alguien de confianza que pueda acompañarte y contacta a los servicios de emergencia de tu país. No tienes que afrontar este momento a solas.';

// Reconocer el contenido no equivale a iniciar una conversación emocional.
export const isPersonalDistress = (text: string): boolean => {
  const input = normalize(text);
  return IMMEDIATE_RISK.test(input) || SADNESS.test(input) || STRESS.test(input) || INSECURITY.test(input);
};

// Excluimos también nuestras frases de apoyo del contexto que podría ir a Gemini.
// Así ni el malestar del visitante ni la respuesta local forman parte del prompt.
const SOCIAL_ANSWERS: readonly string[] = [
  ...SAD_ANSWERS, ...STRESS_ANSWERS, ...INSECURITY_ANSWERS,
  ...FOLLOWUP_ANSWERS, URGENT_ANSWER,
];
export const isClippySocialResponse = (text: string): boolean => SOCIAL_ANSWERS.includes(text);

// Evita repetir exactamente la última respuesta del asistente cuando sea posible.
const chooseDifferent = (options: readonly string[], history: ClippyTurn[]): string => {
  const recent = history.filter((turn) => turn.role === 'assistant').slice(-3).map((turn) => turn.text);
  const available = options.filter((answer) => !recent.includes(answer));
  const pool = available.length ? available : options;
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Resuelve expresiones de ánimo ANTES de cualquier recomendación de prendas.
 * Las continuaciones vagas («no sé») solo se tratan como apoyo si un mensaje
 * anterior del usuario ya expresaba malestar, evitando desviar el tema de moda.
 */
export const getClippySocialReply = (question: string, history: ClippyTurn[]): ClippySocialReply | null => {
  const current = normalize(question);
  const recentVisitor = [...history].reverse().find((turn) => turn.role === 'user');
  const previous = recentVisitor ? normalize(recentVisitor.text) : '';

  if (IMMEDIATE_RISK.test(current) || (IMMEDIATE_RISK.test(previous) && NEUTRAL_FOLLOWUP.test(current))) {
    return { kind: 'urgent', answer: URGENT_ANSWER };
  }
  if (INSECURITY.test(current)) {
    return { kind: 'encouragement', answer: chooseDifferent(INSECURITY_ANSWERS, history) };
  }
  if (STRESS.test(current)) {
    return { kind: 'encouragement', answer: chooseDifferent(STRESS_ANSWERS, history) };
  }
  if (SADNESS.test(current)) {
    return { kind: 'encouragement', answer: chooseDifferent(SAD_ANSWERS, history) };
  }
  if (NEUTRAL_FOLLOWUP.test(current) && isPersonalDistress(previous)) {
    return { kind: 'encouragement', answer: chooseDifferent(FOLLOWUP_ANSWERS, history) };
  }
  return null;
};
