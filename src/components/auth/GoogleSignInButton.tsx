import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode: 'popup' }): void;
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

  useEffect(() => {
    if (!clientId) {
      onUnavailable('Login com Google ainda não foi configurado.');
      return;
    }
    let active = true;
    const render = () => {
      if (!active || !window.google || !buttonTarget.current) return;
      buttonTarget.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: ({ credential }) => credential && onCredential(credential),
      });
      const availableWidth = Math.max(240, Math.floor(buttonTarget.current.getBoundingClientRect().width));
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
      script.onerror = () => onUnavailable('Não foi possível carregar o login do Google.');
      document.head.appendChild(script);
    }
    const observer = new ResizeObserver(() => window.google && render());
    if (buttonTarget.current) observer.observe(buttonTarget.current);
    return () => { active = false; observer.disconnect(); };
  }, [clientId, onCredential, onUnavailable]);

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
