import {NextResponse} from "next/server";
import crypto from "node:crypto";
import {createClient} from "@supabase/supabase-js";

function verifyStripeSignature(payload:string,header:string,secret:string){
  const parts=header.split(",").reduce<Record<string,string[]>>((acc,p)=>{
    const [k,v]=p.split("=",2); if(k&&v)(acc[k]??=[]).push(v); return acc;
  },{});
  const timestamp=parts.t?.[0];
  const signatures=parts.v1??[];
  if(!timestamp||!signatures.length) return false;
  const age=Math.abs(Date.now()/1000-Number(timestamp));
  if(!Number.isFinite(age)||age>300) return false;
  const signed=timestamp+"."+payload;
  const expected=crypto.createHmac("sha256",secret).update(signed).digest("hex");
  return signatures.some(sig=>sig.length===expected.length && crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)));
}

export async function POST(req:Request){
  const payload=await req.text();
  const signature=req.headers.get("stripe-signature")||"";
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secret||!verifyStripeSignature(payload,signature,secret)){
    return NextResponse.json({error:"Invalid Stripe signature"},{status:400});
  }
  try{
    const event=JSON.parse(payload);
    const object=event.data?.object;
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key) throw new Error("Database is not configured");
    const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
    const companyId=object?.metadata?.company_id;
    const customerId=object?.customer;
    if(["checkout.session.completed","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
      const subscription=event.type==="checkout.session.completed"
        ? object.subscription
        : object;
      const status=event.type==="customer.subscription.deleted" ? "canceled" : (subscription?.status||"inactive");
      const periodEnd=subscription?.current_period_end ? new Date(subscription.current_period_end*1000).toISOString() : null;
      const update={subscription_status:status,stripe_subscription_id:subscription?.id||null,subscription_current_period_end:periodEnd};
      if(companyId){
        await db.from("companies").update(update).eq("id",companyId);
      }else if(customerId){
        await db.from("companies").update(update).eq("stripe_customer_id",customerId);
      }
    }
    return NextResponse.json({received:true});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Webhook processing failed"},{status:500});
  }
}
