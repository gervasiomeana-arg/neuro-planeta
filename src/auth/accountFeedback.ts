export const RECOVERY_MESSAGE = 'Si el correo corresponde a una cuenta, recibirás las instrucciones para recuperar el acceso.';

// Never distinguish an unknown account from a successful recovery request.
// Network/rate-limit failures do not disclose whether the account exists.
export function recoveryErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code) : '';
  if (code === 'auth/network-request-failed') return 'No se pudo conectar. Revisá tu conexión e intentá más tarde.';
  if (code === 'auth/too-many-requests') return 'Hay demasiados intentos. Esperá un momento antes de volver a intentar.';
  return RECOVERY_MESSAGE;
}
