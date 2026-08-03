import * as bcrypt from 'bcryptjs';
import { closePool, query } from '../config/database';

if (process.env.COACH_ACCEPTANCE !== '1' || !process.env.DB_NAME?.startsWith('GYMFIT_DB_COACH_ACCEPTANCE_')) throw new Error('Coach acceptance requires COACH_ACCEPTANCE=1 and an isolated GYMFIT_DB_COACH_ACCEPTANCE_* database');
const base = process.env.COACH_API_BASE || 'http://localhost:5000/api';
const suffix = '20260803';
const password = 'CoachAccept#20260803';
const emails = { coachA:`coach-a-${suffix}@example.test`, coachB:`coach-b-${suffix}@example.test`, memberA:`member-a-${suffix}@example.test`, memberB:`member-b-${suffix}@example.test` };
type Account = { id:number; email:string; password:string; token?:string };
const accounts:Record<keyof typeof emails,Account> = Object.fromEntries(Object.entries(emails).map(([key,email])=>[key,{id:0,email,password}])) as Record<keyof typeof emails,Account>;
const check = (value:boolean,message:string) => { if (!value) throw new Error(`ASSERTION_FAILED ${message}`); console.log(`PASS ${message}`); };

async function cleanup() {
  const users = await query<{ id:number }>('SELECT id FROM dbo.Users WHERE email IN (@coachA,@coachB,@memberA,@memberB)', { coachA:emails.coachA,coachB:emails.coachB,memberA:emails.memberA,memberB:emails.memberB });
  const ids = users.recordset.map(row=>Number(row.id)); if (!ids.length) return;
  const csv = ids.join(',');
  await query(`DELETE FROM dbo.CoachProgramSchedules WHERE assignment_id IN (SELECT id FROM dbo.CoachProgramAssignments WHERE member_id IN (${ids.filter((_,index)=>index>=2).join(',')||'-1'}))`);
  await query(`DELETE FROM dbo.CoachProgramAssignments WHERE member_id IN (${ids.filter((_,index)=>index>=2).join(',')||'-1'}) OR coach_id IN (${ids.slice(0,2).join(',')||'-1'})`);
  await query(`DELETE FROM dbo.WorkoutProgramExercises WHERE program_day_id IN (SELECT id FROM dbo.WorkoutProgramDays WHERE program_id IN (SELECT id FROM dbo.WorkoutPrograms WHERE owner_coach_id IN (${ids.slice(0,2).join(',')||'-1'})))`);
  await query(`DELETE FROM dbo.WorkoutProgramDays WHERE program_id IN (SELECT id FROM dbo.WorkoutPrograms WHERE owner_coach_id IN (${ids.slice(0,2).join(',')||'-1'}))`);
  await query(`DELETE FROM dbo.WorkoutPrograms WHERE owner_coach_id IN (${ids.slice(0,2).join(',')||'-1'})`);
  await query(`DELETE FROM dbo.Exercises WHERE slug=@slug`, { slug:`coach-acceptance-exercise-${suffix}` });
  await query(`DELETE FROM dbo.WorkoutSessions WHERE user_id IN (${csv}) OR workout_id IN (SELECT id FROM dbo.Workouts WHERE coach_id IN (${ids.slice(0,2).join(',')||'-1'}))`);
  await query(`DELETE FROM dbo.WorkoutExercises WHERE workout_id IN (SELECT id FROM dbo.Workouts WHERE coach_id IN (${ids.slice(0,2).join(',')||'-1'}))`);
  await query(`DELETE FROM dbo.Workouts WHERE coach_id IN (${ids.slice(0,2).join(',')||'-1'})`);
  await query(`DELETE FROM dbo.CRMCustomers WHERE user_id IN (${csv})`);
  await query(`DELETE FROM dbo.AuthSessions WHERE user_id IN (${csv})`);
  await query(`DELETE FROM dbo.CartItems WHERE cart_id IN (SELECT id FROM dbo.Carts WHERE buyer_id IN (${csv}))`);
  await query(`DELETE FROM dbo.Carts WHERE buyer_id IN (${csv})`);
  await query(`DELETE FROM dbo.Points WHERE user_id IN (${csv})`);
  await query(`DELETE FROM dbo.Users WHERE id IN (${csv})`);
}

async function seed() {
  await cleanup(); const hash = await bcrypt.hash(password, 10);
  for (const [key,email] of Object.entries(emails)) { const role = key.startsWith('coach')?'coach':'member'; const result = await query<{id:number}>(`INSERT dbo.Users(email,password,name,role,is_active,email_verified,token_version) OUTPUT INSERTED.id VALUES(@email,@password,@name,@role,1,1,0)`, { email,password:hash,name:key==='coachA'?'Coach Acceptance A':key==='coachB'?'Coach Acceptance B':key==='memberA'?'Member Acceptance A':'Member Acceptance B',role }); accounts[key as keyof typeof emails].id = Number(result.recordset[0].id); }
  await query(`INSERT dbo.CRMCustomers(user_id,assigned_coach_id) VALUES(@memberA,@coachA),(@memberB,@coachB)`, { memberA:accounts.memberA.id,memberB:accounts.memberB.id,coachA:accounts.coachA.id,coachB:accounts.coachB.id });
  let exercise = await query<{id:number}>('SELECT TOP 1 id FROM dbo.Exercises WHERE is_active=1 ORDER BY id');
  if (!exercise.recordset[0]) exercise = await query<{id:number}>(`INSERT dbo.Exercises(name,slug,description,instructions,muscle_group,equipment,difficulty,is_active) OUTPUT INSERTED.id VALUES(N'Coach Acceptance Exercise',@slug,N'Acceptance-only active Exercise',N'Use controlled form.',N'full_body',N'bodyweight',N'intermediate',1)`, { slug:`coach-acceptance-exercise-${suffix}` });
  check(Boolean(exercise.recordset[0]),'active exercise seed exists');
  const workout = await query<{id:number}>(`INSERT dbo.Workouts(name,description,coach_id,difficulty,is_active) OUTPUT INSERTED.id VALUES(N'Coach acceptance legacy workout',N'Read-only acceptance workout',@coach,N'intermediate',1)`, { coach:accounts.coachA.id });
  await query(`INSERT dbo.WorkoutExercises(workout_id,name,sets,reps,rest_seconds,sort_order) VALUES(@workout,N'Acceptance Exercise',3,10,60,1)`, { workout:workout.recordset[0].id });
  await query(`INSERT dbo.WorkoutSessions(user_id,workout_id,started_at,completed_at,status,notes) VALUES(@member,@workout,DATEADD(day,-2,SYSUTCDATETIME()),DATEADD(minute,45,DATEADD(day,-2,SYSUTCDATETIME())),N'completed',N'Coach read-only acceptance session')`, { member:accounts.memberA.id,workout:workout.recordset[0].id });
  return Number(exercise.recordset[0].id);
}

async function call(method:string,path:string,account?:Account,body?:unknown) { const response = await fetch(`${base}${path}`, { method, headers:{ 'Content-Type':'application/json', ...(account?.token?{Authorization:`Bearer ${account.token}`}:{}) }, body:body===undefined?undefined:JSON.stringify(body) }); const text = await response.text(); let data:unknown=null; try{data=JSON.parse(text);}catch{} return { status:response.status,data:data as {data:any;message?:string} }; }
async function login(account:Account) { const result=await call('POST','/auth/login',undefined,{email:account.email,password:account.password}); check(result.status===200,`${account.email} login`); account.token=String(result.data.data.accessToken); }

async function run() {
  const exerciseId = await seed(); await login(accounts.coachA); await login(accounts.coachB); await login(accounts.memberA);
  check((await call('GET','/coach/dashboard')).status===401,'guest cannot access Coach API');
  check((await call('GET','/coach/dashboard',accounts.memberA)).status===403,'Member cannot access Coach API');
  check((await call('GET','/coach/dashboard',accounts.coachA)).status===200,'Coach dashboard access');
  const ownerSpoof = await call('POST','/coach/workout-programs',accounts.coachA,{name:'Spoof',goal:'GENERAL_FITNESS',difficulty:'BEGINNER',durationWeeks:4,daysPerWeek:3,owner_coach_id:accounts.coachB.id}); check(ownerSpoof.status===400,'owner_coach_id rejected from body');
  const programA = await call('POST','/coach/workout-programs',accounts.coachA,{name:'Coach A Program',description:'Acceptance program',goal:'STRENGTH',difficulty:'INTERMEDIATE',durationWeeks:1,daysPerWeek:1}); check(programA.status===201,'Coach A creates owned Program'); const programAId=Number(programA.data.data.id);
  const programB = await call('POST','/coach/workout-programs',accounts.coachB,{name:'Coach B Program',description:'Private program',goal:'MOBILITY',difficulty:'BEGINNER',durationWeeks:1,daysPerWeek:1}); check(programB.status===201,'Coach B creates owned Program'); const programBId=Number(programB.data.data.id);
  check((await call('GET',`/coach/workout-programs/${programBId}`,accounts.coachA)).status===404,'Coach A cannot read Coach B Program'); check((await call('PATCH',`/coach/workout-programs/${programBId}`,accounts.coachA,{name:'IDOR',goal:'GENERAL_FITNESS',difficulty:'BEGINNER',durationWeeks:1,daysPerWeek:1})).status===404,'Coach A cannot edit Coach B Program');
  const day = await call('POST',`/coach/workout-programs/${programAId}/days`,accounts.coachA,{weekNumber:1,dayNumber:1,title:'Acceptance Day'}); check(day.status===201,'Coach creates Program Day'); const dayId=Number(day.data.data.id);
  const programExercise = await call('POST',`/coach/workout-program-days/${dayId}/exercises`,accounts.coachA,{exerciseId,targetSets:3,targetRepsMin:8,targetRepsMax:12,restSeconds:60}); check(programExercise.status===201,'Coach adds active Exercise to Program');
  check((await call('POST',`/coach/workout-programs/${programAId}/days/reorder`,accounts.coachA,{ids:[dayId,dayId]})).status===400,'duplicate Day reorder rejected');
  check((await call('GET',`/coach/members/${accounts.memberB.id}`,accounts.coachA)).status===404,'Coach A cannot read Member B'); check((await call('GET','/coach/members',accounts.coachA)).data.data.items.every((item:any)=>Number(item.id)!==accounts.memberB.id),'Member list excludes Member B');
  const assignmentBody={memberId:accounts.memberA.id,programId:programAId,startDate:'2026-08-03',scheduleTimezone:'Asia/Ho_Chi_Minh',note:'Acceptance'};
  check((await call('POST','/coach/assignments',accounts.coachA,{...assignmentBody,coach_id:accounts.coachB.id})).status===400,'coach_id rejected from Assignment body');
  const assignments=await Promise.all([call('POST','/coach/assignments',accounts.coachA,assignmentBody),call('POST','/coach/assignments',accounts.coachA,assignmentBody)]); check(assignments.map(item=>item.status).sort().join(',')==='201,409','duplicate active Assignment concurrency protected'); const assignment=assignments.find(item=>item.status===201)!; const assignmentId=Number(assignment.data.data.id);
  check((await call('POST','/coach/assignments',accounts.coachA,{...assignmentBody,memberId:accounts.memberB.id})).status===404,'Coach A cannot assign Member B');
  const generated=await call('POST',`/coach/assignments/${assignmentId}/schedules/generate`,accounts.coachA,{fromDate:'2026-08-03',horizonDays:7}); check(generated.status===200 && Number(generated.data.data.inserted)>=1,'deterministic schedule generation');
  const duplicateGeneration=await Promise.all([call('POST',`/coach/assignments/${assignmentId}/schedules/generate`,accounts.coachA,{fromDate:'2026-08-03',horizonDays:7}),call('POST',`/coach/assignments/${assignmentId}/schedules/generate`,accounts.coachA,{fromDate:'2026-08-03',horizonDays:7})]); check(duplicateGeneration.every(item=>item.status===200) && duplicateGeneration.every(item=>Number(item.data.data.inserted)===0),'duplicate schedule generation idempotent under concurrency');
  const scheduleList=await call('GET','/coach/schedules?limit=50',accounts.coachA); check(scheduleList.status===200 && scheduleList.data.data.items.length>=1,'Coach reads scoped schedules');
  check((await call('GET',`/coach/members/${accounts.memberA.id}/sessions`,accounts.coachA)).status===200,'Coach reads scoped legacy session history'); check((await call('GET',`/coach/members/${accounts.memberB.id}/sessions`,accounts.coachA)).status===404,'Coach cannot read out-of-scope session history');
  const progress=await call('GET',`/coach/members/${accounts.memberA.id}/progress`,accounts.coachA); check(progress.status===200 && progress.data.data.blockedReason===null && progress.data.data.dataSources.memberProgressFlow===true,'Coach progress reads the Member progress contract');
  check((await call('GET',`/coach/assignments/${assignmentId}`,accounts.coachB)).status===404,'Coach B cannot read Coach A Assignment');
  console.log(JSON.stringify({verdict:'PASS',database:process.env.DB_NAME,accounts:{coachA:emails.coachA,coachB:emails.coachB,memberA:emails.memberA,memberB:emails.memberB},password,programAId,programBId,assignmentId,exerciseId}));
}

if (process.argv.includes('--cleanup')) cleanup().then(()=>console.log(`CLEANUP_PASS ${process.env.DB_NAME}`)).catch(error=>{console.error(error);process.exitCode=1;}).finally(closePool); else run().catch(error=>{console.error(error);process.exitCode=1;}).finally(closePool);
