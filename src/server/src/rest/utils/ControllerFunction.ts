import * as core from "express-serve-static-core"

export type ControllerFunctionAsync = (req: core.Request, res: core.Response, next?: any) => Promise<void>;
export type ControllerFunction = (req: core.Request, res: core.Response, next?: any) =>  void;