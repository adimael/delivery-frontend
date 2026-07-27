const SERVICE_WORKER_URL = '/delivery-sw.js';

export const registrarNotificacoesPedido = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
  } catch {
    return null;
  }
};

export const ativarNotificacoesPedido = async (): Promise<boolean> => {
  if (typeof Notification === 'undefined' || !window.isSecureContext) return false;
  const permissao = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permissao !== 'granted') return false;
  return (await registrarNotificacoesPedido()) !== null;
};

export const notificarNovoPedido = async (
  quantidade: number,
  numeroPedido?: string,
): Promise<void> => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const registration = await registrarNotificacoesPedido();
  const body = numeroPedido
    ? `O pedido #${numeroPedido} está aguardando atendimento.`
    : `${quantidade} novo(s) pedido(s) aguardando atendimento.`;

  if (registration) {
    await registration.showNotification('Novo pedido recebido', {
      body,
      tag: numeroPedido ? `pedido-${numeroPedido}` : 'novos-pedidos',
      data: { url: '/dashboard/gerente/pedidos' },
      requireInteraction: true,
    });
    return;
  }

  new Notification('Novo pedido recebido', { body, tag: 'novos-pedidos' });
};
