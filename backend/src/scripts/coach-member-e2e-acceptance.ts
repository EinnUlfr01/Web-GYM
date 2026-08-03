import * as bcrypt from 'bcryptjs';
import { closePool, query } from '../config/database';

if (process.env.COACH_ACCEPTANCE !== '1' || !process.env.DB_NAME?.startsWith('GYMFIT_DB_COACH_E2E_FIX_')) throw new Error('Coach Member E2E acceptance requires COACH_ACCEPTANCE=1 and an isolated GYMFIT_DB_COACH_E2E_FIX_* database');
const base = process.env.COACH_API_BASE || 'http://localhost:5000/api';
const suffix = 'fix20260803';
const password = 'CoachMemberE2E#20260803';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const addDays = (value: string, days: number) => { const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
const emails = { coachA:`e2e-coach-a-${suffix}@example.test`, coachB:`e2e-coach-b-${suffix}@example.test`, memberA:`e2e-member-a-${suffix}@example.test`, memberB:`e2e-member-b-${suffix}@example.test` };
type Key = keyof typeof emails;
type Account = { id:number; email:string; password:string; token?:string };
type Json = Record<string, unknown>;
type ApiResult = { status:number; body:unknown };
const accounts:Record<Key,Account> = Object.fromEntries(Object.entries(emails).map(([key,email])=>[key,{id:0,email,password}])) as Record<Key,Account>;
const check = (value:boolean,message:string) => { if (!value) throw new Error(`ASSERTION_FAILED ${message}`); console.log(`PASS ${message}`); };
const bodyData = <T,>(result:ApiResult):T => { const body=result.body as Json; return body.data as T; };

async function call(method:string,path:string,account?:Account,body?:unknown):Promise<ApiResult> {
  const response = await fetch(`${base}${path}`, { method, headers:{'Content-Type':'application/json', ...(account?.token?{Authorization:`Bearer ${account.token}`}:{})}, body:body===undefined?undefined:JSON.stringify(body) });
  const text = await response.text(); let parsed:unknown = null; try { parsed=JSON.parse(text); } catch { parsed={message:text}; }
  return { status:response.status, body:parsed };
}

async function login(account:Account) { const result=await call('POST','/auth/login',undefined,{email:account.email,password:account.password}); check(result.status===200,`${account.email} login`); account.token=String((bodyData<{accessToken:string}>(result)).accessToken); }

async function cleanup() {
  const users=await query<{id:number}>('SELECT id FROM dbo.Users WHERE email IN (@coachA,@coachB,@memberA,@memberB)',emails);
  const ids=users.recordset.map(row=>Number(row.id)); if(!ids.length) return;
  const list=ids.join(',');
  await query(`DELETE FROM dbo.MemberWorkoutSetLogs WHERE session_exercise_id IN (SELECT se.id FROM dbo.MemberWorkoutSessionExercises se JOIN dbo.MemberWorkoutSessions s ON s.id=se.session_id WHERE s.member_id IN (${list}))`);
  await query(`DELETE FROM dbo.MemberWorkoutSessionExercises WHERE session_id IN (SELECT id FROM dbo.MemberWorkoutSessions WHERE member_id IN (${list}))`);
  await query(`DELETE FROM dbo.MemberWorkoutSessions WHERE member_id IN (${list})`);
  await query(`DELETE FROM dbo.CoachProgramSchedules WHERE assignment_id IN (SELECT id FROM dbo.CoachProgramAssignments WHERE member_id IN (${list}) OR coach_id IN (${list}))`);
  await query(`DELETE FROM dbo.CoachProgramAssignments WHERE member_id IN (${list}) OR coach_id IN (${list})`);
  await query(`DELETE FROM dbo.WorkoutProgramExercises WHERE program_day_id IN (SELECT d.id FROM dbo.WorkoutProgramDays d JOIN dbo.WorkoutPrograms p ON p.id=d.program_id WHERE p.owner_coach_id IN (${list}))`);
  await query(`DELETE FROM dbo.WorkoutProgramDays WHERE program_id IN (SELECT id FROM dbo.WorkoutPrograms WHERE owner_coach_id IN (${list}))`);
  await query(`DELETE FROM dbo.WorkoutPrograms WHERE owner_coach_id IN (${list})`);
  await query('DELETE FROM dbo.Exercises WHERE slug=@slug',{slug:`coach-member-e2e-exercise-${suffix}`});
  await query(`DELETE FROM dbo.CRMCustomers WHERE user_id IN (${list})`);
  await query(`DELETE FROM dbo.AuthSessions WHERE user_id IN (${list})`);
  await query(`DELETE FROM dbo.CartItems WHERE cart_id IN (SELECT id FROM dbo.Carts WHERE buyer_id IN (${list}))`);
  await query(`DELETE FROM dbo.Carts WHERE buyer_id IN (${list})`);
  await query(`DELETE FROM dbo.Users WHERE id IN (${list})`);
}

async function seedUsers() {
  await cleanup(); const hash=await bcrypt.hash(password,10);
  for(const [key,email] of Object.entries(emails)) { const role=key.startsWith('coach')?'coach':'member'; const result=await query<{id:number}>(`INSERT dbo.Users(email,password,name,role,is_active,email_verified,token_version) OUTPUT INSERTED.id VALUES(@email,@password,@name,@role,1,1,0)`,{email,password:hash,name:`E2E ${key}`,role}); accounts[key as Key].id=Number(result.recordset[0].id); }
  await query(`INSERT dbo.CRMCustomers(user_id,assigned_coach_id) VALUES(@memberA,@coachA),(@memberB,@coachB)`,{memberA:accounts.memberA.id,memberB:accounts.memberB.id,coachA:accounts.coachA.id,coachB:accounts.coachB.id});
}

async function run() {
  await seedUsers(); await login(accounts.coachA); await login(accounts.coachB); await login(accounts.memberA); await login(accounts.memberB);
  check((await call('GET','/member/workouts/current')).status===401,'guest denied Member Workout API');
  check((await call('GET','/member/workouts/current',accounts.coachA)).status===403,'Coach denied Member Workout API');
  let exercise=await query<{id:number}>('SELECT TOP 1 id FROM dbo.Exercises WHERE is_active=1 ORDER BY id'); if(!exercise.recordset[0]) exercise=await query<{id:number}>(`INSERT dbo.Exercises(name,slug,description,instructions,muscle_group,equipment,difficulty,is_active) OUTPUT INSERTED.id VALUES(N'Member E2E Exercise',@slug,N'Acceptance exercise',N'Controlled form.',N'full_body',N'bodyweight',N'BEGINNER',1)`,{slug:`coach-member-e2e-exercise-${suffix}`}); check(Boolean(exercise.recordset[0]),'active exercise seed exists'); const exerciseId=Number(exercise.recordset[0].id);
  const program=await call('POST','/coach/workout-programs',accounts.coachA,{name:'Member E2E Program',description:'Acceptance program',goal:'STRENGTH',difficulty:'INTERMEDIATE',durationWeeks:1,daysPerWeek:2}); check(program.status===201,'Coach creates E2E program'); const programId=Number((bodyData<Json>(program)).id);
  const dayOne=await call('POST',`/coach/workout-programs/${programId}/days`,accounts.coachA,{weekNumber:1,dayNumber:1,title:'Monday Strength'}); const dayTwo=await call('POST',`/coach/workout-programs/${programId}/days`,accounts.coachA,{weekNumber:1,dayNumber:2,title:'Tuesday Strength'}); check(dayOne.status===201&&dayTwo.status===201,'Coach creates two program days');
  const dayOneId=Number((bodyData<Json>(dayOne)).id); const dayTwoId=Number((bodyData<Json>(dayTwo)).id);
  const programExercise=await call('POST',`/coach/workout-program-days/${dayOneId}/exercises`,accounts.coachA,{exerciseId,targetSets:2,targetRepsMin:8,targetRepsMax:12,targetWeight:20,restSeconds:60}); const secondExercise=await call('POST',`/coach/workout-program-days/${dayTwoId}/exercises`,accounts.coachA,{exerciseId,targetSets:2,targetRepsMin:8,targetRepsMax:12,targetWeight:15,restSeconds:60}); check(programExercise.status===201&&secondExercise.status===201,'Coach adds snapshot source exercises'); const programExerciseId=Number((bodyData<Json>(programExercise)).id);
  const assignment=await call('POST','/coach/assignments',accounts.coachA,{memberId:accounts.memberA.id,programId,startDate:today,scheduleTimezone:'Asia/Ho_Chi_Minh',note:'E2E'}); check(assignment.status===201,'Coach assigns Member A in scope'); const assignmentId=Number((bodyData<Json>(assignment)).id);
  const generated=await call('POST',`/coach/assignments/${assignmentId}/schedules/generate`,accounts.coachA,{fromDate:today,horizonDays:2}); check(generated.status===200&&Number((bodyData<Json>(generated)).inserted)===2,'Coach generates dated schedules');
  await query(`UPDATE dbo.CoachProgramSchedules SET scheduled_date=CONVERT(date,SYSUTCDATETIME()) WHERE assignment_id=@assignmentId AND program_day_id=@dayId`,{assignmentId,dayId:dayTwoId});
  await query(`INSERT dbo.CoachProgramSchedules(assignment_id,program_day_id,scheduled_date,status) VALUES(@assignmentId,@dayId,DATEADD(day,-1,CONVERT(date,SYSUTCDATETIME())),N'SCHEDULED')`,{assignmentId,dayId:dayOneId});
  const schedules=await call('GET','/member/workouts/schedules?limit=50',accounts.memberA); check(schedules.status===200&&bodyData<{items:Json[]}>(schedules).items.length===3,'Member sees own schedule list'); const scheduleItems=bodyData<{items:Array<{id:number;program_day_id:number;status:string;can_start?:boolean}>}>(schedules).items; const firstSchedule=scheduleItems.find(item=>item.program_day_id===dayOneId&&item.can_start)!; const secondSchedule=scheduleItems.find(item=>item.program_day_id===dayTwoId)!;
  const current=await call('GET','/member/workouts/current',accounts.memberA); const currentItems=bodyData<{upcomingSchedules:Array<{scheduled_date:string;can_start:boolean}>}>(current).upcomingSchedules; check(current.status===200&&currentItems.length===2&&currentItems.every(item=>item.scheduled_date>=today),'Current endpoint excludes past schedules and exposes start eligibility');
  check((await call('GET',`/member/workouts/schedules/${firstSchedule.id}`,accounts.memberB)).status===404,'Member B cannot read Member A schedule');
  const starts=await Promise.all([call('POST',`/member/workouts/schedules/${firstSchedule.id}/start`,accounts.memberA),call('POST',`/member/workouts/schedules/${firstSchedule.id}/start`,accounts.memberA)]); check(starts.map(item=>item.status).sort().join(',')==='201,409','Concurrent Start Session has one winner'); const started=starts.find(item=>item.status===201)!; const sessionId=Number((bodyData<Json>(started)).id);
  const sessionBefore=await call('GET',`/member/workouts/sessions/${sessionId}`,accounts.memberA); check(sessionBefore.status===200&&bodyData<{exercises:Array<{target_weight:number|null}>}>(sessionBefore).exercises[0].target_weight===20,'Start creates immutable target snapshot'); const sessionExerciseId=Number(bodyData<{exercises:Array<{session_exercise_id:number}>}>(sessionBefore).exercises[0].session_exercise_id);
  const changed=await call('PATCH',`/coach/workout-program-exercises/${programExerciseId}`,accounts.coachA,{targetSets:4,targetRepsMin:10,targetRepsMax:10,targetWeight:99,restSeconds:30}); check(changed.status===200,'Coach edits source program after Start'); const sessionAfterEdit=await call('GET',`/member/workouts/sessions/${sessionId}`,accounts.memberA); check(bodyData<{exercises:Array<{target_weight:number|null}>}>(sessionAfterEdit).exercises[0].target_weight===20,'Snapshot remains immutable after Program edit');
  const invalidSet=await call('POST',`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`,accounts.memberA,{set_number:1,completed:true}); check(invalidSet.status===400,'Completed set without measurement rejected');
  const setWrites=await Promise.all([call('POST',`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`,accounts.memberA,{set_number:1,reps:10,weight_kg:20,completed:true}),call('POST',`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`,accounts.memberA,{set_number:1,reps:10,weight_kg:20,completed:true})]); check(setWrites.map(item=>item.status).sort().join(',')==='201,409','Duplicate set number conflict protected'); const createdSet=setWrites.find(item=>item.status===201)!; const createdSetId=Number(bodyData<Json>(createdSet).id);
  const updatedSet=await call('PATCH',`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${createdSetId}`,accounts.memberA,{reps:11,weight_kg:22,completed:true}); check(updatedSet.status===200&&Number((bodyData<Json>(updatedSet)).reps)===11,'Set update changes an existing log');
  const draftSet=await call('POST',`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`,accounts.memberA,{set_number:2,completed:false,note:'draft'}); check(draftSet.status===201&&bodyData<Json>(draftSet).completed===false,'Draft set is supported'); const draftId=Number(bodyData<Json>(draftSet).id); const deletedDraft=await call('DELETE',`/member/workouts/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${draftId}`,accounts.memberA); check(deletedDraft.status===200,'Set delete succeeds before terminal state');
  const completed=await call('POST',`/member/workouts/sessions/${sessionId}/complete`,accounts.memberA); check(completed.status===200&&bodyData<Json>(completed).status==='COMPLETED','Complete transition succeeds');
  const secondStart=await call('POST',`/member/workouts/schedules/${secondSchedule.id}/start`,accounts.memberA); check(secondStart.status===201,'Second schedule starts after first completes'); const secondSessionId=Number((bodyData<Json>(secondStart)).id); const abandoned=await call('POST',`/member/workouts/sessions/${secondSessionId}/abandon`,accounts.memberA); check(abandoned.status===200&&bodyData<Json>(abandoned).status==='ABANDONED','Abandon transition succeeds');
  const progressSessions=await call('GET','/member/workouts/progress/sessions?status=COMPLETED&limit=50',accounts.memberA); check(progressSessions.status===200&&bodyData<{items:Array<{program_name:string;completed_at:string|null}>}>(progressSessions).items.some(item=>item.program_name&&item.completed_at),'Dedicated progress sessions returns flat completed rows');
  const exerciseProgress=await call('GET',`/member/workouts/progress/exercises/${exerciseId}`,accounts.memberA); check(exerciseProgress.status===200&&bodyData<{exercise:{id:number};history:Json[]}>(exerciseProgress).exercise.id===exerciseId&&bodyData<{history:Json[]}>(exerciseProgress).history.length>0,'Exercise progress returns self-scoped history');
  check((await call('GET',`/member/workouts/progress/exercises/${exerciseId}`,accounts.memberB)).status===404,'Member B cannot read Member A exercise progress');
  const programB=await call('POST','/coach/workout-programs',accounts.coachB,{name:'Future Member E2E Program',description:'Future assignment',goal:'GENERAL_FITNESS',difficulty:'BEGINNER',durationWeeks:1,daysPerWeek:1}); const programBId=Number(bodyData<Json>(programB).id); const futureAssignment=await call('POST','/coach/assignments',accounts.coachB,{memberId:accounts.memberB.id,programId:programBId,startDate:addDays(today,1),scheduleTimezone:'Asia/Ho_Chi_Minh'}); check(futureAssignment.status===201,'Future assignment is created for date-range test'); const futureCurrent=await call('GET','/member/workouts/current',accounts.memberB); check(futureCurrent.status===200&&bodyData<Json>(futureCurrent).assignment===null,'Future assignment is excluded from current Member state'); const invalidTimezone=await call('POST','/coach/assignments',accounts.coachB,{memberId:accounts.memberB.id,programId:programBId,startDate:today,scheduleTimezone:'Mars/Olympus'}); check(invalidTimezone.status===422,'Invalid IANA timezone returns 422');
  check((await call('GET',`/member/workouts/sessions/${sessionId}`,accounts.memberB)).status===404,'Member B cannot read Member A session'); check((await call('GET',`/coach/members/${accounts.memberA.id}/sessions`,accounts.coachB)).status===404,'Coach B cannot read Member A session');
  const coachSessions=await call('GET',`/coach/members/${accounts.memberA.id}/sessions?limit=50`,accounts.coachA); check(coachSessions.status===200&&bodyData<{items:Json[]}>(coachSessions).items.some(item=>item.source==='member'&&item.blockedReason===null),'Coach sees real Member sessions and set summary');
  const coachDetail=await call('GET',`/coach/members/${accounts.memberA.id}/sessions/${sessionId}`,accounts.coachA); check(coachDetail.status===200&&bodyData<Json>(coachDetail).blockedReason===null,'Coach sees real snapshot/set detail');
  const progress=await call('GET',`/coach/members/${accounts.memberA.id}/progress`,accounts.coachA); const progressData=bodyData<Json>(progress); check(progress.status===200&&progressData.blockedReason===null&&Number(progressData.training_volume)===242,'Coach sees real progress volume'); check(Number(progressData.due_schedules)===3&&Number(progressData.completed_due_schedules)===1&&Math.abs(Number(progressData.completion_rate)-100/3)<0.0001,'Progress due/completion formula is correct');
  const state=await query<{session_status:string;schedule_status:string}>(`SELECT ms.status AS session_status,cs.status AS schedule_status FROM dbo.MemberWorkoutSessions ms JOIN dbo.CoachProgramSchedules cs ON cs.id=ms.schedule_id WHERE ms.id=@sessionId`,{sessionId}); check(state.recordset[0].session_status==='COMPLETED'&&state.recordset[0].schedule_status==='COMPLETED','Completed state is persisted atomically');
  console.log(JSON.stringify({verdict:'PASS',database:process.env.DB_NAME,accounts:{coachA:emails.coachA,coachB:emails.coachB,memberA:emails.memberA,memberB:emails.memberB},password,programId,assignmentId,sessionId,secondSessionId}));
}

if(process.argv.includes('--cleanup')) cleanup().then(()=>console.log(`CLEANUP_PASS ${process.env.DB_NAME}`)).catch(error=>{console.error(error);process.exitCode=1;}).finally(closePool); else run().catch(error=>{console.error(error);process.exitCode=1;}).finally(closePool);
