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
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f4f0;color:#253736;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">A little less noise, a lot more clarity. Welcome to TruTool.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f4f0;"><tr><td align="center" style="padding:32px 14px 36px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e0e6df;border-radius:16px;overflow:hidden;">
<tr><td style="background:#142f31;padding:26px 34px 10px;">
  <p style="font-size:25px;font-weight:800;letter-spacing:-1.1px;color:#ffffff;margin:0;">tru<span style="color:#c8e78b;">tool</span> <span style="font-size:9px;letter-spacing:1.3px;font-weight:700;color:#b4ccc7;">&nbsp;/&nbsp; AI &amp; SOFTWARE DISCOVERY</span></p>
</td></tr>
<tr><td style="background:#142f31;padding:24px 34px 40px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="54" height="4" style="background:#c8e78b;font-size:1px;line-height:1px;">&nbsp;</td><td width="8">&nbsp;</td><td width="16" height="4" style="background:#6c9871;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
  <p style="margin:26px 0 12px;font-size:11px;font-weight:800;letter-spacing:2px;color:#c8e78b;">WELCOME TO TRUTOOL</p>
  <h1 style="margin:0 0 16px;font-size:36px;line-height:1.15;letter-spacing:-1.4px;font-weight:800;color:#ffffff;">Less noise.<br><span style="color:#c8e78b;">Better discoveries.</span></h1>
  <p style="margin:0;font-size:15px;line-height:1.7;color:#d4e1db;">Your space for good tools, useful ideas, and the things worth knowing.</p>
</td></tr>
<tr><td style="padding:36px 34px 14px;">
  <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#183337;">Hello there,</p>
  <p style="margin:0 0 15px;font-size:15px;line-height:1.85;color:#455a59;">Thanks for subscribing to TruTool. We're glad you're here.</p>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.85;color:#455a59;">We'll share thoughtful software recommendations, practical guides, and AI updates that help you make better decisions — without the extra noise.</p>
</td></tr>
<tr><td style="padding:0 34px 22px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f6eb;border-left:3px solid #91b56b;border-radius:8px;">
    <tr><td style="padding:17px 21px;">
      <p style="margin:0 0 7px;color:#607f53;font-size:10px;font-weight:800;letter-spacing:1.4px;">YOUR INTERESTS</p>
      <p style="margin:0;font-size:13px;line-height:1.8;color:#29423d;">${topicNames}</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:4px 34px 35px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#193c3a;border-radius:8px;">
    <a href="${link('/tools')}" style="display:inline-block;padding:13px 23px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Explore TruTool &nbsp; →</a>
  </td></tr></table>
  <p style="font-size:15px;line-height:1.8;color:#455a59;margin:28px 0 0;">Happy exploring,<br><strong style="color:#193c3a;">The TruTool team</strong></p>
</td></tr>
<tr><td style="background:#f8faf6;border-top:1px solid #e7ebe5;padding:20px 34px 24px;">
  <p style="margin:0 0 10px;font-size:12px;line-height:1.75;color:#697d77;">You're receiving this because you subscribed to TruTool. <a href="${escapeHtml(unsubscribe)}" style="color:#406b49;text-decoration:underline;">Unsubscribe any time</a>.</p>
  <p style="margin:0;font-size:11px;line-height:1.7;color:#82918b;">TruTool &nbsp; · &nbsp; <a href="${ROOT}/privacy" style="color:#82918b;text-decoration:underline;">Privacy policy</a></p>
</td></tr></table>
</td></tr></table>
</body></html>`;
  const text = [
    'Welcome to TruTool', '',
    'Less noise. Better discoveries.', '',
    'Hello there,', '',
    "Thanks for subscribing to TruTool. We're glad you're here.", '',
    "We'll share thoughtful software recommendations, practical guides, and AI updates that help you make better decisions — without the extra noise.", '',
    'Your interests: ' + preferences, '',
    'Explore TruTool: ' + link('/tools'), '',
    'Happy exploring,',
    'The TruTool team', '',
    "You're receiving this because you subscribed to TruTool.",
    'Unsubscribe any time: ' + unsubscribe, '',
    'TruTool · ' + ROOT
  ].join('\n');
  return { subject: 'Welcome to TruTool', html, text };
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
