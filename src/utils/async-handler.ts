import type { Request, Response, NextFunction } from "express";

type asyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

const asyncHandler = (requestHandler: asyncRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(requestHandler(req, res, next)).catch(next)
    }
}

export { asyncHandler };