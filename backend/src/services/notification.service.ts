import nodemailer from 'nodemailer';
import { config } from '../config';

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

function buildEmailTemplate(jobs: AlertJob[]): string {
  const items = jobs
    .map((job) => {
      const title = escapeHtml(job.jobTitle);
      const date = job.publishedAt ? job.publishedAt.toLocaleDateString('pt-BR') : '';
      return `<li><a href="${job.jobUrl}">${title}</a>${date ? ` — ${date}` : ''}</li>`;
    })
    .join('');

  return `<p>Encontramos ${jobs.length} nova(s) vaga(s) para você:</p><ul>${items}</ul>`;
}

// One email per user per cycle — batch jobs into a single message.
// Do NOT send one email per job.
export async function sendAlert(recipientEmail: string, jobs: AlertJob[]): Promise<void> {
  await transporter.sendMail({
    from: config.smtp.user,
    to: recipientEmail,
    subject: `[Job Alert] ${jobs.length} new job(s) found`,
    html: buildEmailTemplate(jobs),
  });
}
