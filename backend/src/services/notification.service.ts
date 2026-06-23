import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../lib/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export interface AlertJob {
  jobTitle: string;
  jobUrl: string;
  publishedAt: Date | null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildJobRow(job: AlertJob): string {
  const title = escapeHtml(job.jobTitle);
  const date = job.publishedAt ? job.publishedAt.toLocaleDateString('pt-BR') : null;

  return `
    <tr>
      <td style="padding:0 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-left:4px solid #7c3aed;border-radius:8px;">
          <tr>
            <td style="padding:16px;">
              <a href="${job.jobUrl}" style="font-size:15px;font-weight:bold;color:#111827;text-decoration:none;">${title}</a>
              ${date ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${date}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildEmailTemplate(jobs: AlertJob[]): string {
  const rows = jobs.map(buildJobRow).join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#7c3aed;background-image:linear-gradient(135deg,#7c3aed,#06b6d4);padding:24px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:bold;">🔔 job4devs</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;">
                <p style="margin:0 0 16px;font-size:16px;color:#111827;">
                  Encontramos <strong>${jobs.length}</strong> nova${jobs.length === 1 ? '' : 's'} vaga${jobs.length === 1 ? '' : 's'} que combinam com suas palavras-chave:
                </p>
              </td>
            </tr>
            ${rows}
            <tr>
              <td style="padding:8px 32px 32px;">
                <p style="margin:16px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af;">
                  Você está recebendo este e-mail porque configurou palavras-chave no job4devs. Para ajustar ou parar os alertas, acesse as configurações da sua conta.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// One email per user per cycle — batch jobs into a single message.
// Do NOT send one email per job.
export async function sendAlert(recipientEmail: string, jobs: AlertJob[]): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"job4devs" <${config.smtp.user}>`,
      to: recipientEmail,
      subject: `🔔 ${jobs.length} nova${jobs.length === 1 ? '' : 's'} vaga${jobs.length === 1 ? '' : 's'} encontrada${jobs.length === 1 ? '' : 's'} — job4devs`,
      html: buildEmailTemplate(jobs),
    });
    logger.info({ recipient: recipientEmail, jobCount: jobs.length }, 'Alert email sent');
  } catch (err) {
    logger.error({ err, recipient: recipientEmail, jobCount: jobs.length }, 'Failed to send alert email');
    throw err;
  }
}
