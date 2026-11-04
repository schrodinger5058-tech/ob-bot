import type {State} from './types';
export interface DataPort { loadData():Promise<unknown>; saveData(data:unknown):Promise<void> }
export function initialState():State {return {version:1,bots:[],providers:[{id:'deepseek',name:'DeepSeek',baseUrl:'https://api.deepseek.com',apiKey:'',transport:'fetch',stream:true},{id:'openai',name:'OpenAI compatible',baseUrl:'https://api.openai.com/v1',apiKey:'',transport:'fetch',stream:true}],sessions:{},groups:[],tickets:[]};}
export function decode(raw:unknown):State {
 if(raw==null)return initialState();const s=raw as State;
 if(s.version!==1||!Array.isArray(s.bots)||!Array.isArray(s.providers)||!Array.isArray(s.groups)||!Array.isArray(s.tickets)||!s.sessions||typeof s.sessions!=='object'||Array.isArray(s.sessions))throw new Error('Unsupported or invalid ob-bot data; restore a backup before loading.');
 for(const b of s.bots)if(!b.id||!b.name||!Array.isArray(b.toolPermissions)||!Array.isArray(b.vaultScope)||!b.memory||!b.params)throw new Error('Invalid bot data');
 for(const t of s.tickets)if(['running','queued','attention'].includes(t.status)){t.status='interrupted';t.error='Host stopped. Send a new message to retry; writes are never replayed.';}
 const lists=[...Object.values(s.sessions).map(x=>x.messages),...s.groups.map(g=>g.messages)];for(const messages of lists)for(const m of messages)if(m.status==='running')m.status='interrupted';return s;
}
export class Storage {
 state=initialState();private tail:Promise<void>=Promise.resolve();constructor(private port:DataPort){}
 async load(){this.state=decode(await this.port.loadData());await this.save();}
 save():Promise<void>{const snapshot=JSON.parse(JSON.stringify(this.state));const next=this.tail.catch(()=>{}).then(()=>this.port.saveData(snapshot));this.tail=next;return next;}
 flush(){return this.tail;}
}
