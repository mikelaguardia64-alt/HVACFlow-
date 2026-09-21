"use client";
import{useState}from"react";
export default function CommunicationsSettings({initialPhone}:{initialPhone:string}){
  const[phone,setPhone]=useState(initialPhone),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false);
  async function save(){
    setSaving(true);setSaved(false);
    try{
      const r=await fetch("/api/settings/twilio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to save");
      setSaved(true);
    }catch(e){alert(e instanceof Error?e.message:"Unable to save")}finally{setSaving(false)}
  }
  return <div className="card">
    <h2>Missed-call recovery</h2>
    <p className="muted">Connect the HVAC business phone number that forwards to your Twilio setup. Use E.164 format.</p>
    <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+14075551234" style={{width:"100%",margin:"10px 0"}}/>
    <button className="btn" onClick={save} disabled={saving}>{saving?"Saving…":"Save business number"}</button>
    {saved&&<p className="muted">Saved. Twilio webhooks can now associate calls and texts with this company.</p>}
  </div>;
}
