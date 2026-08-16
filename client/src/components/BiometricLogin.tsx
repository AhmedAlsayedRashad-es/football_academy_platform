import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Fingerprint, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface BiometricLoginProps {
  userId?: number;
  mode: 'register' | 'authenticate';
  onSuccess?: () => void;
  className?: string;
}

export function BiometricLogin({ userId, mode, onSuccess, className = '' }: BiometricLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  // Registration
  const { data: regOptions, refetch: fetchRegOptions } = trpc.users.passkeyRegistrationOptions.useQuery(
    undefined,
    { enabled: false }
  );
  const registerMutation = trpc.users.passkeyRegister.useMutation();

  // Authentication
  const { refetch: fetchAuthOptions } = trpc.users.passkeyAuthOptions.useQuery(
    { userId: effectiveUserId! },
    { enabled: false }
  );
  const authMutation = trpc.users.passkeyAuthenticate.useMutation();

  const handleRegister = async () => {
    if (!effectiveUserId) return;
    setIsLoading(true);
    try {
      const { data: options } = await fetchRegOptions();
      if (!options) throw new Error('Could not get registration options');

      const response = await startRegistration({ optionsJSON: options as any });
      await registerMutation.mutateAsync({ response });

      toast({
        title: 'Biometric login enabled!',
        description: 'You can now use Face ID or fingerprint to sign in.',
      });
      onSuccess?.();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast({ title: 'Cancelled', description: 'Biometric registration was cancelled.', variant: 'destructive' });
      } else {
        toast({ title: 'Registration failed', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!effectiveUserId) return;
    setIsLoading(true);
    try {
      const { data: options } = await fetchAuthOptions();
      if (!options) throw new Error('Could not get authentication options');

      const response = await startAuthentication({ optionsJSON: options as any });
      await authMutation.mutateAsync({ userId: effectiveUserId, response });

      toast({
        title: 'Authenticated!',
        description: 'Biometric authentication successful.',
      });
      onSuccess?.();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast({ title: 'Cancelled', description: 'Biometric authentication was cancelled.', variant: 'destructive' });
      } else {
        toast({ title: 'Authentication failed', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    return null;
  }

  if (mode === 'register') {
    return (
      <Button
        type="button"
        variant="outline"
        className={`gap-2 ${className}`}
        onClick={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {isLoading ? 'Setting up...' : 'Enable Face ID / Fingerprint'}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={`gap-2 w-full ${className}`}
      onClick={handleAuthenticate}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShieldCheck className="h-4 w-4" />
      )}
      {isLoading ? 'Authenticating...' : 'Sign in with Face ID / Fingerprint'}
    </Button>
  );
}

/**
 * PasskeyManager — shown in Settings to list and delete registered passkeys
 */
export function PasskeyManager() {
  const { data: passkeys, refetch } = trpc.users.passkeyList.useQuery();
  const deleteMutation = trpc.users.passkeyDelete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Registered Passkeys</h3>
        <BiometricLogin mode="register" onSuccess={() => refetch()} />
      </div>
      {!passkeys?.length ? (
        <p className="text-sm text-muted-foreground">No passkeys registered yet.</p>
      ) : (
        <ul className="space-y-2">
          {passkeys.map((pk) => (
            <li key={pk.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium capitalize">{pk.deviceType.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(pk.createdAt).toLocaleDateString()}
                    {pk.lastUsedAt && ` · Last used ${new Date(pk.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate({ id: pk.id })}
                disabled={deleteMutation.isPending}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
