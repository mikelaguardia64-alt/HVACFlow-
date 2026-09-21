import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

export async function POST(){
  try{
    const c=await cookies();
    const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
      cookies:{getAll:()=>c.getAll(),setAll:a=>a.forEach(({name,value,options})=>c.set(name,value,options))}
    });
    const {data:{user}}=await s.auth.getUser();
    if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
    const {data:m}=await s.from("company_members").select("company_id,companies(stripe_customer_id)").eq("user_id",user.id).maybeSingle();
    const company=(m?.companies as any);
    if(!company?.stripe_customer_id) return NextResponse.json({error:"No Stripe customer found"},{status:404});
    const key=process.env.STRIPE_SECRET_KEY;
    if(!key) throw new Error("Stripe is not configured yet");
    const origin=process.env.NEXT_PUBLIC_APP_URL || "https://hvac-flow-hvacf-low.vercel.app";
    const body=new URLSearchParams({customer:company.stripe_customer_id,return_url:origin+"/dashboard"});
    const res=await fetch("https://api.stripe.com/v1/billing_portal/sessions",{
      method:"POST",headers:{"Authorization":"Basic "+Buffer.from(key+":").toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body,cache:"no-store"
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data?.error?.message||"Stripe portal request failed");
    return NextResponse.json({url:data.url});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Unable to open billing portal"},{status:500});
  }
}
