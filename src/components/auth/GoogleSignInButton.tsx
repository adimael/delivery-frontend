import { useEffect, useRef } from 'react';

let initializedClientId: string | null = null;
let activeCredentialHandler: ((credential: string) => void) | null = null;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode: 'popup';
            use_fedcm_for_button?: boolean;
          }): void;
          renderButton(element: HTMLElement, options: Record<string, unknown>): void;
          cancel(): void;
        };
      };
    };
  }
}

type Props = { disabled?: boolean; onCredential: (credential: string) => void; onUnavailable: (message: string) => void };

export function GoogleSignInButton({ disabled, onCredential, onUnavailable }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const buttonTarget = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const credentialHandler = useRef(onCredential);
  const unavailableHandler = useRef(onUnavailable);
  credentialHandler.current = onCredential;
  unavailableHandler.current = onUnavailable;

  useEffect(() => {
    if (!clientId) {
      unavailableHandler.current('Login com Google ainda não foi configurado.');
      return;
    }
    let active = true;
    let lastWidth = 0;
    let resizeFrame = 0;
    const render = () => {
      if (!active || !window.google || !buttonTarget.current) return;
      if (initializedClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          use_fedcm_for_button: true,
          callback: ({ credential }) => credential && activeCredentialHandler?.(credential),
        });
        initializedClientId = clientId;
      }
      buttonTarget.current.replaceChildren();
      const availableWidth = Math.max(240, Math.floor(buttonTarget.current.getBoundingClientRect().width));
      lastWidth = availableWidth;
      window.google.accounts.id.renderButton(buttonTarget.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'signin_with',
        shape: 'rectangular', width: Math.min(400, availableWidth), locale: 'pt-BR',
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      if (window.google) render(); else existing.addEventListener('load', render, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = render;
      script.onerror = () => unavailableHandler.current('Não foi possível carregar o login do Google.');
      document.head.appendChild(script);
    }
    activeCredentialHandler = (credential) => credentialHandler.current(credential);
    const observer = new ResizeObserver(() => {
      if (!buttonTarget.current) return;
      const width = Math.max(240, Math.floor(buttonTarget.current.getBoundingClientRect().width));
      if (width === lastWidth) return;
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(render);
    });
    if (buttonTarget.current) observer.observe(buttonTarget.current);
    return () => {
      active = false;
      observer.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      activeCredentialHandler = null;
    };
  }, [clientId]);

  return (
    <div
      ref={container}
      className="delivery-google-login"
      aria-label="Fazer login com o Google"
      aria-disabled={disabled}
      style={{ opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <strong className="delivery-google-login-title">Fazer login com o Google</strong>
      <span className="delivery-google-login-hint">Selecione sua conta para continuar com segurança</span>
      <div ref={buttonTarget} className="delivery-google-login-target" />
    </div>
  );
}
