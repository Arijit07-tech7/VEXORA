import express from "express";
import { db } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();
router.use(requireAuth);

function usersFor(taskId){
  return db.prepare(`SELECT u.id,u.name FROM task_assignees ta JOIN users u ON u.id=ta.user_id WHERE ta.task_id=? ORDER BY u.name`).all(taskId);
}
function list(all=true, userId=null){
  const where = all ? "" : "WHERE EXISTS (SELECT 1 FROM task_assignees x WHERE x.task_id=t.id AND x.user_id=?)";
  const args = all ? [] : [userId];
  return db.prepare(`SELECT t.*, u.name creator_name FROM tasks t LEFT JOIN users u ON u.id=t.created_by ${where} ORDER BY t.id DESC`).all(...args)
    .map(t=>({...t,assignees:usersFor(t.id)}));
}
function validate(b){return b?.title && ["todo","in_progress","done"].includes(b.status)&&["low","medium","high","critical"].includes(b.priority);}
function notify(ids,title,message){
  const stmt=db.prepare("INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)");
  const tx=db.transaction(()=>{[...new Set(ids||[])].forEach(id=>stmt.run(id,title,message,"assignment"));}); tx();
}
function assignedIds(taskId){return db.prepare("SELECT user_id FROM task_assignees WHERE task_id=?").all(taskId).map(x=>x.user_id);}
function sync(taskId, ids){
  db.prepare("DELETE FROM task_assignees WHERE task_id=?").run(taskId);
  const ins=db.prepare("INSERT OR IGNORE INTO task_assignees(task_id,user_id) VALUES(?,?)");
  [...new Set(ids||[])].filter(Boolean).forEach(id=>ins.run(taskId,id));
  const first=(ids||[])[0]||null;
  db.prepare("UPDATE tasks SET assignee_id=? WHERE id=?").run(first,taskId);
}
router.get("/",(req,res)=>res.json({tasks:req.user.role==="admin"?list(true):list(false,req.user.id)}));
router.post("/",requireAdmin,(req,res)=>{
  const b=req.body||{}; if(!validate(b))return res.status(400).json({message:"Invalid task data"});
  const ids=Array.isArray(b.assignee_ids)?b.assignee_ids.filter(Boolean):[];
  for(const id of ids) if(!db.prepare("SELECT id FROM users WHERE id=? AND active=1 AND role='member'").get(id))return res.status(400).json({message:"One or more assignees are invalid"});
  const r=db.prepare("INSERT INTO tasks(title,description,status,priority,deadline,assignee_id,created_by) VALUES(?,?,?,?,?,?,?)").run(b.title.trim(),b.description||"",b.status,b.priority,b.deadline||null,ids[0]||null,req.user.id);
  sync(r.lastInsertRowid,ids);
  db.prepare("INSERT INTO activity_logs(actor_id,title) VALUES(?,?)").run(req.user.id,`Task created: ${b.title.trim()}`);
  notify(ids,"New task assigned",`${b.title.trim()} was assigned to you. Open Tasks to view the full details.`);
  res.status(201).json({task:list(true).find(x=>x.id===Number(r.lastInsertRowid))});
});
router.put("/:id",requireAdmin,(req,res)=>{
  const b=req.body||{}; if(!validate(b))return res.status(400).json({message:"Invalid task data"});
  const old=assignedIds(req.params.id), ids=Array.isArray(b.assignee_ids)?b.assignee_ids.filter(Boolean):[];
  const r=db.prepare("UPDATE tasks SET title=?,description=?,status=?,priority=?,deadline=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(b.title.trim(),b.description||"",b.status,b.priority,b.deadline||null,req.params.id);
  if(!r.changes)return res.status(404).json({message:"Task not found"});
  sync(req.params.id,ids);
  const changed=[...new Set([...ids,...old])];
  notify(changed,"Task updated",`${b.title.trim()} was updated by an administrator. Check your Tasks section for the latest details.`);
  res.json({task:list(true).find(x=>x.id===Number(req.params.id))});
});
router.delete("/:id",requireAdmin,(req,res)=>{const ids=assignedIds(req.params.id);const r=db.prepare("DELETE FROM tasks WHERE id=?").run(req.params.id);if(!r.changes)return res.status(404).json({message:"Task not found"});notify(ids,"Task removed","A task assigned to you was removed by an administrator.");res.json({ok:true})});
export default router;