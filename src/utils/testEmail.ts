import 'dotenv/config';
import { sendEmail } from './mailer';

async function main() {
  const to = process.argv[2] || 'kayskidadenusi@gmail.com';
  const subject = 'Welcome to CATALOG — you\'re all set';
  const text = `Hi there,

This is a test email from CATALOG to confirm that our messaging system is working end to end.

If you're reading this in your inbox, delivery is healthy and future updates — order confirmations, wallet notifications, and account activity — will reach you the same way.

You can head to the store any time from the button below to browse the latest verified logs, PayPal accounts, and more.

Thanks for being an early member.

— The CATALOG team`;

  console.log(`Sending test email to ${to}...`);
  const result = await sendEmail({
    to,
    subject,
    text,
    preheader: 'A quick note from the CATALOG team — delivery test.',
  });
  console.log('Sent. Resend id:', result?.id);
}

main().catch((err) => {
  console.error('Failed to send test email:', err);
  process.exit(1);
});
