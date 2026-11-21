/**
 * Registro de tareas asíncronas que justifican un indicador de carga global.
 * No guarda datos del usuario, de la sesión ni del carrito.
 */
type LoadingSubscriber = () => void;
const subscribers = new Set<LoadingSubscriber>();
let activeLoads = 0;

const notifySubscribers = (): void => {
  subscribers.forEach((notify) => notify());
};

/** Inicia una tarea y devuelve una función de cierre segura e idempotente. */
export const beginGlobalLoading = (): (() => void) => {
  activeLoads += 1;
  notifySubscribers();
  let finished = false;

  return () => {
    if (finished) return; // Una respuesta o error jamás puede restar dos veces.
    finished = true;
    activeLoads = Math.max(0, activeLoads - 1);
    notifySubscribers();
  };
};

/** Funciones estables para useSyncExternalStore de React. */
export const subscribeGlobalLoading = (subscriber: LoadingSubscriber): (() => void) => {
  subscribers.add(subscriber);
  return () => { subscribers.delete(subscriber); };
};

export const getGlobalLoadingCount = (): number => activeLoads;
