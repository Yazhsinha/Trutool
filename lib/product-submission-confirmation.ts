import 'server-only';
import {createHash} from 'node:crypto';
import {get,put} from './private-storage';

export type ProductSubmissionReceipt = {
  id:string; name:string; email:string; topic:string; createdAt:string;
  product?:{name:string;url:string;category:string};
  confirmationEventId?:string; confirmationSentAt?:string;
};
type Delivery='sent'|'pending'|'skipped';
const ROOT='https://trutool.co';
const escape=(text:string)=>text.replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]!));

export function productConfirmationId(id:string){
  return 'trutool-product-'+createHash('sha256').update('submission-receipt:'+id).digest('hex').slice(0,48);
}
export function productSubmissionEmail(record:ProductSubmissionReceipt){
  if(!record.product)throw new Error('No product submission');
  const name=escape(record.name),product=escape(record.product.name),url=escape(record.product.url);
  const reference=record.id.slice(0,8).toUpperCase();
  const subject='TruTool received your product submission — '+record.product.name.slice(0,90);
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
    '<body style="margin:0;background:#f1f4f0;font-family:Arial,Helvetica,sans-serif;color:#263c3a;">'+
    '<table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background:#f1f4f0;"><tr><td align="center" style="padding:32px 16px;">'+
    '<table role="presentation" cellspacing="0" cellpadding="0" width="600" style="width:100%;max-width:600px;background:#fff;border:1px solid #dce5df;border-radius:16px;">'+
    '<tr><td style="background:#173e37;color:#fff;padding:24px 32px;font-size:23px;font-weight:bold;">TruTool</td></tr>'+
    '<tr><td style="padding:30px 32px 12px;"><p style="margin:0 0 12px;color:#5b8061;font-size:12px;font-weight:bold;letter-spacing:1px;">PRODUCT SUBMISSION RECEIVED</p>'+
    '<h1 style="margin:0 0 20px;font-size:27px;line-height:1.3;">Thanks for submitting '+product+'.</h1>'+
    '<p style="font-size:15px;line-height:1.8;">Hi '+name+',</p>'+
    '<p style="font-size:15px;line-height:1.8;">We received your request to list <strong>'+product+'</strong> on TruTool. Our editorial team will check category fit and the information provided.</p>'+
    '<p style="font-size:15px;line-height:1.8;">This confirms receipt only. It does <strong>not</strong> mean your product has been approved or published.</p>'+
    '<div style="background:#f3f7ec;border:1px solid #e0e8d8;padding:16px 20px;border-radius:8px;margin:24px 0;">'+
    '<p style="margin:0 0 9px;font-size:14px;"><strong>Product:</strong> '+product+'</p>'+
    '<p style="margin:0 0 9px;font-size:14px;"><strong>Website:</strong> <a href="'+url+'" style="color:#395e41;">'+url+'</a></p>'+
    '<p style="margin:0;font-size:14px;"><strong>Reference:</strong> '+reference+'</p></div>'+
    '<p style="font-size:15px;line-height:1.8;">If the listing is accepted, we will contact you with the live profile link. In the meantime, you can review how TruTool evaluates listings.</p>'+
    '<a href="'+ROOT+'/methodology" style="display:inline-block;background:#183f38;color:#fff;text-decoration:none;padding:12px 20px;border-radius:7px;font-weight:bold;">Our listing methodology</a>'+
    '<p style="font-size:14px;line-height:1.7;margin-top:25px;">Thanks,<br><strong>The TruTool team</strong></p></td></tr>'+
    '<tr><td style="background:#f8faf7;padding:20px 32px;border-top:1px solid #e2e8df;color:#75857c;font-size:12px;">You received this email because a product was submitted using this email address on TruTool. If you did not submit it, you may ignore this message. <a href="'+ROOT+'/contact" style="color:#49684c;">Contact TruTool</a>.</td></tr>'+
    '</table></td></tr></table></body></html>';
  const text=['TruTool received your product submission','',
    'Hi '+record.name+',','',
    'We received your request to list '+record.product.name+' on TruTool.','',
    'This is a receipt confirmation, not approval or publication. Our team will review the submission.','',
    'Product: '+record.product.name,
    'Website: '+record.product.url,
    'Reference: '+reference,'',
    'If accepted, we will contact you with your live listing link.','',
    'Listing methodology: '+ROOT+'/methodology','',
    'Thanks,','The TruTool team'
  ].join('\n');
  return {subject,html,text};
}
export async function sendProductSubmissionEmail(record:ProductSubmissionReceipt):Promise<'sent'|'pending'>{
  if(!record.product || !record.confirmationEventId)return 'pending';
  const apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
  if(!apiKey||!from)return 'pending';
  const template=productSubmissionEmail(record);
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',cache:'no-store',signal:AbortSignal.timeout(7000),
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':record.confirmationEventId},
    body:JSON.stringify({from,to:[record.email],subject:template.subject,html:template.html,text:template.text,
      ...(process.env.RESEND_REPLY_TO?{reply_to:process.env.RESEND_REPLY_TO}:{})})
  });
  if(!response.ok){console.error('Product receipt email not accepted by provider, HTTP',response.status);return 'pending';}
  return 'sent';
}
export async function deliverPendingProductConfirmation(path:string):Promise<Delivery>{
  if(!/^enquiries\/[^\s]+\/[0-9a-f-]{36}\.json$/.test(path))return 'skipped';
  const original=await get(path,{access:'private',useCache:false});
  if(!original||original.statusCode!==200)return 'skipped';
  const record=await new Response(original.stream).json() as ProductSubmissionReceipt;
  if(!record.product||record.topic!=='suggestion'||!record.confirmationEventId||record.confirmationSentAt)return 'skipped';
  let status:'sent'|'pending'='pending';
  try{status=await sendProductSubmissionEmail(record);}
  catch{console.error('Product receipt send failed');}
  if(status==='sent'){
    try{
      const fresh=await get(path,{access:'private',useCache:false});
      if(fresh?.statusCode===200){
        const current=await new Response(fresh.stream).json() as ProductSubmissionReceipt;
        if(current.confirmationEventId===record.confirmationEventId&&!current.confirmationSentAt){
          await put(path,JSON.stringify({...current,confirmationSentAt:new Date().toISOString()}),
            {access:'private',contentType:'application/json',addRandomSuffix:false,ifMatch:fresh.blob.etag});
        }
      }
    }catch{console.error('Product receipt accepted but its delivery state could not be saved');}
  }
  return status;
}
