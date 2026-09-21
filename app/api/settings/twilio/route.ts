import {NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

export async function POST(req:Request){
  const c=await cookies();
  const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>c.getAll(),setAll:a=>a.forEach(({name,value,options})=>c.set(name,value,options))}});
  const {data:{user}}=await s.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await req.json();
  const phone=String(body.phone||"").trim();
  if(!/^\+1\d{10}$/.test(phone))return NextResponse.json({error:"Use a US phone number in +1XXXXXXXXXX format"},{status:400});
  const {data:m}=await s.from("company_members").select("company_id").eq("user_id",user.id).maybeSingle();
  if(!m?.company_id)return NextResponse.json({error:"Company not found"},{status:404});
  const {error}=await s.from("companies").update({twilio_phone_number:phone}).eq("id",m.company_id);
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true,phone});
}
