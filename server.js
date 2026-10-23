import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const app = express(), PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/status",(_req,res)=>res.json({ok:true,aiConfigured:Boolean(process.env.OPENAI_API_KEY)}));
app.post("/api/chat",async(req,res)=>{
 const messages=req.body?.messages;
 if(!Array.isArray(messages)||!messages.length) return res.status(400).json({error:"Add a message first."});
 if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"AI is not configured yet. Add your API key to .env and restart HQ."});
 try {
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",messages:[{role:"system",content:"You are HQ by CHS, a helpful beginner-friendly AI coding assistant. Give complete copy-ready code when useful. Never claim you changed files or ran code unless you did."},...messages.slice(-20)],temperature:.5})});
  const data=await r.json();
  if(!r.ok)return res.status(r.status).json({error:data?.error?.message||`AI request failed (${r.status}).`});
  res.json({reply:data?.choices?.[0]?.message?.content||"The AI returned an empty response."});
 } catch(e){console.error(e);res.status(500).json({error:"Could not reach the AI service. Check internet and API settings."});}
});
app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`HQ by CHS running at http://localhost:${PORT}`));
