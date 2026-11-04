import {Plugin, TFile, requestUrl, Notice} from 'obsidian';
import {Storage} from './storage';
import {BotRegistry} from './registry';
import {SessionManager} from './sessions';
import {GroupManager} from './groups';
import {PermissionLayer} from './permissions';
import {VaultTools} from './tools';
import {OpenAIProvider} from './providers';
import {Executor} from './executor';
import {Orchestrator} from './orchestrator';
import {BotView, ApprovalModal, VIEW_TYPE} from './ui';
export default class ObBotPlugin extends Plugin {
 store!:Storage; registry!:BotRegistry; sessions!:SessionManager; groups!:GroupManager; orchestrator!:Orchestrator;
 approvals=new Set<ApprovalModal>(); private listeners=new Set<()=>void>(); disposed=false;
 subscribe(fn:()=>void){this.listeners.add(fn);return ()=>{this.listeners.delete(fn);};}
 changed=()=>{if(!this.disposed)for(const fn of this.listeners)fn();};
 async onload(){
  this.store=new Storage(this);await this.store.load();
  this.registry=new BotRegistry(this.store);this.sessions=new SessionManager(this.store);this.groups=new GroupManager(this.store);
  const permissions=new PermissionLayer((request,signal)=>new Promise(resolve=>{if(this.disposed||signal.aborted){resolve(false);return;}const modal=new ApprovalModal(this.app,request,signal,approved=>{this.approvals.delete(modal);resolve(approved);});this.approvals.add(modal);modal.open();}));
  const file=(path:string)=>{const f=this.app.vault.getAbstractFileByPath(path);if(!(f instanceof TFile))throw new Error('Note missing');return f;};
  const vault=new VaultTools({list:()=>this.app.vault.getMarkdownFiles().map(f=>{const aliases=this.app.metadataCache.getFileCache(f)?.frontmatter?.aliases;return {path:f.path,aliases:Array.isArray(aliases)?aliases.filter((x:unknown):x is string=>typeof x==='string'):typeof aliases==='string'?[aliases]:[]};}),read:path=>this.app.vault.read(file(path)),exists:path=>this.app.vault.getAbstractFileByPath(path)!==null,create:async(path,content)=>{await this.app.vault.create(path,content);},replace:async(path,before,after)=>{await this.app.vault.process(file(path),current=>{if(current!==before)throw new Error('Note changed since approval; retry for a fresh preview.');return after;});}},permissions);
  const provider=new OpenAIProvider(async(url,headers,body)=>{const r=await requestUrl({url,method:'POST',headers,body,throw:false});return {status:r.status,json:r.json};});
  const executor=new Executor(this.store,this.sessions,provider,vault,this.changed);
  this.orchestrator=new Orchestrator(this.store,this.registry,executor,this.changed);
  this.registerView(VIEW_TYPE,leaf=>new BotView(leaf,this));
  this.addRibbonIcon('messages-square','Open ob-bot',()=>{void this.openView();});
  this.addCommand({id:'open',name:'Open chat',callback:()=>{void this.openView();}});
 }
 async openView(){try{const leaf=this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]??this.app.workspace.getLeaf('tab');await leaf.setViewState({type:VIEW_TYPE,active:true});await this.app.workspace.revealLeaf(leaf);}catch{new Notice('Could not open ob-bot.');}}
 onunload(){this.disposed=true;this.orchestrator?.cancel();for(const modal of [...this.approvals])modal.close();this.listeners.clear();void this.store?.save().catch(()=>new Notice('ob-bot could not save interrupted state.'));}
}
