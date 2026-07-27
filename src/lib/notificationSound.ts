let audioContext: AudioContext | null = null;
const SOUND_ENABLED_KEY = 'delivery-order-sound-enabled';

export const somNovoPedidoAtivo = (): boolean => {
  try {
    return localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
};

const reproduzirAviso = (): boolean => {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state !== 'running') return false;

    const agora = audioContext.currentTime;
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    compressor.connect(audioContext.destination);

    [0, 1.05, 2.1].forEach((repeticao) => {
      [
        { atraso: 0, frequencia: 660, duracao: 0.24 },
        { atraso: 0.24, frequencia: 880, duracao: 0.26 },
        { atraso: 0.52, frequencia: 1100, duracao: 0.34 },
      ].forEach(({ atraso, frequencia, duracao }, indice) => {
        const inicio = agora + repeticao + atraso;
        const oscilador = audioContext!.createOscillator();
        const volume = audioContext!.createGain();
        oscilador.type = indice === 2 ? 'square' : 'triangle';
        oscilador.frequency.setValueAtTime(frequencia, inicio);
        volume.gain.setValueAtTime(0.0001, inicio);
        volume.gain.exponentialRampToValueAtTime(indice === 2 ? 0.42 : 0.34, inicio + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
        oscilador.connect(volume);
        volume.connect(compressor);
        oscilador.start(inicio);
        oscilador.stop(inicio + duracao + 0.02);
      });
    });
    return true;
  } catch {
    return false;
  }
};

export const ativarSomNovoPedido = async (): Promise<boolean> => {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    if (audioContext.state !== 'running') return false;

    localStorage.setItem(SOUND_ENABLED_KEY, 'true');
    return reproduzirAviso();
  } catch {
    return false;
  }
};

export const tocarSomNovoPedido = (): void => {
  if (!somNovoPedidoAtivo()) return;

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') {
      void audioContext.resume().then(() => reproduzirAviso());
      return;
    }
    reproduzirAviso();
  } catch {
    // O navegador pode suspender áudio quando a página está em segundo plano.
  }
};
