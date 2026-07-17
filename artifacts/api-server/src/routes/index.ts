import { Router, type IRouter } from "express";
import healthRouter from "./health";
import presenceRouter from "./presence";
import spotifyRouter from "./spotify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(presenceRouter);
router.use(spotifyRouter);

export default router;
