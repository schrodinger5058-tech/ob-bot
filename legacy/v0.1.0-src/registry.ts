import type {Bot} from './types';import type {Storage} from './storage';
export class BotRegistry {
 constructor(private store:Storage){}
 get(id:string){const b=this.store.state.bots.find(b=>b.id===id);if(!b)throw new Error(`Unknown bot: ${id}`);return b;}
 async put(bot:Bot){
 if(!/^[a-z][a-z0-9_-]{0,31}$/.test(bot.id))throw new Error('Handle: lowercase letters, digits, _ or -, starting with a letter (max 32).');
 if(!bot.name.trim()||!bot.model.trim())throw new Error('Name and model are required.');if(!this.store.state.providers.some(p=>p.id===bot.providerId))throw new Error('Unknown provider');
 if(!Number.isFinite(bot.params.temperature)||bot.params.temperature<0||bot.params.temperature>2||!Number.isInteger(bot.params.maxTokens)||bot.params.maxTokens<1||bot.params.maxTokens>32768)throw new Error('Temperature must be 0–2; max tokens 1–32768.');
 const index=this.store.state.bots.findIndex(b=>b.id===bot.id);if(index<0)this.store.state.bots.push(bot);else this.store.state.bots[index]=bot;await this.store.save();}
 async remove(id:string){this.store.state.bots=this.store.state.bots.filter(b=>b.id!==id);for(const g of this.store.state.groups){g.members=g.members.filter(x=>x!==id);if(g.leadBotId===id)g.leadBotId=g.members[0]??'';}for(const [key,s]of Object.entries(this.store.state.sessions))if(s.botId===id)delete this.store.state.sessions[key];await this.store.save();}
}
