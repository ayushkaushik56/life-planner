import { useState, useCallback, useRef, useEffect } from "react";
import { googleSignIn, googleSignOut, onAuth, saveToCloud, listenToCloud, isConfigured, STORE_KEYS } from "./firebase.js";

const SK="lp_v4_data", GHK="lp_v4_habits", YK="lp_v4_years", TMK="lp_v4_theme";
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TAGS=["work","health","personal","finance","learning","family"];
const MEDIA_TYPES=["book","article","video","podcast","other"];

function useLS(key,init,uid){
  const [v,sv]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}});
  const skipNextCloud=useRef(false);
  const set=useCallback(val=>{
    sv(val);
    try{localStorage.setItem(key,JSON.stringify(val));}catch{}
    if(uid&&isConfigured)saveToCloud(uid,key,val);
  },[key,uid]);
  // Listen for cloud changes
  useEffect(()=>{
    if(!uid||!isConfigured)return;
    const unsub=listenToCloud(uid,key,(cloudVal)=>{
      if(cloudVal!==undefined){
        sv(cloudVal);
        try{localStorage.setItem(key,JSON.stringify(cloudVal));}catch{}
      }
    });
    return unsub;
  },[uid,key]);
  return [v,set];
}
function dIM(y,m){return new Date(y,m+1,0).getDate();}
function pad(n){return String(n).padStart(2,"0");}
function td(){const d=new Date();return{y:d.getFullYear(),m:d.getMonth(),d:d.getDate()};}

// Theme tokens
const T={
  dark:{
    bg:"#151515", surface:"#1e1e1e", card:"#1e1e1e", border:"#2c2c2c",
    borderHover:"#444444", text:"#ededed", textSub:"#9a9a9a", textMuted:"#666666",
    accent:"#a3a3a3", accentBg:"#2a2a2a", accentText:"#d4d4d4",
    green:"#52a87c", greenBg:"#182a20", red:"#c46c6c", orange:"#c48b52",
    tagBg:"rgba(255,255,255,0.05)", pill:"#262626",
    input:"#1a1a1a", shadow:"0 2px 8px rgba(0,0,0,.3)",
    glass:"rgba(21,21,21,0.85)", glassStrong:"rgba(21,21,21,0.95)",
  },
  light:{
    bg:"#f9f9f9", surface:"#ffffff", card:"#ffffff", border:"#e5e5e5",
    borderHover:"#cccccc", text:"#171717", textSub:"#666666", textMuted:"#a1a1a1",
    accent:"#525252", accentBg:"#f5f5f5", accentText:"#404040",
    green:"#448a64", greenBg:"#eefcf3", red:"#d16666", orange:"#e07a2d",
    tagBg:"rgba(0,0,0,0.03)", pill:"#f0f0f0",
    input:"#fafafa", shadow:"0 1px 3px rgba(0,0,0,.08)",
    glass:"rgba(249,249,249,0.85)", glassStrong:"rgba(249,249,249,0.95)",
  }
};

function makeCSS(t){return`
*{box-sizing:border-box;margin:0;padding:0;}
body,html{background:${t.bg};color:${t.text};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:${t.border};border-radius:4px;}
::-webkit-scrollbar-thumb:hover{background:${t.borderHover};}

/* ---- Glassmorphism Topbar ---- */
.topbar{position:sticky;top:0;z-index:100;background:${t.glass};border-bottom:1px solid ${t.border};padding:0 20px;display:flex;align-items:center;height:52px;gap:4px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);}
.crumb{background:none;border:none;cursor:pointer;color:${t.textSub};font-size:13px;padding:5px 10px;border-radius:8px;font-family:inherit;transition:all .18s ease;}
.crumb:hover{color:${t.text};background:${t.pill};}
.crumb.cur{color:${t.text};font-weight:600;cursor:default;}
.crumb.cur:hover{background:transparent;}
.sep{color:${t.textMuted};font-size:11px;user-select:none;opacity:.6;}
.page{max-width:680px;margin:0 auto;padding:32px 16px 120px;}

/* ---- FAB Row ---- */
.fab-container{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;z-index:200;height:48px;}
.fab-row{display:flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;height:100%;box-sizing:border-box;background:${t.glassStrong};border:1px solid ${t.border};border-radius:24px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:${t.shadow};transition:all .2s;}
.fab{display:flex;align-items:center;justify-content:center;height:40px;border:1px solid transparent;background:transparent;color:${t.textSub};border-radius:20px;padding:0 16px;font-size:14.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s ease;letter-spacing:.02em;box-sizing:border-box;}
.fab:hover{background:${t.pill};border-color:${t.borderHover};}
.fab-today{background:${t.accent};color:${t.bg};border-color:${t.accent};}
.fab-today:hover{background:${t.text};border-color:${t.text};color:${t.bg};transform:translateY(-1px);}
.fab-todoist{display:flex;align-items:center;justify-content:center;width:48px;height:48px;box-sizing:border-box;border-radius:50%;background:#e44332;color:#fff;font-size:26px;font-weight:300;text-decoration:none;transition:all .2s;flex-shrink:0;padding:0;box-shadow:0 4px 12px rgba(228,67,50,.3);}
.fab-todoist:hover{transform:translateY(-2px);background:#cb3b2c;box-shadow:0 6px 16px rgba(228,67,50,.4);}

/* ---- Cards ---- */
.card{background:${t.card};border:1px solid ${t.border};border-radius:12px;padding:20px;transition:border-color .2s ease;}
.card:hover{border-color:${t.borderHover};}

/* ---- Inputs ---- */
.inp{background:${t.input};border:1px solid ${t.border};color:${t.text};border-radius:8px;padding:9px 13px;font-size:13px;font-family:inherit;outline:none;transition:border .18s ease;width:100%;}
.inp:focus{border-color:${t.borderHover};}
.inp::placeholder{color:${t.textMuted};}
.textarea{background:${t.input};border:1px solid ${t.border};color:${t.text};border-radius:10px;padding:14px 16px;font-size:14px;font-family:inherit;outline:none;resize:vertical;line-height:1.8;transition:border .18s ease;width:100%;}
.textarea:focus{border-color:${t.borderHover};}
.textarea::placeholder{color:${t.textMuted};}
.sec-label{font-size:11px;font-weight:600;color:${t.textMuted};letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;display:block;}

/* ---- Buttons ---- */
.btn{background:${t.pill};border:1px solid ${t.border};color:${t.textSub};border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;transition:all .18s ease;font-family:inherit;font-weight:500;}
.btn:hover{border-color:${t.borderHover};color:${t.text};}
.btn-ghost{background:transparent;border:none;color:${t.textMuted};cursor:pointer;font-family:inherit;transition:all .18s ease;font-size:13px;padding:4px 7px;border-radius:6px;}
.btn-ghost:hover{color:${t.text};background:${t.pill};}
.btn-primary{background:${t.accent};border:none;color:${t.bg};border-radius:8px;padding:9px 20px;font-size:13px;cursor:pointer;transition:all .18s ease;font-family:inherit;font-weight:600;}
.btn-primary:hover{opacity:0.9;transform:translateY(-1px);}

/* ---- Classy Title ---- */
.grad-title{color:${t.text};}

/* ---- Keyframes ---- */
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes popIn{from{opacity:0;transform:scale(.98);}to{opacity:1;transform:scale(1);}}
@keyframes staggerIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
@keyframes bounceCheck{0%{transform:scale(1);}40%{transform:scale(1.15);}100%{transform:scale(1);}}
@keyframes slideIn{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}}

.fade-up{animation:fadeUp .25s ease both;}
.fade-in{animation:fadeIn .2s ease both;}
.pop-in{animation:popIn .2s ease both;}
.stagger-item{animation:staggerIn .3s ease both;}
.slide-in{animation:slideIn .2s ease both;}

/* ---- Shimmer progress bar ---- */
.shimmer-bar{position:relative;overflow:hidden;}
.shimmer-bar::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.08) 50%,transparent 100%);background-size:200% 100%;animation:shimmer 3s ease-in-out infinite;}

/* ---- Interactive cards (year/month grid, calendar) ---- */
.grid-card{transition:all .2s ease;cursor:pointer;min-width:0;overflow:hidden;}
.grid-card:hover{transform:translateY(-2px);border-color:${t.borderHover};}
.cal-cell{transition:all .15s ease;cursor:pointer;}
.cal-cell:hover{transform:translateY(-1px);border-color:${t.borderHover};z-index:2;background:${t.pill};}

/* ---- Habit toggle ---- */
.habit-row{transition:all .2s ease;}
.habit-row:hover{transform:translateX(2px);}
.habit-check.done{animation:bounceCheck .2s ease;}

select option{background:${t.surface};}

/* ---- Mobile Responsive ---- */
@media(max-width:640px){
  .topbar{padding:0 12px !important;height:46px;}
  .crumb{font-size:12px;padding:4px 6px;}
  .fab-container{bottom:28px;transform:translateX(-50%);height:48px;}
  .fab-row{padding:0 14px;}
  .fab{padding:0 14px;font-size:14px;}
  .fab-today{animation:none;}
  .page{padding:20px 12px 100px;}
  .card{padding:14px;border-radius:12px;}
  .grad-title{font-size:22px !important;}
  .sec-label{font-size:10px;}
  .btn{padding:6px 11px;font-size:11px;}
  .btn-primary{padding:8px 16px;font-size:12px;}
  .inp{padding:8px 11px;font-size:12px;border-radius:8px;}
  .textarea{padding:12px 13px;font-size:13px;border-radius:10px;}
  .grid-card:hover{transform:none;box-shadow:none;}
  .cal-cell:hover{transform:none;box-shadow:none;}
  .habit-row:hover{transform:none;}
  .year-grid{grid-template-columns:repeat(2,1fr) !important;gap:6px !important;}
  .month-grid{grid-template-columns:repeat(2,1fr) !important;gap:6px !important;}
  .auth-btn{padding:4px 8px !important;font-size:10px !important;}
  .auth-name{display:none !important;}
}
@media(max-width:380px){
  .year-grid{grid-template-columns:1fr !important;}
  .month-grid{grid-template-columns:1fr !important;}
  .fab{padding:8px 14px;font-size:11px;}
  .grad-title{font-size:20px !important;}
}
`;}

// ---- Canvas Board ----
function CanvasBoard({items,onChange,t}){
  const [dragging,setDragging]=useState(null);
  const [off,setOff]=useState({x:0,y:0});
  const [adding,setAdding]=useState(false);
  const [nt,setNt]=useState("");
  const [ntype,setNtype]=useState("note");
  const ref=useRef();
  const types={
    note:{bg:t.accentBg,border:t.accent,c:t.accentText},
    goal:{bg:t.greenBg,border:t.green,c:t.green},
    quote:{bg:"#1e1218",border:"#c084fc",c:"#d8b4fe"},
    idea:{bg:"#1e1810",border:"#fbbf24",c:"#fde68a"},
  };
  const mdown=(e,id)=>{
    const r=ref.current.getBoundingClientRect();
    const item=items.find(i=>i.id===id);
    setDragging(id);
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    setOff({x:cx-r.left-item.x,y:cy-r.top-item.y});
  };
  const mmove=e=>{
    if(!dragging)return;
    const r=ref.current.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    onChange(items.map(i=>i.id===dragging?{...i,x:Math.max(0,cx-r.left-off.x),y:Math.max(0,cy-r.top-off.y)}:i));
  };
  const add=()=>{
    if(!nt.trim())return;
    onChange([...items,{id:Date.now(),text:nt,type:ntype,x:Math.random()*220+40,y:Math.random()*80+30}]);
    setNt("");setAdding(false);
  };
  return(
    <div style={{marginBottom:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span className="sec-label" style={{margin:0}}>Vision board</span>
        <button className="btn" onClick={()=>setAdding(a=>!a)}>+ Card</button>
      </div>
      {adding&&(
        <div className="fade-up" style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <select className="inp" value={ntype} onChange={e=>setNtype(e.target.value)} style={{width:90}}>
            {Object.keys(types).map(tp=><option key={tp} value={tp}>{tp}</option>)}
          </select>
          <input className="inp" style={{flex:1,minWidth:160}} value={nt} onChange={e=>setNt(e.target.value)} placeholder="Type and press Enter…" autoFocus
            onKeyDown={e=>{if(e.key==="Enter")add();if(e.key==="Escape")setAdding(false);}}/>
          <button className="btn-primary" onClick={add}>Add</button>
        </div>
      )}
      <div ref={ref} onMouseMove={mmove} onMouseUp={()=>setDragging(null)} onTouchMove={mmove} onTouchEnd={()=>setDragging(null)}
        style={{position:"relative",minHeight:180,background:t.surface,border:`1px solid ${t.border}`,borderRadius:14,overflow:"hidden",cursor:dragging?"grabbing":"default",touchAction:"none"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle,${t.border} 1px,transparent 1px)`,backgroundSize:"24px 24px",opacity:.5}}/>
        {items.length===0&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,fontSize:12}}>Drag cards freely · click + Card to begin</div>}
        {items.map(item=>{
          const tp=types[item.type]||types.note;
          return(
            <div key={item.id} onMouseDown={e=>mdown(e,item.id)} onTouchStart={e=>mdown(e,item.id)}
              style={{position:"absolute",left:item.x,top:item.y,background:tp.bg,border:`1px solid ${tp.border}`,borderRadius:11,padding:"10px 12px",minWidth:120,maxWidth:200,cursor:"grab",userSelect:"none",boxShadow:`0 0 20px ${tp.border}22`}}>
              <div style={{fontSize:9,fontWeight:700,color:tp.border,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5}}>{item.type}</div>
              <div style={{fontSize:12,color:tp.c,lineHeight:1.6}}>{item.text}</div>
              <button onClick={()=>onChange(items.filter(i=>i.id!==item.id))} style={{position:"absolute",top:5,right:7,background:"none",border:"none",color:t.textMuted,cursor:"pointer",fontSize:13,lineHeight:1}}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Todo ----
const TAG_C={work:"#60a5fa",health:"#34d399",personal:"#a78bfa",finance:"#fbbf24",learning:"#f87171",family:"#f472b6"};
const PRI_C={high:{c:"#f87171",bg:"rgba(248,113,113,.12)"},medium:{c:"#fb923c",bg:"rgba(251,146,60,.12)"},low:{c:"#34d399",bg:"rgba(52,211,153,.12)"}};

function GoalItem({item,onChange,onDelete,onMoveMonth,onMoveYear,onMoveUp,onMoveDown,t}){
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(false);
  const [text,setText]=useState(item.text);
  const pc=PRI_C[item.priority]||PRI_C.medium;
  return(
    <div className="fade-up" style={{background:t.surface,border:`1px solid ${open?t.borderHover:t.border}`,borderRadius:10,marginBottom:5,transition:"all .2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px"}}>
        <input type="checkbox" checked={item.done} onChange={e=>onChange({...item,done:e.target.checked})} style={{flexShrink:0,cursor:"pointer",accentColor:t.accent,width:15,height:15}}/>
        {editing?(
          <input value={text} autoFocus onChange={e=>setText(e.target.value)}
            onBlur={()=>{onChange({...item,text});setEditing(false);}}
            onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape"){onChange({...item,text});setEditing(false);}}}
            style={{flex:1,fontSize:13,border:"none",outline:"none",background:"transparent",color:t.text,fontFamily:"inherit"}}/>
        ):(
          <span onClick={()=>setEditing(true)} style={{flex:1,fontSize:13,cursor:"text",textDecoration:item.done?"line-through":"none",color:item.done?t.textMuted:t.text,transition:"color .15s"}}>{item.text||"Untitled goal"}</span>
        )}
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          {item.tag&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:TAG_C[item.tag]+"18",color:TAG_C[item.tag],fontWeight:600}}>{item.tag}</span>}
          {item.priority&&item.priority!=="medium"&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:pc.bg,color:pc.c,fontWeight:600}}>{item.priority}</span>}
          {item.deadline&&<span style={{fontSize:10,color:t.textMuted}}>📅 {item.deadline}</span>}
          {onMoveUp&&<button className="btn-ghost" onClick={onMoveUp} style={{fontSize:11,padding:"2px 6px"}}>↑</button>}
          {onMoveDown&&<button className="btn-ghost" onClick={onMoveDown} style={{fontSize:11,padding:"2px 6px"}}>↓</button>}
          <button className="btn-ghost" onClick={()=>setOpen(o=>!o)} style={{fontSize:11,padding:"2px 6px"}}>{open?"▲":"···"}</button>
          <button className="btn-ghost" onClick={onDelete} style={{fontSize:14}}>×</button>
        </div>
      </div>
      {open&&(
        <div className="fade-in" style={{padding:"0 12px 12px",borderTop:`1px solid ${t.border}`,marginTop:4,paddingTop:12}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
            {["high","medium","low"].map(p=>(
              <button key={p} onClick={()=>onChange({...item,priority:p})} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:item.priority===p?PRI_C[p].bg:"transparent",color:PRI_C[p].c,border:`1px solid ${PRI_C[p].c}44`,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            <button onClick={()=>onChange({...item,tag:""})} style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:!item.tag?t.pill:"transparent",color:t.textSub,border:`1px solid ${t.border}`,cursor:"pointer",fontFamily:"inherit"}}>none</button>
            {TAGS.map(tg=>(
              <button key={tg} onClick={()=>onChange({...item,tag:tg})} style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:item.tag===tg?TAG_C[tg]+"22":"transparent",color:TAG_C[tg],border:`1px solid ${TAG_C[tg]}44`,cursor:"pointer",fontFamily:"inherit"}}>{tg}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <input type="date" value={item.deadline||""} onChange={e=>onChange({...item,deadline:e.target.value})} className="inp" style={{fontSize:11,padding:"4px 8px",width:"auto"}}/>
          </div>
          <div style={{display:"flex",gap:6,borderTop:`1px solid ${t.border}`,paddingTop:8,marginTop:4}}>
            {onMoveMonth&&<button className="btn" style={{fontSize:11}} onClick={()=>{onMoveMonth();setOpen(false);}}>→ Next month</button>}
            {onMoveYear&&<button className="btn" style={{fontSize:11}} onClick={()=>{onMoveYear();setOpen(false);}}>→ Next year</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function TodoList({items,onChange,title,showMove,year,month,t}){
  const [adding,setAdding]=useState(false);
  const [draft,setDraft]=useState({text:"",priority:"medium",tag:"",deadline:""});
  const inp=useRef();
  useEffect(()=>{if(adding&&inp.current)inp.current.focus();},[adding]);

  const commit=()=>{
    if(!draft.text.trim())return;
    onChange([...items,{id:Date.now(),...draft,done:false}]);
    setDraft({text:"",priority:"medium",tag:"",deadline:""});
  };
  const moveNM=item=>{
    const nm=month===11?0:month+1,ny=month===11?year+1:year;
    try{const q=JSON.parse(localStorage.getItem("lp_mq")||"[]");q.push({...item,ty:ny,tm:nm});localStorage.setItem("lp_mq",JSON.stringify(q));}catch{}
    onChange(items.filter(i=>i.id!==item.id));
  };
  const moveNY=item=>{
    try{const q=JSON.parse(localStorage.getItem("lp_mq")||"[]");q.push({...item,ty:year+1,tm:month||0});localStorage.setItem("lp_mq",JSON.stringify(q));}catch{}
    onChange(items.filter(i=>i.id!==item.id));
  };
  const moveOrder=(idx,dir)=>{
    const copy=[...items];
    const nIdx=idx+dir;
    if(nIdx<0||nIdx>=copy.length)return;
    const temp=copy[idx];
    copy[idx]=copy[nIdx];
    copy[nIdx]=temp;
    onChange(copy);
  };
  const done=items.filter(i=>i.done).length;
  return(
    <div style={{marginBottom:22,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span className="sec-label" style={{margin:0}}>{title}</span>
          {items.length>0&&<span style={{fontSize:10,color:t.textMuted,background:t.pill,padding:"2px 8px",borderRadius:20}}>{done}/{items.length}</span>}
        </div>
        <button onClick={()=>setAdding(a=>!a)} style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${t.border}`,background:adding?t.pill:t.surface,color:adding?t.text:t.textSub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,fontWeight:"300",paddingBottom:2,transition:"all .2s",boxShadow:t.shadow}}>
          {adding ? "×" : "+"}
        </button>
      </div>
      {adding&&(
        <div className="fade-up" style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:12,marginBottom:10}}>
          <input ref={inp} className="inp" value={draft.text} onChange={e=>setDraft(d=>({...d,text:e.target.value}))}
            placeholder="Goal title — press Enter to save, Tab for another"
            onKeyDown={e=>{
              if(e.key==="Enter"){commit();}
              if(e.key==="Escape"){setAdding(false);setDraft({text:"",priority:"medium",tag:"",deadline:""});}
            }} style={{marginBottom:8}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {["high","medium","low"].map(p=>(
              <button key={p} onClick={()=>setDraft(d=>({...d,priority:p}))} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:draft.priority===p?PRI_C[p].bg:"transparent",color:PRI_C[p].c,border:`1px solid ${PRI_C[p].c}44`,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>
            ))}
            <div style={{width:1,height:16,background:t.border,margin:"0 2px"}}/>
            {TAGS.map(tg=>(
              <button key={tg} onClick={()=>setDraft(d=>({...d,tag:d.tag===tg?"":tg}))} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:draft.tag===tg?TAG_C[tg]+"22":"transparent",color:draft.tag===tg?TAG_C[tg]:t.textMuted,border:`1px solid ${draft.tag===tg?TAG_C[tg]+"44":t.border}`,cursor:"pointer",fontFamily:"inherit"}}>{tg}</button>
            ))}
            <div style={{width:1,height:16,background:t.border,margin:"0 2px"}}/>
            <input type="date" value={draft.deadline} onChange={e=>setDraft(d=>({...d,deadline:e.target.value}))} className="inp" style={{fontSize:11,padding:"3px 8px",width:"auto"}}/>
            <button className="btn-primary" onClick={commit} style={{marginLeft:"auto",padding:"5px 14px",fontSize:12}}>Save</button>
          </div>
        </div>
      )}
      {items.map((item,idx)=>(
        <GoalItem key={item.id} item={item} t={t}
          onChange={u=>onChange(items.map(i=>i.id===item.id?u:i))}
          onDelete={()=>onChange(items.filter(i=>i.id!==item.id))}
          onMoveMonth={showMove?()=>moveNM(item):null}
          onMoveYear={showMove?()=>moveNY(item):null}
          onMoveUp={idx>0?()=>moveOrder(idx,-1):null}
          onMoveDown={idx<items.length-1?()=>moveOrder(idx,1):null}/>
      ))}
      {items.length===0&&!adding&&<div style={{fontSize:12,color:t.textMuted,padding:"6px 0"}}>Nothing here yet.</div>}
    </div>
  );
}

// ---- Habit Row ----
function HabitWidget({year,month,data,allHabits,t}){
  const days=dIM(year,month);
  if(!allHabits?.length)return<div style={{fontSize:12,color:t.textMuted}}>No habits yet.</div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {allHabits.map(h=>{
        const comp=Array.from({length:days},(_,i)=>!!(data[`${year}-${pad(month+1)}-${pad(i+1)}`]?.habits?.[h]));
        const count=comp.filter(Boolean).length;
        const pct=Math.round((count/days)*100);
        let streak=0;for(let i=comp.length-1;i>=0;i--){if(comp[i])streak++;else break;}
        return(
          <div key={h} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:t.text,minWidth:90,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{h}</span>
            <div style={{display:"flex",gap:2,flex:1,overflow:"hidden"}}>
              {comp.map((d,i)=>(
                <div key={i} style={{flex:1,height:20,minWidth:6,maxWidth:18,borderRadius:4,background:d?t.accent:t.pill,border:`1px solid ${d?t.accent+"88":t.border}`,transition:"background .2s",flexShrink:0}}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{width:36,height:4,borderRadius:2,background:t.pill}}>
                <div style={{height:"100%",width:`${pct}%`,background:t.accent,borderRadius:2,transition:"width .4s ease"}}/>
              </div>
              <span style={{fontSize:10,color:t.textMuted,minWidth:24,textAlign:"right"}}>{pct}%</span>
              {streak>0&&<span style={{fontSize:10,color:t.accent,background:t.accentBg,padding:"1px 6px",borderRadius:20,fontWeight:600}}>🔥{streak}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Books ----
function MediaEntry({entry,onChange,onDelete,t}){
  const [open,setOpen]=useState(false);
  const [et,setEt]=useState(false);
  const [title,setTitle]=useState(entry.title);
  const mc={book:"#a78bfa",article:"#60a5fa",video:"#f87171",podcast:"#34d399",other:"#fbbf24"};
  const c=mc[entry.type]||mc.other;
  return(
    <div className="pop-in" style={{border:`1px solid ${open?t.borderHover:t.border}`,borderRadius:10,marginBottom:5,background:t.surface,overflow:"visible",transition:"border .2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:c+"18",color:c,fontWeight:600,flexShrink:0}}>{entry.type}</span>
        {et?(
          <input value={title} autoFocus onChange={e=>setTitle(e.target.value)}
            onBlur={()=>{onChange({...entry,title});setEt(false);}}
            onKeyDown={e=>{if(e.key==="Enter"){onChange({...entry,title});setEt(false);}}}
            onClick={e=>e.stopPropagation()}
            style={{flex:1,fontSize:13,border:"none",outline:"none",background:"transparent",color:t.text,fontFamily:"inherit"}}/>
        ):(
          <span onDoubleClick={e=>{e.stopPropagation();setEt(true);}} style={{flex:1,fontSize:13,color:t.text}}>{entry.title||"Untitled"}</span>
        )}
        <div style={{display:"flex",gap:1}}>
          {[1,2,3,4,5].map(s=>(
            <span key={s} onClick={e=>{e.stopPropagation();onChange({...entry,rating:s});}} style={{fontSize:13,cursor:"pointer",color:s<=(entry.rating||0)?"#fbbf24":t.textMuted,transition:"color .1s"}}>★</span>
          ))}
        </div>
        <span style={{fontSize:10,color:t.textMuted}}>{open?"▲":"▼"}</span>
        <button onClick={e=>{e.stopPropagation();onDelete();}} className="btn-ghost">×</button>
      </div>
      {open&&(
        <div className="fade-up" style={{padding:"0 12px 12px",borderTop:`1px solid ${t.border}`}}>
          <div style={{display:"flex",gap:8,margin:"10px 0",flexWrap:"wrap"}}>
            <select className="inp" value={entry.type} onChange={e=>onChange({...entry,type:e.target.value})} style={{width:100,fontSize:12}}>
              {MEDIA_TYPES.map(tp=><option key={tp} value={tp}>{tp}</option>)}
            </select>
            <input className="inp" value={entry.author||""} onChange={e=>onChange({...entry,author:e.target.value})} placeholder="Author / source" style={{flex:1,minWidth:110,fontSize:12}}/>
            <input className="inp" value={entry.url||""} onChange={e=>onChange({...entry,url:e.target.value})} placeholder="URL" style={{flex:1,minWidth:110,fontSize:12}}/>
          </div>
          <textarea className="textarea" value={entry.notes||""} onChange={e=>onChange({...entry,notes:e.target.value})} placeholder="Notes, highlights, key takeaways…" style={{minHeight:80,fontSize:13}}/>
        </div>
      )}
    </div>
  );
}
function MediaSection({entries,onChange,t}){
  return(
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span className="sec-label" style={{margin:0}}>Books &amp; links</span>
        <button className="btn" onClick={()=>onChange([...entries,{id:Date.now(),title:"",type:"book",author:"",url:"",notes:"",rating:0}])}>+ Add</button>
      </div>
      {entries.length===0&&<div style={{fontSize:12,color:t.textMuted}}>Nothing logged yet.</div>}
      {entries.map(e=><MediaEntry key={e.id} entry={e} t={t} onChange={u=>onChange(entries.map(x=>x.id===e.id?u:x))} onDelete={()=>onChange(entries.filter(x=>x.id!==e.id))}/>)}
    </div>
  );
}

// ---- Journal Bot ----
function JournalChat({dayKey, dd, setDD, dayOneUrl, t, geminiKey, setGeminiKey}) {
  const [msgs, setMsgs] = useState(() => dd.chatMsgs || [{role:"model", text:"Hey! 👋 How's your day going? Tell me anything — I'm here like a friend."}]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);
  const [keyInp, setKeyInp] = useState("");
  const chatScroll = useRef();

  useEffect(() => {
    if(chatScroll.current) {
      chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
    }
  }, [msgs, loading]);

  // Persist messages to data
  useEffect(() => {
    if(msgs.length > 1 || (msgs.length === 1 && msgs[0].role === "user")) {
      setDD({...dd, chatMsgs: msgs});
    }
  }, [msgs]);

  const callGemini = async (contents, sysInstruction) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sysInstruction }] },
        contents
      })
    });
    if(!res.ok) {
      const errBody = await res.text();
      throw new Error(`${res.status}: ${errBody}`);
    }
    const d = await res.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here. Keep going.";
  };

  const send = async () => {
    if(!inp.trim() || loading) return;
    const um = inp.trim(); setInp("");
    const newMsgs = [...msgs, {role:"user", text: um}];
    setMsgs(newMsgs); setLoading(true);
    try {
      const contents = newMsgs.map(m => ({role: m.role === "model" ? "model" : "user", parts:[{text: m.text}]}));
      const reply = await callGemini(contents, "You are a close friend who genuinely cares. IMPORTANT: Always reply in Hinglish (mix of Hindi and English, written in English script) — match the exact same language style the user is using. If they write in Hinglish, you reply in Hinglish. If they write in pure English, reply in English. CRITICAL: Always use 'tum' and 'tumhe' when addressing the user. NEVER use 'tu' or 'tujhe' — that sounds too rough. Your job: 1) React naturally to what they said (1 sentence). 2) Ask a cross-question or follow-up that digs deeper — like 'ye kyun hua?' or 'tumhe kaisa laga?' or 'ab kya karoge?'. 3) Occasionally share a tiny opinion like a real friend would. Keep it to 2-3 sentences total. Be casual, not formal. Never use markdown or bullet points.");
      setMsgs(prev => [...prev, {role:"model", text: reply}]);
    } catch(e) {
      console.error(e);
      const errMsg = e.message?.includes("400") ? "API key may be invalid. Try disconnecting and re-pasting." : e.message?.includes("404") ? "Model not found. Updating..." : `Connection issue: ${e.message?.slice(0,100)}`;
      setMsgs(prev => [...prev, {role:"model", text: errMsg}]);
    }
    setLoading(false);
  };

  const generateSummary = async () => {
    if(msgs.length < 3) return;
    setLoading(true); setSummary("");
    try {
      const transcript = msgs.map(m => `${m.role === "user" ? "Me" : "Friend"}: ${m.text}`).join("\n");
      const contents = [{role:"user", parts:[{text: `Below is a full conversation I had with a friend about my day. Read the ENTIRE conversation. Create a concise journal summary capturing ONLY the facts and feelings I explicitly narrated. DO NOT add fictional stories, fabricate events, or inject your own details. Stick STRICTLY to what was discussed. Write it as a coherent narrative in first-person. Write in the EXACT SAME language I used.\n\n---\n${transcript}`}]}];
      const result = await callGemini(contents, "You are a journal summarizer. Extract ONLY information provided in the conversation. NEVER make up stories or fabricate details. Write a concise, coherent first-person narrative summary. Speak in the exact same language the user used (e.g., Hinglish).");
      setSummary(result);
    } catch(e) {
      console.error(e);
      setSummary("Could not generate summary. Please try again.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  if(!geminiKey) {
    return (
      <div className="card" style={{marginBottom:16}}>
        <span className="sec-label" style={{margin:0, marginBottom:8}}>Journal Companion (AI)</span>
        <div style={{fontSize:12, color:t.textMuted, marginBottom:10}}>Paste a free Google Gemini API key to enable your AI journal buddy. Get one at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{color:t.accent}}>aistudio.google.com</a></div>
        <div style={{display:"flex", gap:6}}>
          <input className="inp" value={keyInp} onChange={e=>setKeyInp(e.target.value)} type="password" placeholder="Gemini API key…" />
          <button className="btn-primary" style={{padding:"8px 14px", flexShrink:0}} onClick={()=>{if(keyInp.trim())setGeminiKey(keyInp.trim());}}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{marginBottom:16, padding:0, overflow:"hidden"}}>
        <div style={{padding:"14px 16px 0", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span className="sec-label" style={{margin:0}}>Journal</span>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <span style={{fontSize:11, color:t.textMuted}}>{msgs.filter(m=>m.role==="user").length} messages</span>
            <button className="btn-ghost" onClick={()=>{if(window.confirm("Clear this chat?")) setMsgs([{role:"model", text:"Hey! 👋 How's your day going? Tell me anything — I'm here like a friend."}])}} style={{fontSize:10, padding:"2px 6px"}}>Clear</button>
            <button className="btn-ghost" onClick={()=>setGeminiKey("")} style={{fontSize:10, padding:"2px 6px"}}>Disconnect</button>
          </div>
        </div>
        <div ref={chatScroll} style={{padding:"10px 16px 14px", maxHeight:380, overflowY:"auto", display:"flex", flexDirection:"column", gap:10}}>
          {msgs.map((m, i) => (
            <div key={i} style={{display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{
                maxWidth:"82%", padding:"10px 14px", borderRadius:16, fontSize:13, lineHeight:1.7,
                background:m.role==="user" ? t.accent : t.surface,
                color:m.role==="user" ? "#fff" : t.text,
                border:m.role==="user" ? "none" : `1px solid ${t.border}`,
                [m.role==="user" ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 4
              }}>{m.text}</div>
            </div>
          ))}
          {loading && <div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:t.surface,padding:"10px 16px",borderRadius:16,borderBottomLeftRadius:4,fontSize:13,color:t.textMuted,border:`1px solid ${t.border}`}}>···</div></div>}
        </div>
        <div style={{display:"flex", gap:8, padding:"10px 14px", borderTop:`1px solid ${t.border}`, background:t.card}}>
          <input className="inp" value={inp} onChange={e=>setInp(e.target.value)} placeholder="Talk to me…" onKeyDown={e=>{if(e.key==="Enter")send();}} style={{border:"none", background:"transparent"}} />
          <button className="btn-primary" onClick={send} disabled={loading} style={{padding:"8px 16px", flexShrink:0, borderRadius:20}}>↑</button>
        </div>
      </div>

      {msgs.filter(m=>m.role==="user").length >= 2 && (
        <button className="btn" onClick={generateSummary} disabled={loading} style={{width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", marginBottom:16, fontSize:13}}>
          {loading ? "Generating…" : "✨ Generate Journal Summary"}
        </button>
      )}

      {summary && (
        <div className="card fade-up" style={{marginBottom:16}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <span className="sec-label" style={{margin:0}}>Generated Summary</span>
            <div style={{display:"flex", gap:6}}>
              <button className="btn-primary" onClick={()=>{setDD({...dd, keptJournal:summary});setSummary("");}} style={{padding:"5px 12px", fontSize:11}}>Keep</button>
              <button className="btn" onClick={copyToClipboard} style={{padding:"5px 12px", fontSize:11}}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div style={{fontSize:13, lineHeight:1.8, color:t.text, whiteSpace:"pre-wrap"}}>{summary}</div>
        </div>
      )}

      {dd.keptJournal && !summary && (
        <div className="card fade-in" style={{marginBottom:16}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <span className="sec-label" style={{margin:0}}>My Journal Entry</span>
            <button className="btn-ghost" onClick={()=>{if(window.confirm("Delete kept journal?")) setDD({...dd, keptJournal:""})}} style={{padding:"5px 8px", fontSize:11}}>Remove</button>
          </div>
          <div style={{fontSize:13, lineHeight:1.8, color:t.text, whiteSpace:"pre-wrap"}}>{dd.keptJournal}</div>
        </div>
      )}

      <div style={{display:"flex", justifyContent:"center"}}>
        <button onClick={(e)=>{e.preventDefault();window.location.assign(dayOneUrl);}} style={{
          padding:"10px 28px", borderRadius:8, border:"none",
          background:"#2563eb", color:"#fff", fontSize:13, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit", marginBottom:16, transition:"all .2s"
        }}>Day One</button>
      </div>
    </>
  );
}

const Footer = ({t}) => (
  <div style={{textAlign:"center",paddingTop:40,color:t.textMuted,fontFamily:"inherit",fontSize:12,opacity:0.7}}>
    Built and maintained by Ayush Singh Kaushik
  </div>
);

function SettingsModal({data, onClose, t}) {
  const bytes = new Blob([JSON.stringify(data)]).size;
  const sizeStr = bytes < 1024 ? `${bytes} B` : bytes < 1024*1024 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/(1024*1024)).toFixed(2)} MB`;
  const maxBytes = 1048576; // 1MB DB limit per doc
  const rawPct = (bytes / maxBytes) * 100;
  const pct = Math.min(rawPct, 100).toFixed(1);
  const color = rawPct > 90 ? t.red : rawPct > 75 ? "#f59e0b" : t.green;
  
  return (
    <div className="fade-in" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(5px)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div className="card pop-in" style={{width:"100%",maxWidth:400,position:"relative",cursor:"default"}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:t.textMuted,cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
        <h2 style={{marginTop:0,marginBottom:24,fontSize:20,fontWeight:600}}>Settings</h2>
        
        <div style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span className="sec-label" style={{margin:0}}>Storage space (DB)</span>
          <span style={{fontSize:13,color:t.text,fontWeight:500}}>{sizeStr} / 1 MB</span>
        </div>
        
        <div className="shimmer-bar" style={{height:8,borderRadius:4,background:t.pill,marginBottom:12}}>
          <div style={{height:"100%",width:`${Math.max(pct,1)}%`,background:color,borderRadius:4,transition:"width .4s"}}/>
        </div>
        <div style={{fontSize:12,color:t.textMuted,lineHeight:1.5}}>
          You are using <strong>{pct}%</strong> of your free cloud database tier. Old chats are automatically deleted after 3 days to preserve space. Deleting an old year card will also free up space.
        </div>

        <div style={{marginTop:24}}>
          <span className="sec-label" style={{margin:0}}>Keyboard Shortcuts</span>
          <div style={{marginTop:8, display:"grid", gap:8}}>
            {[
              {k:"H", d:"Home (My Life)"},
              {k:"T", d:"Today"},
              {k:"M", d:"This Month"},
              {k:"A", d:"Add Task (Todoist)"},
              {k:"D", d:"Toggle Theme"}
            ].map(s=>(
              <div key={s.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}>
                <span style={{color:t.text}}>{s.d}</span>
                <span style={{background:t.surface,padding:"2px 8px",borderRadius:4,border:`1px solid ${t.border}`,fontFamily:"monospace",fontSize:12,color:t.textMuted}}>{s.k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Pages ----
function LifePage({data,setData,onNav,t}){
  const [years,setYears]=useLS(YK,[2025,2026,2027,2028]);
  const [addY,setAddY]=useState("");
  return(
    <div className="page fade-up">
      <div style={{marginBottom:32}}>
        <h1 className="grad-title" style={{fontSize:30,fontWeight:700,marginBottom:6,letterSpacing:"-.03em"}}>My Life</h1>
        <p style={{fontSize:13,color:t.textSub}}>Vision, long-term goals, and your years ahead.</p>
      </div>
      <CanvasBoard items={data.canvas||[]} onChange={v=>setData({...data,canvas:v})} t={t}/>
      <TodoList title="Life goals" items={data.lifeGoals||[]} onChange={v=>setData({...data,lifeGoals:v})} t={t}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span className="sec-label" style={{margin:0}}>Years</span>
        <div style={{display:"flex",gap:6}}>
          <input className="inp" value={addY} onChange={e=>setAddY(e.target.value)} placeholder="2031" style={{width:72,fontSize:12}} onKeyDown={e=>{if(e.key==="Enter"&&addY.trim()){setYears([...years,parseInt(addY)].sort());setAddY("");}}}/>
          <button className="btn" onClick={()=>{if(addY.trim()){setYears([...years,parseInt(addY)].sort());setAddY("");}}}> + Year</button>
        </div>
      </div>
      <div className="year-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(135px,1fr))",gap:8}}>
        {years.map((y,yi)=>{
          const goals=data.years?.[y]?.goals||[];
          const done=goals.filter(g=>g.done).length;
          const pct=goals.length?Math.round((done/goals.length)*100):null;
          const cur=td().y===y;
          return(
            <div key={y} className="stagger-item" style={{position:"relative",animationDelay:`${yi*60}ms`}}>
              <button className="grid-card" onClick={()=>onNav("year",{year:y})} style={{width:"100%",background:cur?t.accentBg:t.card,border:`1px solid ${cur?t.accent:t.border}`,borderRadius:14,padding:"16px 16px",cursor:"pointer",textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:19,fontWeight:700,color:cur?t.accentText:t.text,letterSpacing:"-.02em"}}>{y}</span>
                  {cur&&<span style={{width:6,height:6,borderRadius:"50%",background:t.accent,display:"inline-block",boxShadow:`0 0 8px ${t.accent}`}}/>}
                </div>
                {pct!==null?(
                  <>
                    <div style={{fontSize:11,color:t.textMuted,marginBottom:6}}>{done}/{goals.length} · {pct}%</div>
                    <div className="shimmer-bar" style={{height:3,borderRadius:2,background:t.pill}}><div style={{height:"100%",width:`${pct}%`,background:t.accent,borderRadius:2,transition:"width .4s"}}/></div>
                  </>
                ):<div style={{fontSize:11,color:t.textMuted}}>No goals yet</div>}
              </button>
              <button onClick={()=>{
                if(window.confirm(`Are you sure you want to delete ${y} and ALL its data?`)){
                  setYears(years.filter(x=>x!==y));
                  const newData = {...data};
                  if(newData.years && newData.years[y]) delete newData.years[y];
                  Object.keys(newData).forEach(k => { if(k.startsWith(`${y}-`)) delete newData[k]; });
                  setData(newData);
                }
              }} className="btn-ghost" style={{position:"absolute",top:8,right:8,fontSize:12,color:t.textMuted}}>×</button>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:28}}>
        <span className="sec-label">Life notes</span>
        <textarea className="textarea" value={data.lifeVision||""} onChange={e=>setData({...data,lifeVision:e.target.value})} placeholder="Your values, legacy, and long-term path…" style={{minHeight:110}}/>
      </div>
      <Footer t={t}/>
    </div>
  );
}

function YearPage({year,data,setData,onNav,t}){
  const yData=data.years?.[year]||{};
  const setY=v=>setData({...data,years:{...(data.years||{}),[year]:v}});
  const cur=td().y===year;
  return(
    <div className="page fade-up">
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <h1 className="grad-title" style={{fontSize:30,fontWeight:700,letterSpacing:"-.03em"}}>{year}</h1>
          {cur&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:t.accentBg,color:t.accentText,border:`1px solid ${t.accent}44`}}>Current year</span>}
        </div>
        <p style={{fontSize:13,color:t.textSub}}>Goals and monthly overview.</p>
      </div>
      <TodoList title="Yearly goals" items={yData.goals||[]} onChange={v=>setY({...yData,goals:v})} showMove year={year} month={0} t={t}/>
      <span className="sec-label">Months</span>
      <div className="month-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
        {MONTHS.map((m,mi)=>{
          const mData=yData.months?.[mi]||{};
          const goals=mData.goals||[];
          const done=goals.filter(g=>g.done).length;
          const pct=goals.length?Math.round((done/goals.length)*100):null;
          const isCM=td().y===year&&td().m===mi;
          return(
            <button key={mi} className="grid-card stagger-item" onClick={()=>onNav("month",{year,month:mi})} style={{animationDelay:`${mi*40}ms`,background:isCM?t.accentBg:t.card,border:`1px solid ${isCM?t.accent:t.border}`,borderRadius:14,padding:14,cursor:"pointer",textAlign:"left",width:"100%"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{fontSize:14,fontWeight:600,color:isCM?t.accentText:t.text}}>{m}</span>
                {isCM&&<span style={{width:5,height:5,borderRadius:"50%",background:t.accent,display:"inline-block",boxShadow:`0 0 6px ${t.accent}`}}/>}
              </div>
              {goals.slice(0,3).map((g,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,width:"100%",overflow:"hidden"}}>
                  <span style={{width:4,height:4,borderRadius:"50%",background:g.done?t.accent:t.textMuted,flexShrink:0,transition:"background .2s"}}/>
                  <span style={{flex:1,minWidth:0,fontSize:11,color:g.done?t.textMuted:t.textSub,textDecoration:g.done?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.text||"…"}</span>
                </div>
              ))}
              {goals.length>3&&<div style={{fontSize:10,color:t.textMuted,marginTop:2}}>+{goals.length-3} more</div>}
              {pct!==null&&<div className="shimmer-bar" style={{marginTop:8,height:2,borderRadius:2,background:t.pill}}><div style={{height:"100%",width:`${pct}%`,background:isCM?t.accent:t.textMuted,borderRadius:2,transition:"width .4s"}}/></div>}
              {goals.length===0&&<div style={{fontSize:11,color:t.textMuted,marginTop:4}}>No goals yet</div>}
            </button>
          );
        })}
      </div>
      <div style={{marginTop:28}}>
        <span className="sec-label">Year notes</span>
        <textarea className="textarea" value={yData.notes||""} onChange={e=>setY({...yData,notes:e.target.value})} placeholder="Themes, lessons, reflections for this year…" style={{minHeight:90}}/>
      </div>
      <Footer t={t}/>
    </div>
  );
}

function MonthPage({year,month,data,setData,onNav,globalHabits,setGlobalHabits,t}){
  const yData=data.years?.[year]||{};
  const mData=yData.months?.[month]||{};
  const setM=v=>setData({...data,years:{...(data.years||{}),[year]:{...yData,months:{...(yData.months||{}),[month]:v}}}});
  const mHabits=mData.monthHabits||[];
  const setMH=v=>setM({...mData,monthHabits:v});
  const allHabits=[...new Set([...globalHabits,...mHabits])];
  const days=dIM(year,month);
  const t2=td();
  const [newH,setNewH]=useState("");
  const [hScope,setHScope]=useState("month");

  return(
    <div className="page fade-up">
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <h1 className="grad-title" style={{fontSize:30,fontWeight:700,letterSpacing:"-.03em"}}>{MONTHS[month]} {year}</h1>
          {t2.y===year&&t2.m===month&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:t.accentBg,color:t.accentText,border:`1px solid ${t.accent}44`}}>This month</span>}
        </div>
        <p style={{fontSize:13,color:t.textSub}}>Goals, habits, daily log, and reading.</p>
      </div>
      <TodoList title="Monthly goals" items={mData.goals||[]} onChange={v=>setM({...mData,goals:v})} showMove year={year} month={month} t={t}/>

      <div className="card" style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span className="sec-label" style={{margin:0}}>Habit tracker</span>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <select className="inp" value={hScope} onChange={e=>setHScope(e.target.value)} style={{width:110,fontSize:11,padding:"4px 8px"}}>
              <option value="month">This month</option>
              <option value="global">All months</option>
            </select>
            <input className="inp" value={newH} onChange={e=>setNewH(e.target.value)} placeholder="New habit…" style={{width:130,fontSize:12}}
              onKeyDown={e=>{if(e.key==="Enter"&&newH.trim()){if(hScope==="global")setGlobalHabits([...globalHabits,newH.trim()]);else setMH([...mHabits,newH.trim()]);setNewH("");}}}/>
            <button className="btn" onClick={()=>{if(newH.trim()){if(hScope==="global")setGlobalHabits([...globalHabits,newH.trim()]);else setMH([...mHabits,newH.trim()]);setNewH("");}}}>+</button>
          </div>
        </div>
        {allHabits.length>0&&(
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
            {allHabits.map(h=>{
              const isG=globalHabits.includes(h);
              return(
                <span key={h} style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:isG?t.accentBg:t.pill,color:isG?t.accentText:t.textSub,border:`1px solid ${isG?t.accent+"44":t.border}`,display:"flex",alignItems:"center",gap:4}}>
                  {h}
                  <button onClick={()=>{if(isG)setGlobalHabits(globalHabits.filter(x=>x!==h));else setMH(mHabits.filter(x=>x!==h));}} style={{background:"none",border:"none",cursor:"pointer",color:t.textMuted,fontSize:12,lineHeight:1,padding:0}}>×</button>
                </span>
              );
            })}
          </div>
        )}
        <HabitWidget year={year} month={month} data={data} allHabits={allHabits} t={t}/>
      </div>

      <span className="sec-label">Days</span>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:24}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:10,color:t.textMuted,paddingBottom:4,fontWeight:500}}>{d}</div>
        ))}
        {Array.from({length:new Date(year,month,1).getDay()},(_,i)=><div key={"e"+i}/>)}
        {Array.from({length:days},(_,i)=>{
          const d=i+1;
          const key=`${year}-${pad(month+1)}-${pad(d)}`;
          const dd=data[key]||{};
          const hDone=allHabits.filter(h=>dd.habits?.[h]).length;
          const pct=allHabits.length?Math.round((hDone/allHabits.length)*100):0;
          const hasJ=!!(dd.journal||"").trim();
          const isToday=t2.y===year&&t2.m===month&&t2.d===d;
          return(
            <button key={d} className="cal-cell" onClick={()=>onNav("day",{year,month,day:d})} style={{
              background:isToday?t.accentBg:t.surface,
              border:`1px solid ${isToday?t.accent:t.border}`,
              borderRadius:10,padding:"8px 3px 6px",textAlign:"center",
              position:"relative",
            }}>
              <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?t.accentText:t.textSub,marginBottom:3}}>{d}</div>
              <div className={pct>0?"shimmer-bar":""} style={{height:3,borderRadius:2,background:t.pill,margin:"0 4px",overflow:"hidden"}}>
                {pct>0&&<div style={{height:"100%",width:`${pct}%`,background:t.accent,borderRadius:2,transition:"width .4s"}}/>}
              </div>
              {hasJ&&<div style={{position:"absolute",top:4,right:4,width:5,height:5,borderRadius:"50%",background:"#a78bfa",boxShadow:"0 0 6px #a78bfa88"}}/>}
            </button>
          );
        })}
      </div>
      <MediaSection entries={mData.media||[]} onChange={v=>setM({...mData,media:v})} t={t}/>
      <div style={{marginTop:8}}>
        <span className="sec-label">Month notes</span>
        <textarea className="textarea" value={mData.notes||""} onChange={e=>setM({...mData,notes:e.target.value})} placeholder="Reflections and intentions for this month…" style={{minHeight:80}}/>
      </div>
      <Footer t={t}/>
    </div>
  );
}

// ---- Todoist Integration ----
function TodoistWidget({token, setToken, t}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadTasks = useCallback(async () => {
    if(!token) return;
    setLoading(true);
    setErrorMsg("");
    
    if (token.length !== 40) {
      setErrorMsg("Invalid token. Todoist API tokens are exactly 40 characters long. Please re-copy it from Settings -> Developer.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("https://api.todoist.com/rest/v2/tasks?filter=today", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
         setTasks(await res.json());
      } else {
         const txt = await res.text();
         if(res.status === 401 || res.status === 403) {
            setErrorMsg("API Token rejected securely by Todoist. Please disconnect and paste a valid token.");
            setToken("");
         } else {
            setErrorMsg(`Todoist Error ${res.status}: ${txt}`);
         }
      }
    } catch(err) { 
      setErrorMsg("Network Error. Note: Todoist blocks connections if the token is invalid (CORS drop). Try disconnecting and updating your token."); 
      console.error(err); 
    }
    setLoading(false);
  }, [token, setToken]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const closeTask = async (id) => {
    setTasks(ts => ts.map(x => x.id === id ? {...x, checking: true} : x));
    try {
      const res = await fetch(`https://api.todoist.com/rest/v2/tasks/${id}/close`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) setTasks(ts => ts.filter(x => x.id !== id));
      else setTasks(ts => ts.map(x => x.id === id ? {...x, checking: false} : x));
    }catch(err){ setTasks(ts => ts.map(x => x.id === id ? {...x, checking: false} : x)); }
  };

  if(!token) {
    return (
      <div className="card" style={{marginBottom:16, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
        <div style={{flex:1, minWidth:200}}>
          <span className="sec-label" style={{margin:0}}>Todoist Sync</span>
          <div style={{fontSize:12, color:t.textMuted, marginTop:4}}>Connect a Developer API Token to view and complete today's tasks here.</div>
          {errorMsg && <div style={{fontSize:11, color:t.red, marginTop:4}}>{errorMsg}</div>}
        </div>
        <div style={{display:"flex", gap:6}}>
          <input className="inp" value={inputToken} onChange={e=>setInputToken(e.target.value)} type="password" placeholder="API Token..." style={{width:140}}/>
          <button className="btn-primary" style={{padding:"8px 14px", flexShrink:0}} onClick={()=>{if(inputToken.trim())setToken(inputToken.trim());}}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span className="sec-label" style={{margin:0}}>Today's Tasks (Todoist)</span>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <button className="btn-ghost" onClick={()=>setToken("")} style={{fontSize:11, padding:"2px 6px"}}>Disconnect</button>
          <button className="btn-ghost" onClick={loadTasks} style={{fontSize:15, padding:"2px 8px"}}>↻</button>
        </div>
      </div>
      {errorMsg && <div style={{fontSize:12,color:t.red,marginBottom:8}}>{errorMsg}</div>}
      {loading && <div className="shimmer-bar" style={{height:3,borderRadius:2,background:t.pill,marginBottom:8}}><div style={{height:"100%",width:"30%",background:t.accent,borderRadius:2}}/></div>}
      {!loading && !errorMsg && tasks.length===0 && <div style={{fontSize:12,color:t.textMuted}}>All clear! No tasks due today.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {tasks.map(task => {
           const done = task.checking;
           return (
             <div key={task.id} className="habit-row" style={{
               display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,cursor:"pointer",
               background:done ? t.accentBg : t.surface, border:`1px solid ${done ? t.accent+"66" : t.border}`
             }}>
               <div onClick={()=>closeTask(task.id)} className={`habit-check${done?" done":""}`} style={{
                 width:18,height:18,borderRadius:"50%",
                 border:done?"none":`1.5px solid ${t.borderHover}`,
                 background:done?`linear-gradient(135deg, ${t.accent}, #a78bfa)`:"transparent",
                 display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .18s",
                 boxShadow:done?`0 0 10px ${t.accent}44`:"none"
               }}>
                 {done&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
               </div>
               <span style={{fontSize:13,color:done ? t.accentText : t.text,flex:1,transition:"color .18s",textDecoration:done?"line-through":"none"}}>{task.content}</span>
             </div>
           );
        })}
      </div>
    </div>
  );
}

function DayPage({year,month,day,data,setData,globalHabits,todoistToken,setTodoistToken,geminiKey,setGeminiKey,t}){
  const key=`${year}-${pad(month+1)}-${pad(day)}`;
  const dd=data[key]||{};
  const setDD=v=>setData({...data,[key]:v});
  const yData=data.years?.[year]||{};
  const mData=yData.months?.[month]||{};
  const allHabits=[...new Set([...globalHabits,...(mData.monthHabits||[])])];
  const doneC=allHabits.filter(h=>dd.habits?.[h]).length;
  const pct=allHabits.length?Math.round((doneC/allHabits.length)*100):0;
  const dayOneUrl=`dayone://moment?date=${year}-${pad(month+1)}-${pad(day)}`;

  return(
    <div className="page fade-up">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 className="grad-title" style={{fontSize:30,fontWeight:700,letterSpacing:"-.03em",marginBottom:2}}>{day} {MS[month]} {year}</h1>
          <p style={{fontSize:13,color:t.textSub}}>{DAYS_SHORT[new Date(year,month,day).getDay()]}</p>
        </div>
      </div>

      <TodoistWidget token={todoistToken} setToken={setTodoistToken} t={t} />

      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span className="sec-label" style={{margin:0}}>Habits</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:t.textMuted}}>{doneC}/{allHabits.length}</span>
            <div className="shimmer-bar" style={{width:50,height:4,borderRadius:2,background:t.pill}}>
              <div style={{height:"100%",width:`${pct}%`,background:t.accent,borderRadius:2,transition:"width .4s"}}/>
            </div>
          </div>
        </div>
        {allHabits.length===0&&<div style={{fontSize:12,color:t.textMuted}}>Add habits from the month page.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {allHabits.map(h=>{
            const done=!!(dd.habits?.[h]);
            const isMO=(mData.monthHabits||[]).includes(h)&&!globalHabits.includes(h);
            return(
              <div key={h} className="habit-row" onClick={()=>setDD({...dd,habits:{...(dd.habits||{}),[h]:!done}})} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,cursor:"pointer",
                background:done?t.accentBg:t.surface,border:`1px solid ${done?t.accent+"66":t.border}`,
              }}>
                <div className={`habit-check${done?" done":""}`} style={{width:18,height:18,borderRadius:"50%",border:done?"none":`1.5px solid ${t.borderHover}`,background:done?`linear-gradient(135deg, ${t.accent}, #a78bfa)`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .18s",boxShadow:done?`0 0 10px ${t.accent}44`:"none"}}>
                  {done&&<span style={{color:"#fff",fontSize:10,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontSize:13,color:done?t.accentText:t.text,flex:1,transition:"color .18s"}}>{h}</span>
                {isMO&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(251,191,36,.1)",color:"#fbbf24",border:"1px solid rgba(251,191,36,.2)"}}>{MS[month]}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <JournalChat dayKey={key} dd={dd} setDD={setDD} dayOneUrl={dayOneUrl} t={t} geminiKey={geminiKey} setGeminiKey={setGeminiKey} />
      <Footer t={t}/>
    </div>
  );
}

// ---- App ----
export default function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  useEffect(()=>{
    const unsub=onAuth((u)=>{setUser(u);setAuthLoading(false);});
    return unsub;
  },[]);
  const uid=user?.uid||null;
  const [data,setData]=useLS(SK,{},uid);
  const [globalHabits,setGlobalHabits]=useLS(GHK,[],uid);
  const [todoistToken,setTodoistToken]=useLS("lp_v4_todoist","",uid);
  const [geminiKey,setGeminiKey]=useLS("lp_v4_gemini","",uid);
  const [dark,setDark]=useLS(TMK,true,uid);
  const [view,setView]=useState({page:"life"});
  const [showSettings, setShowSettings] = useState(false);

  const cleanupRun = useRef(false);
  useEffect(() => {
    if(cleanupRun.current || !data || Object.keys(data).length === 0) return;
    cleanupRun.current = true;
    let changed = false;
    const newData = {...data};
    const today = new Date();
    today.setHours(0,0,0,0);
    Object.keys(newData).forEach(key => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && newData[key].chatMsgs) {
        const [y,m,d] = key.split("-").map(Number);
        const entryDate = new Date(y, m-1, d);
        const diffDays = Math.floor((today - entryDate)/(1000*60*60*24));
        if (diffDays >= 3) {
          const { chatMsgs, ...rest } = newData[key];
          newData[key] = rest;
          changed = true;
        }
      }
    });
    if(changed) setData(newData);
  }, [data, setData]);
  const t=dark?T.dark:T.light;
  const nav=(page,params={})=>{
    setView({page,...params});
    window.scrollTo({top:0, left:0, behavior:"instant"});
  };
  const goToday=()=>{const d=td();nav("day",{year:d.y,month:d.m,day:d.d});};
  const goThisMonth=()=>{const d=td();nav("month",{year:d.y,month:d.m});};

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; 
      
      const k = e.key.toLowerCase();
      if (k === 'h') { e.preventDefault(); nav("life"); }
      else if (k === 't') { e.preventDefault(); goToday(); }
      else if (k === 'm') { e.preventDefault(); goThisMonth(); }
      else if (k === 'a') { e.preventDefault(); window.location.assign('todoist://'); }
      else if (k === 'd') { e.preventDefault(); setDark(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
  const navTo=idx=>{
    if(idx===0)nav("life");
    else if(idx===1&&view.year)nav("year",{year:view.year});
    else if(idx===2&&view.year!=null&&view.month!=null)nav("month",{year:view.year,month:view.month});
  };
  const crumbs=()=>{
    const p=[{label:"Life"}];
    if(["year","month","day"].includes(view.page))p.push({label:String(view.year)});
    if(["month","day"].includes(view.page))p.push({label:MS[view.month]});
    if(view.page==="day")p.push({label:String(view.day)});
    return p;
  };
  const handleAuth=async()=>{
    if(user){await googleSignOut();}else{try{await googleSignIn();}catch(e){console.warn("Sign-in cancelled",e);}}
  };
  const css=makeCSS(t);
  return(
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:t.bg,transition:"background .25s"}}>
        <div className="topbar">
          {crumbs().map((c,i,arr)=>(
            <span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              {i>0&&<span className="sep">›</span>}
              <button className={`crumb${i===arr.length-1?" cur":""}`} onClick={()=>navTo(i)}>{c.label}</button>
            </span>
          ))}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {isConfigured&&(
              <button onClick={handleAuth} className="btn auth-btn" style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",fontSize:11}}>
                {user?(
                  <>
                    {user.photoURL&&<img src={user.photoURL} alt="" style={{width:18,height:18,borderRadius:"50%",border:`1px solid ${t.accent}44`}}/>}
                    <span className="auth-name" style={{maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.displayName?.split(" ")[0]||"You"}</span>
                    <span style={{color:t.textMuted}}>·</span>
                    <span style={{color:t.red}}>Out</span>
                  </>
                ):(
                  <><span>🔒</span><span>Sign in</span></>
                )}
              </button>
            )}
            <button className="btn-ghost" onClick={()=>setShowSettings(true)} style={{padding:6,borderRadius:"50%",display:"flex",alignItems:"center",color:t.textMuted}} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            {user&&<span style={{width:6,height:6,borderRadius:"50%",background:t.green,boxShadow:`0 0 8px ${t.green}66`,flexShrink:0}} title="Syncing to cloud"/>}
          </div>
        </div>
        <div className="fab-container">
          <div className="fab-row">
            <button className="fab fab-theme" onClick={()=>setDark(d=>!d)} style={{paddingLeft:14, paddingRight:14}}>
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
            <button className="fab fab-month" onClick={goThisMonth}>{MS[td().m].slice(0,3)}</button>
            <button className="fab fab-today" onClick={goToday}>{td().d}</button>
          </div>
          <a className="fab-todoist" href="todoist://" title="Open Todoist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </a>
        </div>
        {view.page==="life"&&<LifePage data={data} setData={setData} onNav={nav} t={t}/>}
        {view.page==="year"&&<YearPage year={view.year} data={data} setData={setData} onNav={nav} t={t}/>}
        {view.page==="month"&&<MonthPage year={view.year} month={view.month} data={data} setData={setData} onNav={nav} globalHabits={globalHabits} setGlobalHabits={setGlobalHabits} t={t}/>}
        {view.page==="day"&&<DayPage year={view.year} month={view.month} day={view.day} data={data} setData={setData} globalHabits={globalHabits} todoistToken={todoistToken} setTodoistToken={setTodoistToken} geminiKey={geminiKey} setGeminiKey={setGeminiKey} t={t}/>}
      </div>
      {showSettings&&<SettingsModal data={data} onClose={()=>setShowSettings(false)} t={t}/>}
    </>
  );
}
