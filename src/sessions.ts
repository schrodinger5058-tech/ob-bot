import type {Storage} from './storage';
export class SessionManager {constructor(private store:Storage){} get(botId:string,roomId=`dm:${botId}`){const id=JSON.stringify([roomId,botId]);return this.store.state.sessions[id]??(this.store.state.sessions[id]={id,botId,roomId,messages:[]});}}
