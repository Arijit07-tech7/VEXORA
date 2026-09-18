import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router=express.Router();
router.post("/",requireAuth,(req,res)=>{
  upload.single("file")(req,res,(err)=>{
    if(err)return res.status(400).json({message:err.message});
    if(!req.file)return res.status(400).json({message:"File is required"});
    res.status(201).json({file:{originalName:req.file.originalname,filename:req.file.filename,mimetype:req.file.mimetype,size:req.file.size,url:`/uploads/${encodeURIComponent(req.file.filename)}`}});
  });
});
export default router;
