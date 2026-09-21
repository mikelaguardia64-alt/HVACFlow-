import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import {createClient} from "@supabase/supabase-js";

async function twilioSend(to:string,body:string){
  const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN;
  if(!sid||!token) throw new Error("Twilio is not configured yet");
  const params=new URLSearchParams({To:to,Body:body});
  if(process.env.TWILIO_MESSAGING_SERVICE_SID) params.set("MessagingServiceSid",process.env.TWILIO_MESSAGING_SERVICE_SID);
  else if(process.env.TWILIO_PHONE_NUMBER) params.set("From",process.env.TWILIO_PHONE_NUMBER);
  else throw new Error("TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER is required");
  const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{
    method:"POST",headers:{Authorization:"Basic "+Buffer.from(sid+":"+token).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:params,cache:"no-store"
  });
  const d=await r.json();
  if(!r.ok) throw new Error(d?.message||"Twilio rejected the SMS");
  return d;
}

export async function POST(req:Request){
  try{
    const c=await cookies();
    const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>c.getAll(),setAll:a=>a.forEach(({name,value,options})=>c.set(name,value,options))}});
    const {data:{user}}=await s.auth.getUser();
    if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
    const body=await req.json();
    if(!body.to||!body.message) return NextResponse.json({error:"to and message are required"},{status:400});
    const {data:m}=await s.from("company_members").select("company_id").eq("user_id",user.id).maybeSingle();
    if(!m?.company_id) return NextResponse.json({error:"Company not found"},{status:404});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:lead}=await db.from("leads").select("id").eq("company_id",m.company_id).or(`phone.eq.${body.to},phone.eq.${body.to.replace(/^\+1/,"")}`).limit(1).maybeSingle();
    const tw=await twilioSend(body.to,body.message);
    await db.from("conversations").insert({company_id:m.company_id,lead_id:lead?.id||null,channel:"sms",direction:"outbound",body:body.message});
    return NextResponse.json({ok:true,messageSid:tw.sid});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to send SMS"},{status:500});}
}
