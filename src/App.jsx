import { useState, useEffect, useRef } from "react";

const NOTION_MCP_URL = "https://mcp.notion.com/mcp";

// ── DATA ──────────────────────────────────────────────────────────────────────

const DAILY_MORNING_HABITS = [
  { id: "dm1", label: "Woke up on time" },
  { id: "dm2", label: "Morning exercise" },
  { id: "dm3", label: "Planned today's tasks" },
  { id: "dm4", label: "Reached office on time" },
];
const DAILY_WORK_HABITS = [
  { id: "dw1", label: "Logged tasks in tracker" },
  { id: "dw2", label: "Stayed focused — no laziness" },
  { id: "dw3", label: "Design thinking — 15 min" },
  { id: "dw4", label: "Video editing or gimbal practice" },
  { id: "dw5", label: "Spoke up and engaged with team" },
];
const DAILY_EVENING_HABITS = [
  { id: "de1", label: "Read 10 pages" },
  { id: "de2", label: "Evening reflection done" },
  { id: "de3", label: "Prepared tomorrow's plan" },
];

const WEEKLY_SECTIONS = [
  { id:"wtime", title:"Time Management", items:[
    {id:"wt1",label:"Used time-blocking every day"},
    {id:"wt2",label:"Created a daily task log each morning"},
    {id:"wt3",label:"Arrived on time — no late days"},
    {id:"wt4",label:"Justified time spent in office daily"},
    {id:"wt5",label:"Reviewed and adjusted plan mid-week"},
  ]},
  { id:"wded", title:"Dedication", items:[
    {id:"wd1",label:"No unproductive days this week"},
    {id:"wd2",label:"Set personal KPIs at start of week"},
    {id:"wd3",label:"Reviewed KPIs at end of week"},
    {id:"wd4",label:"Treated every task as a commitment"},
    {id:"wd5",label:"Reflected on tasks each evening — 5 of 5 days"},
  ]},
  { id:"wdes", title:"Design Thinking", items:[
    {id:"wds1",label:"Design thinking — 15 min every day"},
    {id:"wds2",label:"Added 3 new inspirations to library"},
    {id:"wds3",label:"Followed or studied 1 new designer"},
    {id:"wds4",label:"Worked on 1 portfolio project this week"},
    {id:"wds5",label:"Asked for feedback on a design"},
  ]},
  { id:"wvid", title:"Video & Videography", items:[
    {id:"wv1",label:"Completed 1 video editing tutorial"},
    {id:"wv2",label:"Practiced gimbal at least twice"},
    {id:"wv3",label:"Shot or edited 1 short video"},
    {id:"wv4",label:"Reviewed own footage critically"},
  ]},
  { id:"wcom", title:"Communication & Reading", items:[
    {id:"wc1",label:"Read 10 pages every day — 5 of 5"},
    {id:"wc2",label:"Spoke up in at least 1 meeting per day"},
    {id:"wc3",label:"Initiated 1 conversation daily"},
    {id:"wc4",label:"Joined team lunch or informal chat"},
  ]},
  { id:"wgro", title:"Personal Growth", items:[
    {id:"wg1",label:"Identified 3 things I enjoyed at work"},
    {id:"wg2",label:"Applied a managerial lesson to real work"},
    {id:"wg3",label:"Reviewed 3-month milestone goals"},
    {id:"wg4",label:"Noted 1 skill improvement this week"},
  ]},
];

const ALL_DAILY_HABITS = [...DAILY_MORNING_HABITS, ...DAILY_WORK_HABITS, ...DAILY_EVENING_HABITS];
const ALL_WEEKLY_ITEMS = WEEKLY_SECTIONS.flatMap(s => s.items);
const CATS = ["Work","Design","Video","Meeting","Learning","Personal"];
const DEFAULT_ALARMS = [
  { id:"leave",  label:"Leave Home",   time:"08:10", enabled:true, ringing:false, message:"Leave home now — office by 9:30" },
  { id:"arrive", label:"Reach Office", time:"09:30", enabled:true, ringing:false, message:"You should be at office by now" },
];
const SEED = [
  { title:"Check emails",         priority:"Medium", category:"Work",    time:"09:00", section:"morning" },
  { title:"Review today's goals", priority:"High",   category:"Work",    time:"09:15", section:"morning" },
  { title:"Team stand-up",        priority:"Medium", category:"Meeting", time:"09:30", section:"morning" },
];

// ── COLOUR TOKENS ─────────────────────────────────────────────────────────────

const C = {
  bg:     "#E1E6F9",
  surface:"#FFFFFF",
  blue:   "#2997FF",
  dark:   "#111C2E",
  mid:    "#3D4E73",
  light:  "#AECBFA",
  border: "#D0DAFB",
  tray:   "#F0F4FF",
};

// ── CLAY STYLE HELPERS ────────────────────────────────────────────────────────

const clay      = (e={}) => ({ background:C.surface, borderRadius:20, border:`1.5px solid ${C.border}`, boxShadow:`0 2px 0 #BFCBEF, 0 6px 24px rgba(41,151,255,0.08)`, ...e });
const clayActive= (e={}) => ({ background:C.blue, borderRadius:20, border:`1.5px solid #1A82E0`, boxShadow:`0 2px 0 #1A6FC4, 0 6px 20px rgba(41,151,255,0.22)`, ...e });
const clayLight = (e={}) => ({ background:C.tray, borderRadius:16, border:`1.5px solid ${C.border}`, boxShadow:`0 2px 0 #C8D5F5, 0 4px 12px rgba(41,151,255,0.06)`, ...e });

const T = {
  label:{ fontSize:10, fontWeight:600, color:C.mid, letterSpacing:1, textTransform:"uppercase" },
  body: { fontSize:13, fontWeight:400, color:C.dark, letterSpacing:0.1 },
  title:{ fontSize:20, fontWeight:700, color:C.dark, letterSpacing:-0.5 },
  sub:  { fontSize:11, fontWeight:400, color:C.mid },
  clock:{ fontSize:22, fontWeight:700, color:C.dark, letterSpacing:-1 },
};

const inputStyle = {
  background:C.tray,
  border:`1.5px solid ${C.border}`,
  borderRadius:12,
  color:C.dark,
  outline:"none",
  fontFamily:"inherit",
  fontSize:13,
  width:"100%",
  boxSizing:"border-box",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function nowHHMM() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}
function clockDisplay() {
  return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
}
function dateDisplay() {
  return new Date().toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric"});
}
function playAlarm(ctx) {
  if (!ctx) return;
  [660,880,660,880,1100].forEach((f,i)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type="sine"; o.frequency.value=f;
    const t=ctx.currentTime+i*0.35;
    g.gain.setValueAtTime(0.35,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3);
    o.start(t); o.stop(t+0.3);
  });
}

// ── SUB-COMPONENTS (all defined OUTSIDE App to prevent remount on re-render) ──

function ScoreBar({ pct }) {
  return (
    <div style={{ height:5, background:C.border, borderRadius:99, overflow:"hidden", marginTop:6 }}>
      <div style={{ height:"100%", width:`${pct}%`, background:C.blue, borderRadius:99, transition:"width 0.6s ease" }} />
    </div>
  );
}

function SectionLabel({ text, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, marginTop:20 }}>
      <span style={T.label}>{text}</span>
      {right && <span style={{ ...T.sub, fontWeight:600, color:C.mid }}>{right}</span>}
    </div>
  );
}

function TaskList({ items, onToggle, onRemove }) {
  if (!items.length) return (
    <p style={{ ...T.sub, textAlign:"center", padding:"28px 0", color:C.mid }}>No tasks yet</p>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {items.map(t => (
        <div key={t.id} style={{ ...clayLight(), padding:"12px 14px", opacity:t.done?0.45:1, transition:"opacity 0.3s", display:"flex", alignItems:"center", gap:12 }}>
          <button
            onClick={()=>onToggle(t.id)}
            style={{
              width:18, height:18, borderRadius:6,
              border:`2px solid ${t.done ? C.blue : C.border}`,
              background:t.done ? C.blue : "transparent",
              cursor:"pointer", flexShrink:0, transition:"all 0.2s", padding:0,
              boxShadow:t.done ? `0 2px 6px rgba(41,151,255,0.35)` : "none",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {t.done && <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>✓</span>}
          </button>
          <div style={{ flex:1 }}>
            <div style={{ ...T.body, textDecoration:t.done?"line-through":"none", color:t.done?C.mid:C.dark }}>{t.title}</div>
            <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap" }}>
              {[t.priority, t.category, t.time].filter(Boolean).map((tag,i) => (
                <span key={i} style={{ fontSize:9, fontWeight:600, color:C.mid, background:C.bg, padding:"2px 8px", borderRadius:99, letterSpacing:0.6, textTransform:"uppercase", border:`1px solid ${C.border}` }}>{tag}</span>
              ))}
            </div>
          </div>
          <button onClick={()=>onRemove(t.id)} style={{ background:"none", border:"none", color:C.border, cursor:"pointer", fontSize:16, lineHeight:1, padding:2 }}>×</button>
        </div>
      ))}
    </div>
  );
}

function AddRow({ section, draft, setDraft, onAdd }) {
  return (
    <div style={{ ...clayLight(), padding:14, marginTop:10 }}>
      <input
        value={draft.title}
        onChange={e => setDraft(p => ({ ...p, title:e.target.value }))}
        onKeyDown={e => e.key==="Enter" && onAdd(section)}
        placeholder="New task…"
        style={{ ...inputStyle, padding:"9px 12px", marginBottom:10 }}
      />
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        {["High","Medium","Low"].map(p => (
          <button key={p} onClick={()=>setDraft(d=>({...d,priority:p}))} style={{
            padding:"4px 12px", borderRadius:99, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", fontSize:10, fontWeight:600,
            border:`1.5px solid ${draft.priority===p ? C.blue : C.border}`,
            background:draft.priority===p ? C.blue : "transparent",
            color:draft.priority===p ? "#fff" : C.mid,
          }}>{p}</button>
        ))}
        <select value={draft.category} onChange={e=>setDraft(p=>({...p,category:e.target.value}))}
          style={{ ...inputStyle, width:"auto", padding:"4px 9px", fontSize:10, cursor:"pointer", border:`1.5px solid ${C.border}`, color:C.dark }}>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </select>
        <input type="time" value={draft.time} onChange={e=>setDraft(p=>({...p,time:e.target.value}))}
          style={{ ...inputStyle, width:"auto", padding:"4px 9px", fontSize:10, colorScheme:"light" }} />
        <button onClick={()=>onAdd(section)} style={{ ...clayActive({ borderRadius:14 }), padding:"5px 18px", border:"none", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginLeft:"auto" }}>Add</button>
      </div>
    </div>
  );
}

function HabitRow({ label, checked, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display:"flex", alignItems:"center", gap:12,
      ...clayLight({
        background:checked ? "#EBF3FF" : C.tray,
        border:`1.5px solid ${checked ? C.blue : C.border}`,
        boxShadow:checked ? `0 2px 0 #AECBFA, 0 4px 12px rgba(41,151,255,0.12)` : `0 2px 0 #C8D5F5, 0 4px 12px rgba(41,151,255,0.04)`,
      }),
      padding:"12px 14px", cursor:"pointer", textAlign:"left", width:"100%",
      fontFamily:"inherit", transition:"all 0.22s",
    }}>
      <div style={{
        width:18, height:18, borderRadius:6,
        border:`2px solid ${checked ? C.blue : C.border}`,
        background:checked ? C.blue : "transparent",
        flexShrink:0, transition:"all 0.2s",
        boxShadow:checked ? `0 2px 6px rgba(41,151,255,0.35)` : "none",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {checked && <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>✓</span>}
      </div>
      <span style={{ ...T.body, color:checked ? C.dark : C.mid }}>{label}</span>
    </button>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tasks,       setTasks]       = useState(SEED.map((t,i)=>({...t,id:i+1,done:false})));
  const [dailyHabits, setDailyHabits] = useState({});
  const [weeklyItems, setWeeklyItems] = useState({});
  const [tab,         setTab]         = useState("alarms");
  const [draft,       setDraft]       = useState({title:"",priority:"Medium",category:"Work",time:"",section:"morning"});
  const [dailyNote,   setDailyNote]   = useState("");
  const [weeklyNote,  setWeeklyNote]  = useState("");
  const [aiLoad,      setAiLoad]      = useState(false);
  const [ntnSt,       setNtnSt]       = useState("idle");
  const [ntnMsg,      setNtnMsg]      = useState("");
  const [alarms,      setAlarms]      = useState(DEFAULT_ALARMS);
  const [clock,       setClock]       = useState(clockDisplay());
  const [ringing,     setRinging]     = useState(null);
  const [notifPerm,   setNotifPerm]   = useState("Notification" in window ? Notification.permission : "denied");
  const audioCtx   = useRef(null);
  // live refs so reminder interval always sees latest state without stale closures
  const tasksRef   = useRef(tasks);
  const habitsRef  = useRef(dailyHabits);
  useEffect(()=>{ tasksRef.current  = tasks; },        [tasks]);
  useEffect(()=>{ habitsRef.current = dailyHabits; },  [dailyHabits]);

  useEffect(()=>{ const t=setInterval(()=>setClock(clockDisplay()),5000); return ()=>clearInterval(t); },[]);

  // ── Auto-request notification permission on first load ─────────────────────
  useEffect(()=>{
    if("Notification" in window && Notification.permission === "default"){
      Notification.requestPermission().then(p=>setNotifPerm(p));
    }
  },[]);

  // ── Alarm tick ─────────────────────────────────────────────────────────────
  useEffect(()=>{
    const t=setInterval(()=>{
      const hhmm=nowHHMM();
      setAlarms(prev=>prev.map(a=>{ if(a.enabled&&a.time===hhmm&&!a.ringing){ triggerAlarm(a.id); return {...a,ringing:true}; } return a; }));
    },30000);
    return ()=>clearInterval(t);
  },[]);

  // ── Pending item reminder (every 10 s) ────────────────────────────────────
  const reminderIdxRef = useRef(0);
  useEffect(()=>{
    const interval = setInterval(()=>{
      if(!("Notification" in window) || Notification.permission !== "granted") return;

      // Build full pending list: tasks first, then habits
      const pending = [];
      tasksRef.current.filter(t=>!t.done).forEach(t=>{
        pending.push({
          title: "📋 " + t.title,
          body:  `${t.section === "morning" ? "Morning" : "Work"} task${t.time ? " · " + t.time : ""} — tap to open tracker`,
        });
      });
      ALL_DAILY_HABITS.forEach(h=>{
        if(!habitsRef.current[h.id]){
          pending.push({
            title: "✅ Habit not done yet",
            body:  h.label + " — tap to mark complete",
          });
        }
      });

      if(pending.length === 0) return; // everything done — no notification

      // Cycle through items in order so every pending thing gets surfaced
      const idx = reminderIdxRef.current % pending.length;
      reminderIdxRef.current = idx + 1;
      const pick = pending[idx];

      const n = new Notification("Satyam · Daily Tracker", {
        body:             pick.title + "\n" + pick.body,
        icon:             "/vite.svg",
        badge:            "/vite.svg",
        tag:              "pending-reminder",   // replaces previous — no pile-up
        renotify:         true,                  // re-fires sound/vibration each time
        requireInteraction: false,               // auto-dismiss after OS default time
        silent:           false,                 // play system sound
      });
      // Clicking the notification focuses the tab
      n.onclick = ()=>{ window.focus(); n.close(); };
    }, 10000); // exactly 10 seconds

    return ()=>clearInterval(interval);
  },[]);

  function triggerAlarm(id){
    if(!audioCtx.current) audioCtx.current=new(window.AudioContext||window.webkitAudioContext)();
    let c=0; const r=setInterval(()=>{ playAlarm(audioCtx.current); if(++c>=3)clearInterval(r); },1300);
    setRinging(id);
    if("Notification"in window&&Notification.permission==="granted"){
      const a=DEFAULT_ALARMS.find(x=>x.id===id);
      new Notification("Satyam — "+a?.label,{body:a?.message});
    }
  }
  function dismissAlarm(id){ setRinging(null); setAlarms(p=>p.map(a=>a.id===id?{...a,ringing:false}:a)); }
  function testAlarm(id){
    if(!audioCtx.current) audioCtx.current=new(window.AudioContext||window.webkitAudioContext)();
    playAlarm(audioCtx.current); setRinging(id); setTimeout(()=>setRinging(null),4500);
  }

  const morningTasks = tasks.filter(t=>t.section==="morning");
  const workTasks    = tasks.filter(t=>t.section==="work");
  const doneTasks    = tasks.filter(t=>t.done).length;
  const dHabitDone   = Object.values(dailyHabits).filter(Boolean).length;
  const wItemDone    = Object.values(weeklyItems).filter(Boolean).length;
  const dayScore     = tasks.length+ALL_DAILY_HABITS.length>0 ? Math.round(((doneTasks+dHabitDone)/(tasks.length+ALL_DAILY_HABITS.length))*100) : 0;
  const weekScore    = ALL_WEEKLY_ITEMS.length>0 ? Math.round((wItemDone/ALL_WEEKLY_ITEMS.length)*100) : 0;

  function addTask(section){
    if(!draft.title.trim()) return;
    setTasks(p=>[...p,{...draft,section,id:Date.now(),done:false}]);
    setDraft(p=>({...p,title:"",time:""}));
  }
  function toggleTask(id)  { setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t)); }
  function removeTask(id)  { setTasks(p=>p.filter(t=>t.id!==id)); }
  function toggleDH(id)    { setDailyHabits(p=>({...p,[id]:!p[id]})); }
  function toggleWI(id)    { setWeeklyItems(p=>({...p,[id]:!p[id]})); }

  async function aiSuggest(){
    setAiLoad(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,
          messages:[{role:"user",content:`Generate 5 work tasks for Satyam Pariyar, Graphic Designer improving: design thinking, video editing, communication, punctuality. Return ONLY JSON array no markdown: [{"title":"task","priority":"High|Medium|Low","category":"Work|Design|Video|Meeting|Learning","time":"HH:MM"}] Times 10:00-18:00.`}]})});
      const d=await r.json();
      const txt=d.content?.find(b=>b.type==="text")?.text||"[]";
      const arr=JSON.parse(txt.replace(/```json|```/g,"").trim());
      setTasks(p=>[...p,...arr.map(t=>({...t,id:Date.now()+Math.random(),done:false,section:"work"}))]);
      setTab("work");
    }catch(e){console.error(e);}
    setAiLoad(false);
  }

  async function pushToNotion(){
    setNtnSt("pushing"); setNtnMsg("");
    try{
      const fmt=arr=>arr.map(t=>`${t.done?"done":"todo"} [${t.priority}] ${t.title}${t.time?" @ "+t.time:""}`).join("\n");
      const hfmt=(arr,state)=>arr.map(h=>`${state[h.id]?"done":"todo"} ${h.label}`).join("\n");
      const wfmt=WEEKLY_SECTIONS.map(s=>`${s.title}\n${s.items.map(i=>`${weeklyItems[i.id]?"done":"todo"} ${i.label}`).join("\n")}`).join("\n\n");
      const body=`${dateDisplay()}\n\nALARMS\n${alarms.map(a=>`${a.enabled?"on":"off"} ${a.label} ${a.time}`).join("\n")}\n\nMORNING TASKS\n${fmt(morningTasks)||"none"}\n\nWORK TASKS\n${fmt(workTasks)||"none"}\n\nMORNING HABITS\n${hfmt(DAILY_MORNING_HABITS,dailyHabits)}\n\nWORK HABITS\n${hfmt(DAILY_WORK_HABITS,dailyHabits)}\n\nEVENING HABITS\n${hfmt(DAILY_EVENING_HABITS,dailyHabits)}\n\nDAY SCORE: ${doneTasks}/${tasks.length} tasks, ${dHabitDone}/${ALL_DAILY_HABITS.length} habits, ${dayScore}%\n\nDAILY NOTES\n${dailyNote||"—"}\n\n---WEEKLY---\n\n${wfmt}\n\nWEEK SCORE: ${wItemDone}/${ALL_WEEKLY_ITEMS.length} = ${weekScore}%\n\nWEEKLY NOTES\n${weeklyNote||"—"}`;
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,mcp_servers:[{type:"url",url:NOTION_MCP_URL,name:"notion"}],messages:[{role:"user",content:`Search Notion for "Daily Tracker" page or database. If found, create a new entry for today. If not found, create a new page titled "Daily Tracker — ${new Date().toISOString().slice(0,10)}" with this content:\n\n${body}\n\nConfirm with done.`}]})});
      const d=await r.json();
      const reply=d.content?.filter(b=>b.type==="text").map(b=>b.text).join(" ")||"";
      setNtnSt("success");
      setNtnMsg(reply.toLowerCase().includes("done")||reply.toLowerCase().includes("creat")||reply.includes("✅")?"Saved to Notion ✓":"Pushed — "+reply.slice(0,100));
    }catch(e){setNtnSt("error");setNtnMsg("Could not connect. Check Notion connector.");}
  }

  const TABS = [
    ["alarms","Alarms"],["morning","Morning"],["work","Work"],
    ["daily","Habits"],["weekly","Weekly"],["notes","Notes"],
  ];

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter','DM Sans',system-ui,sans-serif", padding:"24px 16px", paddingBottom:40 }}>

      {/* RINGING OVERLAY */}
      {ringing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(17,28,46,0.55)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ ...clay({ borderRadius:28 }), padding:"40px 32px", textAlign:"center", maxWidth:300, width:"100%" }}>
            <div style={{ ...T.label, marginBottom:10 }}>{alarms.find(a=>a.id===ringing)?.label}</div>
            <div style={{ fontSize:52, fontWeight:800, color:C.dark, letterSpacing:-2, marginBottom:4 }}>
              {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false})}
            </div>
            <div style={{ ...T.sub, marginBottom:28, lineHeight:1.7 }}>{alarms.find(a=>a.id===ringing)?.message}</div>
            <button onClick={()=>dismissAlarm(ringing)} style={{ ...clayActive({ borderRadius:14 }), padding:"12px 0", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", width:"100%" }}>Dismiss</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth:520, margin:"0 auto" }}>

        {/* HEADER */}
        <div style={{ ...clay({ borderRadius:24 }), padding:"22px 22px 18px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
            <div>
              <div style={{ ...T.label, marginBottom:4 }}>{dateDisplay()}</div>
              <div style={T.title}>Daily Tracker</div>
              <div style={{ ...T.sub, marginTop:2 }}>Satyam · Graphic Designer</div>
            </div>
            <div style={{ ...clayLight({ borderRadius:14 }), padding:"8px 14px", textAlign:"center" }}>
              <div style={T.clock}>{clock}</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
            {[
              { label:"Tasks",  val:`${doneTasks}/${tasks.length}`,             pct:tasks.length>0?Math.round((doneTasks/tasks.length)*100):0 },
              { label:"Habits", val:`${dHabitDone}/${ALL_DAILY_HABITS.length}`, pct:Math.round((dHabitDone/ALL_DAILY_HABITS.length)*100) },
              { label:"Day",    val:`${dayScore}%`,                             pct:dayScore },
              { label:"Week",   val:`${weekScore}%`,                            pct:weekScore },
            ].map(s => (
              <div key={s.label} style={{ background:C.tray, borderRadius:16, padding:"10px 11px", border:`1.5px solid ${C.border}`, boxShadow:`0 2px 0 ${C.border}` }}>
                <div style={T.label}>{s.label}</div>
                <div style={{ fontSize:17, fontWeight:700, color:C.dark, marginTop:3 }}>{s.val}</div>
                <ScoreBar pct={s.pct} />
              </div>
            ))}
          </div>
        </div>

        {/* NOTIFICATION PERMISSION BANNER */}
        {notifPerm !== "granted" && (
          <div style={{ ...clayLight({ borderRadius:16, border:`1.5px solid ${notifPerm==="denied" ? "#FFCDD2" : C.border}`, background: notifPerm==="denied" ? "#FFF5F5" : "#FFFBEB" }), padding:"11px 16px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>{notifPerm==="denied" ? "🔕" : "🔔"}</span>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:C.dark }}>
                  {notifPerm==="denied" ? "Notifications blocked" : "Enable reminders"}
                </div>
                <div style={{ fontSize:10, color:C.mid, marginTop:1 }}>
                  {notifPerm==="denied"
                    ? "Allow in browser settings to get task reminders"
                    : "Get nudged every 15–30s for pending tasks & habits"}
                </div>
              </div>
            </div>
            {notifPerm !== "denied" && (
              <button
                onClick={()=>Notification.requestPermission().then(p=>setNotifPerm(p))}
                style={{ ...clayActive({ borderRadius:10 }), padding:"6px 14px", border:"none", color:"#fff", fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}
              >
                Enable
              </button>
            )}
          </div>
        )}

        {/* TAB BAR */}
        <div style={{ display:"flex", gap:4, background:C.tray, borderRadius:18, padding:5, marginBottom:12, border:`1.5px solid ${C.border}`, overflowX:"auto" }}>
          {TABS.map(([t,label]) => (
            <button key={t} onClick={()=>setTab(t)} style={{
              flexShrink:0, padding:"7px 12px", border:"none", borderRadius:13,
              fontSize:10, fontWeight:600, cursor:"pointer", transition:"all 0.2s",
              fontFamily:"inherit", letterSpacing:0.4, whiteSpace:"nowrap",
              background:tab===t ? C.blue : "transparent",
              color:      tab===t ? "#fff" : C.mid,
              boxShadow:  tab===t ? "0 2px 0 #1A6FC4, 0 4px 14px rgba(41,151,255,0.2)" : "none",
            }}>{label}</button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ ...clay({ borderRadius:24 }), padding:20 }}>

          {/* ALARMS */}
          {tab==="alarms" && (
            <div>
              <div style={{ ...T.label, marginBottom:14 }}>Office Alarms</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                {alarms.map(alarm => (
                  <div key={alarm.id} style={{ ...clayLight({ border:`1.5px solid ${alarm.enabled ? C.blue : C.border}` }), padding:16, transition:"all 0.3s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div>
                        <div style={{ ...T.body, fontWeight:600 }}>{alarm.label}</div>
                        <div style={{ ...T.sub, marginTop:2 }}>{alarm.message}</div>
                      </div>
                      <button onClick={()=>setAlarms(p=>p.map(a=>a.id===alarm.id?{...a,enabled:!a.enabled}:a))}
                        style={{ width:44, height:24, borderRadius:99, border:"none", cursor:"pointer", transition:"all 0.3s", position:"relative", flexShrink:0,
                          background:alarm.enabled ? C.blue : C.border,
                          boxShadow:alarm.enabled ? "0 2px 6px rgba(41,151,255,0.4)" : "none",
                        }}>
                        <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:alarm.enabled?23:3, transition:"all 0.3s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
                      </button>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <input type="time" value={alarm.time}
                        onChange={e=>setAlarms(p=>p.map(a=>a.id===alarm.id?{...a,time:e.target.value}:a))}
                        style={{ ...inputStyle, flex:1, padding:"9px 13px", fontSize:20, fontWeight:700, letterSpacing:1, colorScheme:"light" }} />
                      <button onClick={()=>testAlarm(alarm.id)} style={{ ...clayLight(), padding:"9px 16px", border:`1.5px solid ${C.border}`, color:C.mid, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", letterSpacing:0.4, borderRadius:12 }}>Test</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>{ "Notification"in window&&Notification.requestPermission(); }}
                style={{ width:"100%", ...clayLight({ borderRadius:14 }), padding:"10px 0", border:`1.5px solid ${C.border}`, color:C.mid, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:14 }}>
                Allow notifications
              </button>
              <div style={{ ...clayLight({ borderRadius:14 }), padding:14 }}>
                <div style={{ ...T.label, marginBottom:8 }}>Phone setup — sleep mode</div>
                {["iPhone: Clock → Alarm → 8:10 AM & 9:30 AM","Android: Clock → Alarm → Add both times","Label: Leave Home & Reach Office","Enable bypass in Focus / DND settings"].map((tip,i,arr)=>(
                  <div key={i} style={{ ...T.sub, padding:"6px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", lineHeight:1.7 }}>{tip}</div>
                ))}
              </div>
            </div>
          )}

          {/* MORNING */}
          {tab==="morning" && (
            <div>
              <div style={{ ...T.label, marginBottom:12 }}>Morning Tasks</div>
              <TaskList items={morningTasks} onToggle={toggleTask} onRemove={removeTask} />
              <AddRow section="morning" draft={draft} setDraft={setDraft} onAdd={addTask} />
            </div>
          )}

          {/* WORK */}
          {tab==="work" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={T.label}>Work Tasks</span>
                <button onClick={aiSuggest} disabled={aiLoad} style={{ ...clayActive({ borderRadius:99 }), padding:"5px 14px", border:"none", color:"#fff", fontSize:10, fontWeight:600, cursor:aiLoad?"not-allowed":"pointer", fontFamily:"inherit", letterSpacing:0.3, opacity:aiLoad?0.5:1 }}>
                  {aiLoad?"Generating…":"AI Fill"}
                </button>
              </div>
              <TaskList items={workTasks} onToggle={toggleTask} onRemove={removeTask} />
              <AddRow section="work" draft={draft} setDraft={setDraft} onAdd={addTask} />
            </div>
          )}

          {/* HABITS */}
          {tab==="daily" && (
            <div>
              <SectionLabel text="Morning" right={`${DAILY_MORNING_HABITS.filter(h=>dailyHabits[h.id]).length} / ${DAILY_MORNING_HABITS.length}`} />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {DAILY_MORNING_HABITS.map(h=><HabitRow key={h.id} label={h.label} checked={!!dailyHabits[h.id]} onToggle={()=>toggleDH(h.id)} />)}
              </div>
              <SectionLabel text="Work" right={`${DAILY_WORK_HABITS.filter(h=>dailyHabits[h.id]).length} / ${DAILY_WORK_HABITS.length}`} />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {DAILY_WORK_HABITS.map(h=><HabitRow key={h.id} label={h.label} checked={!!dailyHabits[h.id]} onToggle={()=>toggleDH(h.id)} />)}
              </div>
              <SectionLabel text="Evening" right={`${DAILY_EVENING_HABITS.filter(h=>dailyHabits[h.id]).length} / ${DAILY_EVENING_HABITS.length}`} />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {DAILY_EVENING_HABITS.map(h=><HabitRow key={h.id} label={h.label} checked={!!dailyHabits[h.id]} onToggle={()=>toggleDH(h.id)} />)}
              </div>
              <div style={{ ...T.sub, textAlign:"center", marginTop:16, fontWeight:600, color:dHabitDone===ALL_DAILY_HABITS.length ? C.blue : C.mid }}>
                {dHabitDone===ALL_DAILY_HABITS.length ? "✓ All habits complete" : `${ALL_DAILY_HABITS.length-dHabitDone} remaining`}
              </div>
            </div>
          )}

          {/* WEEKLY */}
          {tab==="weekly" && (
            <div>
              <div style={{ ...clayLight({ borderRadius:18 }), padding:"14px 16px", marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={T.label}>Week progress</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.blue }}>{wItemDone} / {ALL_WEEKLY_ITEMS.length} — {weekScore}%</span>
                </div>
                <ScoreBar pct={weekScore} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px", marginTop:14 }}>
                  {WEEKLY_SECTIONS.map(s=>{
                    const done=s.items.filter(i=>weeklyItems[i.id]).length;
                    return (
                      <div key={s.id}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={T.label}>{s.title}</span>
                          <span style={{ fontSize:9, fontWeight:600, color:C.mid }}>{done}/{s.items.length}</span>
                        </div>
                        <ScoreBar pct={Math.round((done/s.items.length)*100)} />
                      </div>
                    );
                  })}
                </div>
              </div>
              {WEEKLY_SECTIONS.map(s=>{
                const done=s.items.filter(i=>weeklyItems[i.id]).length;
                return (
                  <div key={s.id}>
                    <SectionLabel text={s.title} right={`${done} / ${s.items.length}`} />
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {s.items.map(item=><HabitRow key={item.id} label={item.label} checked={!!weeklyItems[item.id]} onToggle={()=>toggleWI(item.id)} />)}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:22 }}>
                <div style={{ ...T.label, marginBottom:8 }}>Weekly reflection</div>
                <textarea value={weeklyNote} onChange={e=>setWeeklyNote(e.target.value)} rows={5}
                  placeholder={"Biggest win this week?\nBiggest struggle?\nOne thing I commit to next week?"}
                  style={{ ...inputStyle, padding:13, fontSize:13, lineHeight:1.8, resize:"vertical" }} />
              </div>
            </div>
          )}

          {/* NOTES */}
          {tab==="notes" && (
            <div>
              <div style={{ ...T.label, marginBottom:8 }}>Daily Reflection</div>
              <textarea value={dailyNote} onChange={e=>setDailyNote(e.target.value)} rows={7}
                placeholder={"What went well today?\nWhat could be better?\nWhat will I change tomorrow?"}
                style={{ ...inputStyle, padding:13, fontSize:13, lineHeight:1.8, resize:"vertical" }} />
              <div style={{ ...T.label, marginTop:18, marginBottom:8 }}>Week Notes</div>
              <textarea value={weeklyNote} onChange={e=>setWeeklyNote(e.target.value)} rows={5}
                placeholder={"Biggest win? Biggest struggle? Commitment for next week?"}
                style={{ ...inputStyle, padding:13, fontSize:13, lineHeight:1.8, resize:"vertical" }} />
            </div>
          )}

        </div>

        {/* NOTION SAVE */}
        <div style={{ marginTop:14 }}>
          <button onClick={pushToNotion} disabled={ntnSt==="pushing"} style={{
            width:"100%", padding:"14px", ...clay({ borderRadius:18 }),
            border:`1.5px solid ${ntnSt==="success" ? C.blue : C.border}`,
            color:ntnSt==="pushing" ? C.mid : C.dark,
            fontSize:12, fontWeight:700, cursor:ntnSt==="pushing"?"not-allowed":"pointer",
            fontFamily:"inherit", letterSpacing:0.5, transition:"all 0.3s",
            background:ntnSt==="success" ? "#EBF3FF" : C.surface,
          }}>
            {ntnSt==="pushing" ? "Saving…" : "Save to Notion"}
          </button>
          {ntnMsg && (
            <div style={{ ...clayLight({ borderRadius:14 }), marginTop:8, padding:"10px 14px", fontSize:11, color:C.mid, fontWeight:500 }}>{ntnMsg}</div>
          )}
        </div>

        <div style={{ ...T.label, textAlign:"center", marginTop:18, color:C.mid }}>Satyam · Daily Tracker</div>
      </div>
    </div>
  );
}
