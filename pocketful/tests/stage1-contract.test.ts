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
