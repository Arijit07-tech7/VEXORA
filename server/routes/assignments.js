import express from "express";
import { db } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router=express.Router(); router.use(requireAuth);
function membersFor(id){return db.prepare(`SELECT u.id,u.name FROM assignment_members am JOIN users u ON u.id=am.user_id WHERE am.assignment_id=? ORDER BY u.name`).all(id);}
function list(all=true,id=null){
 const where=all?"":"WHERE EXISTS (SELECT 1 FROM assignment_members x WHERE x.assignment_id=a.id AND x.user_id=?)";
 return db.prepare(`SELECT a.*,c.name creator_name FROM assignments a LEFT JOIN users c ON c.id=a.created_by ${where} ORDER BY a.id DESC`).all(...(all?[]:[id])).map(a=>({...a,members:membersFor(a.id)}));
}
function notify(ids,title,message){const q=db.prepare("INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)");db.transaction(()=>[...new Set(ids||[])].forEach(id=>q.run(id,title,message,"assignment")))();}
function oldIds(id){return db.prepare("SELECT user_id FROM assignment_members WHERE assignment_id=?").all(id).map(x=>x.user_id);}
function sync(id,ids){db.prepare("DELETE FROM assignment_members WHERE assignment_id=?").run(id);const q=db.prepare("INSERT OR IGNORE INTO assignment_members(assignment_id,user_id) VALUES(?,?)");[...new Set(ids||[])].filter(Boolean).forEach(x=>q.run(id,x));db.prepare("UPDATE assignments SET member_id=? WHERE id=?").run((ids||[])[0]||null,id);}
router.get("/",(req,res)=>res.json({assignments:req.user.role==="admin"?list(true):list(false,req.user.id)}));
router.post("/",requireAdmin,(req,res)=>{
 const b=req.body||{};if(!b.title||!["pending","in_progress","completed"].includes(b.status))return res.status(400).json({message:"Invalid assignment data"});
 const ids=Array.isArray(b.member_ids)?b.member_ids.filter(Boolean):[];
 for(const id of ids)if(!db.prepare("SELECT id FROM users WHERE id=? AND active=1 AND role='member'").get(id))return res.status(400).json({message:"One or more members are invalid"});
 const r=db.prepare("INSERT INTO assignments(title,description,status,deadline,member_id,created_by) VALUES(?,?,?,?,?,?)").run(b.title.trim(),b.description||"",b.status,b.deadline||null,ids[0]||null,req.user.id);
 sync(r.lastInsertRowid,ids);db.prepare("INSERT INTO activity_logs(actor_id,title) VALUES(?,?)").run(req.user.id,`Assignment created: ${b.title.trim()}`);
 notify(ids,"New assignment assigned",`${b.title.trim()} was assigned to you. Open Assignments to view the full details.`);
 res.status(201).json({assignment:list(true).find(x=>x.id===Number(r.lastInsertRowid))});
});
router.put("/:id",requireAdmin,(req,res)=>{
 const b=req.body||{};if(!b.title||!["pending","in_progress","completed"].includes(b.status))return res.status(400).json({message:"Invalid assignment data"});
 const ids=Array.isArray(b.member_ids)?b.member_ids.filter(Boolean):[], old=oldIds(req.params.id);
 const r=db.prepare("UPDATE assignments SET title=?,description=?,status=?,deadline=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(b.title.trim(),b.description||"",b.status,b.deadline||null,req.params.id);
 if(!r.changes)return res.status(404).json({message:"Assignment not found"});sync(req.params.id,ids);
 notify([...new Set([...ids,...old])],"Assignment updated",`${b.title.trim()} was updated by an administrator. Check your Assignments section for the latest details.`);
 res.json({assignment:list(true).find(x=>x.id===Number(req.params.id))});
});
router.delete("/:id",requireAdmin,(req,res)=>{const ids=oldIds(req.params.id),r=db.prepare("DELETE FROM assignments WHERE id=?").run(req.params.id);if(!r.changes)return res.status(404).json({message:"Assignment not found"});notify(ids,"Assignment removed","An assignment assigned to you was removed by an administrator.");res.json({ok:true})});
export default router;