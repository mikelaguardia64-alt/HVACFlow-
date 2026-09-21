import Link from "next/link";

const features = [
  ["Missed-call recovery", "Automatically turn unanswered calls into a text conversation so opportunities do not simply disappear."],
  ["Lead capture", "Capture new HVAC opportunities and keep the contact, source, notes, and pipeline in one place."],
  ["Booking workflow", "Move prospects from first contact toward qualified appointments with a simple operating workflow."],
];

export default function Home() {
  return (
    <>
      <nav className="nav">
        <div className="wrap nav-inner">
          <Link className="brand" href="/">HVAC<span>Flow+</span></Link>
          <div className="nav-actions">
            <Link className="nav-link" href="/sales">How it works</Link>
            <Link className="btn btn-small" href="/demo">Book a demo</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero wrap">
          <div className="eyebrow">HVAC lead follow-up software</div>
          <h1>Turn missed calls and new leads into booked jobs.</h1>
          <p className="hero-copy">
            HVACFlow+ gives HVAC companies a single workflow for capturing leads,
            recovering missed calls, following up, and moving opportunities toward appointments.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/demo">Book a free demo →</Link>
            <Link className="btn btn-secondary" href="/signup">Start with HVACFlow+</Link>
          </div>
          <p className="microcopy">Built specifically for HVAC contractors. $497/month.</p>
        </section>

        <section className="wrap proof-grid">
          <div><strong>Missed calls</strong><span>Recover the conversation</span></div>
          <div><strong>New leads</strong><span>Capture them immediately</span></div>
          <div><strong>Appointments</strong><span>Keep the pipeline moving</span></div>
        </section>

        <section className="section wrap">
          <div className="section-heading">
            <div className="eyebrow">One workflow</div>
            <h2>Stop letting good leads go cold.</h2>
            <p className="muted">HVACFlow+ is designed around the moments where HVAC companies most often lose opportunities.</p>
          </div>
          <div className="grid">
            {features.map(([h, p]) => (
              <div className="card" key={h}>
                <div className="card-number">{features.findIndex(x => x[0] === h) + 1}</div>
                <h3>{h}</h3>
                <p className="muted">{p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section wrap">
          <div className="split-card">
            <div>
              <div className="eyebrow">Simple offer</div>
              <h2>$497/month</h2>
              <p className="muted">One HVAC-focused operating system for lead capture, missed-call recovery, follow-up, and booking workflow.</p>
            </div>
            <div className="cta-stack">
              <Link className="btn" href="/demo">See HVACFlow+ in action</Link>
              <Link className="text-link" href="/signup">Create an account →</Link>
            </div>
          </div>
        </section>

        <section className="section wrap">
          <div className="dark-cta">
            <div className="eyebrow">Ready when you are</div>
            <h2>Give every new HVAC opportunity a faster path to a conversation.</h2>
            <Link className="btn" href="/demo">Book a free demo →</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span>© 2026 HVACFlow+</span>
          <div><Link href="/sales">How it works</Link><Link href="/demo">Book a demo</Link><Link href="/login">Log in</Link></div>
        </div>
      </footer>
    </>
  );
}