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
    [0, 0.18].forEach((atraso, indice) => {
      const oscilador = audioContext!.createOscillator();
      const volume = audioContext!.createGain();
      oscilador.type = 'sine';
      oscilador.frequency.value = indice === 0 ? 740 : 940;
      volume.gain.setValueAtTime(0.0001, agora + atraso);
      volume.gain.exponentialRampToValueAtTime(0.22, agora + atraso + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, agora + atraso + 0.16);
      oscilador.connect(volume);
      volume.connect(audioContext!.destination);
      oscilador.start(agora + atraso);
      oscilador.stop(agora + atraso + 0.18);
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
