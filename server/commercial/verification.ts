// Only these fixed categories may reach the browser. Never forward SDK errors or tokens.
export type VerificationFailure = 'SESSION_INVALID' | 'FIREBASE_AUTH_PERMISSION' | 'FIREBASE_DATABASE_PERMISSION' | 'SERVER_CREDENTIALS' | 'FIREBASE_UNAVAILABLE';
export class AccountVerificationError extends Error {
  constructor(readonly reason: VerificationFailure) { super(reason); }
}
const invalidSessions = new Set(['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error', 'auth/invalid-argument', 'auth/user-disabled', 'auth/user-not-found', 'auth/tenant-id-mismatch']);
export function verificationFailure(error: unknown, stage: 'auth' | 'database' = 'auth'): AccountVerificationError {
  if (error instanceof AccountVerificationError) return error;
  const code = error && typeof error === 'object' && 'code' in error ? (error as { code: unknown }).code : undefined;
  if (stage === 'auth' && typeof code === 'string' && invalidSessions.has(code)) return new AccountVerificationError('SESSION_INVALID');
  if (code === 'auth/insufficient-permission') return new AccountVerificationError('FIREBASE_AUTH_PERMISSION');
  if (code === 7 || code === 'permission-denied' || code === 'PERMISSION_DENIED') return new AccountVerificationError(stage === 'database' ? 'FIREBASE_DATABASE_PERMISSION' : 'FIREBASE_AUTH_PERMISSION');
  if (code === 'app/invalid-credential' || code === 'auth/invalid-credential' || code === 16 || code === 'UNAUTHENTICATED') return new AccountVerificationError('SERVER_CREDENTIALS');
  return new AccountVerificationError('FIREBASE_UNAVAILABLE');
}
export function verificationResponse(error: unknown) {
  const { reason } = verificationFailure(error);
  const messages: Record<VerificationFailure, string> = {
    SESSION_INVALID: 'No se pudo verificar tu sesión. Volvé a ingresar con Google.',
    FIREBASE_AUTH_PERMISSION: 'El servidor no tiene permisos suficientes en Firebase Authentication. La administración debe revisar la identidad de servicio; volver a ingresar con Google no resuelve este permiso.',
    FIREBASE_DATABASE_PERMISSION: 'El servidor no tiene permisos suficientes para consultar los roles en Firestore. La administración debe revisar la identidad de servicio.',
    SERVER_CREDENTIALS: 'Las credenciales del servidor para Firebase no están disponibles o no son válidas. La administración debe revisar su configuración.',
    FIREBASE_UNAVAILABLE: 'El servidor no pudo completar la comprobación con Firebase. La administración debe revisar su conexión y configuración. Tus perfiles no se modificaron.',
  };
  return { status: reason === 'SESSION_INVALID' ? 401 : 503, body: { error: messages[reason], code: reason } };
}
