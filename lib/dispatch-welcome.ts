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
  const selected = newsletterTopics.filter(t => subscription.topics.includes(t.id));
  const preferences = selected.map(t => t.label).join(' · ');
  const topicNames = selected.map(t => escapeHtml(t.label)).join(' &nbsp; · &nbsp; ');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f4ef;color:#172b31;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">You're on the list. Thoughtful tools, useful guides, and the AI updates worth your time.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f4ef;"><tr><td align="center" style="padding:32px 16px 42px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #dce5d8;border-radius:18px;overflow:hidden;">
<tr><td style="background:#132932;padding:30px 38px 0;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:22px;letter-spacing:-1px;font-weight:800;color:#ffffff;">tru<span style="color:#d6ef82;">tool</span><span style="font-size:9px;letter-spacing:2px;font-weight:700;color:#b0c4ad;"> &nbsp; / &nbsp; DISPATCH</span></td>
  <td align="right" style="font-size:10px;letter-spacing:1.6px;color:#d6ef82;font-weight:700;">WELCOME EDITION &nbsp; ✳</td></tr></table>
</td></tr>
<tr><td style="background:#132932;padding:44px 38px 41px;color:#ffffff;">
  <div style="height:3px;width:60px;background:#d6ef82;border-radius:3px;margin-bottom:23px;"></div>
  <div style="font-size:12px;letter-spacing:2.8px;font-weight:700;color:#d6ef82;margin-bottom:17px;">YOU'RE OFFICIALLY IN</div>
  <h1 style="font-size:clamp(34px,7vw,50px);line-height:1.08;letter-spacing:-2px;font-weight:700;margin:0 0 21px;color:#ffffff;">Less noise.<br><span style="color:#d6ef82;">Better discoveries.</span></h1>
  <p style="font-size:16px;line-height:1.7;color:#d1dedb;margin:0;max-width:470px;">Welcome to TruTool Dispatch — a thoughtful place for useful software, meaningful AI developments, and smarter decisions.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:30px;"><tr>
  <td style="padding:10px 16px;background:#d6ef82;border-radius:8px;color:#183126;font-size:11px;font-weight:800;letter-spacing:1.2px;">YOUR SUBSCRIPTION IS ACTIVE</td>
  </tr></table>
</td></tr>
<tr><td style="padding:35px 38px 13px;">
  <p style="font-size:11px;letter-spacing:2px;font-weight:800;color:#5c7e45;margin:0 0 11px;">A NOTE FROM THE EDITORS</p>
  <h2 style="font-size:27px;letter-spacing:-1px;line-height:1.25;color:#142b31;margin:0 0 16px;">The internet has enough lists.<br>We'd rather send you perspective.</h2>
  <p style="font-size:15px;line-height:1.85;color:#526468;margin:0;">We'll share the tools worth evaluating, the shifts in AI worth understanding, and straightforward guides to help you choose what actually works. Nothing to catch up on. Just useful discoveries when they matter.</p>
</td></tr>
<tr><td style="padding:19px 38px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e9dc;border-radius:12px;overflow:hidden;">
<tr><td style="background:#f7faf3;padding:19px 21px;border-bottom:1px solid #e0e9dc;">
  <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;color:#729252;margin-bottom:5px;">01 / DISCOVER</div>
  <div style="font-size:17px;font-weight:700;color:#193035;">Find tools that earn their place.</div>
  <div style="font-size:13px;line-height:1.65;color:#647677;margin-top:5px;">Explore useful software by category and practical use case.</div>
</td></tr>
<tr><td style="background:#ffffff;padding:19px 21px;border-bottom:1px solid #e0e9dc;">
  <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;color:#729252;margin-bottom:5px;">02 / UNDERSTAND</div>
  <div style="font-size:17px;font-weight:700;color:#193035;">Make sense of what AI changes.</div>
  <div style="font-size:13px;line-height:1.65;color:#647677;margin-top:5px;">Clear context without hype, with links to explore further.</div>
</td></tr>
<tr><td style="background:#f7faf3;padding:19px 21px;">
  <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;color:#729252;margin-bottom:5px;">03 / DECIDE</div>
  <div style="font-size:17px;font-weight:700;color:#193035;">Choose with more confidence.</div>
  <div style="font-size:13px;line-height:1.65;color:#647677;margin-top:5px;">Comparisons, guides, and practical questions worth asking.</div>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:26px 38px 26px;">
  <a href="${link('/tools')}" style="display:inline-block;padding:16px 30px;border-radius:9px;background:#162e34;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:.2px;">Explore TruTool &nbsp; →</a>
  <p style="font-size:12px;color:#778784;margin:17px 0 0;">Curious already? That's a good place to start.</p>
</td></tr>
<tr><td style="padding:19px 38px 29px;background:#f3f7ed;border-top:1px solid #e0e9dc;">
  <p style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#587740;margin:0 0 9px;">YOUR DISPATCH TOPICS</p>
  <p style="font-size:13px;line-height:1.65;color:#50635b;margin:0;">${topicNames}</p>
  <p style="font-size:12px;line-height:1.7;color:#6b7a70;margin:19px 0 0;">You're receiving this because you subscribed at TruTool. You can <a href="${escapeHtml(unsubscribe)}" style="color:#355f30;text-decoration:underline;">unsubscribe at any time</a>.</p>
</td></tr>
</table>
<p style="font-size:11px;color:#849188;line-height:1.8;margin:18px 0;">TruTool Dispatch · ${ROOT} · Independent software discovery<br><a href="${ROOT}/privacy" style="color:#698367;text-decoration:underline;">Privacy policy</a> &nbsp; · &nbsp; <a href="${escapeHtml(unsubscribe)}" style="color:#698367;text-decoration:underline;">Unsubscribe</a></p>
</td></tr></table></body></html>`;
  const text = [
    'WELCOME TO TRUTOOL DISPATCH', '',
    'Less noise. Better discoveries.', '',
    "You're officially on the list. Thanks for subscribing to TruTool Dispatch.",
    "We'll share useful tools, meaningful AI developments, and practical buying guides — with context rather than hype.", '',
    '01 / DISCOVER: Useful software by category. ' + link('/tools'),
    '02 / UNDERSTAND: AI developments that matter. ' + link('/everything-ai'),
    '03 / DECIDE: Practical buying guides. ' + link('/guides'), '',
    'Your topics: ' + preferences, '',
    'Unsubscribe whenever you like: ' + unsubscribe, '',
    'TruTool Dispatch · ' + ROOT
  ].join('\n');
  return { subject: "You're in. Welcome to TruTool Dispatch.", html, text };
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
