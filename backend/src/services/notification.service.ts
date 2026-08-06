import { Resend } from 'resend';
import { config } from '../config';
import { logger } from '../lib/logger';

// Railway's Hobby plan blocks all outbound SMTP ports (25/465/587/2525) at
// the network level — no code-level fix gets around that. Resend sends over
// HTTPS instead, which is never blocked.
const resend = new Resend(config.resendApiKey);

export interface AlertJob {
  jobTitle: string;
  jobUrl: string;
  publishedAt: Date | null;
  proposalCount: number | null;
  interestedCount: number | null;
  avgProposalValue: number | null;
  avgDurationDays: number | null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildJobRow(job: AlertJob): string {
  const title = escapeHtml(job.jobTitle);
  const date = job.publishedAt ? job.publishedAt.toLocaleDateString('pt-BR') : null;

  const metaParts: string[] = [];
  if (date) metaParts.push(date);
  if (job.proposalCount !== null) metaParts.push(`${job.proposalCount} proposta${job.proposalCount === 1 ? '' : 's'}`);
  if (job.interestedCount !== null) metaParts.push(`${job.interestedCount} interessado${job.interestedCount === 1 ? '' : 's'}`);
  if (job.avgProposalValue !== null) metaParts.push(`Média R$ ${job.avgProposalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (job.avgDurationDays !== null) metaParts.push(`${job.avgDurationDays} dia${job.avgDurationDays === 1 ? '' : 's'}`);
  const meta = metaParts.length > 0 ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${metaParts.join(' · ')}</p>` : '';

  return `
    <tr>
      <td style="padding:0 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-left:4px solid #7c3aed;border-radius:8px;">
          <tr>
            <td style="padding:16px;">
              <a href="${job.jobUrl}" style="font-size:15px;font-weight:bold;color:#111827;text-decoration:none;">${title}</a>
              ${meta}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildEmailTemplate(jobs: AlertJob[], unsubscribeUrl: string): string {
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
                  Você está recebendo este e-mail porque configurou palavras-chave no job4devs. Para ajustar os alertas, acesse as configurações da sua conta. <a href="${unsubscribeUrl}" style="color:#9ca3af;">Cancelar inscrição</a>
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

export async function sendAuthExpiredAlert(adminEmail: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.emailTransactionalFrom,
    to: adminEmail,
    subject: '⚠️ Credenciais do 99freelas expiraram — job4devs',
    html: `<!doctype html>
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
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:bold;">Os cookies de autenticação do 99freelas expiraram.</p>
                <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Os campos <code>avg_proposal_value</code> e <code>avg_duration_days</code> ficam nulos até a atualização.</p>
                <p style="margin:0 0 8px;font-size:14px;color:#111827;font-weight:bold;">Como corrigir:</p>
                <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#6b7280;line-height:1.8;">
                  <li>Acesse <a href="https://www.99freelas.com.br" style="color:#7c3aed;">99freelas.com.br</a> e faça login</li>
                  <li>Abra DevTools → Application → Cookies → www.99freelas.com.br</li>
                  <li>Copie os valores de <code>kmlicin</code> e <code>kmlicn</code></li>
                  <li>Atualize as variáveis <code>FREELAS99_AUTH_ID</code> e <code>FREELAS99_AUTH_TOKEN</code> no Railway</li>
                </ol>
                <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">Este alerta é enviado apenas uma vez por sessão do servidor.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });

  if (error) {
    throw new Error(error.message);
  }

  logger.info({ recipient: adminEmail }, 'Auth expired alert sent');
}

export async function sendVerificationEmail(recipientEmail: string, verificationUrl: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.emailTransactionalFrom,
    to: recipientEmail,
    subject: 'Confirme seu e-mail — job4devs',
    html: `<!doctype html>
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
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#111827;">Bem-vindo ao job4devs! Clique no botão abaixo para confirmar seu e-mail e ativar sua conta.</p>
                <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">Confirmar e-mail</a>
                <p style="margin:24px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af;">Se o botão não funcionar, copie e cole este link no seu navegador:<br>${verificationUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });

  if (error) {
    throw new Error(error.message);
  }

  logger.info({ recipient: recipientEmail }, 'Verification email sent');
}

export async function sendPasswordResetEmail(recipientEmail: string, resetUrl: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: config.emailTransactionalFrom,
    to: recipientEmail,
    subject: 'Redefinição de senha — job4devs',
    html: `<!doctype html>
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
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#111827;">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">O link abaixo é válido por 1 hora. Se você não solicitou isso, pode ignorar este e-mail.</p>
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">Redefinir senha</a>
                <p style="margin:24px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af;">Se o botão não funcionar, copie e cole este link no seu navegador:<br>${resetUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });

  if (error) {
    throw new Error(error.message);
  }

  logger.info({ recipient: recipientEmail }, 'Password reset email sent');
}

// One email per user per cycle — batch jobs into a single message.
// Do NOT send one email per job.
export async function sendAlert(recipientEmail: string, jobs: AlertJob[], unsubscribeUrl: string): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: config.emailFrom,
      to: recipientEmail,
      subject: `🔔 ${jobs.length} nova${jobs.length === 1 ? '' : 's'} vaga${jobs.length === 1 ? '' : 's'} encontrada${jobs.length === 1 ? '' : 's'} — job4devs`,
      html: buildEmailTemplate(jobs, unsubscribeUrl),
    });

    if (error) {
      throw new Error(error.message);
    }

    logger.info({ recipient: recipientEmail, jobCount: jobs.length }, 'Alert email sent');
  } catch (err) {
    logger.error({ err, recipient: recipientEmail, jobCount: jobs.length }, 'Failed to send alert email');
    throw err;
  }
}
