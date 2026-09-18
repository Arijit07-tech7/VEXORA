import express from "express";
import { db } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router=express.Router();router.use(requireAuth);
function membersFor(id){return db.prepare(`SELECT u.id,u.name FROM hackathon_members hm JOIN users u ON u.id=hm.user_id WHERE hm.hackathon_id=? ORDER BY u.name`).all(id);}
function list(all=true,id=null){const where=all?"":"WHERE EXISTS (SELECT 1 FROM hackathon_members x WHERE x.hackathon_id=h.id AND x.user_id=?)";return db.prepare(`SELECT h.*,c.name creator_name FROM hackathons h LEFT JOIN users c ON c.id=h.created_by ${where} ORDER BY h.event_date IS NULL,h.event_date ASC,h.id DESC`).all(...(all?[]:[id])).map(h=>({...h,members:membersFor(h.id)}));}
function notify(ids,title,message){const q=db.prepare("INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)");db.transaction(()=>[...new Set(ids||[])].forEach(id=>q.run(id,title,message,"hackathon")))();}
function oldIds(id){return db.prepare("SELECT user_id FROM hackathon_members WHERE hackathon_id=?").all(id).map(x=>x.user_id);}
function sync(id,ids){db.prepare("DELETE FROM hackathon_members WHERE hackathon_id=?").run(id);const q=db.prepare("INSERT OR IGNORE INTO hackathon_members(hackathon_id,user_id) VALUES(?,?)");[...new Set(ids||[])].filter(Boolean).forEach(x=>q.run(id,x));}
router.get("/",(req,res)=>res.json({hackathons:req.user.role==="admin"?list(true):list(false,req.user.id)}));
router.post("/",requireAdmin,(req,res)=>{
 const b=req.body||{};if(!b.name||!["upcoming","active","completed"].includes(b.status))return res.status(400).json({message:"Invalid hackathon data"});
 const ids=Array.isArray(b.member_ids)?b.member_ids.filter(Boolean):[];
 for(const id of ids)if(!db.prepare("SELECT id FROM users WHERE id=? AND active=1 AND role='member'").get(id))return res.status(400).json({message:"One or more members are invalid"});
 const r=db.prepare("INSERT INTO hackathons(name,description,status,event_date,team_info,created_by) VALUES(?,?,?,?,?,?)").run(b.name.trim(),b.description||"",b.status,b.event_date||null,b.team_info||"",req.user.id);
 sync(r.lastInsertRowid,ids);db.prepare("INSERT INTO activity_logs(actor_id,title) VALUES(?,?)").run(req.user.id,`Hackathon created: ${b.name.trim()}`);
 notify(ids,"Hackathon assignment",`${b.name.trim()} has been assigned to you. Open Hackathons for the full event and team details.`);
 res.status(201).json({hackathon:list(true).find(x=>x.id===Number(r.lastInsertRowid))});
});
router.put("/:id",requireAdmin,(req,res)=>{
 const b=req.body||{};if(!b.name||!["upcoming","active","completed"].includes(b.status))return res.status(400).json({message:"Invalid hackathon data"});
 const ids=Array.isArray(b.member_ids)?b.member_ids.filter(Boolean):[],old=oldIds(req.params.id);
 const r=db.prepare("UPDATE hackathons SET name=?,description=?,status=?,event_date=?,team_info=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(b.name.trim(),b.description||"",b.status,b.event_date||null,b.team_info||"",req.params.id);
 if(!r.changes)return res.status(404).json({message:"Hackathon not found"});sync(req.params.id,ids);
 notify([...new Set([...ids,...old])],"Hackathon updated",`${b.name.trim()} was updated by an administrator. Open Hackathons for the latest details.`);
 res.json({hackathon:list(true).find(x=>x.id===Number(req.params.id))});
});
router.delete("/:id",requireAdmin,(req,res)=>{const ids=oldIds(req.params.id),r=db.prepare("DELETE FROM hackathons WHERE id=?").run(req.params.id);if(!r.changes)return res.status(404).json({message:"Hackathon not found"});notify(ids,"Hackathon removed","A hackathon assigned to you was removed by an administrator.");res.json({ok:true})});
export default router;