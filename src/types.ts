export type ToolName = 'read_note'|'search_notes'|'create_note'|'append_note'|'edit_note';
export interface Bot { id:string; name:string; avatarColor:string; systemPrompt:string; providerId:string; model:string; params:{temperature:number; maxTokens:number}; toolPermissions:ToolName[]; vaultScope:string[]; memory:{history:boolean} }
export interface ProviderConfig { id:string; name:string; baseUrl:string; apiKey:string; transport:'fetch'|'obsidian'; stream:boolean }
export interface Message { id:string; role:'user'|'assistant'; content:string; botId?:string; status:'running'|'complete'|'failed'|'interrupted'; time:number }
export interface ChatSession { id:string; botId:string; roomId:string; messages:Message[] }
export interface Group { id:string; name:string; members:string[]; leadBotId:string; messages:Message[] }
export interface Ticket { id:string; parentId?:string; groupId:string; botId:string; task:string; phase:'plan'|'work'|'merge'; status:'queued'|'running'|'attention'|'complete'|'failed'|'interrupted'; result?:string; error?:string; time:number }
export interface State { version:1; bots:Bot[]; providers:ProviderConfig[]; sessions:Record<string,ChatSession>; groups:Group[]; tickets:Ticket[] }
export interface WireMessage { role:'system'|'user'|'assistant'|'tool'; content:string|null; tool_call_id?:string; tool_calls?:ToolCall[] }
export interface ToolCall { id:string; type:'function'; function:{name:string; arguments:string} }
export interface ToolSchema { type:'function'; function:{name:string; description:string; parameters:Record<string,unknown>} }
export interface Completion { content:string; toolCalls:ToolCall[] }
export interface ChatProvider { complete(config:ProviderConfig,bot:Bot,messages:WireMessage[],tools:ToolSchema[],onDelta:(s:string)=>void,signal:AbortSignal):Promise<Completion> }
export const uid=()=>globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export const message=(role:Message['role'],content:string,botId?:string):Message=>({id:uid(),role,content,botId,status:'complete',time:Date.now()});
