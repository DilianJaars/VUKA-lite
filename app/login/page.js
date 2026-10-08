'use client';
import { useState } from 'react';
import { m } from 'framer-motion';
import { useApp } from '@/components/AppProvider';
import { WatchLogo, ComparisonTable } from '@/components/ui';
import { CITIES, WATCHES } from '@/lib/watches';

const SLANG = ['Howzit', 'Yebo', 'Sharp', 'Lekker', 'Vuka'];
const PICKABLE = WATCHES.filter((w) => w.kind !== 'strava');

export default function LoginPage() {
  const { login, register, toast } = useApp();
  const [step, setStep] = useState('welcome'); // welcome | phone | otp | email | link | name | watch | goal
  const [ident, setIdent] = useState(null); // { id, method }
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Cape Town');
  const [watch, setWatch] = useState('polaroid');
  const [goal, setGoal] = useState(20);
  const [demo, setDemo] = useState(true);
  const [err, setErr] = useState('');

  const proceed = (id, method) => {
    // returning runners skip onboarding - every user has their own data
    if (login(id)) return;
    setIdent({ id, method });
    setStep('name');
  };

  const finish = () => {
    register({ id: ident.id, method: ident.method, name: name.trim() || 'Runner', city, watch, goalKm: goal, demo });
  };

  const phoneOk = (v) => v.replace(/\D/g, '').length >= 9;
  const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v);

  const Back = ({ to }) => (
    <button onClick={() => { setErr(''); setStep(to); }} className="text-sm text-white/60 min-h-[44px] mb-2">← Back</button>
  );

  return (
    <div className="px-5 pb-16 pt-8">
      {/* HERO */}
      <section aria-labelledby="hero">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6" aria-hidden="true">
          {SLANG.map((s) => <span key={s} className="chip text-lime border-lime/40">{s}!</span>)}
        </div>
        <h1 id="hero" className="text-[88px] leading-[0.85] uppercase">
          <span className="text-lime">Vuka</span>
          <br />
          <span className="text-transparent" style={{ WebkitTextStroke: '2px #fff' }}>Lite</span>
        </h1>
        <p className="mt-5 font-heading font-extrabold text-2xl uppercase leading-tight">Press Start. Run. Done.<br /><span className="text-start">No subscription.</span></p>
        <p className="mt-3 text-white/65 max-w-md">The South African Strava Light. Connect any budget watch, track offline through loadshedding, and keep your data. Free for Cape Town, Jozi and Durban runners.</p>
      </section>

      {/* AUTH */}
      <section className="mt-8 card p-5 brut" aria-label="Sign in">
        {step === 'welcome' && (
          <div className="space-y-3">
            <h2 className="text-xl uppercase">Howzit! Let&apos;s go</h2>
            <button className="btn bg-white text-black w-full" onClick={() => proceed('google:demo-account', 'google')}>
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" /><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 019.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 000 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
              Continue with Google
            </button>
            <button className="btn-ghost w-full" onClick={() => setStep('phone')}>Continue with phone number</button>
            <button className="btn-ghost w-full" onClick={() => setStep('email')}>Continue with email</button>
            <p className="text-xs text-white/45 pt-1">No password. No card. Demo build: sign-in is simulated on your device, nothing is sent to a server.</p>
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!phoneOk(phone)) return setErr('Enter your cell number'); setErr(''); setStep('otp'); }} className="space-y-3">
            <Back to="welcome" />
            <label className="label" htmlFor="phone">Cell number</label>
            <div className="flex gap-2">
              <span className="input !w-auto flex items-center font-mono text-white/70">+27</span>
              <input id="phone" className="input font-mono" inputMode="tel" autoComplete="tel-national" placeholder="82 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {err && <p className="text-start text-sm" role="alert">{err}</p>}
            <button className="btn-lime w-full">Send code</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={(e) => { e.preventDefault(); if (otp.length !== 4) return setErr('Enter the 4 digit code'); proceed(`phone:27${phone.replace(/\D/g, '').replace(/^0/, '')}`, 'phone'); }} className="space-y-3">
            <Back to="phone" />
            <label className="label" htmlFor="otp">4 digit code</label>
            <input id="otp" className="input font-mono text-center text-3xl tracking-[0.5em]" inputMode="numeric" maxLength={4} autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            <p className="text-xs text-white/50">Demo: type any 4 digits (e.g. 1234).</p>
            {err && <p className="text-start text-sm" role="alert">{err}</p>}
            <button className="btn-lime w-full">Verify</button>
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!emailOk(email)) return setErr('That email does not look right'); setErr(''); setStep('link'); }} className="space-y-3">
            <Back to="welcome" />
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" placeholder="you@example.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
            {err && <p className="text-start text-sm" role="alert">{err}</p>}
            <button className="btn-lime w-full">Email me a sign-in link</button>
          </form>
        )}

        {step === 'link' && (
          <div className="space-y-3 text-center">
            <div className="text-5xl" aria-hidden="true">📬</div>
            <h2 className="text-xl uppercase">Check your inbox</h2>
            <p className="text-sm text-white/65">A magic link is on its way to <b>{email}</b>. Demo build: tap below as if you opened it.</p>
            <button className="btn-lime w-full" onClick={() => proceed(`email:${email.trim().toLowerCase()}`, 'email')}>I opened the link</button>
            <button className="text-sm text-white/60 min-h-[44px]" onClick={() => setStep('email')}>Wrong email?</button>
          </div>
        )}

        {step === 'name' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return setErr('What should we call you?'); setErr(''); setStep('watch'); }} className="space-y-4">
            <div className="label text-lime">Step 1 of 3</div>
            <h2 className="text-2xl uppercase">Who&apos;s running?</h2>
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input id="name" className="input mt-1" autoComplete="given-name" autoFocus placeholder="e.g. Thandi" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="label mb-2">Where do you run?</div>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Location">
                {CITIES.map((c) => (
                  <button type="button" key={c.id} role="radio" aria-checked={city === c.id} onClick={() => setCity(c.id)} className={`min-h-[56px] rounded-2xl border-2 font-heading font-extrabold uppercase ${city === c.id ? 'bg-lime text-black border-lime' : 'border-white/20'}`}>{c.label}</button>
                ))}
              </div>
            </div>
            {err && <p className="text-start text-sm" role="alert">{err}</p>}
            <button className="btn-lime w-full">Next</button>
          </form>
        )}

        {step === 'watch' && (
          <div className="space-y-4">
            <div className="label text-lime">Step 2 of 3</div>
            <h2 className="text-2xl uppercase">Which watch do you wear?</h2>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Primary watch brand">
              {PICKABLE.map((w) => (
                <button key={w.id} role="radio" aria-checked={watch === w.id} onClick={() => setWatch(w.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 min-h-[104px] ${watch === w.id ? 'border-lime bg-lime/10' : 'border-white/15'}`}>
                  <WatchLogo id={w.id} size={44} />
                  <span className="text-[11px] font-bold leading-tight text-center">{w.id === 'generic' ? 'No watch / other' : w.short}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setStep('name')}>Back</button>
              <button className="btn-lime flex-1" onClick={() => setStep('goal')}>Next</button>
            </div>
          </div>
        )}

        {step === 'goal' && (
          <div className="space-y-5">
            <div className="label text-lime">Step 3 of 3</div>
            <h2 className="text-2xl uppercase">Weekly running goal</h2>
            <div className="text-center">
              <div className="stat text-7xl font-bold text-lime">{goal}</div>
              <div className="label">km per week</div>
            </div>
            <input type="range" min="5" max="100" step="5" value={goal} onChange={(e) => setGoal(+e.target.value)} className="w-full accent-[#C6FF00] h-10" aria-label="Kilometres per week" />
            <div className="flex justify-between text-xs text-white/50"><span>5 km</span><span>100 km</span></div>
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 min-h-[56px]">
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="mt-1 w-5 h-5 accent-[#C6FF00]" />
              <span><b className="block">Fill my dashboard with lekker demo runs</b><span className="text-xs text-white/55">47 runs, 312 km on your own routes. Untick for a fresh start.</span></span>
            </label>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setStep('watch')}>Back</button>
              <button className="btn-red flex-1" onClick={finish}>Vuka! Let&apos;s run</button>
            </div>
          </div>
        )}
      </section>

      {/* COMPARISON */}
      <section className="mt-10" aria-labelledby="cmp">
        <h2 id="cmp" className="text-3xl uppercase leading-none">Strava <span className="text-white/40">R279/month</span><br />VUKA Lite <span className="text-lime">R0</span></h2>
        <p className="mt-2 mb-4 text-sm text-white/60">Same runs. Same routes. Your money stays in your pocket.</p>
        <ComparisonTable />
      </section>

      <section className="mt-10 grid grid-cols-3 gap-2 text-center" aria-label="Highlights">
        {[['14', 'watch brands'], ['0 MB', 'needed to start'], ['100%', 'works offline']].map(([a, b], i) => (
          <m.div key={b} className="glass p-4" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <div className="stat text-2xl font-bold text-lime">{a}</div>
            <div className="label mt-1">{b}</div>
          </m.div>
        ))}
      </section>
      <p className="mt-8 text-center text-xs text-white/35">Map data © OpenStreetMap contributors</p>
    </div>
  );
}
