/**
 * En producción se puede integrar SendGrid, Resend, Firebase Extensions o servicio SMTP.
 */

export type PaymentSupportEmailInput = {
  destinatarioEmail: string;
  destinatarioNombre: string;
  numeroSoporte: string;
  monto: number;
  periodo: string;
  contratoCode: string;
};

export type EmailSendResult = {
  success: boolean;
  simulated: boolean;
  messageId?: string;
};

export async function sendPaymentSupportEmail(
  input: PaymentSupportEmailInput
): Promise<EmailSendResult> {
  void input;
  return {
    success: true,
    simulated: true,
    messageId: `sim-${Date.now()}`,
  };
}
