import React, { useCallback } from "react";

export function useServerFn<TArgs, TResponse>(fn: (args: TArgs) => Promise<TResponse>) {
  return useCallback((args: any) => {
    return fn(args);
  }, [fn]);
}

export function createServerFn() {
  const builder = {
    middleware: () => builder,
    inputValidator: () => builder,
    handler: (handlerFn: any) => {
      return async (args: any) => {
        const data = args && typeof args === "object" && "data" in args ? args.data : args;
        return handlerFn({ data, context: {} });
      };
    },
  };
  return builder;
}

export function createMiddleware() {
  const middleware = {
    server: () => middleware,
    client: () => middleware,
  };
  return middleware;
}

export function createStart() {
  return () => {};
}

export function createCsrfMiddleware() {
  return {};
}

export function HeadContent() {
  return null;
}

export function Scripts() {
  return null;
}
