import type {Bot,ChatProvider,Completion,ProviderConfig,ToolCall,ToolSchema,WireMessage} from './types';
export type BufferedTransport=(url:string,headers:Record<string,string>,body:string)=>Promise<{status:number;json:unknown}>;
/** Incremental SSE decoder handles split UTF-8, CRLF, multiple data lines and tool argument fragments. */
export class SSEDecoder {
 private buffer='';private decoder=new TextDecoder();
 push(bytes:Uint8Array,final=false):string[]{this.buffer+=this.decoder.decode(bytes,{stream:!final});this.buffer=this.buffer.replace(/\r\n/g,'\n');const events:string[]=[];let end:number;while((end=this.buffer.indexOf('\n\n'))>=0){events.push(this.buffer.slice(0,end));this.buffer=this.buffer.slice(end+2);}if(final&&this.buffer.trim()){events.push(this.buffer);this.buffer='';}return events.map(e=>e.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n')).filter(Boolean);}
}
function bufferedResult(raw:unknown):Completion {const r=raw as {choices?:{message?:{content?:string;tool_calls?:ToolCall[]};finish_reason?:string}[]};const choice=r.choices?.[0];if(!choice?.message)throw new Error('Provider returned no message.');if(choice.finish_reason==='length')throw new Error('Provider output limit reached; increase max tokens.');return {content:choice.message.content??'',toolCalls:choice.message.tool_calls??[]};}
function abortError(){return new Error('Request canceled or timed out.');}
export function withAbort<T>(promise:Promise<T>,signal:AbortSignal):Promise<T>{return new Promise((resolve,reject)=>{if(signal.aborted){reject(abortError());return;}const abort=()=>reject(abortError());signal.addEventListener('abort',abort,{once:true});promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));});}
export class OpenAIProvider implements ChatProvider {
 constructor(private buffered?:BufferedTransport,private fetcher:typeof fetch=fetch){}
 async complete(config:ProviderConfig,bot:Bot,messages:WireMessage[],tools:ToolSchema[],onDelta:(s:string)=>void,signal:AbortSignal):Promise<Completion>{
  if(!config.apiKey.trim())throw new Error(`Configure the ${config.name} API key in ob-bot settings.`);
  let base:URL;try{base=new URL(config.baseUrl);}catch{throw new Error('Invalid provider base URL');}if(base.protocol!=='https:')throw new Error('Provider base URL must use HTTPS.');
  const url=config.baseUrl.replace(/\/+$/,'')+'/chat/completions';const headers={'Content-Type':'application/json',Authorization:`Bearer ${config.apiKey}`};
  const stream=config.stream&&config.transport==='fetch';const body=JSON.stringify({model:bot.model,messages,temperature:bot.params.temperature,max_tokens:bot.params.maxTokens,stream,...(tools.length?{tools,tool_choice:'auto'}:{})});
  if(config.transport==='obsidian'){
   if(!this.buffered)throw new Error('Buffered transport unavailable.');const r=await withAbort(this.buffered(url,headers,body),signal);if(r.status<200||r.status>=300)throw new Error(`Provider HTTP ${r.status}; check endpoint, key and model.`);const result=bufferedResult(r.json);onDelta(result.content);return result;
  }
  let response:Response;try{response=await this.fetcher(url,{method:'POST',headers,body,signal});}catch{throw new Error(signal.aborted?'Request canceled or timed out.':'Network/CORS failure. Try buffered Obsidian transport in settings.');}
  if(!response.ok)throw new Error(`Provider HTTP ${response.status}; check endpoint, key and model.`);
  if(!stream||!response.headers.get('content-type')?.includes('text/event-stream')){const result=bufferedResult(await response.json());onDelta(result.content);return result;}
  if(!response.body)throw new Error('Provider returned an empty stream.');const reader=response.body.getReader();const decoder=new SSEDecoder();const calls=new Map<number,ToolCall>();let content='';let finished=false;let stopped=false;
  const consume=(data:string)=>{if(data==='[DONE]'){finished=true;return;}const packet=JSON.parse(data) as {error?:unknown;choices?:{delta?:{content?:string;tool_calls?:{index:number;id?:string;function?:{name?:string;arguments?:string}}[]};finish_reason?:string}[]};if(packet.error)throw new Error('Provider stream error.');const choice=packet.choices?.[0];if(!choice)return;if(choice.finish_reason==='length')throw new Error('Provider output limit reached; increase max tokens.');if(choice.finish_reason)finished=true;const delta=choice.delta;if(delta?.content){content+=delta.content;onDelta(delta.content);}for(const c of delta?.tool_calls??[]){const current=calls.get(c.index)??{id:'',type:'function',function:{name:'',arguments:''}};if(c.id)current.id=c.id;if(c.function?.name)current.function.name+=c.function.name;if(c.function?.arguments)current.function.arguments+=c.function.arguments;calls.set(c.index,current);}if(content.length>200000||[...calls.values()].some(c=>c.function.arguments.length>100000))throw new Error('Provider output exceeded safety limit.');};
  try{while(!stopped){const r=await reader.read();for(const data of decoder.push(r.value??new Uint8Array(),r.done))consume(data);if(r.done||finished)stopped=true;}if(!finished)throw new Error('Stream interrupted before completion.');if(signal.aborted)throw abortError();return {content,toolCalls:[...calls.values()]};}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 }
}
