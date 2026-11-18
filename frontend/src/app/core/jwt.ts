interface Payload {
  sub?: unknown;
  exp?: unknown;
}

function leerPayload(token: string): Payload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as Payload;
  } catch {
    return null;
  }
}

export function vencimiento(token: string): number | null {
  const exp = leerPayload(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

export function usuarioDelToken(token: string): string | null {
  const sub = leerPayload(token)?.sub;
  return typeof sub === 'string' ? sub : null;
}
