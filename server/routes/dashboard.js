import express from "express";
import { db } from "../database/db.js";
import { requireAuth } from "../middleware/auth.js";
const router=express.Router();router.use(requireAuth);
router.get("/",(req,res)=>{
 const admin=req.user.role==="admin";
 const stats=admin?{
  totalUsers:db.prepare("SELECT COUNT(*) c FROM users").get().c,activeUsers:db.prepare("SELECT COUNT(*) c FROM users WHERE active=1").get().c,
  tasks:db.prepare("SELECT COUNT(*) c FROM tasks").get().c,assignments:db.prepare("SELECT COUNT(*) c FROM assignments").get().c,hackathons:db.prepare("SELECT COUNT(*) c FROM hackathons").get().c,
  notifications:db.prepare("SELECT COUNT(*) c FROM notifications").get().c
 }:{
  totalUsers:0,activeUsers:0,
  tasks:db.prepare("SELECT COUNT(DISTINCT task_id) c FROM task_assignees WHERE user_id=?").get(req.user.id).c,
  assignments:db.prepare("SELECT COUNT(DISTINCT assignment_id) c FROM assignment_members WHERE user_id=?").get(req.user.id).c,
  hackathons:db.prepare("SELECT COUNT(DISTINCT hackathon_id) c FROM hackathon_members WHERE user_id=?").get(req.user.id).c,
  notifications:db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=?").get(req.user.id).c
 };
 const recentActivity=admin?db.prepare(`SELECT a.id,a.title,a.created_at,u.name actor FROM activity_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 10`).all():
 db.prepare(`SELECT n.id,n.title,n.message,n.created_at,'VEXORA' actor FROM notifications n WHERE n.user_id=? ORDER BY n.id DESC LIMIT 8`).all(req.user.id);
 const snapshot=admin?{
  openTasks:db.prepare("SELECT COUNT(*) c FROM tasks WHERE status <> 'done'").get().c,
  pendingAssignments:db.prepare("SELECT COUNT(*) c FROM assignments WHERE status <> 'completed'").get().c,
  unreadNotifications:db.prepare("SELECT COUNT(*) c FROM notifications WHERE read_at IS NULL").get().c
 }:{
  openTasks:db.prepare(`SELECT COUNT(DISTINCT t.id) c FROM tasks t JOIN task_assignees x ON x.task_id=t.id WHERE x.user_id=? AND t.status <> 'done'`).get(req.user.id).c,
  pendingAssignments:db.prepare(`SELECT COUNT(DISTINCT a.id) c FROM assignments a JOIN assignment_members x ON x.assignment_id=a.id WHERE x.user_id=? AND a.status <> 'completed'`).get(req.user.id).c,
  unreadNotifications:db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL").get(req.user.id).c
 };
 const myWork=admin?[]:[
  ...db.prepare(`SELECT id,title,deadline,status,'task' kind FROM tasks t WHERE EXISTS(SELECT 1 FROM task_assignees x WHERE x.task_id=t.id AND x.user_id=?) ORDER BY id DESC LIMIT 4`).all(req.user.id),
  ...db.prepare(`SELECT id,title,deadline,status,'assignment' kind FROM assignments a WHERE EXISTS(SELECT 1 FROM assignment_members x WHERE x.assignment_id=a.id AND x.user_id=?) ORDER BY id DESC LIMIT 4`).all(req.user.id),
  ...db.prepare(`SELECT id,name title,event_date deadline,status,'hackathon' kind FROM hackathons h WHERE EXISTS(SELECT 1 FROM hackathon_members x WHERE x.hackathon_id=h.id AND x.user_id=?) ORDER BY id DESC LIMIT 4`).all(req.user.id)
 ];
 res.json({stats,recentActivity,snapshot,myWork});
});
export default router;