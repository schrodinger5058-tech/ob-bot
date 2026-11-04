import type {Storage} from './storage';import {uid} from './types';
export function parseMentions(text:string):string[]{
 let fence='';const lines:string[]=[];for(const line of text.split('\n')){const mark=/^\s*(`{3,}|~{3,})/.exec(line)?.[1];if(mark){if(!fence)fence=mark;else if(mark[0]===fence[0]&&mark.length>=fence.length)fence='';continue;}if(!fence&&!line.trimStart().startsWith('>'))lines.push(line.replace(/(`+).*?\1/g,''));}
 return [...new Set([...lines.join('\n').matchAll(/(?:^|[^\w@])@([a-z][a-z0-9_-]*)\b/gi)].map(m=>m[1].toLowerCase()))];
}
export function routeMentions(text:string,members:string[]):string[]{const handles=parseMentions(text);if(handles.some(h=>!members.includes(h)))throw new Error('Mentioned bot is not a group member. Use its @handle.');return handles;}
export class GroupManager {constructor(private store:Storage){} async create(name:string,members:string[],leadBotId:string){if(!name.trim()||!members.length||!members.includes(leadBotId)||members.some(id=>!this.store.state.bots.some(b=>b.id===id)))throw new Error('Choose a name, members and a lead.');const group={id:uid(),name,members:[...new Set(members)],leadBotId,messages:[]};this.store.state.groups.push(group);await this.store.save();return group;}}
