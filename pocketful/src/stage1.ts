import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import express from "express";

type User = {
  id: string; email: string; password_hash: string; display_name: string;
  handle: string; balance: number; token_hashes: string[];
};
type Payment = {
  id: string; from_user_id: string; to_user_id: string; amount: number;
  note: string; visibility: "public"|"private"; request_id: string|null;
  settlement_id: string|null; created_at: string;
};
type MoneyRequest = {
  id: string; requester_id: string; payer_id: string; amount: number;
  note: string; status: "pending"|"paid"|"declined"|"cancelled";
  payment_id: string|null; created_at: string;
};
type IdempotencyRecord = {
  user_id: string; key: string; method: string; path: string; fingerprint: string;
  status: number; body: unknown;
};
type Split = { id:string; amount:number; note:string; shares:{handle:string;amount:number}[]; request_ids:string[]; created_at:string };
type State = {
  currency:string; minor_units:0|2|3; users:User[]; payments:Payment[];
  requests:MoneyRequest[]; splits:Split[]; idempotency:IdempotencyRecord[];
  settlement_operator_ids:string[];
};

const now = () => new Date().toISOString();
const id = (prefix:string) => prefix + "_" + randomBytes(12).toString("hex");
const hash = (value:string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("hex");
const passwordHash = (password:string) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 32).toString("hex");
};
const passwordMatches = (password:string, stored:string) => {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const canonical = (value:unknown):string => {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value as Record<string,unknown>).sort()
      .map(k => JSON.stringify(k)+":"+canonical((value as Record<string,unknown>)[k])).join(",") + "}";
  }
  return JSON.stringify(value);
};
const errorBody = (code:string, message:string) => ({error:{code,message}});
const malformed = (res:express.Response, code:string, message:string, status:number) => res.status(status).json(errorBody(code,message));
const validId = (value:unknown) => typeof value === "string" && value.length <= 64 && value.length > 0;
const validAmount = (value:unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 1_000_000_000;
const optionalNote = (body:any) => body.note === undefined ? "" : body.note;
const visibility = (body:any) => body.visibility === undefined ? "public" : body.visibility;

function fixtureState(): State {
  return {currency:"EUR",minor_units:2,users:[],payments:[],requests:[],splits:[],idempotency:[],settlement_operator_ids:[]};
}

function validateImportedState(input:any): input is State {
  if (!input || typeof input !== "object" || typeof input.currency !== "string" ||
      ![0,2,3].includes(input.minor_units) || !Array.isArray(input.users) ||
      !Array.isArray(input.payments) || !Array.isArray(input.requests) ||
      !Array.isArray(input.splits) || !Array.isArray(input.idempotency) ||
      !Array.isArray(input.settlement_operator_ids)) return false;
  const users=input.users as any[];
  const ids=new Set<string>(), handles=new Set<string>(), emails=new Set<string>();
  for(const u of users){
    if(!u || !validId(u.id) || typeof u.email!=="string" || typeof u.password_hash!=="string" ||
       typeof u.display_name!=="string" || typeof u.handle!=="string" ||
       !/^[a-z0-9_]{1,20}$/.test(u.handle) || !Number.isSafeInteger(u.balance) || u.balance<0 ||
       !Array.isArray(u.token_hashes) || u.token_hashes.some((x:any)=>typeof x!=="string") ||
       ids.has(u.id) || handles.has(u.handle) || emails.has(u.email)) return false;
    ids.add(u.id); handles.add(u.handle); emails.add(u.email);
  }
  const paymentIds=new Set<string>();
  for(const p of input.payments as any[]){
    if(!p || !validId(p.id) || paymentIds.has(p.id) || !ids.has(p.from_user_id) || !ids.has(p.to_user_id) ||
       p.from_user_id===p.to_user_id || !validAmount(p.amount) || typeof p.note!=="string" ||
       !["public","private"].includes(p.visibility) || (p.request_id!==null && p.request_id!==undefined && typeof p.request_id!=="string") ||
       (p.settlement_id!==null && p.settlement_id!==undefined && typeof p.settlement_id!=="string") ||
       typeof p.created_at!=="string") return false;
    paymentIds.add(p.id);
  }
  const requestIds=new Set<string>();
  for(const r of input.requests as any[]){
    if(!r || !validId(r.id) || requestIds.has(r.id) || !ids.has(r.requester_id) || !ids.has(r.payer_id) ||
       r.requester_id===r.payer_id || !validAmount(r.amount) || typeof r.note!=="string" ||
       !["pending","paid","declined","cancelled"].includes(r.status) ||
       (r.payment_id!==null && r.payment_id!==undefined && typeof r.payment_id!=="string") ||
       typeof r.created_at!=="string") return false;
    requestIds.add(r.id);
  }
  for(const s of input.splits as any[]){
    if(!s || !validId(s.id) || !validAmount(s.amount) || typeof s.note!=="string" ||
       !Array.isArray(s.shares) || !Array.isArray(s.request_ids) || typeof s.created_at!=="string") return false;
    if(s.shares.some((x:any)=>!x || typeof x.handle!=="string" || !handles.has(x.handle) ||
       !Number.isSafeInteger(x.amount) || x.amount<0) || s.request_ids.some((x:any)=>typeof x!=="string")) return false;
    if(s.shares.reduce((sum:number,x:any)=>sum+x.amount,0)!==s.amount) return false;
  }
  for(const r of input.idempotency as any[]){
    if(!r || typeof r.user_id!=="string" || !ids.has(r.user_id) || typeof r.key!=="string" ||
       r.key.length<1 || r.key.length>255 || typeof r.method!=="string" || typeof r.path!=="string" ||
       typeof r.fingerprint!=="string" || !Number.isInteger(r.status) || r.status!==201) return false;
  }
  if((input.settlement_operator_ids as any[]).some((x:any)=>!ids.has(x))) return false;
  return true;
}

function validateFixture(input:any): {ok:true; state:State}|{ok:false} {
  if (!input || typeof input !== "object" || typeof input.currency !== "string" ||
      ![0,2,3].includes(input.minor_units) || !Array.isArray(input.users) ||
      !Array.isArray(input.payments) || !Array.isArray(input.requests)) return {ok:false};
  const users:User[] = [];
  const handles = new Set<string>();
  const emails = new Set<string>();
  for (const u of input.users) {
    if (!u || !validId(u.id) || typeof u.email !== "string" || typeof u.password !== "string" ||
        typeof u.display_name !== "string" || typeof u.handle !== "string" ||
        !/^[a-z0-9_]{1,20}$/.test(u.handle) || !Number.isSafeInteger(u.balance) || u.balance < 0 ||
        handles.has(u.handle) || emails.has(u.email)) return {ok:false};
    handles.add(u.handle); emails.add(u.email);
    users.push({id:u.id,email:u.email,password_hash:passwordHash(u.password),display_name:u.display_name,
      handle:u.handle,balance:u.balance,token_hashes:[]});
  }
  const userById = new Map(users.map(u=>[u.id,u]));
  const userByHandle = new Map(users.map(u=>[u.handle,u]));
  const payments:Payment[]=[];
  for (const p of input.payments) {
    if (!p || !validId(p.id) || !userById.has(p.from_user_id) || !userById.has(p.to_user_id) ||
        !validAmount(p.amount) || p.from_user_id===p.to_user_id ||
        typeof p.note !== "string" || !["public","private"].includes(p.visibility)) return {ok:false};
    payments.push({id:p.id,from_user_id:p.from_user_id,to_user_id:p.to_user_id,amount:p.amount,
      note:p.note,visibility:p.visibility,request_id:p.request_id ?? null,settlement_id:p.settlement_id ?? null,created_at:now()});
  }
  const requests:MoneyRequest[]=[];
  for (const r of input.requests) {
    if (!r || !validId(r.id) || !userById.has(r.requester_id) || !userById.has(r.payer_id) ||
        r.requester_id===r.payer_id || !validAmount(r.amount) || typeof r.note !== "string" ||
        !["pending","paid","declined","cancelled"].includes(r.status)) return {ok:false};
    requests.push({id:r.id,requester_id:r.requester_id,payer_id:r.payer_id,amount:r.amount,note:r.note,
      status:r.status,payment_id:r.payment_id ?? null,created_at:now()});
  }
  if (input.settlement_operator_ids !== undefined &&
      (!Array.isArray(input.settlement_operator_ids) || input.settlement_operator_ids.some((x:any)=>!userById.has(x)))) return {ok:false};
  for (const p of payments) {
    const from=userById.get(p.from_user_id)!; const to=userById.get(p.to_user_id)!;
    if (from.balance < 0 || to.balance < 0) return {ok:false};
  }
  return {ok:true,state:{currency:input.currency,minor_units:input.minor_units,users,payments,requests,splits:[],
    idempotency:[],settlement_operator_ids:input.settlement_operator_ids ?? []}};
}

export function createStage1App(initial:State = fixtureState()) {
  const app=express();
  app.use(express.json({limit:"2mb"}));
  let state:State=structuredClone(initial);

  const findUser=(handle:string)=>state.users.find(u=>u.handle===handle);
  const auth=(req:express.Request)=> {
    const h=req.header("authorization"); if(!h?.startsWith("Bearer ")) return null;
    const raw=h.slice(7).trim(); if(!raw) return null;
    const hsh=hash(raw); return state.users.find(u=>u.token_hashes.includes(hsh)) ?? null;
  };
  const authRequired=(req:express.Request,res:express.Response)=> {
    const u=auth(req); if(!u) { malformed(res,"unauthenticated","Authentication required",401); return null; } return u;
  };
  const reply=(res:express.Response,status:number,body:unknown)=>res.status(status).json(body);
  const idem=(req:express.Request,user:User):{kind:"missing"|"reuse"|"replay"|"new"; record?:IdempotencyRecord}=>{
    const key=req.header("Idempotency-Key");
    if(!key || key.length===0) return {kind:"missing"};
    const existing=state.idempotency.find(x=>x.user_id===user.id&&x.key===key&&x.method===req.method&&x.path===req.path);
    const fingerprint=canonical(req.body ?? {});
    if(existing) return existing.fingerprint===fingerprint ? {kind:"replay",record:existing} : {kind:"reuse",record:existing};
    return {kind:"new"};
  };
  const requireIdem=(req:express.Request,res:express.Response,user:User)=>{
    const key=req.header("Idempotency-Key");
    if(!key) { malformed(res,"missing_idempotency_key","Idempotency-Key is required",400); return null; }
    if(key.length>255) { malformed(res,"validation_failed","Idempotency-Key is too long",422); return null; }
    return idem(req,user);
  };
  const storeIdem=(req:express.Request,user:User,status:number,body:unknown)=>{
    state.idempotency.push({user_id:user.id,key:req.header("Idempotency-Key")!,method:req.method,path:req.path,fingerprint:canonical(req.body ?? {}),status,body:structuredClone(body)});
  };
  const publicUser=(u:User)=>({user_id:u.id,display_name:u.display_name,handle:u.handle});
  const paymentView=(p:Payment)=> {
    const from=state.users.find(u=>u.id===p.from_user_id)!; const to=state.users.find(u=>u.id===p.to_user_id)!;
    return {payment_id:p.id,from_user_id:p.from_user_id,from_handle:from.handle,to_user_id:p.to_user_id,to_handle:to.handle,
      amount:p.amount,currency:state.currency,note:p.note,visibility:p.visibility,request_id:p.request_id,created_at:p.created_at,
      ...(p.settlement_id ? {settlement_id:p.settlement_id} : {})};
  };
  const requestView=(r:MoneyRequest)=> {
    const rq=state.users.find(u=>u.id===r.requester_id)!; const py=state.users.find(u=>u.id===r.payer_id)!;
    return {request_id:r.id,requester_id:r.requester_id,requester_handle:rq.handle,payer_id:r.payer_id,payer_handle:py.handle,
      amount:r.amount,currency:state.currency,note:r.note,status:r.status,payment_id:r.payment_id,created_at:r.created_at};
  };

  app.get("/health",(_req,res)=>reply(res,200,{status:"ok"}));
  app.post("/_test/reset",(req,res)=>{
    const checked=validateFixture(req.body);
    if(!checked.ok) return malformed(res,"validation_failed","Invalid fixture",422);
    state=checked.state;
    return res.status(204).send();
  });
  app.get("/_test/export",(_req,res)=>reply(res,200,{track:"pocketful",format_version:1,state}));
  app.post("/_test/import",(req,res)=>{
    if(!req.body || req.body.track!=="pocketful" || req.body.format_version!==1 || !req.body.state)
      return malformed(res,"validation_failed","Invalid export",422);
    const s=req.body.state;
    if(!validateImportedState(s)) return malformed(res,"validation_failed","Invalid state",422);
    state=structuredClone(s);
    return res.status(204).send();
  });

  app.post("/auth/signup",(req,res)=>{
    const {email,password,display_name}=req.body ?? {};
    if(typeof email!=="string"||typeof password!=="string"||typeof display_name!=="string")
      return malformed(res,"malformed_request","Invalid field type",400);
    if(!/^[^@\s]+@[^@\s]+$/.test(email)) return malformed(res,"validation_failed","Invalid email",422);
    if(password.length<8) return malformed(res,"validation_failed","Password too short",422);
    if(state.users.some(u=>u.email===email)) return malformed(res,"email_taken","Email already registered",409);
    const handle=email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g,"_").slice(0,20);
    if(!/^[a-z0-9_]{1,20}$/.test(handle)||state.users.some(u=>u.handle===handle))
      return malformed(res,"handle_taken","Derived handle is already taken",409);
    const u:User={id:id("u"),email,password_hash:passwordHash(password),display_name,handle,balance:0,token_hashes:[]};
    const raw=token(); u.token_hashes.push(hash(raw)); state.users.push(u);
    return reply(res,201,{user_id:u.id,display_name:u.display_name,token:raw});
  });
  app.post("/auth/login",(req,res)=>{
    const {email,password}=req.body ?? {};
    if(typeof email!=="string"||typeof password!=="string") return malformed(res,"malformed_request","Invalid field type",400);
    const u=state.users.find(x=>x.email===email);
    if(!u||!passwordMatches(password,u.password_hash)) return malformed(res,"unauthenticated","Invalid credentials",401);
    const raw=token(); u.token_hashes.push(hash(raw));
    return reply(res,200,{user_id:u.id,display_name:u.display_name,token:raw});
  });
  app.get("/me",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    return reply(res,200,{...publicUser(u),balance:u.balance,currency:state.currency,minor_units:state.minor_units});
  });

  app.post("/payments",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const check=requireIdem(req,res,u); if(!check)return;
    if(check.kind==="replay") return reply(res,200,check.record!.body);
    if(check.kind==="reuse") return malformed(res,"idempotency_key_reuse","Key was used with a different request",409);
    const {to_handle,amount}=req.body??{}; const note=optionalNote(req.body); const vis=visibility(req.body);
    if(typeof to_handle!=="string"||typeof amount!=="number"||typeof note!=="string"||typeof vis!=="string")
      return malformed(res,"malformed_request","Invalid field type",400);
    if(!validAmount(amount)||note.length>200||!["public","private"].includes(vis))
      return malformed(res,"validation_failed","Invalid payment",422);
    const to=findUser(to_handle); if(!to)return malformed(res,"not_found","Recipient not found",404);
    if(to.id===u.id)return malformed(res,"self_payment","Cannot pay yourself",422);
    if(u.balance<amount)return malformed(res,"insufficient_funds","Insufficient funds",409);
    if(to.balance>Number.MAX_SAFE_INTEGER-amount)return malformed(res,"validation_failed","Balance range exceeded",422);
    u.balance-=amount; to.balance+=amount;
    const p:Payment={id:id("p"),from_user_id:u.id,to_user_id:to.id,amount,note,visibility:vis as any,request_id:null,settlement_id:null,created_at:now()};
    state.payments.push(p); const body=paymentView(p); storeIdem(req,u,201,body); return reply(res,201,body);
  });

  app.post("/requests",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const check=requireIdem(req,res,u); if(!check)return;
    if(check.kind==="replay")return reply(res,200,check.record!.body);
    if(check.kind==="reuse")return malformed(res,"idempotency_key_reuse","Key was used with a different request",409);
    const {payer_handle,amount}=req.body??{}; const note=optionalNote(req.body);
    if(typeof payer_handle!=="string"||typeof amount!=="number"||typeof note!=="string")return malformed(res,"malformed_request","Invalid field type",400);
    if(!validAmount(amount)||note.length>200)return malformed(res,"validation_failed","Invalid request",422);
    const payer=findUser(payer_handle); if(!payer)return malformed(res,"not_found","Payer not found",404);
    if(payer.id===u.id)return malformed(res,"self_request","Cannot request from yourself",422);
    const r:MoneyRequest={id:id("rq"),requester_id:u.id,payer_id:payer.id,amount,note,status:"pending",payment_id:null,created_at:now()};
    state.requests.push(r); const body=requestView(r); storeIdem(req,u,201,body); return reply(res,201,body);
  });

  app.post("/requests/:id/pay",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const check=requireIdem(req,res,u); if(!check)return;
    if(check.kind==="replay")return reply(res,200,check.record!.body);
    if(check.kind==="reuse")return malformed(res,"idempotency_key_reuse","Key was used with a different request",409);
    const r=state.requests.find(x=>x.id===req.params.id); if(!r)return malformed(res,"not_found","Request not found",404);
    if(r.payer_id!==u.id)return malformed(res,"forbidden","Only the payer may pay",403);
    const vis=visibility(req.body);
    if(typeof vis!=="string")return malformed(res,"malformed_request","Invalid field type",400);
    if(!["public","private"].includes(vis))return malformed(res,"validation_failed","Invalid visibility",422);
    if(r.status!=="pending")return malformed(res,"request_not_pending","Request is not pending",409);
    if(u.balance<r.amount)return malformed(res,"insufficient_funds","Insufficient funds",409);
    const requester=state.users.find(x=>x.id===r.requester_id)!;
    if(requester.balance>Number.MAX_SAFE_INTEGER-r.amount)return malformed(res,"validation_failed","Balance range exceeded",422);
    u.balance-=r.amount; requester.balance+=r.amount;
    const p:Payment={id:id("p"),from_user_id:u.id,to_user_id:requester.id,amount:r.amount,note:r.note,visibility:vis as any,request_id:r.id,settlement_id:null,created_at:now()};
    state.payments.push(p); r.status="paid"; r.payment_id=p.id;
    const body=paymentView(p); storeIdem(req,u,201,body); return reply(res,201,body);
  });

  const changeRequest=(action:"decline"|"cancel")=>(req:express.Request,res:express.Response)=>{
    const u=authRequired(req,res); if(!u)return;
    const r=state.requests.find(x=>x.id===req.params.id); if(!r)return malformed(res,"not_found","Request not found",404);
    if(action==="decline"&&r.payer_id!==u.id)return malformed(res,"forbidden","Only the payer may decline",403);
    if(action==="cancel"&&r.requester_id!==u.id)return malformed(res,"forbidden","Only the requester may cancel",403);
    const target=action==="decline"?"declined":"cancelled";
    if(r.status===target)return reply(res,200,requestView(r));
    if(r.status!=="pending")return malformed(res,"request_not_pending","Request is not pending",409);
    r.status=target; return reply(res,200,requestView(r));
  };
  app.post("/requests/:id/decline",changeRequest("decline"));
  app.post("/requests/:id/cancel",changeRequest("cancel"));

  app.get("/requests",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const direction=req.query.direction as string|undefined, status=req.query.status as string|undefined;
    const limitRaw=req.query.limit as string|undefined, offsetRaw=req.query.offset as string|undefined;
    const limit=limitRaw===undefined?50:Number(limitRaw), offset=offsetRaw===undefined?0:Number(offsetRaw);
    if(!Number.isInteger(limit)||limit<1||limit>200||!Number.isInteger(offset)||offset<0||
       (direction!==undefined&&!["incoming","outgoing"].includes(direction))||
       (status!==undefined&&!["pending","paid","declined","cancelled"].includes(status)))
      return malformed(res,"validation_failed","Invalid query",422);
    let rows=state.requests.filter(r=>r.requester_id===u.id||r.payer_id===u.id);
    if(direction==="incoming")rows=rows.filter(r=>r.payer_id===u.id);
    if(direction==="outgoing")rows=rows.filter(r=>r.requester_id===u.id);
    if(status)rows=rows.filter(r=>r.status===status);
    rows.sort((a,b)=>b.created_at.localeCompare(a.created_at));
    const page=rows.slice(offset,offset+limit).map(requestView);
    return reply(res,200,{requests:page,has_more:offset+limit<rows.length});
  });

  app.post("/splits",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const check=requireIdem(req,res,u); if(!check)return;
    if(check.kind==="replay")return reply(res,200,check.record!.body);
    if(check.kind==="reuse")return malformed(res,"idempotency_key_reuse","Key was used with a different request",409);
    const {amount,participant_handles}=req.body??{}; const note=optionalNote(req.body);
    if(typeof amount!=="number"||!Array.isArray(participant_handles)||typeof note!=="string")
      return malformed(res,"malformed_request","Invalid field type",400);
    if(!validAmount(amount)||participant_handles.length===0||participant_handles.some((x:any)=>typeof x!=="string")||
       new Set(participant_handles).size!==participant_handles.length||note.length>200)
      return malformed(res,"validation_failed","Invalid split",422);
    const participants=participant_handles.map((h:string)=>findUser(h));
    if(participants.some(x=>!x))return malformed(res,"not_found","Participant not found",404);
    if(!participants.some(x=>x!.id===u.id)) participants.unshift(u);
    else if(participants[0]?.id!==u.id) { /* caller position remains as supplied for share ordering */ }
    const originalHandles=participant_handles as string[];
    const n=originalHandles.length; const base=Math.floor(amount/n), extra=amount%n;
    const shares=originalHandles.map((handle:string,i:number)=>({handle,amount:base+(i<extra?1:0)}));
    const createdRequests:MoneyRequest[]=[];
    for(const s of shares){
      const p=findUser(s.handle)!;
      if(p.id===u.id)continue;
      const r:MoneyRequest={id:id("rq"),requester_id:u.id,payer_id:p.id,amount:s.amount,note,status:"pending",payment_id:null,created_at:now()};
      state.requests.push(r); createdRequests.push(r);
    }
    const split:Split={id:id("sp"),amount,note,shares,request_ids:createdRequests.map(r=>r.id),created_at:now()};
    state.splits.push(split);
    const body={split_id:split.id,amount,currency:state.currency,note,shares,requests:createdRequests.map(requestView),created_at:split.created_at};
    storeIdem(req,u,201,body); return reply(res,201,body);
  });

  app.get("/activity",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const limit= req.query.limit===undefined?50:Number(req.query.limit), offset=req.query.offset===undefined?0:Number(req.query.offset);
    if(!Number.isInteger(limit)||limit<1||limit>200||!Number.isInteger(offset)||offset<0)return malformed(res,"validation_failed","Invalid query",422);
    const rows=state.payments.filter(p=>p.visibility==="public"||p.from_user_id===u.id||p.to_user_id===u.id)
      .sort((a,b)=>b.created_at.localeCompare(a.created_at));
    return reply(res,200,{payments:rows.slice(offset,offset+limit).map(paymentView),has_more:offset+limit<rows.length});
  });

  app.post("/settlements",(req,res)=>{
    const u=authRequired(req,res); if(!u)return;
    const check=requireIdem(req,res,u); if(!check)return;
    if(check.kind==="replay")return reply(res,200,check.record!.body);
    if(check.kind==="reuse")return malformed(res,"idempotency_key_reuse","Key was used with a different request",409);
    if(!state.settlement_operator_ids.includes(u.id))return malformed(res,"forbidden","Operator permission required",403);
    const transfers=req.body?.transfers;
    if(!Array.isArray(transfers)||transfers.length<1||transfers.length>32)return malformed(res,"validation_failed","Invalid settlement batch",422);
    const deltas=new Map<string,number>(); const planned:{from:User;to:User;amount:number;note:string;visibility:"public"|"private"}[]=[];
    for(const t of transfers){
      if(!t||typeof t.from_handle!=="string"||typeof t.to_handle!=="string"||typeof t.amount!=="number")return malformed(res,"validation_failed","Invalid settlement entry",422);
      if(!validAmount(t.amount))return malformed(res,"validation_failed","Invalid amount",422);
      const from=findUser(t.from_handle),to=findUser(t.to_handle); if(!from||!to)return malformed(res,"not_found","Handle not found",404);
      if(from.id===to.id)return malformed(res,"self_payment","Cannot transfer to yourself",422);
      const note=t.note===undefined?"":t.note, vis=t.visibility===undefined?"public":t.visibility;
      if(typeof note!=="string"||note.length>200||!["public","private"].includes(vis))return malformed(res,"validation_failed","Invalid settlement entry",422);
      planned.push({from,to,amount:t.amount,note,visibility:vis as any});
      deltas.set(from.id,(deltas.get(from.id)||0)-t.amount); deltas.set(to.id,(deltas.get(to.id)||0)+t.amount);
    }
    for(const [uid,delta] of deltas){
      const balance=state.users.find(x=>x.id===uid)!.balance;
      if(balance+delta<0)return malformed(res,"insufficient_funds","Insufficient collective funds",409);
      if(balance+delta>Number.MAX_SAFE_INTEGER)return malformed(res,"validation_failed","Balance range exceeded",422);
    }
    const committed=now(), settlementId=id("st"), payments:Payment[]=[];
    for(const x of planned){x.from.balance-=x.amount;x.to.balance+=x.amount;const p:Payment={id:id("p"),from_user_id:x.from.id,to_user_id:x.to.id,amount:x.amount,note:x.note,visibility:x.visibility,request_id:null,settlement_id:settlementId,created_at:committed};state.payments.push(p);payments.push(p);}
    const body={settlement_id:settlementId,committed_at:committed,payments:payments.map(paymentView)};
    storeIdem(req,u,201,body); return reply(res,201,body);
  });
  return app;
}
