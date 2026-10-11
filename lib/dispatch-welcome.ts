import 'server-only';
import { newsletterTopics, type NewsletterTopic } from './newsletter';
import { createHash } from 'node:crypto';

const ROOT = 'https://trutool.co';
export type WelcomeSubscription = {
  email: string;
  topics: NewsletterTopic[];
  manageUrl: string;
  eventId: string;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const link = (path: string) => ROOT + path;

export function welcomeEventId(subscriberId: string, consentedAt: string) {
  return 'dispatch-' + createHash('sha256').update(subscriberId + ':' + consentedAt).digest('hex').slice(0, 48);
}

export function welcomeEmail(subscription: WelcomeSubscription) {
  const unsubscribe = link(subscription.manageUrl);
  const selected = newsletterTopics.filter(topic => subscription.topics.includes(topic.id));
  const preferences = selected.map(topic => topic.label).join(' · ');
  const topicNames = selected.map(topic => escapeHtml(topic.label)).join(' &nbsp; · &nbsp; ');

  // A brief, useful welcome confirmation instead of a multi-section marketing newsletter.
  // Gmail decides inbox categories; no email template can guarantee placement in Primary.
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f8f4;color:#243335;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f8f4;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#fff;border:1px solid #e4e9e1;">
<tr><td style="padding:26px 34px 20px;border-top:4px solid #749c59;">
  <p style="font-size:21px;font-weight:800;letter-spacing:-.7px;color:#173338;margin:0;">tru<span style="color:#6e9352;">tool</span> <span style="font-size:11px;font-weight:600;color:#7a8e83;letter-spacing:1.3px;">DISPATCH</span></p>
</td></tr>
<tr><td style="padding:4px 34px 30px;">
  <h1 style="font-size:28px;line-height:1.2;letter-spacing:-.7px;font-weight:700;color:#162d34;margin:12px 0 16px;">Welcome to TruTool Dispatch.</h1>
  <p style="font-size:15px;line-height:1.8;color:#334649;margin:0 0 14px;">Hello,</p>
  <p style="font-size:15px;line-height:1.8;color:#334649;margin:0 0 14px;">Thanks for subscribing. This is a quick note to confirm you're on the TruTool Dispatch list.</p>
  <p style="font-size:15px;line-height:1.8;color:#334649;margin:0 0 14px;">Less noise. Better discoveries. We'll share thoughtful software recommendations, useful guides, and AI developments that are worth understanding.</p>
  <p style="font-size:15px;line-height:1.8;color:#334649;margin:0 0 20px;">You chose to hear about: <strong>${topicNames}</strong>.</p>
  <p style="font-size:15px;line-height:1.8;color:#334649;margin:0 0 22px;">In the meantime, you can <a href="${link('/tools')}" style="color:#355d39;font-weight:700;text-decoration:underline;">browse the tools on TruTool</a> whenever you like.</p>
  <p style="font-size:15px;line-height:1.8;color:#334649;margin:0;">Thanks for being here,<br><strong>The TruTool team</strong></p>
</td></tr>
<tr><td style="border-top:1px solid #e7ebe5;background:#f9faf7;padding:20px 34px;">
  <p style="font-size:12px;line-height:1.7;color:#61716a;margin:0 0 10px;">You received this confirmation because you subscribed to TruTool Dispatch. You can <a href="${escapeHtml(unsubscribe)}" style="color:#355d39;text-decoration:underline;">unsubscribe at any time</a>.</p>
  <p style="font-size:11px;color:#73827b;margin:0;">TruTool · ${ROOT} · <a href="${ROOT}/privacy" style="color:#61716a;">Privacy policy</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = [
    'Welcome to TruTool Dispatch.', '',
    'Hello,', '',
    "Thanks for subscribing. This is a quick note to confirm you're on the TruTool Dispatch list.", '',
    'Less noise. Better discoveries.',
    "We'll share thoughtful software recommendations, useful guides, and AI developments worth understanding.", '',
    'You chose to hear about: ' + preferences, '',
    'Browse the tools on TruTool: ' + link('/tools'), '',
    'Thanks for being here,',
    'The TruTool team', '',
    'You received this confirmation because you subscribed to TruTool Dispatch.',
    'Unsubscribe at any time: ' + unsubscribe, '',
    'TruTool · ' + ROOT
  ].join('\n');
  return { subject: 'Welcome to TruTool Dispatch', html, text };
}

export async function sendDispatchWelcome(subscription: WelcomeSubscription): Promise<'sent' | 'pending'> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return 'pending';
  const template = welcomeEmail(subscription);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Idempotency-Key': subscription.eventId,
    },
    body: JSON.stringify({
      from,
      to: [subscription.email],
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
    }),
  });
  if (!response.ok) {
    console.error('Resend welcome email was not accepted, HTTP', response.status);
    return 'pending';
  }
  return 'sent';
}
