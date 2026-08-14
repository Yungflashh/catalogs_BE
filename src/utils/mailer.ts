// Transactional email sender for CATALOG. Wraps the Resend SDK and renders
// outgoing messages with the dark, on-brand HTML template used across admin
// and system emails. Requires RESEND_API_KEY and EMAIL_FROM in the env.
import { Resend } from 'resend';
import logger from './logger';

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM || 'CATALOG <onboarding@resend.dev>';
const clientUrl = process.env.CLIENT_URL || 'https://catalog.example.com';

const resend = apiKey ? new Resend(apiKey) : null;

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  preheader?: string;
}

export async function sendEmail({ to, subject, text, preheader }: SendArgs) {
  if (!resend) {
    throw new Error('Email service is not configured. Set RESEND_API_KEY in the server env.');
  }

  const html = renderTemplate({ subject, text, preheader });

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    logger.error('Email send failed', { to, subject, error });
    throw new Error(error.message || 'Failed to send email');
  }

  logger.info('Email sent', { to, subject, id: data?.id });
  return data;
}

function renderTemplate({
  subject,
  text,
  preheader,
}: {
  subject: string;
  text: string;
  preheader?: string;
}): string {
  const bodyHtml = text
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 18px;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#c7ccd6;">${escapeHtml(
          p
        ).replace(/\n/g, '<br/>')}</p>`
    )
    .join('');

  const previewText = escapeHtml(preheader || stripToPreview(text));
  const shopUrl = `${clientUrl.replace(/\/$/, '')}/shop`;
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .card { border-radius: 0 !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .py { padding-top: 28px !important; padding-bottom: 28px !important; }
      .h1 { font-size: 22px !important; line-height: 1.25 !important; }
      .btn a { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
    a { color: #4ade80; }
    /* Force dark palette against Gmail auto color inversion */
    u + .body .gmail-fix { color: #c7ccd6 !important; }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background:#08090e;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- preheader (hidden inbox preview) -->
  <div style="display:none;overflow:hidden;line-height:1;opacity:0;max-height:0;max-width:0;font-size:1px;color:#08090e;mso-hide:all;">
    ${previewText}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#08090e" style="background:#08090e;">
    <tr>
      <td align="center" style="padding:36px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="#0f1117" style="width:100%;max-width:560px;background:#0f1117;border-radius:18px;border:1px solid #1e2130;overflow:hidden;">

          <!-- Top accent bar -->
          <tr><td style="height:3px;background:#22c55e;line-height:3px;font-size:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td class="px py" style="padding:28px 36px;border-bottom:1px solid #1e2130;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;background:#22c55e;color:#07100d;font-weight:800;font-size:14px;border-radius:9px;vertical-align:middle;">C</span>
                    <span style="display:inline-block;margin-left:11px;font-weight:800;font-size:16px;letter-spacing:0.14em;color:#f1f5f9;vertical-align:middle;">CATALOG</span>
                  </td>
                  <td align="right" style="font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#5b6478;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;">
                    Verified &amp; Fresh
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px py" style="padding:36px;">
              <h1 class="h1" style="margin:0 0 22px;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:26px;line-height:1.25;letter-spacing:-0.01em;color:#f1f5f9;">
                ${escapeHtml(subject)}
              </h1>
              <div class="gmail-fix">${bodyHtml}</div>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="margin:26px 0 6px;">
                <tr>
                  <td align="center" bgcolor="#22c55e" style="border-radius:999px;">
                    <a href="${shopUrl}" target="_blank" style="display:inline-block;padding:13px 30px;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:14px;color:#07100d;text-decoration:none;border-radius:999px;letter-spacing:0.02em;">
                      Visit CATALOG →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 36px;"><div style="height:1px;background:#1e2130;line-height:1px;font-size:0;">&nbsp;</div></td></tr>

          <!-- Footer -->
          <tr>
            <td class="px" style="padding:22px 36px 30px;">
              <p style="margin:0 0 8px;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#6b7387;line-height:1.65;">
                You received this email because you have an account on CATALOG.
                If this wasn't expected, you can safely ignore this message.
              </p>
              <p style="margin:12px 0 0;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#4a5162;letter-spacing:0.06em;">
                © ${year} CATALOG. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!-- Spacer below card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
          <tr><td style="padding:16px 8px 0;text-align:center;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#3d4354;letter-spacing:0.05em;">
            Sent to you securely by CATALOG.
          </td></tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripToPreview(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 120);
}
