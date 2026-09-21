import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

const STRIPE_API="https://api.stripe.com/v1";

async function stripe(path:string, params:URLSearchParams){
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key) throw new Error("Stripe is not configured yet");
  const res=await fetch(STRIPE_API+path,{
    method:"POST",
    headers:{"Authorization":"Basic "+Buffer.from(key+":").toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},
    body:params.toString(),
    cache:"no-store",
  });
  const data=await res.json();
  if(!res.ok) throw new Error(data?.error?.message||"Stripe request failed");
  return data;
}

export async function POST(){
  try{
    const c=await cookies();
    const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
      cookies:{getAll:()=>c.getAll(),setAll:a=>a.forEach(({name,value,options})=>c.set(name,value,options))}
    });
    const {data:{user}}=await s.auth.getUser();
    if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});

    const {data:m}=await s.from("company_members").select("company_id,companies(id,name,email,stripe_customer_id)").eq("user_id",user.id).maybeSingle();
    const company=(m?.companies as any);
    if(!company) return NextResponse.json({error:"Company not found"},{status:404});
    if(company.stripe_customer_id && company.subscription_status==="active"){
      return NextResponse.json({error:"Subscription already active"},{status:409});
    }

    let customerId=company.stripe_customer_id;
    if(!customerId){
      const customer=await stripe("/customers",new URLSearchParams({
        email:company.email||user.email||"",
        name:company.name||"HVACFlow+ Customer",
        "metadata[company_id]":company.id,
        "metadata[user_id]":user.id,
      }));
      customerId=customer.id;
      const {error}=await s.from("companies").update({stripe_customer_id:customerId}).eq("id",company.id);
      if(error) throw error;
    }

    const priceId=process.env.STRIPE_PRICE_ID;
    if(!priceId) throw new Error("STRIPE_PRICE_ID is not configured yet");
    const origin=process.env.NEXT_PUBLIC_APP_URL || "https://hvac-flow-hvacf-low.vercel.app";
    const session=await stripe("/checkout/sessions",new URLSearchParams({
      mode:"subscription",
      "line_items[0][price]":priceId,
      "line_items[0][quantity]":"1",
      customer:customerId,
      client_reference_id:company.id,
      "metadata[company_id]":company.id,
      "metadata[user_id]":user.id,
      success_url:origin+"/dashboard?billing=success",
      cancel_url:origin+"/dashboard?billing=canceled",
      "subscription_data[metadata][company_id]":company.id,
    }));
    return NextResponse.json({url:session.url});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Unable to start checkout"},{status:500});
  }
}
