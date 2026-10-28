import { staffJobRole, BOOKABLE_STAFF_JOB_ROLES } from '../users/staff-job-roles.js';
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { OperationalLogsService } from '../operational-logs/operational-logs.service.js';

const TZ = 'Asia/Manila';
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const salonToday = () => new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function scheduleDate(value: unknown) {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value+'T00:00:00Z')) || new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)
    throw new BadRequestException('Choose a valid schedule date.');
  return value;
}
export function weekDates(value: unknown) {
  const monday = scheduleDate(value);
  if (new Date(monday+'T00:00:00Z').getUTCDay() !== 1) throw new BadRequestException('The week must start on Monday.');
  return Array.from({length:7},(_,i)=>new Date(Date.parse(monday+'T00:00:00Z')+i*86400000).toISOString().slice(0,10));
}
export function validateScheduleDays(body: any) {
  const dates=weekDates(body?.week);
  if (!Array.isArray(body?.days) || body.days.length!==7) throw new BadRequestException('Provide all seven days of the selected week.');
  return dates.map((date,i)=>{
    const d=body.days[i];
    if (!d || d.date!==date || typeof d.active!=='boolean') throw new BadRequestException('Schedule dates must match the selected week in order.');
    if (!d.active) return {date,active:false,start:null,end:null};
    if (typeof d.start!=='string' || typeof d.end!=='string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.end) || d.start>=d.end)
      throw new BadRequestException(`End time must be after start time on ${date}. Overnight shifts are not supported.`);
    return {date,active:true,start:d.start,end:d.end};
  });
}
export const weekRevision = (rows: any[]) => createHash('sha256').update(JSON.stringify(rows.map(r=>[r.id,r.starts_at,r.ends_at,r.status,r.notes,r.archived_at]))).digest('hex');
export function validateStaffDetails(body: any) {
  const jobRole=staffJobRole(body?.role,true);
  if (!['Full-time','Part-time'].includes(body?.type) || typeof body?.onLeave!=='boolean') throw new BadRequestException('Choose an employment type and leave status.');
  return {role:jobRole,type:body.type,onLeave:body.onLeave};
}

@Injectable()
export class ScheduleService implements OnModuleDestroy {
  private readonly pool = new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:10000});
  constructor(private readonly logs: OperationalLogsService) {}
  onModuleDestroy() { return this.pool.end(); }

  async staffUsers() {
    const result=await this.pool.query(`SELECT u.id,concat_ws(' ',u."firstName",u."lastName") AS name,u.email,
      s.job_title,s.employment_type,s.on_leave,s.updated_at::text AS profile_version
      FROM public."user" u LEFT JOIN public.staff s ON s.user_id=u.id
      WHERE u.role='STAFF' AND u."isActive"=true AND u.archived_at IS NULL AND coalesce(u."isArchived",false)=false
      AND s.archived_at IS NULL AND s.roster_hidden_at IS NULL ORDER BY u."firstName",u.id`);
    return result.rows.map(r=>({id:r.id,name:r.name,email:r.email,role:r.job_title||'Unassigned',type:r.employment_type||'Full-time',onLeave:r.on_leave||false,profileVersion:r.profile_version??null}));
  }
  private async shifts(c: Pick<PoolClient,'query'>, profileId: string, dates: string[], lock=false) {
    return (await c.query(`SELECT id,starts_at::text,ends_at::text,status,notes,archived_at::text,
      to_char(starts_at AT TIME ZONE 'Asia/Manila','YYYY-MM-DD') AS day,
      to_char(starts_at AT TIME ZONE 'Asia/Manila','HH24:MI') AS start,
      to_char(ends_at AT TIME ZONE 'Asia/Manila','HH24:MI') AS "end",
      to_char(ends_at AT TIME ZONE 'Asia/Manila','YYYY-MM-DD') AS end_day
      FROM public.staff_schedules WHERE staff_id=$1 AND archived_at IS NULL AND status<>'CANCELLED'
      AND starts_at < (($3::date+1)::timestamp AT TIME ZONE 'Asia/Manila')
      AND ends_at > ($2::date::timestamp AT TIME ZONE 'Asia/Manila') ORDER BY starts_at,id ${lock?'FOR UPDATE':''}`,[profileId,dates[0],dates[6]])).rows;
  }
  async roster(week: string) {
    const dates=weekDates(week);
    const c=await this.pool.connect();
    try {
      // Each revision and displayed shift come from the same database snapshot.
      await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const rows=(await c.query(`SELECT u.id,concat_ws(' ',u."firstName",u."lastName") AS name,u.email,
        u."isActive" AS account_active,(u.archived_at IS NOT NULL OR coalesce(u."isArchived",false)) AS account_archived,
        s.id AS staff_id,s.job_title,s.employment_type,s.on_leave,s.is_active AS profile_active,
        s.archived_at,s.updated_at::text AS profile_version
        FROM public."user" u LEFT JOIN public.staff s ON s.user_id=u.id
        WHERE u.role='STAFF' AND s.roster_hidden_at IS NULL ORDER BY u."firstName",u.id`)).rows;
      const data=[];
      for (const r of rows) {
        const slots=r.staff_id?await this.shifts(c,r.staff_id,dates):[];
        const shifts:any={},days:any={};let editable=true;
        dates.forEach((date,i)=>{
          const onDay=slots.filter(s=>s.day===date || (s.day<date && s.end_day>=date));
          if(onDay.length>1 || onDay.some(s=>s.day!==s.end_day))editable=false;
          shifts[DAYS[i]]=onDay.length?onDay.map(s=>`${s.start} – ${s.end}`).join(', '):'Off';
          days[DAYS[i]]={active:onDay.length>0,start:onDay[0]?.start??'09:00',end:onDay[0]?.end??'17:00',completed:onDay.some(s=>s.status==='COMPLETED')};
        });
        data.push({id:r.id,profileId:r.staff_id,name:r.name,email:r.email,role:r.job_title||'Unassigned',type:r.employment_type||'Full-time',
          status:!r.account_active?'Inactive':r.on_leave?'On Leave':r.profile_active===false?'Inactive':r.employment_type==='Part-time'?'Part Time':'Active',
          onLeave:r.on_leave||false,isArchived:r.account_archived||r.archived_at!=null,accountArchived:r.account_archived,
          accountActive:r.account_active,shifts,days,editable,revision:weekRevision(slots),profileVersion:r.profile_version??null});
      }
      await c.query('COMMIT');return data;
    }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }
  async appointments(archived=false) {
    const result=await this.pool.query(`SELECT a.id,a.reference_code,a.customer_name,a.customer_email,a.guest_phone,
      a.appointment_date,a.start_time::text,a.end_time::text,a.status,a.notes,a.total_amount,
      a.payment_status,a.archived_at,a.archive_reason,s.name AS service_name,s.price,s.duration_minutes,
      concat_ws(' ',u."firstName",u."lastName") AS stylist,count(*) OVER()::int AS total_count
      FROM public.appointments a LEFT JOIN public.services s ON s.id=a.service_id
      LEFT JOIN public.staff st ON st.id=a.staff_id LEFT JOIN public."user" u ON u.id=st.user_id
      WHERE (a.archived_at IS NOT NULL OR a.status='CANCELLED')=$1 ORDER BY a.appointment_date DESC,a.start_time DESC,a.id DESC LIMIT 1000`,[archived]);
    return {total:result.rows[0]?.total_count??0,items:result.rows.map(r=>{
      const date = /^\d{4}-\d{2}-\d{2}$/.test(r.appointment_date)?new Date(`${r.appointment_date}T${r.start_time}+08:00`):null;
      const valid=date && Number.isFinite(date.valueOf());
      return {id:r.id,reference:r.reference_code||String(r.id),clientName:r.customer_name,clientEmail:r.customer_email,
        clientPhone:r.guest_phone||'Not provided',serviceName:r.service_name||'Service unavailable',duration:`${r.duration_minutes??0} mins`,
        price:new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(r.total_amount??r.price??0)),
        stylist:r.stylist||'Unassigned',dateTime:valid?`${new Intl.DateTimeFormat('en-US',{timeZone:TZ,weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(date)} at ${new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'}).format(date)}`:`${r.appointment_date} at ${r.start_time}`,
        status:r.status,notes:r.notes||'',paymentStatus:r.payment_status,isArchived:r.archived_at!=null||r.status==='CANCELLED',archivedAt:r.archived_at,archiveReason:r.archive_reason||''};
    })};
  }
  async cancelAppointment(actorId:number,id:number) {
    return this.tx(async c=>{
      const row=(await c.query(`SELECT id,status,staff_id,appointment_date,archived_at FROM public.appointments WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if(!row)throw new NotFoundException('Appointment not found.');
      if(row.archived_at) {
        if(row.status==='CANCELLED')return {success:true,unchanged:true};
        throw new ConflictException('This appointment is already archived.');
      }
      if(!['PENDING','CONFIRMED','AWAITING_DEPOSIT','PAYMENT_REVIEW','CANCELLED'].includes(row.status))
        throw new BadRequestException('Only pending, confirmed or deposit-review appointments can be cancelled.');
      // Match booking/payment date locks. The appointment row is locked first,
      // as in the existing payment callback, to keep cancellation atomic.
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['centyzz-guest-booking:'+row.appointment_date]);
      await c.query(`UPDATE public.appointments SET status='CANCELLED',archived_at=now(),archived_by=$2,
        archive_reason='Cancelled by Admin from Schedule',reservation_expires_at=NULL,updated_at=now() WHERE id=$1`,[id,actorId]);
      await this.audit(c,actorId,'Appointment Cancelled',`Appointment #${id}; moved to archive; staff assignment and payment history retained.`);
      return {success:true};
    });
  }

  async retrieveAppointment(actorId:number,id:number) {
    return this.tx(async c=>{
      const row=(await c.query(`SELECT id,status,status_before_archive,staff_id,service_id,appointment_date,
        start_time::text,end_time::text,archived_at,payment_status,deposit_amount FROM public.appointments WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if(!row)throw new NotFoundException('Appointment not found.');
      if(!row.archived_at&&row.status!=='CANCELLED')return {success:true,unchanged:true};
      const target=row.status==='CANCELLED' ? (['PENDING','CONFIRMED','COMPLETED','NO_SHOW'].includes(row.status_before_archive)?row.status_before_archive:'PENDING') : row.status;
      const reservesSlot=['PENDING','CONFIRMED','AWAITING_DEPOSIT','PAYMENT_REVIEW'].includes(target);
      if(reservesSlot) {
        const paid=['PAID','TEST_PAID','DEMO_PAID'].includes(row.payment_status);
        if((Number(row.deposit_amount)>0&&!paid)||(['AWAITING_DEPOSIT','PAYMENT_REVIEW'].includes(row.status_before_archive)&&!paid))
          throw new BadRequestException('This booking needs a new deposit checkout before it can be retrieved.');
        scheduleDate(row.appointment_date);
        const salon=(await c.query('SELECT opening_hours FROM public.system_settings WHERE id=1 FOR SHARE')).rows[0];
        if(salon?.opening_hours){const day=salon.opening_hours[(new Date(row.appointment_date+'T00:00:00Z').getUTCDay()+6)%7];
          if(!day||day.closed||row.start_time.slice(0,5)<day.start||row.end_time.slice(0,5)>day.end)throw new ConflictException('This appointment is outside the salon’s current operating hours. Keep it archived.');
        }

        await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['centyzz-guest-booking:'+row.appointment_date]);
        const service=(await c.query('SELECT id FROM public.services WHERE id=$1 AND is_active=true AND archived_at IS NULL',[row.service_id])).rows[0];
        if(!service)throw new ConflictException('The service is no longer available. Keep this booking archived.');
        if(row.staff_id) {
          const staff=(await c.query(`SELECT st.id FROM public.staff st JOIN public."user" u ON u.id=st.user_id
            WHERE st.id=$1 AND st.is_active=true AND st.archived_at IS NULL AND st.roster_hidden_at IS NULL AND NOT st.on_leave
            AND u.role='STAFF' AND u."isActive"=true AND u.archived_at IS NULL AND NOT coalesce(u."isArchived",false) AND st.job_title=ANY($2::text[])`,[row.staff_id,BOOKABLE_STAFF_JOB_ROLES])).rows[0];
          if(!staff)throw new ConflictException('The assigned staff member is unavailable. Restore their availability before retrieving this booking.');
          const shifts=(await c.query(`SELECT starts_at,ends_at FROM public.staff_schedules WHERE staff_id=$1 AND archived_at IS NULL AND status<>'CANCELLED'
            AND starts_at < (($2::date+1)::timestamp AT TIME ZONE 'Asia/Manila') AND ends_at > ($2::date::timestamp AT TIME ZONE 'Asia/Manila')`,[row.staff_id,row.appointment_date])).rows;
          if(shifts.length&&!shifts.some(s=>new Date(s.starts_at)<=new Date(`${row.appointment_date}T${row.start_time}+08:00`)&&new Date(s.ends_at)>=new Date(`${row.appointment_date}T${row.end_time}+08:00`)))
            throw new ConflictException('The appointment is outside the assigned staff member’s saved shift.');
        }
        const conflict=await c.query(`SELECT 1 FROM public.appointments a WHERE a.id<>$1 AND a.appointment_date=$2 AND a.archived_at IS NULL
          AND (a.staff_id=$3::uuid OR a.staff_id IS NULL OR $3::uuid IS NULL)
          AND a.start_time<$5::time AND a.end_time>$4::time
          AND (a.status IN ('PENDING','CONFIRMED') OR (a.status='AWAITING_DEPOSIT' AND a.reservation_expires_at>now())) LIMIT 1`,
          [id,row.appointment_date,row.staff_id,row.start_time,row.end_time]);
        if(conflict.rowCount)throw new ConflictException('That appointment time is already booked. The appointment remains archived.');
      }
      await c.query(`UPDATE public.appointments SET status=$2,archived_at=NULL,archived_by=NULL,archive_reason=NULL,
        status_before_archive=NULL,updated_at=now() WHERE id=$1`,[id,target]);
      await this.audit(c,actorId,'Appointment Retrieved',`Appointment #${id}; returned to ${target}; original staff assignment and payment history retained.`);
      return {success:true,status:target};
    });
  }

  private async tx(action:(c:PoolClient)=>Promise<any>) {
    const c=await this.pool.connect();try{await c.query('BEGIN');const result=await action(c);await c.query('COMMIT');return result;}
    catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }
  private async staff(c:PoolClient,userId:number,create=false,requireActive=true) {
    const user=(await c.query(`SELECT id,"isActive",archived_at,coalesce("isArchived",false) AS is_archived FROM public."user" WHERE id=$1 AND role='STAFF' FOR UPDATE`,[userId])).rows[0];
    if(!user)throw new NotFoundException('Staff account not found in Users.');
    if(user.archived_at||user.is_archived)throw new BadRequestException('Restore this account in User Management first.');
    let created=false;
    if(create) {
      if(requireActive&&!user.isActive)throw new BadRequestException('Activate this staff account in User Management first.');
      created=Boolean((await c.query(`INSERT INTO public.staff(user_id,employee_code) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING RETURNING id`,[userId,`USR-${userId}`])).rowCount);
    }
    const profile=(await c.query('SELECT *,updated_at::text AS profile_version FROM public.staff WHERE user_id=$1 FOR NO KEY UPDATE',[userId])).rows[0];
    return {user,profile,created};
  }
  private async audit(c:PoolClient,actorId:number,event:string,details:string) {
    const actor=(await c.query(`SELECT role,concat_ws(' ',"firstName","lastName") AS name FROM public."user" WHERE id=$1`,[actorId])).rows[0];
    await this.logs.record({module:'Staff & Schedule Management',event,actorUserId:actorId,userName:actor.name||`User #${actorId}`,userRole:actor.role,details},c);
  }
  async details(actorId:number,userId:number,body:any) {
    const d=validateStaffDetails(body);
    return this.tx(async c=>{
      const {profile:p,created}=await this.staff(c,userId,true);
      if(p.archived_at||p.roster_hidden_at)throw new BadRequestException('Restore this staff profile first.');
      const changed=p.job_title!==d.role||p.employment_type!==d.type||p.on_leave!==d.onLeave;
      if(!changed)return {success:true,unchanged:true};
      if((created?null:p.profile_version)!==(body.profileVersion??null))throw new ConflictException('Staff details changed. Refresh and try again.');
      // Reuse the profile availability flag respected by guest booking. Account login status is untouched.
      await c.query(`UPDATE public.staff SET job_title=$2,employment_type=$3,
        leave_previous_active=CASE WHEN $4 AND NOT on_leave THEN is_active WHEN NOT $4 THEN NULL ELSE leave_previous_active END,
        is_active=CASE WHEN $4 THEN false WHEN on_leave THEN coalesce(leave_previous_active,true) ELSE is_active END,
        on_leave=$4,updated_at=now() WHERE user_id=$1`,[userId,d.role,d.type,d.onLeave]);
      await this.audit(c,actorId,'Staff Details Updated',`Staff user #${userId}; job details updated.`);
      return {success:true};
    });
  }
  async saveWeek(actorId:number,userId:number,body:any) {
    const days=validateScheduleDays(body),dates=days.map(d=>d.date);
    if(!/^[0-9a-f]{64}$/.test(body?.revision??''))throw new BadRequestException('Reload the schedule before saving.');
    return this.tx(async c=>{
      let {profile:p,user}=await this.staff(c,userId);
      if(!user.isActive)throw new BadRequestException('Activate this staff account in User Management first.');
      if(!p && !days.some(d=>d.active))return {success:true,unchanged:true};
      if(!p)p=(await this.staff(c,userId,true)).profile;
      if(p.archived_at||p.roster_hidden_at||!p.is_active||p.on_leave)throw new BadRequestException('Select active staff who are not on leave.');
      const old=await this.shifts(c,p.id,dates,true);
      if(old.some(s=>s.day!==s.end_day || !dates.includes(s.day)) || dates.some(date=>old.filter(s=>s.day===date).length>1))
        throw new ConflictException('This week contains split or overnight shifts. Existing shifts have been preserved.');
      const changes=days.filter(d=>{
        const previous=old.find(s=>s.day===d.date);
        return d.active ? !previous||previous.start!==d.start||previous.end!==d.end : Boolean(previous);
      });
      if(!changes.length)return {success:true,unchanged:true};
      if(weekRevision(old)!==body.revision)throw new ConflictException('The schedule changed while you were editing. Refresh before saving.');
      if(changes.some(d=>old.find(s=>s.day===d.date)?.status==='COMPLETED'))throw new BadRequestException('Completed shifts cannot be changed.');
      for(const d of changes){
        // Match the existing guest booking date lock when checking its bookings.
        await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['centyzz-guest-booking:'+d.date]);
        const appointments=(await c.query(`SELECT id,start_time::text,end_time::text FROM public.appointments
          WHERE staff_id=$1 AND appointment_date=$2 AND archived_at IS NULL AND
          (status IN ('PENDING','CONFIRMED') OR (status='AWAITING_DEPOSIT' AND reservation_expires_at>now())) FOR UPDATE`,[p.id,d.date])).rows;
        if(appointments.some(a=>!d.active||a.start_time.slice(0,5)<d.start!||a.end_time.slice(0,5)>d.end!))
          throw new ConflictException(`The shift on ${d.date} would exclude an existing appointment. Keep time for that booking.`);
        await c.query(`UPDATE public.staff_schedules SET archived_at=now(),archived_by=$3,archive_reason='Replaced in Admin weekly schedule'
          WHERE staff_id=$1 AND (starts_at AT TIME ZONE 'Asia/Manila')::date=$2::date AND archived_at IS NULL AND status='SCHEDULED'`,[p.id,d.date,actorId]);
        if(d.active)await c.query(`INSERT INTO public.staff_schedules(staff_id,starts_at,ends_at,status,assigned_by)
          VALUES($1,$2::timestamptz,$3::timestamptz,'SCHEDULED',$4)`,[p.id,`${d.date}T${d.start}:00+08:00`,`${d.date}T${d.end}:00+08:00`,actorId]);
      }
      await this.audit(c,actorId,'Staff Schedule Updated',`Staff user #${userId}; week ${dates[0]}; ${changes.length} days updated.`);
      return {success:true};
    });
  }
  async state(actorId:number,userId:number,state:'archive'|'restore'|'hide') {
    return this.tx(async c=>{
      const {profile:p}=await this.staff(c,userId,true,false);
      if(state==='archive') {
        if(p.archived_at)return {success:true,unchanged:true};
        const future=(await c.query(`SELECT 1 FROM public.appointments WHERE staff_id=$1 AND archived_at IS NULL
          AND appointment_date >= $2 AND (status IN ('PENDING','CONFIRMED') OR (status='AWAITING_DEPOSIT' AND reservation_expires_at>now())) LIMIT 1`,[p.id,salonToday()])).rowCount;
        if(future)throw new ConflictException('This staff member has upcoming appointments. Resolve those bookings before archiving.');
        await c.query('UPDATE public.staff SET roster_previous_active=is_active,is_active=false,archived_at=now(),archived_by=$2,updated_at=now() WHERE user_id=$1',[userId,actorId]);
      }else if(state==='restore'){
        if(!p.archived_at&&!p.roster_hidden_at)return {success:true,unchanged:true};
        await c.query(`UPDATE public.staff SET is_active=coalesce(roster_previous_active,true),roster_previous_active=NULL,
          archived_at=NULL,archived_by=NULL,archive_reason=NULL,roster_hidden_at=NULL,roster_hidden_by=NULL,updated_at=now() WHERE user_id=$1`,[userId]);
      }else{
        if(!p.archived_at)throw new BadRequestException('Archive the staff profile first.');
        if(p.roster_hidden_at)return {success:true,unchanged:true};
        await c.query('UPDATE public.staff SET roster_hidden_at=now(),roster_hidden_by=$2,updated_at=now() WHERE user_id=$1',[userId,actorId]);
      }
      await this.audit(c,actorId,state==='archive'?'Staff Roster Archived':state==='restore'?'Staff Roster Restored':'Staff Roster Removed',`Staff user #${userId}; login account and booking history retained.`);
      return {success:true};
    });
  }
}
