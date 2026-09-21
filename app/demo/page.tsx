"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "demo-request" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to submit your request.");
      setMessage("Thanks — your demo request is in. We’ll follow up with you shortly.");
      setForm({ name: "", company: "", email: "", phone: "" });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to submit your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <div className="form demo-form">
        <Link className="brand" href="/">HVAC<span>Flow+</span></Link>
        <div className="eyebrow">Free demo</div>
        <h1>See how HVACFlow+ can recover missed opportunities.</h1>
        <p className="muted">Tell us where you are losing leads today. We’ll show you the workflow and how the $497/month platform fits your business.</p>
        <form onSubmit={submit}>
          <label>Name</label>
          <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <label>HVAC company</label>
          <input className="input" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          <label>Email</label>
          <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label>Business phone</label>
          <input className="input" type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Request my demo →"}</button>
        </form>
        {message && <p className="muted">{message}</p>}
        <p className="small-note">Prefer to start now? <Link href="/signup">Create your HVACFlow+ account.</Link></p>
      </div>
    </main>
  );
}