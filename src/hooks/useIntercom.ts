import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    Intercom: (...args: unknown[]) => void;
    intercomSettings: {
      app_id: string;
      [key: string]: unknown;
    };
  }
}

interface UseIntercomOptions {
  appId: string;
}

export function useIntercom({ appId }: UseIntercomOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!appId) return;

    // Initialize Intercom settings
    window.intercomSettings = {
      app_id: appId,
    };

    // Load Intercom script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://widget.intercom.io/widget/${appId}`;
    script.onload = () => {
      setIsLoaded(true);

      // Boot Intercom
      if (window.Intercom) {
        window.Intercom("boot", {
          app_id: appId,
        });

        // Listen for show/hide events
        window.Intercom("onShow", () => {
          setIsOpen(true);
        });

        window.Intercom("onHide", () => {
          setIsOpen(false);
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (window.Intercom) {
        window.Intercom("shutdown");
      }
      script.remove();
    };
  }, [appId]);

  const show = useCallback(() => {
    if (window.Intercom) {
      window.Intercom("show");
    }
  }, []);

  const hide = useCallback(() => {
    if (window.Intercom) {
      window.Intercom("hide");
    }
  }, []);

  return { isOpen, isLoaded, show, hide };
}
