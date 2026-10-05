import { generateVideo } from "../controller/generate-video";

import Router from 'express'
const router = Router();


router.get("/generate-video", generateVideo)
export default router