import { apiRequest } from "./api";

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: string;
    backend: string;
  };
  message?: string;
  error?: string;
}

/**
 * Checks the health of the backend and database connection
 * @returns Promise<HealthStatus> - Health status information
 */
export const checkSystemHealth = async (): Promise<HealthStatus> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const data = await apiRequest('/health', {
      method: 'GET',
      signal: controller.signal,
    }) as HealthStatus;
    
    return data ? {
      ...data,
      timestamp: data.timestamp ?? new Date().toISOString(),
      services: data.services ?? {
        database: 'connected',
        backend: 'connected',
      },
    } : {
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        backend: 'error'
      },
      message: 'Backend returned an invalid health check response'
    };
  } catch (error: any) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          backend: 'timeout'
        },
        message: 'Connection timeout - backend not responding'
      };
    }
    
    // Network error (backend unreachable)
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        backend: 'unreachable'
      },
      message: 'Unable to connect to backend service',
      error: error.message
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Continuously checks system health until successful connection is established
 * @param interval - Time in milliseconds between checks (default: 5000ms)
 * @returns Promise<boolean> - True when connection is restored
 */
export const waitForHealthySystem = async (interval: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const health = await checkSystemHealth();
        if (health.status === 'ok') {
          clearInterval(checkInterval);
          resolve(true);
        }
      } catch (error) {
        // Continue checking
      }
    }, interval);
  });
};
