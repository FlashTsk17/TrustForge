import { describe, expect, it } from "vitest";
import request from "supertest";
import { createStage1App } from "../src/stage1.js";

async function reset(app:any) {
  await request(app).post("/_test/reset").send({
    currency:"EUR",minor_units:2,
    users:[
      {id:"u_ada",email:"ada@example.com",password:"correct horse",display_name:"Ada",handle:"ada",balance:10000},
      {id:"u_bob",email:"bob@example.com",password:"correct horse",display_name:"Bob",handle:"bob",balance:2500}
    ],payments:[],requests:[]
  }).expect(204);
}
async function login(app:any,email:string){
  const r=await request(app).post("/auth/login").send({email:email,password:"correct horse"}).expect(200);
  return r.body.token;
}

describe("T12 official Stage 1 contract",()=>{
  it("supports auth, payment idempotency and exact replay",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    const first=await request(app).post("/payments").set("Authorization","Bearer "+ada).set("Idempotency-Key","pay-1")
      .send({to_handle:"bob",amount:1500,note:"dinner",visibility:"public"}).expect(201);
    const replay=await request(app).post("/payments").set("Authorization","Bearer "+ada).set("Idempotency-Key","pay-1")
      .send({visibility:"public",note:"dinner",amount:1500,to_handle:"bob"}).expect(200);
    expect(replay.body).toEqual(first.body);
    await request(app).get("/me").set("Authorization","Bearer "+ada).expect(200).then(r=>expect(r.body.balance).toBe(8500));
    await request(app).post("/payments").set("Authorization","Bearer "+ada).set("Idempotency-Key","pay-1")
      .send({to_handle:"bob",amount:1400}).expect(409);
  
  it("creates pending requests for every non-caller split participant with exact rounding",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    await request(app).post("/_test/reset").send({
      currency:"EUR",minor_units:2,
      users:[
        {id:"u_ada",email:"ada@example.com",password:"correct horse",display_name:"Ada",handle:"ada",balance:10000},
        {id:"u_bob",email:"bob@example.com",password:"correct horse",display_name:"Bob",handle:"bob",balance:2500},
        {id:"u_cy",email:"cy@example.com",password:"correct horse",display_name:"Cy",handle:"cy",balance:0}
      ],payments:[],requests:[]
    }).expect(204);
    const r=await request(app).post("/splits").set("Authorization","Bearer "+ada).set("Idempotency-Key","split-1")
      .send({amount:5,participant_handles:["ada","bob","cy"],note:"meal"}).expect(201);
    expect(r.body.shares).toEqual([
      {handle:"ada",amount:2},{handle:"bob",amount:2},{handle:"cy",amount:1}
    ]);
    expect(r.body.requests).toHaveLength(2);
  
  it("serializes concurrent identical idempotent writes to one effect",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    const calls=Array.from({length:10},()=>request(app).post("/payments")
      .set("Authorization","Bearer "+ada).set("Idempotency-Key","concurrent-1")
      .send({to_handle:"bob",amount:100}));
    const responses=await Promise.all(calls);
    expect(responses.filter(r=>r.status===201)).toHaveLength(1);
    expect(responses.filter(r=>r.status===200)).toHaveLength(9);
    const balances=await request(app).get("/me").set("Authorization","Bearer "+ada).expect(200);
    expect(balances.body.balance).toBe(9900);
  });
});

  it("allows a request above the payer balance and rejects only the later payment",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    const created=await request(app).post("/requests").set("Authorization","Bearer "+ada).set("Idempotency-Key","rq-1")
      .send({payer_handle:"bob",amount:5000}).expect(201);
    const bob=await login(app,"bob@example.com");
    await request(app).post("/requests/"+created.body.request_id+"/pay").set("Authorization","Bearer "+bob).set("Idempotency-Key","pay-rq")
      .send({}).expect(409);
    await request(app).get("/requests").set("Authorization","Bearer "+bob).expect(200)
      .then(r=>expect(r.body.requests[0].status).toBe("pending"));
  });

  it("rejects malformed imported state without replacing the current state",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    await request(app).post("/_test/import").send({
      track:"pocketful",format_version:1,
      state:{currency:"EUR",minor_units:2,users:[],payments:[],requests:[],splits:"invalid",idempotency:[],settlement_operator_ids:[]}
    }).expect(422);
    await request(app).get("/me").set("Authorization","Bearer "+ada).expect(200)
      .then(r=>expect(r.body.balance).toBe(10000));
  });
});

  it("keeps failed 4xx idempotency keys reusable",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    await request(app).post("/payments").set("Authorization","Bearer "+ada).set("Idempotency-Key","retry")
      .send({to_handle:"missing",amount:100}).expect(404);
    await request(app).post("/payments").set("Authorization","Bearer "+ada).set("Idempotency-Key","retry")
      .send({to_handle:"bob",amount:100}).expect(201);
  });

  it("preserves state through export/import",async()=>{
    const app=createStage1App(); await reset(app);
    const ada=await login(app,"ada@example.com");
    await request(app).post("/payments").set("Authorization","Bearer "+ada).set("Idempotency-Key","exp")
      .send({to_handle:"bob",amount:100}).expect(201);
    const exported=await request(app).get("/_test/export").expect(200);
    await request(app).post("/_test/reset").send({currency:"EUR",minor_units:2,users:[],payments:[],requests:[]}).expect(204);
    await request(app).post("/_test/import").send(exported.body).expect(204);
    const me=await request(app).get("/me").set("Authorization","Bearer "+ada).expect(200);
    expect(me.body.balance).toBe(9900);
  });
});
