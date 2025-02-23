import { Request, Response, Router } from "express";
import { generateUploadUrl } from "../providers/aws";

const ArchivosRouter: Router = Router();

ArchivosRouter.get("/signed-url", async (req: Request, res: Response) => {
  try {
    const fileKey = req.query.fileKey as string;
    if (!fileKey) throw new Error("Missing fileKey query parameter.");
    const uploadUrl: string | null = await generateUploadUrl(fileKey);
    if (!uploadUrl) throw new Error("Couldn't generate signed-url.");
    res.status(200).json({ uploadUrl });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export { ArchivosRouter };
