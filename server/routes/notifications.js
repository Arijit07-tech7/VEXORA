import express from "express";
import { db } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router=express.Router();router.use(requireAuth);

router.get("/",(req,res)=>{
  const rows=req.user.role==="admin"?db.prepare("SELECT * FROM notifications ORDER BY id DESC").all():db.prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC").all(req.user.id);
  res.json({notifications:rows});
});
router.post("/",(req,res)=>{
  const b=req.body||{};if(!b.title||!b.message)return res.status(400).json({message:"Title and message are required"});
  if(req.user.role!=="admin" && b.user_id!==req.user.id)return res.status(403).json({message:"You cannot notify another user"});
  const uid=req.user.role==="admin"?(b.user_id||null):req.user.id;
  const r=db.prepare("INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)").run(uid,b.title.trim(),b.message.trim(),b.type||"info");
  res.status(201).json({notification:db.prepare("SELECT * FROM notifications WHERE id=?").get(r.lastInsertRowid)});
});
router.put("/:id/read",(req,res)=>{
  const row=db.prepare("SELECT * FROM notifications WHERE id=?").get(req.params.id);
  if(!row)return res.status(404).json({message:"Notification not found"});
  if(req.user.role!=="admin"&&row.user_id!==req.user.id)return res.status(403).json({message:"Access denied"});
  db.prepare("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json({ok:true});
});
router.delete("/:id",requireAdmin,(req,res)=>{const r=db.prepare("DELETE FROM notifications WHERE id=?").run(req.params.id);if(!r.changes)return res.status(404).json({message:"Notification not found"});res.json({ok:true})});
export default router;
