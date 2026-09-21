"use client";
import {useState} from "react";

export default function BillingActions({active}:{active:boolean}){
  const [loading,setLoading]=useState<"checkout"|"portal"|null>(null);
  async function go(kind:"checkout"|"portal"){
    setLoading(kind);
    try{
      const r=await fetch("/api/billing/"+kind,{method:"POST"});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Unable to continue");
      window.location.href=data.url;
    }catch(e){
      alert(e instanceof Error?e.message:"Unable to continue");
      setLoading(null);
    }
  }
  return <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    {active
      ? <button className="btn" onClick={()=>go("portal")} disabled={!!loading}>{loading==="portal"?"Opening…":"Manage billing"}</button>
      : <button className="btn" onClick={()=>go("checkout")} disabled={!!loading}>{loading==="checkout"?"Opening checkout…":"Activate HVACFlow+ — $497/month"}</button>}
  </div>;
}
