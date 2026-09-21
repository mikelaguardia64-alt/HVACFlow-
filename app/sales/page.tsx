import Link from "next/link";

const steps = [
  ["1", "Capture", "New opportunities enter one place instead of getting scattered across calls, texts, and notes."],
  ["2", "Recover", "Missed calls can trigger an immediate text conversation so the customer has a way to respond."],
  ["3", "Follow up", "Keep lead details and conversations organized while your team works the opportunity."],
  ["4", "Book", "Move qualified prospects toward appointments with a clear workflow."],
];

export default function SalesPage() {
  return (
    <>
      <nav className="nav"><div className="wrap nav-inner"><Link className="brand" href="/">HVAC<span>Flow+</span></Link><Link className="btn btn-small" href="/demo">Book a demo</Link></div></nav>
      <main>
        <section className="hero wrap compact-hero">
          <div className="eyebrow">How HVACFlow+ works</div>
          <h1>A tighter system for the leads your HVAC company already worked to earn.</h1>
          <p className="hero-copy">HVACFlow+ connects lead capture, missed-call recovery, follow-up, CRM organization, and the path to an appointment.</p>
        </section>

        <section className="section wrap">
          <div className="steps">
            {steps.map(([n, h, p]) => <div className="step" key={n}><div className="card-number">{n}</div><h3>{h}</h3><p className="muted">{p}</p></div>)}
          </div>
        </section>

        <section className="section wrap">
          <div className="split-card">
            <div><div className="eyebrow">Built for the HVAC sales cycle</div><h2>One place to see what needs attention.</h2><p className="muted">Lead records, appointments, conversations, billing, and CRM connections are brought into the same operating workflow.</p></div>
            <ul className="check-list"><li>Lead capture</li><li>Missed-call recovery</li><li>SMS communications</li><li>Appointment workflow</li><li>Close CRM connection</li><li>Subscription billing</li></ul>
          </div>
        </section>

        <section className="section wrap">
          <div className="dark-cta"><div className="eyebrow">$497/month</div><h2>See the workflow before you commit.</h2><p className="muted">Book a demo and walk through the platform with your actual HVAC sales process in mind.</p><Link className="btn" href="/demo">Book a free demo →</Link></div>
        </section>
      </main>
      <footer className="footer"><div className="wrap footer-inner"><span>© 2026 HVACFlow+</span><Link href="/signup">Start HVACFlow+</Link></div></footer>
    </>
  );
}