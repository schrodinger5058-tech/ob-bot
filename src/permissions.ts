import type {Bot,ToolName} from './types';
export interface WriteRequest {botId:string; tool:ToolName; path:string; before:string; after:string}
export type Approval=(request:WriteRequest,signal:AbortSignal)=>Promise<boolean>;
export function safePath(raw:string):string{
 if(typeof raw!=='string'||!raw.trim()||raw.startsWith('/')||raw.includes('\\')||raw.includes(':')||/[\x00-\x1f]/.test(raw))throw new Error('Use a vault-relative Markdown path.');
 const parts=raw.split('/');if(parts.some(p=>!p||p==='.'||p==='..'||p.startsWith('.'))||!raw.endsWith('.md'))throw new Error('Only visible Markdown notes allowed; traversal/config paths denied.');return raw;
}
export function inScope(path:string,scope:string[]){return scope.some(s=>{const p=s.trim().replace(/\/+$/,'');return p===''||path===p||path.startsWith(p+'/');});}
export class PermissionLayer{
 constructor(private approval:Approval){}
 check(bot:Bot,tool:ToolName,path?:string){if(!bot.toolPermissions.includes(tool))throw new Error(`Tool denied: ${tool}`);if(path!==undefined){safePath(path);if(!inScope(path,bot.vaultScope))throw new Error('Note is outside this bot’s vault scope.');}}
 async write(bot:Bot,request:WriteRequest,signal:AbortSignal){this.check(bot,request.tool,request.path);if(signal.aborted||!await this.approval(request,signal)||signal.aborted)throw new Error('Write denied or canceled.');this.check(bot,request.tool,request.path);}
}
