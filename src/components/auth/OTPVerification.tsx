import { OTPInput, OTPInputContext } from 'input-otp';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface OTPVerificationProps {
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
}

export function OTPVerification({ onVerify, onResend, email }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onVerify(otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onResend();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Enter the verification code sent to {email}
        </p>
      </div>

      <div className="flex justify-center">
        <OTPInput
          maxLength={6}
          className="flex gap-2"
          value={otp}
          onChange={setOtp}
          render={({ slots }) => (
            <>
              {slots.map((slot, index) => (
                <input
                  key={index}
                  {...slot}
                  className="w-10 h-10 text-center border rounded-md"
                />
              ))}
            </>
          )}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={handleVerify}
          disabled={isLoading || otp.length !== 6}
          className="w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={isLoading}
          className="w-full"
        >
          Resend Code
        </Button>
      </div>
    </div>
  );
} 