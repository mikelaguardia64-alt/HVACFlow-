import {NextResponse} from "next/server";
import crypto from "node:crypto";
import {createClient} from "@supabase/supabase-js";

function validTwilio(req:Request,params:URLSearchParams){
  const token=process.env.TWILIO_AUTH_TOKEN, sig=req.headers.get("x-twilio-signature");
  if(!token||!sig) return false;
  const url=new URL(req.url).toString();
  const data=url+Array.from(params.keys()).sort().map(k=>k+params.get(k)).join("");
  const expected=crypto.createHmac("sha1",token).update(data).digest("base64");
  return sig===expected;
}

export async function POST(req:Request){
  const params=new URLSearchParams(await req.text());
  if(!validTwilio(req,params)) return new NextResponse("Forbidden",{status:403});
  const from=params.get("From")||"",to=params.get("To")||"",body=params.get("Body")||"";
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return new NextResponse("Database not configured",{status:503});
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:company}=await db.from("companies").select("id").eq("twilio_phone_number",to).maybeSingle();
  if(company){
    const {data:lead}=await db.from("leads").select("id").eq("company_id",company.id).or(`phone.eq.${from},phone.eq.${from.replace(/^\+1/,"")}`).limit(1).maybeSingle();
    await db.from("conversations").insert({company_id:company.id,lead_id:lead?.id||null,channel:"sms",direction:"inbound",body});
  }
  return new NextResponse("<Response></Response>",{headers:{"Content-Type":"text/xml"}});
}
