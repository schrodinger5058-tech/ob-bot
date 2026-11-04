import type {Bot,ToolName,ToolSchema} from './types';
import {inScope,PermissionLayer,safePath} from './permissions';
export interface VaultPort {list():{path:string;aliases:string[]}[];read(path:string):Promise<string>;exists(path:string):boolean;create(path:string,content:string):Promise<void>;replace(path:string,before:string,after:string):Promise<void>}
export const toolSchemas:ToolSchema[]=(['read_note','search_notes','create_note','append_note','edit_note'] as ToolName[]).map(name=>({type:'function',function:{name,description:({read_note:'Read a Markdown note within your scope.',search_notes:'Search paths, aliases and content within your scope. Returns up to 20 excerpts.',create_note:'Create a new Markdown note. User must approve. Parent folder must already exist.',append_note:'Append content to a note. User must approve.',edit_note:'Replace the entire note content. User must approve the before/after preview.'})[name],parameters:{type:'object',properties:name==='search_notes'?{query:{type:'string'}}:{path:{type:'string'},...(name==='read_note'?{}:{content:{type:'string'}})},required:name==='search_notes'?['query']:name==='read_note'?['path']:['path','content'],additionalProperties:false}}}));
export class VaultTools {
 constructor(private vault:VaultPort,private permissions:PermissionLayer){}
 schemas(bot:Bot){return toolSchemas.filter(s=>bot.toolPermissions.includes(s.function.name as ToolName));}
 async execute(bot:Bot,name:string,args:unknown,signal:AbortSignal):Promise<string>{
  if(signal.aborted)throw new Error('Canceled');if(!toolSchemas.some(t=>t.function.name===name))throw new Error('Unknown tool');const tool=name as ToolName;this.permissions.check(bot,tool);
  if(!args||typeof args!=='object')throw new Error('Tool arguments must be an object');const a=args as Record<string,unknown>;
  if(tool==='search_notes'){
   if(typeof a.query!=='string'||!a.query.trim())throw new Error('Search query required');const query=a.query.toLowerCase();const hits:{path:string;excerpt:string}[]=[];let scanned=0;
   for(const f of this.vault.list()){if(signal.aborted)throw new Error('Canceled');try{safePath(f.path);}catch{continue;}if(!inScope(f.path,bot.vaultScope))continue;if(++scanned>300)break;const text=(await this.vault.read(f.path)).slice(0,100000);const index=text.toLowerCase().indexOf(query);if(f.path.toLowerCase().includes(query)||f.aliases.some(x=>x.toLowerCase().includes(query))||index>=0)hits.push({path:f.path,excerpt:text.slice(Math.max(0,index-80),Math.max(0,index-80)+400)});if(hits.length===20)break;}
   return JSON.stringify({hits,scanned,limit:300});
  }
  if(typeof a.path!=='string')throw new Error('Path required');const path=safePath(a.path);this.permissions.check(bot,tool,path);
  if(tool==='read_note')return (await this.vault.read(path)).slice(0,24000);
  if(typeof a.content!=='string'||a.content.length>100000)throw new Error('Content required, max 100,000 characters');const exists=this.vault.exists(path);if(tool==='create_note'&&exists)throw new Error('Note already exists');if(tool!=='create_note'&&!exists)throw new Error('Note does not exist');
  const before=exists?await this.vault.read(path):'';if(before.length>200000)throw new Error('Note too large for approval preview');const after=tool==='append_note'?before+a.content:a.content;
  await this.permissions.write(bot,{botId:bot.id,tool,path,before,after},signal);if(signal.aborted)throw new Error('Canceled');
  if(tool==='create_note'){if(this.vault.exists(path))throw new Error('Note appeared while awaiting approval');await this.vault.create(path,after);}else await this.vault.replace(path,before,after);
  return `Approved ${tool}: ${path}`;
 }
}
