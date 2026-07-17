import { Router, type IRouter } from "express";
import healthRouter from "./health";
import presenceRouter from "./presence";
import spotifyRouter from "./spotify";
import messageRouter from "./message";

const router: IRouter = Router();

router.use(healthRouter);
router.use(presenceRouter);
router.use(spotifyRouter);
router.use(messageRouter);

export default router;
