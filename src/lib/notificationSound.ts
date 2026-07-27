const SOUND_ENABLED_KEY = 'delivery-order-sound-enabled';
const SAMPLE_RATE = 22_050;
const DURATION_SECONDS = 3.25;
let alertAudio: HTMLAudioElement | null = null;

export const somNovoPedidoAtivo = (): boolean => {
  try {
    return localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const alarmeNovoPedidoPreparado = (): boolean => (
  alertAudio !== null && somNovoPedidoAtivo()
);

const escreverTexto = (view: DataView, offset: number, texto: string): void => {
  for (let indice = 0; indice < texto.length; indice += 1) {
    view.setUint8(offset + indice, texto.charCodeAt(indice));
  }
};

const criarAlarmeWav = (): string => {
  const totalAmostras = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
  const buffer = new ArrayBuffer(44 + totalAmostras * 2);
  const view = new DataView(buffer);
  escreverTexto(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalAmostras * 2, true);
  escreverTexto(view, 8, 'WAVE');
  escreverTexto(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  escreverTexto(view, 36, 'data');
  view.setUint32(40, totalAmostras * 2, true);

  const tons = [
    { inicio: 0, fim: 0.23, frequencia: 660 },
    { inicio: 0.25, fim: 0.50, frequencia: 880 },
    { inicio: 0.53, fim: 0.86, frequencia: 1100 },
  ];
  for (let indice = 0; indice < totalAmostras; indice += 1) {
    const tempo = indice / SAMPLE_RATE;
    const ciclo = tempo % 1.08;
    const tom = tons.find(item => ciclo >= item.inicio && ciclo < item.fim);
    let amostra = 0;
    if (tom) {
      const posicao = ciclo - tom.inicio;
      const duracao = tom.fim - tom.inicio;
      const envelope = Math.min(1, posicao / 0.018, (duracao - posicao) / 0.045);
      const fundamental = Math.sin(2 * Math.PI * tom.frequencia * posicao);
      const harmonico = Math.sin(2 * Math.PI * tom.frequencia * 2 * posicao) * 0.22;
      amostra = Math.max(-1, Math.min(1, (fundamental + harmonico) * envelope * 0.82));
    }
    view.setInt16(44 + indice * 2, Math.round(amostra * 32767), true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

const obterAudio = (): HTMLAudioElement => {
  if (alertAudio) return alertAudio;
  alertAudio = new Audio(criarAlarmeWav());
  alertAudio.preload = 'auto';
  alertAudio.volume = 1;
  return alertAudio;
};

const reproduzir = async (): Promise<boolean> => {
  try {
    const audio = obterAudio();
    audio.pause();
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
};

export const ativarSomNovoPedido = async (): Promise<boolean> => {
  const ativo = await reproduzir();
  if (ativo) localStorage.setItem(SOUND_ENABLED_KEY, 'true');
  return ativo;
};

export const prepararSomNovoPedido = async (): Promise<boolean> => {
  try {
    const audio = obterAudio();
    audio.volume = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    return true;
  } catch {
    return false;
  }
};

export const tocarSomNovoPedido = (): void => {
  if (!somNovoPedidoAtivo()) return;
  void reproduzir();
};

export const removerNotificacoesSistemaAntigas = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registros = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registros
      .filter(registro => (
        registro.active?.scriptURL.includes('/delivery-sw.js')
        || registro.installing?.scriptURL.includes('/delivery-sw.js')
        || registro.waiting?.scriptURL.includes('/delivery-sw.js')
      ))
      .map(registro => registro.unregister()));
  } catch {
    // Limpeza da versão anterior; não interfere no alarme interno.
  }
};
