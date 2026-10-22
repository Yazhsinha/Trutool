import {timingSafeEqual} from 'node:crypto';
import {getAIProductLaunches} from '@/lib/launch-discovery';
import {getAINews} from '@/lib/ai-news';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET,auth=request.headers.get('authorization')||'';
 const expected=secret?'Bearer '+secret:'';
 const supplied=Buffer.from(auth),wanted=Buffer.from(expected);
 if(!expected||supplied.length!==wanted.length||!timingSafeEqual(supplied,wanted))return Response.json({error:'Unauthorized'},{status:401});
 try{
  const [launches,news]=await Promise.all([getAIProductLaunches(),getAINews()]);
  return Response.json({ok:true,launches:launches.length,stories:news.length,source:'public feeds',updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({ok:false,error:'Feed refresh temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
