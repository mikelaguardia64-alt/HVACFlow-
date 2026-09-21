import {NextResponse} from "next/server";
import crypto from "node:crypto";
import {createClient} from "@supabase/supabase-js";

function validTwilio(req:Request,params:URLSearchParams){
  const token=process.env.TWILIO_AUTH_TOKEN,sig=req.headers.get("x-twilio-signature");
  if(!token||!sig) return false;
  const url=new URL(req.url).toString();
  const data=url+Array.from(params.keys()).sort().map(k=>k+params.get(k)).join("");
  const expected=crypto.createHmac("sha1",token).update(data).digest("base64");
  return sig===expected;
}
async function sendSms(to:string,body:string){
  const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN;
  if(!sid||!token) return;
  const p=new URLSearchParams({To:to,Body:body});
  if(process.env.TWILIO_MESSAGING_SERVICE_SID)p.set("MessagingServiceSid",process.env.TWILIO_MESSAGING_SERVICE_SID);
  else if(process.env.TWILIO_PHONE_NUMBER)p.set("From",process.env.TWILIO_PHONE_NUMBER); else return;
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:"POST",headers:{Authorization:"Basic "+Buffer.from(sid+":"+token).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:p});
}
export async function POST(req:Request){
  const params=new URLSearchParams(await req.text());
  if(!validTwilio(req,params)) return new NextResponse("Forbidden",{status:403});
  const status=params.get("CallStatus"),from=params.get("From")||"",to=params.get("To")||"";
  if(!["no-answer","busy","failed"].includes(status||"")) return new NextResponse("<Response></Response>",{headers:{"Content-Type":"text/xml"}});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(url&&key){
    const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:company}=await db.from("companies").select("id").eq("twilio_phone_number",to).maybeSingle();
    if(company){
      const {data:lead}=await db.from("leads").select("id").eq("company_id",company.id).or(`phone.eq.${from},phone.eq.${from.replace(/^\+1/,"")}`).limit(1).maybeSingle();
      await db.from("conversations").insert({company_id:company.id,lead_id:lead?.id||null,channel:"voice",direction:"inbound",body:`Missed call from ${from} (${status})`});
      await sendSms(from,"Hi! We just missed your call. This is HVACFlow+. How can we help with your HVAC needs? Reply here and our team will get back to you.");
    }
  }
  return new NextResponse("<Response></Response>",{headers:{"Content-Type":"text/xml"}});
}
