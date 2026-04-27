// ════════════════════════════════════════════════════════════════════════════
//  Promptly.ai v4 — Hybrid mode: 10 free requests via backend proxy, then BYOK
//  Stack: React + Vite + Vercel Serverless Function backend
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";

const FREE_LIMIT = 10;
const PROXY_ENDPOINT = "/api/optimize"; // Backend endpoint (Vercel Edge Function)

const CATEGORIES = [
  "Software Development","Coding","Database / PL-SQL","Testing","Networking",
  "Writing","Education","Research","Marketing","Social Media","Finance","Legal","Healthcare","General",
];
const PRIORITIES = ["High","Medium","Low"];
const TONES = ["Formal","Casual","Technical","Academic","Professional","Persuasive","Friendly","Concise"];
const PRI_COLORS = { High:"#ef4444", Medium:"#f59e0b", Low:"#3b82f6" };
const STORAGE_KEY = "promptly_v1";
const KEYS_STORAGE = "promptly_keys";
const USAGE_STORAGE = "promptly_free_usage";
const MODE_STORAGE = "promptly_mode";
const LANDED_STORAGE = "promptly_landed";

const PROVIDERS = {
  claude:  { name:"Claude (Anthropic)", color:"#c27f3a", bg:"#fef3e2", placeholder:"sk-ant-...", link:"https://console.anthropic.com/settings/keys", free:"$5 free credits" },
  gemini:  { name:"Gemini (Google)",    color:"#1a73e8", bg:"#e8f0fe", placeholder:"AIza...",   link:"https://aistudio.google.com/app/apikey",   free:"Free (60 req/min)" },
  openai:  { name:"OpenAI (GPT-4o)",    color:"#10a37f", bg:"#e6f4f1", placeholder:"sk-...",    link:"https://platform.openai.com/api-keys",    free:"$5 free trial" },
  groq:    { name:"Groq (Llama 3.3)",   color:"#f55036", bg:"#fdecea", placeholder:"gsk_...",   link:"https://console.groq.com/keys",            free:"100% free, no card" },
};

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ name, size=16, color="currentColor", className="" }) => {
  const paths = {
    sparkles:<><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></>,
    sparkle:<><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></>,
    copy:<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    refresh:<><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>,
    save:<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    search:<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    star:<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    trash:<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    note:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    chevron:<><polyline points="6 9 12 15 18 9"/></>,
    check:<><polyline points="20 6 9 17 4 12"/></>,
    x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    download:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    eye:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    key:<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    arrowUp:<><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>,
    zap:<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    gift:<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></>,
    formal:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/></>,
    casual:<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
    technical:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    academic:<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
    professional:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    persuasive:<><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>,
    friendly:<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
    concise:<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink:0, display:"inline-block", verticalAlign:"middle" }}>
      {paths[name]}
    </svg>
  );
};

const TONE_ICON = { Formal:"formal", Casual:"casual", Technical:"technical", Academic:"academic", Professional:"professional", Persuasive:"persuasive", Friendly:"friendly", Concise:"concise" };

const ProviderLogo = ({ provider, size=14 }) => {
  const logos = {
    claude:<svg width={size} height={size} viewBox="0 0 24 24" fill="#c27f3a"><circle cx="12" cy="12" r="10"/></svg>,
    gemini:<svg width={size} height={size} viewBox="0 0 24 24" fill="#1a73e8"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/></svg>,
    openai:<svg width={size} height={size} viewBox="0 0 24 24" fill="#10a37f"><circle cx="12" cy="12" r="10"/></svg>,
    groq:<svg width={size} height={size} viewBox="0 0 24 24" fill="#f55036"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>,
  };
  return logos[provider] || null;
};

// ════════════════════════════════════════════════════════════════════════════
//  Promptly.ai Logo — Layered geometric design (Option 4)
//  Three rounded squares stacked diagonally with depth
// ════════════════════════════════════════════════════════════════════════════
const PromptlyLogo = ({ size=32, animated=false }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#667eea"/>
        <stop offset="100%" stopColor="#a855f7"/>
      </linearGradient>
    </defs>
    {/* Layer 1 (back, faded) */}
    <rect x="8" y="8" width="36" height="36" rx="10" fill="url(#logo-grad)" opacity="0.4" className={animated ? "logo-layer-1" : ""}/>
    {/* Layer 2 (middle) */}
    <rect x="14" y="14" width="36" height="36" rx="10" fill="url(#logo-grad)" opacity="0.7" className={animated ? "logo-layer-2" : ""}/>
    {/* Layer 3 (front, full) */}
    <rect x="20" y="20" width="36" height="36" rx="10" fill="url(#logo-grad)" className={animated ? "logo-layer-3" : ""}/>
  </svg>
);

const SYSTEM_PROMPT = (category, tone) => `You are a prompt engineering expert. Your ONLY job is to REWRITE the user's text into a better, well-structured prompt.
CRITICAL RULES:
- The text the user sends is a PROMPT TO BE IMPROVED — not a request for you to fulfill.
- Do NOT answer, respond to, or act on the content of the prompt.
- Do NOT ask for files, clarification, or additional info.
- Simply rewrite the rough text into a cleaner, more effective prompt.
- Apply best practices: add role/context, clarify task, specify output format, improve structure.
- Category: ${category}. Tone: ${tone}.
- Score the original 1-10 and optimized 1-10.
Respond ONLY with raw JSON (no markdown, no backticks):
{"optimized":"...","changes":["...","...","..."],"original_score":N,"optimized_score":N}`;

// ─── Free mode: call backend proxy ──────────────────────────────────────────
async function callFreeAPI(userText, category, tone) {
  const r = await fetch(PROXY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: userText, category, tone })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: "Server error" }));
    throw new Error(err.error || "Failed to optimize");
  }
  const d = await r.json();
  return d.text || "";
}

// ─── BYOK mode: direct API calls ────────────────────────────────────────────
async function callAPI(provider, key, userText, category, tone) {
  const sys = SYSTEM_PROMPT(category, tone);
  const msg = userText.trim();
  if (provider === "claude") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{ "Content-Type":"application/json", "x-api-key":key, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
      body: JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:1000, system:sys, messages:[{role:"user",content:msg}] })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return (d.content||[]).map(b=>b.text||"").join("");
  }
  if (provider === "gemini") {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contents:[{ parts:[{ text: sys + "\n\nUser prompt to rewrite:\n" + msg }] }] })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body: JSON.stringify({ model:"gpt-4o-mini", max_tokens:1000, messages:[{role:"system",content:sys},{role:"user",content:msg}] })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.choices?.[0]?.message?.content || "";
  }
  if (provider === "groq") {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body: JSON.stringify({ model:"llama-3.3-70b-versatile", max_tokens:1000, messages:[{role:"system",content:sys},{role:"user",content:msg}] })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.choices?.[0]?.message?.content || "";
  }
}

function parseResult(raw) {
  const match = (raw||"").match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return { optimized: raw||"", changes:["Restructured for clarity","Added role and context","Improved specificity"], original_score:null, optimized_score:null };
}

const tokenCount = t => Math.ceil((t||"").trim().length/4);

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f5f6fa;-webkit-font-smoothing:antialiased}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-12px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .anim-fade{animation:fadeIn 0.35s ease-out}
  .anim-slide{animation:slideDown 0.2s ease-out}
  .anim-scale{animation:scaleIn 0.25s ease-out}
  .spin{animation:spin 0.8s linear infinite}
  .pulse{animation:pulse 1.5s ease-in-out infinite}
  button{transition:all 0.15s ease;font-family:inherit}
  button:not(:disabled):hover{transform:translateY(-1px)}
  button:not(:disabled):active{transform:translateY(0) scale(0.98)}
  input,textarea,select{transition:all 0.15s ease}
  .card-enter{animation:fadeIn 0.4s ease-out backwards}
  .card-enter:nth-child(1){animation-delay:0.05s}
  .card-enter:nth-child(2){animation-delay:0.1s}
  .card-enter:nth-child(3){animation-delay:0.15s}
  .card-enter:nth-child(4){animation-delay:0.2s}
  .container{max-width:680px;margin:0 auto;padding:24px 16px 48px}
  @media (min-width:768px){.container{padding:32px 24px 64px}}
  @media (min-width:1024px){.container{padding:40px 32px 80px}}
  .grid-2{display:grid;grid-template-columns:1fr;gap:12px}
  @media (min-width:600px){.grid-2{grid-template-columns:1fr 1fr}}
  .header-h1{font-size:22px}
  @media (min-width:768px){.header-h1{font-size:26px}}
  .tone-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  @media (min-width:600px){.tone-grid{grid-template-columns:repeat(4,1fr)}}
  .lib-actions-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .lib-export-group{margin-left:auto;display:flex;gap:6px}
  @media (max-width:520px){.lib-export-group{margin-left:0;width:100%;justify-content:flex-start}}
  .modal{position:fixed;inset:0;background:rgba(15,10,40,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease-out;backdrop-filter:blur(4px)}
  .modal-content{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:540px;box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:scaleIn 0.25s ease-out;max-height:90vh;overflow-y:auto}
  .dropdown-portal{position:absolute;background:#fff;border:1.5px solid #e4daf5;border-radius:12px;box-shadow:0 12px 32px rgba(102,126,234,0.18);z-index:9999;overflow:hidden;animation:slideDown 0.18s ease-out;min-width:100%;width:max-content;max-width:280px;max-height:320px;overflow-y:auto}
  ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d8ccf0;border-radius:4px}
  /* ═══ Skeleton + Logo Loading (Option 6) ═══ */
  @keyframes shimmer{
    0%{background-position:-200% 0}
    100%{background-position:200% 0}
  }
  @keyframes logoStackPulse{
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.06)}
  }
  @keyframes logoLayer1{0%,100%{opacity:0.4}33%{opacity:1}}
  @keyframes logoLayer2{0%,100%{opacity:0.7}66%{opacity:1}}
  @keyframes logoLayer3{0%,100%{opacity:1}99%{opacity:0.4}}
  
  .skeleton-shimmer{
    background:linear-gradient(90deg,#ede9fe 0%,#f5f0ff 50%,#ede9fe 100%);
    background-size:200% 100%;
    animation:shimmer 1.5s linear infinite;
    border-radius:6px;
  }
  
  .logo-animated{
    animation:logoStackPulse 1.5s ease-in-out infinite;
    will-change:transform;
  }
  .logo-layer-1{animation:logoLayer1 1.5s ease-in-out infinite}
  .logo-layer-2{animation:logoLayer2 1.5s ease-in-out infinite}
  .logo-layer-3{animation:logoLayer3 1.5s ease-in-out infinite}
  
  /* ═══ Premium Landing Animations — GPU-accelerated, smooth 60fps ═══ */
  @keyframes logoDrop{
    0%{transform:translate3d(0,-100vh,0) scale(0.4);opacity:0}
    55%{transform:translate3d(0,12px,0) scale(1.08);opacity:1}
    70%{transform:translate3d(0,-6px,0) scale(0.97)}
    82%{transform:translate3d(0,3px,0) scale(1.01)}
    92%{transform:translate3d(0,-1px,0) scale(0.995)}
    100%{transform:translate3d(0,0,0) scale(1);opacity:1}
  }
  @keyframes logoGlow{
    0%,100%{filter:drop-shadow(0 12px 28px rgba(102,126,234,0.35))}
    50%{filter:drop-shadow(0 16px 40px rgba(168,85,247,0.55))}
  }
  @keyframes letterReveal{
    0%{opacity:0;transform:translate3d(0,-24px,0) scale(0.6)}
    60%{opacity:1}
    100%{opacity:1;transform:translate3d(0,0,0) scale(1)}
  }
  @keyframes sparkleBurst{
    0%{opacity:0;transform:scale(0)}
    40%{opacity:1;transform:scale(1.3)}
    100%{opacity:0;transform:scale(2.2)}
  }
  @keyframes softRise{
    0%{opacity:0;transform:translate3d(0,16px,0)}
    100%{opacity:1;transform:translate3d(0,0,0)}
  }
  @keyframes ringPulse{
    0%{transform:scale(0.6);opacity:0;border-width:3px}
    40%{opacity:0.8}
    100%{transform:scale(2.4);opacity:0;border-width:1px}
  }

  /* Landing elements — smooth timing with ease-out-expo curves */
  .landing-logo{
    animation:logoDrop 1.2s cubic-bezier(0.22, 1, 0.36, 1) both, logoGlow 3s ease-in-out 1.3s infinite;
    will-change:transform,opacity,filter;
    backface-visibility:hidden;
  }
  .landing-letter{
    display:inline-block;
    animation:letterReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change:transform,opacity;
    backface-visibility:hidden;
  }
  .landing-sparkle{
    animation:sparkleBurst 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change:transform,opacity;
  }
  .landing-rise{
    animation:softRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change:transform,opacity;
  }
  .landing-ring{
    animation:ringPulse 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
    will-change:transform,opacity;
  }

  /* ═══ Universal button interactions — polished & consistent ═══ */
  button:not(:disabled){
    cursor:pointer;
    transition:transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    will-change:transform;
  }
  button:not(:disabled):hover{transform:translate3d(0,-2px,0)}
  button:not(:disabled):active{transform:translate3d(0,0,0) scale(0.96);transition-duration:0.1s}
  button:disabled{cursor:not-allowed;opacity:0.55}
  
  /* Primary gradient buttons — extra glow on hover */
  .btn-primary{
    background:linear-gradient(135deg,#667eea 0%,#a855f7 100%);
    box-shadow:0 4px 14px rgba(102,126,234,0.35), 0 0 0 0 rgba(168,85,247,0);
    position:relative;
    overflow:hidden;
  }
  .btn-primary::before{
    content:"";
    position:absolute;
    top:0;left:-100%;width:100%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
    transition:left 0.6s ease;
  }
  .btn-primary:hover{
    box-shadow:0 8px 22px rgba(102,126,234,0.45), 0 0 30px rgba(168,85,247,0.3);
  }
  .btn-primary:hover::before{left:100%}
  .btn-primary:active{box-shadow:0 2px 8px rgba(102,126,234,0.4)}

  /* Secondary buttons — subtle lift */
  .btn-hover:hover{background:#faf8ff;border-color:#a78bfa;color:#6d28d9}
  
  /* Clickable cards with hover */
  .card-hover{transition:all 0.25s cubic-bezier(0.22, 1, 0.36, 1);will-change:transform,box-shadow}
  .card-hover:hover{transform:translate3d(0,-3px,0);box-shadow:0 8px 24px rgba(102,126,234,0.15);border-color:#a78bfa !important}
  
  /* Provider chips */
  .chip-hover:hover{transform:translate3d(0,-1px,0)}
  .free-counter{background:#fff;color:#6d28d9;padding:2px 10px;border-radius:20px;font-weight:700;font-size:11px}
  .upgrade-banner{background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #fcd34d;border-radius:12px;padding:14px;margin-bottom:14px}
`;

const CARD = { background:"#fff", borderRadius:16, border:"1px solid #e4daf5", padding:"20px 22px", marginBottom:14, boxShadow:"0 2px 12px rgba(102,126,234,0.06)" };
const btnSec = (ex={}) => ({ padding:"7px 14px", borderRadius:8, border:"1.5px solid #e4daf5", background:"#fff", fontSize:12, fontWeight:500, cursor:"pointer", color:"#4c3d7a", display:"inline-flex", alignItems:"center", gap:6, ...ex });
const stepNum = done => ({ width:26, height:26, borderRadius:"50%", background:done?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#667eea,#a855f7)", color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 });

function CustomSelect({ options, value, onChange, renderOption }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div style={{ position:"relative", zIndex:open?9999:1 }} ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} type="button"
        style={{ width:"100%", padding:"10px 36px 10px 13px", border:`1.5px solid ${open?"#a78bfa":"#e4daf5"}`, borderRadius:10, background:open?"#fff":"#faf8ff", fontSize:13, color:"#1a1035", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", fontWeight:500, outline:"none" }}>
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>{renderOption?renderOption(value):value}</span>
        <Icon name="chevron" size={14} color="#9c8cc0"/>
      </button>
      {open && (
        <div className="dropdown-portal" style={{ top:"calc(100% + 6px)", left:0 }}>
          {options.map(opt => (
            <div key={opt} onClick={()=>{ onChange(opt); setOpen(false); }}
              style={{ padding:"10px 16px", fontSize:13, color:value===opt?"#6d28d9":"#1a1035", cursor:"pointer", display:"flex", alignItems:"center", gap:8, background:value===opt?"#ede9fe":"transparent", fontWeight:value===opt?600:400, whiteSpace:"nowrap" }}
              onMouseEnter={e=>{ if(value!==opt) e.currentTarget.style.background="#f5f0ff"; }}
              onMouseLeave={e=>{ if(value!==opt) e.currentTarget.style.background="transparent"; }}>
              {value===opt
                ? <span style={{ width:16,height:16,borderRadius:"50%",background:"linear-gradient(135deg,#667eea,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><Icon name="check" size={10} color="white"/></span>
                : <span style={{ width:16,flexShrink:0 }}/>}
              {renderOption?renderOption(opt):opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score, label }) {
  const [color,bg] = score>=8?["#15803d","#dcfce7"]:score>=5?["#92400e","#fef3c7"]:["#991b1b","#fee2e2"];
  return (
    <div style={{ textAlign:"center", padding:"10px 18px", background:bg, borderRadius:10, minWidth:80 }} className="anim-scale">
      <div style={{ fontSize:22, fontWeight:700, color }}>{score}<span style={{ fontSize:13 }}>/10</span></div>
      <div style={{ fontSize:11, color, fontWeight:600, marginTop:2 }}>{label}</div>
    </div>
  );
}

function DiffView({ original, optimized }) {
  const origSet = new Set(original.toLowerCase().split(/\W+/).filter(w=>w.length>3));
  return (
    <p style={{ fontSize:13, lineHeight:1.8, margin:0, color:"#1a1035" }}>
      {optimized.split(/(\s+)/).map((part,i) => {
        const clean = part.toLowerCase().replace(/\W+/g,"");
        return clean.length>3 && !origSet.has(clean)
          ? <mark key={i} style={{ background:"#dcfce7", color:"#15803d", borderRadius:3, padding:"0 2px" }}>{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  LANDING SCREEN — First impression with Get Started button
// ════════════════════════════════════════════════════════════════════════════
function LandingScreen({ onGetStarted }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => onGetStarted(), 1400);
  };

  // Letter-by-letter reveal for "SharpPrompt"
  const renderLetters = (text, baseDelay, gradient) => text.split("").map((ch, i) => (
    <span key={i} className="landing-letter"
      style={{
        animationDelay: `${baseDelay + i * 0.04}s`,
        ...(gradient ? { background:"linear-gradient(135deg,#667eea,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" } : {})
      }}>{ch}</span>
  ));

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f5f6fa 0%,#ede9fe 50%,#ddd6fe 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, position:"relative", overflow:"hidden" }}>
      {/* Decorative blobs */}
      <div style={{ position:"absolute", top:"-10%", left:"-10%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)", animation:"pulse 6s ease-in-out infinite", willChange:"opacity", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle, rgba(102,126,234,0.2) 0%, transparent 70%)", animation:"pulse 7s ease-in-out 1s infinite", willChange:"opacity", pointerEvents:"none" }}/>

      <div style={{ maxWidth:560, width:"100%", textAlign:"center", position:"relative", zIndex:1 }}>
        {!loading ? (
          <>
            {/* Logo + impact ring + sparkles */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:28, position:"relative", minHeight:96 }}>
              <div style={{ position:"relative", display:"inline-block", width:96, height:96 }}>
                <div className="landing-ring" style={{
                  position:"absolute", inset:-8, borderRadius:"50%",
                  border:"3px solid rgba(168,85,247,0.6)",
                  animationDelay:"1.15s"
                }}/>
                {[
                  { top:-16, left:-16, delay:1.2 },
                  { top:-12, right:-18, delay:1.26 },
                  { bottom:-12, left:-16, delay:1.32 },
                  { bottom:-16, right:-12, delay:1.38 },
                ].map((pos, i) => (
                  <div key={i} className="landing-sparkle" style={{ position:"absolute", top:pos.top, left:pos.left, right:pos.right, bottom:pos.bottom, animationDelay:`${pos.delay}s`, pointerEvents:"none" }}>
                    <Icon name="sparkle" size={12} color="#a855f7"/>
                  </div>
                ))}
                <div className="landing-logo" style={{ position:"relative", zIndex:2 }}>
                  <PromptlyLogo size={96}/>
                </div>
              </div>
            </div>

            <h1 style={{ fontSize:"clamp(34px, 6vw, 50px)", fontWeight:700, color:"#1a1035", letterSpacing:-1.2, lineHeight:1.05, marginBottom:16 }}>
              {renderLetters("Prompt", 1.15, true)}
              {renderLetters("ly", 1.35, false)}
              <span className="landing-letter" style={{ animationDelay:"1.5s", color:"#a855f7", fontWeight:700 }}>.ai</span>
            </h1>

            <p className="landing-rise" style={{ fontSize:"clamp(14px, 2vw, 17px)", color:"#4c3d7a", marginBottom:8, fontWeight:500, animationDelay:"1.55s" }}>
              Better prompts, promptly.
            </p>
            <p className="landing-rise" style={{ fontSize:13, color:"#7c6fa0", marginBottom:32, maxWidth:440, margin:"0 auto 32px", lineHeight:1.6, animationDelay:"1.65s" }}>
              Powered by Claude, Gemini, OpenAI & Groq. Score, optimize, and save your prompts — all in one place.
            </p>

            <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:32, flexWrap:"wrap" }}>
              {[
                { icon:"zap", text:"10 free credits", delay:1.8 },
                { icon:"key", text:"BYOK supported", delay:1.88 },
                { icon:"sparkle", text:"4 AI providers", delay:1.96 },
              ].map((f,i) => (
                <div key={i} className="landing-rise chip-hover"
                  style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:"rgba(255,255,255,0.75)", borderRadius:20, fontSize:12, color:"#4c3d7a", fontWeight:600, backdropFilter:"blur(10px)", border:"1px solid rgba(167,139,250,0.3)", animationDelay:`${f.delay}s`, transition:"transform 0.2s" }}>
                  <Icon name={f.icon} size={12} color="#6d28d9"/>{f.text}
                </div>
              ))}
            </div>

            <button onClick={handleClick} className="btn-primary landing-rise"
              style={{ padding:"16px 44px", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700, border:"none", display:"inline-flex", alignItems:"center", gap:10, letterSpacing:0.3, animationDelay:"2.1s" }}>
              <Icon name="sparkles" size={18}/>
              Get Started
              <Icon name="arrowUp" size={16} color="white"/>
            </button>

            <p className="landing-rise" style={{ fontSize:11, color:"#9c8cc0", marginTop:18, animationDelay:"2.25s" }}>
              No signup needed • Start in seconds
            </p>
          </>
        ) : (
          /* ═══ Skeleton + Logo Loading Screen (Option 6) ═══ */
          <div style={{ padding:"32px 16px", display:"flex", flexDirection:"column", alignItems:"center", maxWidth:380, margin:"0 auto", width:"100%" }}>
            
            {/* Animated Logo */}
            <div className="logo-animated" style={{ marginBottom:28 }}>
              <PromptlyLogo size={64} animated/>
            </div>

            {/* Skeleton placeholders — mimics actual app layout */}
            <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:14 }}>
              {/* Title placeholder */}
              <div className="skeleton-shimmer" style={{ height:18, width:"60%", margin:"0 auto" }}/>
              {/* Subtitle placeholder */}
              <div className="skeleton-shimmer" style={{ height:12, width:"85%", margin:"0 auto" }}/>
              
              {/* Card placeholders (mimics the optimize cards) */}
              <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
                <div className="skeleton-shimmer" style={{ height:56, width:"100%", borderRadius:12 }}/>
                <div className="skeleton-shimmer" style={{ height:56, width:"100%", borderRadius:12 }}/>
                <div className="skeleton-shimmer" style={{ height:42, width:"100%", borderRadius:12 }}/>
              </div>
            </div>

            {/* Loading text */}
            <p style={{ fontSize:12, color:"#9c8cc0", marginTop:24, fontWeight:500, letterSpacing:0.3 }}>
              Loading Promptly.ai...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  WELCOME SCREEN — Choose mode
// ════════════════════════════════════════════════════════════════════════════
function WelcomeScreen({ onSelect }) {
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f5f6fa 0%,#ede9fe 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ maxWidth:520, width:"100%" }} className="anim-fade">
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><PromptlyLogo size={64}/></div>
          <h1 className="header-h1" style={{ fontWeight:700, color:"#1a1035", letterSpacing:-0.5 }}>
            <span style={{ background:"linear-gradient(135deg,#667eea,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Prompt</span>ly<span style={{ color:"#a855f7", fontWeight:700 }}>.ai</span>
          </h1>
          <p style={{ fontSize:14, color:"#7c6fa0", marginTop:6 }}>AI-powered prompt optimizer</p>
        </div>

        <div style={{ ...CARD, cursor:"pointer", border:"2px solid transparent" }} className="anim-scale"
          onClick={()=>onSelect("free")}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#a855f7"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"linear-gradient(135deg,#667eea,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 14px rgba(102,126,234,0.4)" }}>
              <Icon name="zap" size={24} color="white"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:"#1a1035" }}>Try for free</h3>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#dcfce7", color:"#15803d" }}>RECOMMENDED</span>
              </div>
              <p style={{ fontSize:13, color:"#7c6fa0", marginTop:4 }}>Get 10 free optimizations instantly. No setup needed.</p>
            </div>
          </div>
          <div style={{ marginTop:14, padding:"10px 12px", background:"#f5f0ff", borderRadius:8, fontSize:12, color:"#6d28d9", display:"flex", alignItems:"center", gap:8 }}>
            <Icon name="gift" size={14}/>
            <span>Powered by Google Gemini 2.0 — fast and free</span>
          </div>
        </div>

        <div style={{ ...CARD, cursor:"pointer", border:"2px solid transparent" }}
          onClick={()=>onSelect("byok")}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#a855f7"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#1a1035", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="key" size={22} color="white"/>
            </div>
            <div style={{ flex:1 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#1a1035" }}>Use your own API key</h3>
              <p style={{ fontSize:13, color:"#7c6fa0", marginTop:4 }}>Unlimited optimizations. Supports Claude, Gemini, OpenAI, Groq.</p>
            </div>
          </div>
          <div style={{ marginTop:14, padding:"10px 12px", background:"#f9f9f9", borderRadius:8, fontSize:12, color:"#666", display:"flex", alignItems:"center", gap:8 }}>
            <Icon name="key" size={14}/>
            <span>Your key stays in your browser only</span>
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#b0a0d0", marginTop:14 }}>You can switch modes anytime in settings ⚙️</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  BYOK Onboarding (existing)
// ════════════════════════════════════════════════════════════════════════════
function BYOKOnboarding({ onSave, onBack }) {
  const [keys, setKeys] = useState({ claude:"", gemini:"", openai:"", groq:"" });
  const [showPasswords, setShowPasswords] = useState({});
  const hasAny = Object.values(keys).some(k=>k.trim().length>5);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f5f6fa 0%,#ede9fe 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ maxWidth:480, width:"100%" }} className="anim-fade">
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><PromptlyLogo size={48}/></div>
          <h1 className="header-h1" style={{ fontWeight:700, color:"#1a1035" }}>
            <span style={{ background:"linear-gradient(135deg,#667eea,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Prompt</span>ly<span style={{ color:"#a855f7", fontWeight:700 }}>.ai</span>
          </h1>
        </div>
        <div style={{ ...CARD, marginBottom:14 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"#9c8cc0", fontSize:12, cursor:"pointer", marginBottom:10, padding:0 }}>← Back</button>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#1a1035", marginBottom:4 }}>Add your API keys</h2>
          <p style={{ fontSize:12, color:"#9c8cc0", marginBottom:16 }}>Add at least one. Keys saved locally in your browser only.</p>
          {Object.entries(PROVIDERS).map(([id, p]) => (
            <div key={id} style={{ marginBottom:14 }} className="card-enter">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5, flexWrap:"wrap", gap:6 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#1a1035", display:"flex", alignItems:"center", gap:6 }}>
                  <ProviderLogo provider={id} size={14}/>{p.name}
                </label>
                <span style={{ fontSize:11, background:p.bg, color:p.color, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>{p.free}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <div style={{ position:"relative", flex:1 }}>
                  <input type={showPasswords[id]?"text":"password"} value={keys[id]} onChange={e=>setKeys(k=>({...k,[id]:e.target.value}))} placeholder={p.placeholder}
                    style={{ width:"100%", border:"1.5px solid #e4daf5", borderRadius:8, padding:"9px 36px 9px 12px", fontSize:12, fontFamily:"monospace", color:"#1a1035", outline:"none", background:"#faf8ff" }}/>
                  <button onClick={()=>setShowPasswords(s=>({...s,[id]:!s[id]}))} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", color:"#9c8cc0" }}>
                    <Icon name={showPasswords[id]?"eyeOff":"eye"} size={14}/>
                  </button>
                </div>
                <a href={p.link} target="_blank" rel="noreferrer" style={{ padding:"9px 12px", borderRadius:8, border:"1.5px solid #e4daf5", background:"#faf8ff", fontSize:12, color:"#6d28d9", textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  Get<Icon name="arrowUp" size={11}/>
                </a>
              </div>
            </div>
          ))}
        </div>
        <button onClick={()=>onSave(keys)} disabled={!hasAny}
          style={{ width:"100%", padding:13, borderRadius:12, background:hasAny?"linear-gradient(135deg,#667eea,#a855f7)":"#e4daf5", color:hasAny?"#fff":"#9c8cc0", fontSize:14, fontWeight:600, border:"none", cursor:hasAny?"pointer":"not-allowed" }}>
          {hasAny?"Start using Promptly →":"Add at least one key"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Upgrade Modal — shown when user hits free limit
// ════════════════════════════════════════════════════════════════════════════
function UpgradeModal({ onClose, onSwitch }) {
  return (
    <div className="modal" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:"linear-gradient(135deg,#fde68a,#f59e0b)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="sparkles" size={32} color="white"/>
          </div>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:"#1a1035", marginBottom:6 }}>You've used your 10 free credits!</h2>
        <p style={{ fontSize:13, color:"#7c6fa0", marginBottom:20, lineHeight:1.6 }}>To keep optimizing prompts, add your own API key. <strong>Gemini is free</strong> — get 1M tokens daily!</p>
        <div style={{ background:"#f5f0ff", padding:14, borderRadius:12, marginBottom:18, textAlign:"left" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#6d28d9", marginBottom:8 }}>Free options available:</div>
          {Object.entries(PROVIDERS).map(([id,p]) => (
            <div key={id} style={{ fontSize:12, color:"#4c3d7a", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <ProviderLogo provider={id} size={11}/>
              <strong>{p.name.split(" ")[0]}</strong> — {p.free}
            </div>
          ))}
        </div>
        <button onClick={onSwitch} style={{ width:"100%", padding:13, borderRadius:12, background:"linear-gradient(135deg,#667eea,#a855f7)", color:"#fff", fontSize:14, fontWeight:600, border:"none", cursor:"pointer", marginBottom:8 }}>
          <Icon name="key" size={14}/>  Add my API key
        </button>
        <button onClick={onClose} style={btnSec({ width:"100%", padding:11, justifyContent:"center" })}>Maybe later</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Main App
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [hasLanded, setHasLanded] = useState(false);
  const [mode, setMode] = useState(null); // 'free' | 'byok' | null (welcome)
  const [keys, setKeys] = useState(null);
  const [provider, setProvider] = useState("claude");
  const [freeUsage, setFreeUsage] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tab, setTab] = useState("optimize");
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Software Development");
  const [priority, setPriority] = useState("Medium");
  const [tone, setTone] = useState("Formal");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterPri, setFilterPri] = useState("All");
  const [showPinned, setShowPinned] = useState(false);
  const [saveMsg, setSaveMsg] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [exportModal, setExportModal] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedVersions, setExpandedVersions] = useState(null);
  const [showKeySettings, setShowKeySettings] = useState(false);

  useEffect(() => {
    try { const l = localStorage.getItem(LANDED_STORAGE); if(l==="1") setHasLanded(true); } catch {}
    try { const m = localStorage.getItem(MODE_STORAGE); if(m) setMode(m); } catch {}
    try { const k = localStorage.getItem(KEYS_STORAGE); if(k) setKeys(JSON.parse(k)); } catch {}
    try { const s = localStorage.getItem(STORAGE_KEY); if(s) setSaved(JSON.parse(s)); } catch {}
    try { const u = parseInt(localStorage.getItem(USAGE_STORAGE)||"0",10); setFreeUsage(u); } catch {}
  }, []);

  const handleGetStarted = () => { localStorage.setItem(LANDED_STORAGE, "1"); setHasLanded(true); };

  const persist = list => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {} };
  const saveMode = m => { localStorage.setItem(MODE_STORAGE, m); setMode(m); setShowWelcome(false); };
  const saveKeys = k => { localStorage.setItem(KEYS_STORAGE, JSON.stringify(k)); setKeys(k); saveMode("byok"); };
  const incrementUsage = () => { const n = freeUsage + 1; setFreeUsage(n); localStorage.setItem(USAGE_STORAGE, n.toString()); };

  const availableProviders = keys ? Object.entries(PROVIDERS).filter(([id])=>keys[id]?.trim().length>5) : [];

  useEffect(() => {
    if (mode !== "byok" || !availableProviders.length) return;
    setProvider(current => {
      const stillValid = availableProviders.find(([id]) => id === current);
      return stillValid ? current : availableProviders[0][0];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, mode]);

  const optimize = async () => {
    if (!input.trim()) return;
    if (mode === "free" && freeUsage >= FREE_LIMIT) { setShowUpgrade(true); return; }
    setLoading(true); setError(""); setResult(null); setShowDiff(false);
    try {
      let raw;
      if (mode === "free") {
        raw = await callFreeAPI(input, category, tone);
        incrementUsage();
      } else {
        if (!keys?.[provider]) throw new Error("No API key set");
        raw = await callAPI(provider, keys[provider], input, category, tone);
      }
      setResult(parseResult(raw));
    } catch(e) { setError("Error: " + (e.message||"Please try again.")); }
    setLoading(false);
  };

  const fallbackCopy = text => {
    const ta = document.createElement("textarea");
    ta.value=text; ta.style.cssText="position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  };
  const copyText = (text, id) => {
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text)); }
    else { fallbackCopy(text); }
    if (id) { const u=saved.map(s=>s.id===id?{...s,copyCount:(s.copyCount||0)+1}:s); setSaved(u); persist(u); }
  };

  const savePrompt = () => {
    if (!result) return;
    const existing = saved.find(s=>s.original===input.trim());
    let updated;
    if (existing) {
      updated = saved.map(s=>s.id===existing.id?{...s,versions:[...(s.versions||[]),{ optimized:result.optimized, changes:result.changes, originalScore:result.original_score, optimizedScore:result.optimized_score, provider:mode==="free"?"groq":provider, date:new Date().toLocaleDateString() }]}:s);
    } else {
      updated = [{ id:Date.now(), original:input.trim(), optimized:result.optimized, changes:result.changes, originalScore:result.original_score, optimizedScore:result.optimized_score, category, priority, tone, provider:mode==="free"?"groq":provider, date:new Date().toLocaleDateString(), pinned:false, copyCount:0, note:"", versions:[] }, ...saved];
    }
    setSaved(updated); persist(updated); setSaveMsg(true); setTimeout(()=>setSaveMsg(false),2000);
  };

  const del = id => { const u=saved.filter(s=>s.id!==id); setSaved(u); persist(u); };
  const togglePin = id => { const u=saved.map(s=>s.id===id?{...s,pinned:!s.pinned}:s); setSaved(u); persist(u); };
  const saveNote = (id,note) => { const u=saved.map(s=>s.id===id?{...s,note}:s); setSaved(u); persist(u); setEditingNote(null); };

  const exportLib = fmt => {
    const content = fmt==="json" ? JSON.stringify(saved,null,2) : saved.map(s=>`=== ${s.date} | ${s.category} | ${s.priority} ===\nORIGINAL:\n${s.original}\n\nOPTIMIZED:\n${s.optimized}${s.note?`\n\nNOTE: ${s.note}`:""}\n${"─".repeat(50)}`).join("\n\n");
    try {
      const a = document.createElement("a");
      a.href=`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      a.download=`sharprompt_library.${fmt}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { setExportModal({fmt,content}); }
  };

  const tokens = tokenCount(input);
  const tokenColor = tokens>1000?"#dc2626":tokens>500?"#d97706":"#6d28d9";
  const tokenBg = tokens>1000?"#fee2e2":tokens>500?"#fef3c7":"#ede9fe";

  const filteredSaved = saved
    .filter(s=>{
      if(showPinned&&!s.pinned) return false;
      if(filterCat!=="All"&&s.category!==filterCat) return false;
      if(filterPri!=="All"&&s.priority!==filterPri) return false;
      if(search&&!s.original.toLowerCase().includes(search.toLowerCase())&&!s.optimized.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));

  // Routing flow: Landing → Welcome → (Free | BYOK Onboarding) → Main App
  if (!hasLanded) return <><style>{GLOBAL_STYLES}</style><LandingScreen onGetStarted={handleGetStarted}/></>;
  if (showWelcome === "byok") return <><style>{GLOBAL_STYLES}</style><BYOKOnboarding onSave={saveKeys} onBack={()=>setShowWelcome(true)}/></>;
  if (showWelcome) return <><style>{GLOBAL_STYLES}</style><WelcomeScreen onSelect={m=>{ if(m==="byok") setShowWelcome("byok"); else saveMode("free"); }}/></>;
  if (!mode) return <><style>{GLOBAL_STYLES}</style><WelcomeScreen onSelect={m=>{ if(m==="byok") setShowWelcome("byok"); else saveMode("free"); }}/></>;
  if (mode === "byok" && !keys) return <><style>{GLOBAL_STYLES}</style><BYOKOnboarding onSave={saveKeys} onBack={()=>{ localStorage.removeItem(MODE_STORAGE); setMode(null); }}/></>;

  const tabStyle = active => ({ padding:"8px 24px", borderRadius:20, border:`1.5px solid ${active?"#1a1035":"#d8ccf0"}`, background:active?"#1a1035":"#fff", fontSize:13, fontWeight:500, cursor:"pointer", color:active?"#fff":"#7c6fa0" });
  const TEMPLATES = {
    "Software Development":["Architect a microservice for [task]","Design a REST API endpoint for [resource]","Code review checklist for [language]"],
    "Coding":["Debug this code and explain the issue","Write a function that [task] with error handling","Refactor this code to be cleaner"],
    "Database / PL-SQL":["Write a PL/SQL stored procedure to [task]","Create a trigger that fires on [event]","Optimize this SQL query"],
    "Testing":["Write test cases for [feature]","Create a test plan for [application]","Find edge cases for [function]"],
    "Networking":["Explain how [protocol] works","Troubleshoot this network issue","Design a network topology for [scenario]"],
    "Writing":["Write an essay about [topic]","Improve the grammar and flow of my writing","Write a cover letter for [position]"],
    "Education":["Create a lesson plan for [topic]","Explain [concept] to a 10-year-old","Generate quiz questions on [subject]"],
    "Research":["Summarize recent research on [topic]","Compare and contrast [A] vs [B]","Explain [theory] with real-world examples"],
    "Marketing":["Write product copy for [item]","Create an email campaign for [audience]","Generate ad headlines for [product]"],
    "Social Media":["Write Instagram captions for [topic]","Create a Twitter thread on [subject]","LinkedIn post for [achievement]"],
    "Finance":["Explain [financial concept] simply","Analyze this investment scenario","Create a budget plan for [goal]"],
    "Legal":["Draft a contract clause for [purpose]","Summarize this legal document","Explain [legal term] in plain English"],
    "Healthcare":["Explain [condition] in patient-friendly language","Create a wellness plan for [goal]","Summarize this medical research"],
    "General":["Help me brainstorm ideas for [topic]","Explain [concept] to a beginner","Give me feedback on [work]"],
  };
  const priBadge = p => ({ High:{background:"#fee2e2",color:"#991b1b"}, Medium:{background:"#fef3c7",color:"#92400e"}, Low:{background:"#dbeafe",color:"#1e40af"} }[p]);
  const remaining = FREE_LIMIT - freeUsage;
  const lowCredits = mode === "free" && remaining <= 3;

  return (
    <div style={{ background:"#f5f6fa", minHeight:"100vh" }}>
      <style>{GLOBAL_STYLES}</style>
      <div className="container">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <PromptlyLogo size={36}/>
            <div>
              <h1 className="header-h1" style={{ fontWeight:700, letterSpacing:-0.5, color:"#1a1035", lineHeight:1 }}>
                <span style={{ background:"linear-gradient(135deg,#667eea,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Prompt</span>ly<span style={{ color:"#a855f7", fontWeight:700 }}>.ai</span>
              </h1>
              <p style={{ fontSize:11, color:"#7c6fa0", marginTop:3 }}>{mode==="free"?"Free trial mode":"BYOK mode"}</p>
            </div>
          </div>
          <button onClick={()=>setShowKeySettings(true)} style={btnSec({ fontSize:12 })}>
            <Icon name="settings" size={13}/> Settings
          </button>
        </div>

        {/* Free mode banner */}
        {mode === "free" && tab === "optimize" && (
          <div className="free-banner anim-fade" style={{ marginBottom:20 }}>
            <Icon name="zap" size={14}/>
            <span style={{ flex:1 }}>Free trial active</span>
            <span className="free-counter">{remaining}/{FREE_LIMIT} left</span>
          </div>
        )}

        {/* Low credits warning */}
        {lowCredits && remaining > 0 && tab === "optimize" && (
          <div className="upgrade-banner anim-fade">
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <Icon name="zap" size={14} color="#92400e"/>
              <strong style={{ fontSize:13, color:"#92400e" }}>Only {remaining} free credit{remaining>1?"s":""} left!</strong>
            </div>
            <p style={{ fontSize:12, color:"#92400e", marginBottom:10 }}>Add your own free API key to keep optimizing forever.</p>
            <button onClick={()=>setShowUpgrade(true)} style={{ padding:"7px 14px", borderRadius:8, background:"#92400e", color:"#fff", fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>
              Add my key →
            </button>
          </div>
        )}

        {/* BYOK provider selector */}
        {mode === "byok" && availableProviders.length > 1 && (
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", justifyContent:"center" }} className="anim-fade">
            {availableProviders.map(([id,p]) => (
              <button key={id} onClick={()=>setProvider(id)}
                style={{ padding:"7px 16px", borderRadius:20, border:`1.5px solid ${provider===id?p.color:"#e4daf5"}`, background:provider===id?p.bg:"#fff", fontSize:12, fontWeight:provider===id?600:400, color:provider===id?p.color:"#7c6fa0", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}>
                <ProviderLogo provider={id} size={12}/>{p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:18, marginBottom:24 }}>
          <button style={tabStyle(tab==="optimize")} onClick={()=>setTab("optimize")}>Optimize</button>
          <button style={tabStyle(tab==="library")} onClick={()=>setTab("library")}>Library {saved.length>0&&`(${saved.length})`}</button>
        </div>

        {tab==="optimize" && <>
          <div style={CARD} className="card-enter">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={stepNum(false)}><Icon name="sparkle" size={12} color="white"/></div>
                <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Templates</span>
                <span style={{ fontSize:12, color:"#9c8cc0" }}>for {category}</span>
              </div>
              <button style={btnSec()} onClick={()=>setShowTemplates(o=>!o)}>{showTemplates?"Hide":"Browse"}</button>
            </div>
            {showTemplates && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:14 }} className="anim-fade">
                {(TEMPLATES[category]||TEMPLATES["General"]).map((t,i)=>(
                  <button key={i} onClick={()=>{ setInput(t); setShowTemplates(false); }}
                    style={{ padding:"7px 14px", borderRadius:20, border:"1.5px solid #e4daf5", background:"#faf8ff", fontSize:12, color:"#4c3d7a", cursor:"pointer", fontWeight:500 }}>{t}</button>
                ))}
              </div>
            )}
          </div>

          <div style={CARD} className="card-enter">
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <div style={stepNum(false)}>1</div>
              <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Your rough prompt</span>
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:600, color:tokenColor, background:tokenBg, padding:"2px 8px", borderRadius:20 }}>~{tokens} tokens</span>
            </div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="e.g. write a stored procedure for updating student records..."
              style={{ width:"100%", border:"1.5px solid #e4daf5", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#1a1035", resize:"vertical", minHeight:110, outline:"none", background:"#faf8ff", fontFamily:"Inter,sans-serif" }}/>
          </div>

          <div style={CARD} className="card-enter">
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={stepNum(false)}>2</div>
              <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Tone</span>
            </div>
            <div className="tone-grid">
              {TONES.map(t=>(
                <button key={t} onClick={()=>setTone(t)}
                  style={{ padding:"10px 12px", borderRadius:12, border:`1.5px solid ${tone===t?"#a78bfa":"#e4daf5"}`, background:tone===t?"#ede9fe":"#faf8ff", fontSize:12, fontWeight:tone===t?600:500, color:tone===t?"#6d28d9":"#4c3d7a", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <Icon name={TONE_ICON[t]} size={14}/>{t}
                </button>
              ))}
            </div>
          </div>

          <div style={CARD} className="card-enter">
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={stepNum(false)}>3</div>
              <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Context</span>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#9c8cc0", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:6 }}>Category</label>
                <CustomSelect options={CATEGORIES} value={category} onChange={setCategory}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#9c8cc0", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:6 }}>Priority</label>
                <CustomSelect options={PRIORITIES} value={priority} onChange={setPriority}
                  renderOption={v=><span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:8,height:8,borderRadius:"50%",background:PRI_COLORS[v],flexShrink:0 }}/>{v}</span>}/>
              </div>
            </div>
          </div>

          <button onClick={optimize} disabled={loading||!input.trim()}
            style={{ width:"100%", padding:14, borderRadius:12, background:"linear-gradient(135deg,#667eea 0%,#a855f7 100%)", color:"#fff", fontSize:14, fontWeight:600, border:"none", cursor:loading||!input.trim()?"not-allowed":"pointer", boxShadow:"0 4px 16px rgba(102,126,234,0.35)", opacity:loading||!input.trim()?0.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading
              ? <><Icon name="refresh" size={16} className="spin"/> Optimizing...</>
              : <><Icon name="sparkles" size={16}/> Optimize Prompt</>}
          </button>
          {error && <p style={{ fontSize:12, color:"#dc2626", marginTop:8, fontWeight:500 }}>{error}</p>}

          {result && <div className="anim-fade">
            {result.original_score && (
              <div style={{ ...CARD, marginTop:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={stepNum(true)}><Icon name="check" size={12} color="white"/></div>
                  <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Prompt score</span>
                </div>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <ScoreBadge score={result.original_score} label="Before"/>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                    <div style={{ width:"100%", height:6, borderRadius:3, background:"#f3f0ff", overflow:"hidden" }}>
                      <div style={{ width:`${(result.optimized_score/10)*100}%`, height:"100%", background:"linear-gradient(90deg,#667eea,#a855f7)", borderRadius:3, transition:"width 0.6s ease" }}/>
                    </div>
                    <span style={{ fontSize:12, color:"#22c55e", fontWeight:700 }}>+{result.optimized_score-result.original_score} pts</span>
                  </div>
                  <ScoreBadge score={result.optimized_score} label="After"/>
                </div>
              </div>
            )}

            <div style={CARD}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={stepNum(true)}><Icon name="check" size={12} color="white"/></div>
                <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Original</span>
              </div>
              <p style={{ fontSize:13, color:"#888", lineHeight:1.7, background:"#f9f9f9", borderRadius:10, padding:"12px 14px", border:"1px solid #eee", margin:0 }}>{input}</p>
            </div>

            <div style={CARD}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                <div style={stepNum(true)}><Icon name="sparkle" size={12} color="white"/></div>
                <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>Optimized prompt</span>
                <button onClick={()=>setShowDiff(o=>!o)} style={btnSec({ marginLeft:"auto", background:showDiff?"#ede9fe":"#fff", color:showDiff?"#6d28d9":"#4c3d7a", borderColor:showDiff?"#a78bfa":"#e4daf5" })}>
                  <Icon name="eye" size={12}/>{showDiff?"Hide diff":"Show diff"}
                </button>
              </div>
              <div style={{ background:"#faf8ff", borderRadius:10, padding:14, border:"1px solid #ede9fe" }}>
                {showDiff?<DiffView original={input} optimized={result.optimized}/>:<p style={{ fontSize:13, color:"#1a1035", lineHeight:1.75, margin:0 }}>{result.optimized}</p>}
              </div>
              {showDiff && <p style={{ fontSize:11, color:"#9c8cc0", marginTop:6 }}>🟢 Green = new words added</p>}
              <div style={{ display:"flex", gap:8, marginTop:14, alignItems:"center", flexWrap:"wrap" }}>
                <button onClick={()=>copyText(result.optimized)} style={btnSec()}><Icon name="copy" size={12}/>Copy</button>
                <button onClick={optimize} style={btnSec()}><Icon name="refresh" size={12}/>Re-optimize</button>
                <button onClick={savePrompt} style={btnSec({ background:"#1a1035", color:"#fff", borderColor:"#1a1035" })}><Icon name="save" size={12}/>Save to library</button>
                {saveMsg && <span style={{ fontSize:12, color:"#22a06b", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><Icon name="check" size={12}/>Saved!</span>}
              </div>
            </div>

            {result.changes?.length>0 && (
              <div style={CARD}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={stepNum(true)}><Icon name="check" size={12} color="white"/></div>
                  <span style={{ fontSize:14, fontWeight:600, color:"#1a1035" }}>What changed</span>
                </div>
                {result.changes.map((c,i)=>(
                  <div key={i} style={{ display:"flex", gap:8, padding:"8px 0", borderBottom:i<result.changes.length-1?"1px solid #f3f0ff":"none", fontSize:13, color:"#4c3d7a", lineHeight:1.5 }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:"linear-gradient(135deg,#667eea,#a855f7)",marginTop:6,flexShrink:0 }}/>
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>}
        </>}

        {tab==="library" && <div className="anim-fade">
          <div style={CARD}>
            <div style={{ position:"relative", marginBottom:12 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9c8cc0" }}><Icon name="search" size={14}/></span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search saved prompts..."
                style={{ width:"100%", border:"1.5px solid #e4daf5", borderRadius:10, padding:"10px 14px 10px 36px", fontSize:13, color:"#1a1035", outline:"none", background:"#faf8ff", fontFamily:"Inter,sans-serif" }}/>
            </div>
            <div className="lib-actions-row">
              <CustomSelect options={["All",...CATEGORIES]} value={filterCat} onChange={setFilterCat}/>
              <CustomSelect options={["All",...PRIORITIES]} value={filterPri} onChange={setFilterPri}
                renderOption={v=>v==="All"?"All priorities":<span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:8,height:8,borderRadius:"50%",background:PRI_COLORS[v] }}/>{v}</span>}/>
              <button onClick={()=>setShowPinned(o=>!o)} style={btnSec({ background:showPinned?"#fef9c3":"#fff", color:showPinned?"#854d0e":"#4c3d7a", borderColor:showPinned?"#fde047":"#e4daf5" })}>
                <Icon name="star" size={12}/>Pinned
              </button>
              <div className="lib-export-group">
                <button onClick={()=>exportLib("json")} style={btnSec({ fontSize:11 })}><Icon name="download" size={11}/>JSON</button>
                <button onClick={()=>exportLib("txt")} style={btnSec({ fontSize:11 })}><Icon name="download" size={11}/>TXT</button>
              </div>
            </div>
          </div>
          {filteredSaved.length===0
            ? <div style={{ textAlign:"center", padding:"48px 0", color:"#b0a0d0", fontSize:13 }}>{saved.length===0?"No saved prompts yet.":"No prompts match your filters."}</div>
            : filteredSaved.map(s=>(
              <div key={s.id} style={{ ...CARD, border:s.pinned?"1.5px solid #fde047":"1px solid #e4daf5" }} className="card-enter">
                <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#ede9fe", color:"#5b21b6" }}>{s.category}</span>
                  <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, ...priBadge(s.priority) }}>{s.priority}</span>
                  {s.tone && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#f0fdf4", color:"#166534" }}>{s.tone}</span>}
                  {s.originalScore && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"#dcfce7", color:"#15803d" }}>{s.originalScore}→{s.optimizedScore}/10</span>}
                  {s.copyCount>0 && <span style={{ fontSize:11, color:"#9c8cc0", display:"inline-flex", alignItems:"center", gap:3 }}><Icon name="copy" size={10}/>{s.copyCount}x</span>}
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:"#f3f0ff", color:"#7c3aed", marginLeft:"auto", fontWeight:600 }}>{s.date}</span>
                  <button onClick={()=>togglePin(s.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex" }}>
                    <Icon name="star" size={16} color={s.pinned?"#f59e0b":"#cbd5e1"}/>
                  </button>
                </div>
                <div style={{ fontSize:11, color:"#b0a0d0", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:3 }}>Original</div>
                <p style={{ fontSize:12, color:"#9c8cc0", marginBottom:10, lineHeight:1.5 }}>{s.original}</p>
                <div style={{ fontSize:11, color:"#b0a0d0", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:3 }}>Optimized</div>
                <p style={{ fontSize:13, color:"#1a1035", lineHeight:1.6, marginBottom:10 }}>{s.optimized}</p>
                {editingNote?.id===s.id ? (
                  <div style={{ marginBottom:10 }}>
                    <textarea value={editingNote.text} onChange={e=>setEditingNote({...editingNote,text:e.target.value})} placeholder="Add a note..."
                      style={{ width:"100%", border:"1.5px solid #a78bfa", borderRadius:8, padding:"8px 10px", fontSize:12, color:"#1a1035", resize:"none", minHeight:60, outline:"none", fontFamily:"Inter,sans-serif" }}/>
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <button onClick={()=>saveNote(s.id,editingNote.text)} style={btnSec({ background:"#1a1035", color:"#fff", borderColor:"#1a1035" })}><Icon name="save" size={12}/>Save</button>
                      <button onClick={()=>setEditingNote(null)} style={btnSec()}>Cancel</button>
                    </div>
                  </div>
                ) : s.note ? (
                  <div onClick={()=>setEditingNote({id:s.id,text:s.note})} style={{ background:"#fef9c3", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#854d0e", marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                    <Icon name="note" size={12}/>{s.note}
                  </div>
                ) : null}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button onClick={()=>copyText(s.optimized,s.id)} style={btnSec()}><Icon name="copy" size={12}/>Copy</button>
                  <button onClick={()=>setEditingNote({id:s.id,text:s.note||""})} style={btnSec()}><Icon name="note" size={12}/>Note</button>
                  <button onClick={()=>del(s.id)} style={btnSec({ color:"#dc2626", borderColor:"#fca5a5" })}><Icon name="trash" size={12}/>Delete</button>
                </div>
              </div>
            ))}
        </div>}

        {/* Settings modal */}
        {showKeySettings && (
          <div className="modal" onClick={e=>{ if(e.target===e.currentTarget) setShowKeySettings(false); }}>
            <div className="modal-content">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <span style={{ fontSize:15, fontWeight:600, color:"#1a1035", display:"flex", alignItems:"center", gap:8 }}><Icon name="settings" size={16}/>Settings</span>
                <button onClick={()=>setShowKeySettings(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9c8cc0", padding:4 }}><Icon name="x" size={20}/></button>
              </div>

              <div style={{ marginBottom:20, padding:14, background:"#f5f0ff", borderRadius:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#6d28d9", marginBottom:8 }}>Current mode: {mode==="free"?"Free trial":"Bring your own key"}</div>
                {mode==="free" && <div style={{ fontSize:12, color:"#7c6fa0", marginBottom:8 }}>Used: {freeUsage}/{FREE_LIMIT} free credits</div>}
                <button onClick={()=>{ localStorage.removeItem(MODE_STORAGE); setMode(null); setShowKeySettings(false); setShowWelcome(true); }} style={btnSec({ fontSize:11 })}>
                  <Icon name="refresh" size={11}/>Change mode
                </button>
              </div>

              {mode === "byok" && Object.entries(PROVIDERS).map(([id,p])=>(
                <div key={id} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5, flexWrap:"wrap", gap:6 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:"#1a1035", display:"flex", alignItems:"center", gap:6 }}><ProviderLogo provider={id} size={12}/>{p.name}</label>
                    <span style={{ fontSize:11, background:p.bg, color:p.color, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>{p.free}</span>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <input type="password" defaultValue={keys?.[id]||""} id={`key-${id}`} placeholder={p.placeholder}
                      style={{ flex:1, border:"1.5px solid #e4daf5", borderRadius:8, padding:"9px 12px", fontSize:12, fontFamily:"monospace", color:"#1a1035", outline:"none", background:"#faf8ff" }}/>
                    <a href={p.link} target="_blank" rel="noreferrer" style={{ padding:"9px 12px", borderRadius:8, border:"1.5px solid #e4daf5", background:"#faf8ff", fontSize:12, color:"#6d28d9", textDecoration:"none", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>Get<Icon name="arrowUp" size={11}/></a>
                  </div>
                </div>
              ))}
              {mode === "byok" && <button onClick={()=>{ const k={}; Object.keys(PROVIDERS).forEach(id=>{ k[id]=document.getElementById(`key-${id}`)?.value||""; }); saveKeys(k); }}
                style={{ width:"100%", padding:12, borderRadius:10, background:"linear-gradient(135deg,#667eea,#a855f7)", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer", marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Icon name="save" size={14}/>Save keys
              </button>}
            </div>
          </div>
        )}

        {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onSwitch={()=>{ setShowUpgrade(false); localStorage.removeItem(MODE_STORAGE); setMode(null); setShowWelcome("byok"); }}/>}

        {exportModal && (
          <div className="modal" onClick={e=>{ if(e.target===e.currentTarget) setExportModal(null); }}>
            <div className="modal-content">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span style={{ fontSize:15, fontWeight:600 }}>Export {exportModal.fmt.toUpperCase()}</span>
                <button onClick={()=>setExportModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9c8cc0" }}><Icon name="x" size={20}/></button>
              </div>
              <textarea readOnly value={exportModal.content} onFocus={e=>e.target.select()}
                style={{ width:"100%", height:220, border:"1.5px solid #e4daf5", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"monospace", color:"#1a1035", resize:"none", outline:"none", background:"#faf8ff" }}/>
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button onClick={()=>fallbackCopy(exportModal.content)} style={btnSec({ background:"#1a1035", color:"#fff", borderColor:"#1a1035" })}><Icon name="copy" size={12}/>Copy all</button>
                <button onClick={()=>setExportModal(null)} style={btnSec()}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}