import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmationRequest = ConfirmationOptions & {
  resolve: (confirmed: boolean) => void;
};

const listeners = new Set<(request: ConfirmationRequest) => void>();

export const confirmAction = (options: ConfirmationOptions): Promise<boolean> =>
  new Promise((resolve) => {
    const listener = listeners.values().next().value;
    if (!listener) {
      resolve(false);
      return;
    }
    listener({ ...options, resolve });
  });

export function ConfirmationHost() {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const activeResolver = useRef<((confirmed: boolean) => void) | null>(null);

  useEffect(() => {
    const listener = (nextRequest: ConfirmationRequest) => {
      activeResolver.current?.(false);
      activeResolver.current = nextRequest.resolve;
      setRequest(nextRequest);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      activeResolver.current?.(false);
    };
  }, []);

  const finish = (confirmed: boolean) => {
    activeResolver.current?.(confirmed);
    activeResolver.current = null;
    setRequest(null);
  };

  return (
    <AlertDialog open={request !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => finish(false)}>
            {request?.cancelLabel || "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => finish(true)}
          >
            {request?.confirmLabel || "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
