import{redirect}from"next/navigation";
import{createServerClient}from"@supabase/ssr";
import{cookies}from"next/headers";
import BillingActions from"./BillingActions";

export default async function DashboardPage(){
  const c=await cookies();
  const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    cookies:{getAll:()=>c.getAll(),setAll:a=>a.forEach(({name,value,options})=>c.set(name,value,options))}
  });
  const{data:{user}}=await s.auth.getUser();
  if(!user)redirect("/login");
  const{data:m}=await s.from("company_members").select("company_id,companies(name,subscription_status,subscription_current_period_end)").eq("user_id",user.id).maybeSingle();
  const id=m?.company_id;
  const{count:leads}=id?await s.from("leads").select("id",{count:"exact",head:true}).eq("company_id",id):{count:0};
  const{count:appointments}=id?await s.from("appointments").select("id",{count:"exact",head:true}).eq("company_id",id):{count:0};
  const company=(m?.companies as any);
  const active=company?.subscription_status==="active"||company?.subscription_status==="trialing";
  return <main className="wrap"><div className="form">
    <div className="brand">HVAC<span style={{color:"#42d6ff"}}>Flow+</span></div>
    <h1>Dashboard</h1>
    <p className="muted">{user.email}</p>
    <div className="card"><h2>{leads??0}</h2><p>Leads</p></div>
    <div className="card"><h2>{appointments??0}</h2><p>Appointments</p></div>
    <div className="card"><h2>{company?.name??"—"}</h2><p>Company</p></div>
    <div className="card">
      <h2>{active?"Active":"Not active"}</h2>
      <p>HVACFlow+ subscription</p>
      <BillingActions active={active}/>
    </div>
  </div></main>;
}