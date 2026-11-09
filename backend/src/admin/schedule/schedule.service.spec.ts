import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ScheduleService, scheduleDate, weekDates, validateScheduleDays, validateStaffDetails, weekRevision } from './schedule.service.js';
import { ScheduleController } from './schedule.controller.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { ROLES_KEY } from '../../auth/roles.decorator.js';

const {query,connect,release,end}=vi.hoisted(()=>({query:vi.fn(),connect:vi.fn(),release:vi.fn(),end:vi.fn()}));
vi.mock('pg',()=>({Pool:class{query=query;connect=connect;end=end;}}));
const week='2090-01-02';
const payload=()=>({week,revision:weekRevision([]),days:weekDates(week).map(date=>({date,active:false,start:'09:00',end:'17:00'}))});
describe('Admin schedule validation and access',()=>{
  it('accepts Monday weeks including leap days and returns the correct seven dates',()=>{
    expect(weekDates('2028-02-28')).toEqual(['2028-02-28','2028-02-29','2028-03-01','2028-03-02','2028-03-03','2028-03-04','2028-03-05']);
  });
  it.each(['2026-02-30','2026-13-01','2026-01-00','2026-1-01','not-a-date',null])('rejects invalid dates %s',value=>expect(()=>scheduleDate(value)).toThrow());
  it('rejects weeks which do not start on Monday',()=>expect(()=>weekDates('2026-10-28')).toThrow('Monday'));
  it('validates all seven days and allows an all-off week',()=>{
    expect(validateScheduleDays(payload())).toHaveLength(7);
    expect(()=>validateScheduleDays({...payload(),days:[]})).toThrow();
    const p=payload();p.days[0].date=p.days[1].date;expect(()=>validateScheduleDays(p)).toThrow();
  });
  it.each([['17:00','09:00'],['09:00','09:00'],['24:00','25:00'],['9:00 AM','5:00 PM'],['09:61','17:00'],[['09:00'],'17:00']])('rejects invalid shift %s–%s',(start,end)=>{
    const p:any=payload();p.days[0]={...p.days[0],active:true,start,end};expect(()=>validateScheduleDays(p)).toThrow();
  });
  it('does not accept login-role changes through job metadata',()=>{
    expect(()=>validateStaffDetails({role:'ADMIN',type:'Full-time',onLeave:false})).toThrow();
    expect(()=>validateStaffDetails({role:'Stylist',type:'Contract',onLeave:false})).toThrow();
    expect(()=>validateStaffDetails({role:'Stylist',type:'Full-time',onLeave:'false'})).toThrow();
    expect(validateStaffDetails({role:'Cashier',type:'Part-time',onLeave:false})).toEqual({role:'Cashier',type:'Part-time',onLeave:false});
  });
  it('requires authenticated management access and PINs for every mutation',()=>{
    expect(Reflect.getMetadata(GUARDS_METADATA,ScheduleController)).toEqual([JwtAuthGuard,RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY,ScheduleController)).toEqual(['ADMIN','SUPERADMIN']);
    for(const name of ['details','save','archive','restore','hide','cancelAppointment','retrieveAppointment'])expect(Reflect.getMetadata(GUARDS_METADATA,ScheduleController.prototype[name])).toContain(ManagementActionPinGuard);
  });
  it('has guarded cancellation without a payment mutation endpoint',()=>{
    expect(Object.getOwnPropertyNames(ScheduleController.prototype).sort()).toEqual(['appointments','archive','cancelAppointment','constructor','details','hide','jobRoles','restore','retrieveAppointment','roster','save','users'].sort());
  });
});
describe('Schedule writes preserve users and history',()=>{
  let service:ScheduleService,record:ReturnType<typeof vi.fn>;
  beforeEach(()=>{
    vi.clearAllMocks();connect.mockResolvedValue({query,release});record=vi.fn().mockResolvedValue({});
    service=new ScheduleService({record} as any);
    query.mockImplementation(async(sql:string)=>{
      if(sql.includes('FROM public."user" WHERE id=$1 AND role=\'STAFF\''))return {rowCount:1,rows:[{id:12,isActive:true,archived_at:null,is_archived:false}]};
      if(sql.includes('FROM public.staff WHERE user_id='))return {rowCount:1,rows:[{id:'00000000-0000-4000-8000-000000000012',job_title:'Staff',employment_type:'Full-time',on_leave:false,is_active:true,profile_version:'v1'}]};
      if(sql.includes('SELECT role,concat_ws'))return {rowCount:1,rows:[{role:'ADMIN',name:'Test Admin'}]};
      return {rowCount:0,rows:[]};
    });
  });
  it('stores dated shifts and emits only one transaction-bound event',async()=>{
    const p=payload();p.days[0].active=true;
    await service.saveWeek(7,12,p);
    expect(query.mock.calls.find(c=>c[0].includes('INSERT INTO public.staff_schedules'))?.[1]).toEqual(['00000000-0000-4000-8000-000000000012','2090-01-02T09:00:00+08:00','2090-01-02T17:00:00+08:00',7]);
    expect(record).toHaveBeenCalledOnce();expect(record.mock.calls[0][1]).toMatchObject({query});
    expect(query.mock.calls.some(c=>/UPDATE public\."user"|DELETE FROM/i.test(c[0]))).toBe(false);
    expect(query.mock.calls.some(c=>c[0]==='COMMIT')).toBe(true);
  });
  it('rolls back shift writes if activity logging fails',async()=>{
    record.mockRejectedValue(new Error('audit unavailable'));const p=payload();p.days[0].active=true;
    await expect(service.saveWeek(7,12,p)).rejects.toThrow('audit unavailable');
    expect(query.mock.calls.some(c=>c[0]==='ROLLBACK')).toBe(true);
    expect(query.mock.calls.some(c=>c[0]==='COMMIT')).toBe(false);
    expect(release).toHaveBeenCalledOnce();
  });
  it('rejects stale revisions before replacing shifts',async()=>{
    const p=payload();p.days[0].active=true;p.revision='0'.repeat(64);
    await expect(service.saveWeek(7,12,p)).rejects.toThrow('changed while');
    expect(query.mock.calls.some(c=>c[0].includes('UPDATE public.staff_schedules'))).toBe(false);
  });
  it('allows Admin to correct Monday and Tuesday even in a past week',async()=>{
    const pastWeek='2020-01-06';
    const p={week:pastWeek,revision:weekRevision([]),days:weekDates(pastWeek).map((date,i)=>({date,active:i<2,start:'09:00',end:'17:00'}))};
    await service.saveWeek(7,12,p);
    expect(query.mock.calls.filter(c=>c[0].includes('INSERT INTO public.staff_schedules'))).toHaveLength(2);
    expect(record).toHaveBeenCalledOnce();
  });
  it('keeps completed shifts protected when editing an earlier date',async()=>{
    const completed={id:'completed-row',starts_at:'2020-01-06 01:00:00+00',ends_at:'2020-01-06 09:00:00+00',day:'2020-01-06',end_day:'2020-01-06',start:'09:00',end:'17:00',status:'COMPLETED',notes:null,archived_at:null};
    const previous=query.getMockImplementation();
    query.mockImplementation(async(sql:string,...args:any[])=>sql.includes('FROM public.staff_schedules')?{rows:[completed],rowCount:1}:previous!(sql,...args));
    const p={week:'2020-01-06',revision:weekRevision([completed]),days:weekDates('2020-01-06').map(date=>({date,active:false,start:'09:00',end:'17:00'}))};
    await expect(service.saveWeek(7,12,p)).rejects.toThrow('Completed shifts');
    expect(query.mock.calls.some(c=>c[0].includes('UPDATE public.staff_schedules'))).toBe(false);
  });
  it('does not emit another event for an unchanged week',async()=>{
    expect(await service.saveWeek(7,12,payload())).toEqual({success:true,unchanged:true});
    expect(record).not.toHaveBeenCalled();
  });
});

describe('Admin cancellation and archive history',()=>{
  const query=vi.fn(),release=vi.fn(),connect=vi.fn();let service:ScheduleService,record:ReturnType<typeof vi.fn>;
  beforeEach(()=>{
    vi.clearAllMocks();connect.mockResolvedValue({query,release});record=vi.fn().mockResolvedValue({});service=new ScheduleService({record} as any);
    (service as any).pool={connect,query};
    query.mockImplementation(async(sql:string)=>{
      if(sql.includes('FROM public.appointments WHERE id=$1'))return {rowCount:1,rows:[{id:44,status:'CONFIRMED',staff_id:'staff-uuid',appointment_date:'2090-01-02',archived_at:null}]};
      if(sql.includes('SELECT role,concat_ws'))return {rows:[{role:'ADMIN',name:'Admin'}],rowCount:1};
      return {rows:[],rowCount:1};
    });
  });
  it('cancels and archives with the actor, without changing assignment or payments',async()=>{
    expect(await service.cancelAppointment(9,44)).toEqual({success:true});
    const update=query.mock.calls.find(c=>c[0].includes('UPDATE public.appointments'));
    expect(update?.[1]).toEqual([44,9]);expect(update?.[0]).toContain("status='CANCELLED'");expect(update?.[0]).toContain('archived_by=$2');
    expect(update?.[0]).not.toMatch(/SET staff_id|payment_status\s*=|deposit_amount\s*=|DELETE FROM/);
    expect(record).toHaveBeenCalledOnce();expect(record.mock.calls[0][1]).toMatchObject({query});
  });
  it('does not duplicate a cancellation or overwrite the original archive actor on retry',async()=>{
    query.mockResolvedValue({rows:[{id:44,status:'CANCELLED',archived_at:new Date()}],rowCount:1});
    expect(await service.cancelAppointment(9,44)).toEqual({success:true,unchanged:true});
    expect(query.mock.calls.some(c=>c[0].includes('UPDATE public.appointments'))).toBe(false);expect(record).not.toHaveBeenCalled();
  });
  it('rolls back cancellation and archive metadata if event recording fails',async()=>{
    record.mockRejectedValue(new Error('Audit unavailable'));await expect(service.cancelAppointment(9,44)).rejects.toThrow('Audit unavailable');
    expect(query.mock.calls.some(c=>c[0]==='ROLLBACK')).toBe(true);expect(query.mock.calls.some(c=>c[0]==='COMMIT')).toBe(false);
  });
  it.each(['COMPLETED','NO_SHOW'])('does not rewrite terminal %s bookings',async status=>{
    query.mockResolvedValue({rows:[{id:44,status,archived_at:null}],rowCount:1});
    await expect(service.cancelAppointment(9,44)).rejects.toThrow('Only pending');expect(record).not.toHaveBeenCalled();
  });
});

describe('Safe archived appointment retrieval',()=>{
 const query=vi.fn(),release=vi.fn();let service:ScheduleService,record:ReturnType<typeof vi.fn>;
 let row:any;
 beforeEach(()=>{
  vi.clearAllMocks();row={id:90,status:'CANCELLED',status_before_archive:'CONFIRMED',staff_id:null,service_id:1,appointment_date:'2090-01-02',start_time:'12:00:00',end_time:'13:00:00',archived_at:new Date(),payment_status:'NOT_REQUIRED',deposit_amount:0};
  record=vi.fn().mockResolvedValue({});service=new ScheduleService({record} as any);(service as any).pool={connect:async()=>({query,release})};
  query.mockImplementation(async(sql:string)=>{
   if(sql.includes('FROM public.appointments WHERE id=$1'))return {rows:[row],rowCount:1};
   if(sql.includes('FROM public.services'))return {rows:[{id:1}],rowCount:1};
   if(sql.includes('SELECT role,concat_ws'))return {rows:[{role:'ADMIN',name:'Admin'}],rowCount:1};
   return {rows:[],rowCount:0};
  });
 });
 it('retrieves the original confirmed status without modifying payments or assignment',async()=>{
  expect(await service.retrieveAppointment(9,90)).toEqual({success:true,status:'CONFIRMED'});
  const update=query.mock.calls.find(c=>c[0].includes('UPDATE public.appointments'));
  expect(update?.[1]).toEqual([90,'CONFIRMED']);expect(update?.[0]).toContain('archived_at=NULL');expect(update?.[0]).not.toMatch(/payment_status\s*=|staff_id\s*=/);expect(record).toHaveBeenCalledOnce();
 });
 it('uses Pending for legacy cancellations without a known original status',async()=>{
  row.status_before_archive=null;expect(await service.retrieveAppointment(9,90)).toMatchObject({status:'PENDING'});
 });
 it('does not duplicate retrieval events on retry',async()=>{
  row.status='CONFIRMED';row.archived_at=null;expect(await service.retrieveAppointment(9,90)).toEqual({success:true,unchanged:true});expect(record).not.toHaveBeenCalled();
 });
 it('keeps conflicting bookings archived',async()=>{
  const impl=query.getMockImplementation();query.mockImplementation(async(sql:string,...params:any[])=>sql.includes('SELECT 1 FROM public.appointments a')?{rows:[{exists:1}],rowCount:1}:impl!(sql,...params));
  await expect(service.retrieveAppointment(9,90)).rejects.toThrow('already booked');expect(record).not.toHaveBeenCalled();
 });
 it('keeps bookings outside the current salon hours archived',async()=>{
  const impl=query.getMockImplementation();query.mockImplementation(async(sql:string,...params:any[])=>sql.includes('SELECT opening_hours')?{rows:[{opening_hours:Array.from({length:7},()=>({closed:true,start:'12:00',end:'21:00'}))}],rowCount:1}:impl!(sql,...params));
  await expect(service.retrieveAppointment(9,90)).rejects.toThrow('current operating hours');expect(record).not.toHaveBeenCalled();
 });
 it('does not bypass an unpaid deposit',async()=>{
  row.deposit_amount=60;row.payment_status='UNPAID';await expect(service.retrieveAppointment(9,90)).rejects.toThrow('deposit checkout');expect(record).not.toHaveBeenCalled();
 });
 it('rolls back retrieval when logging fails',async()=>{
  record.mockRejectedValue(new Error('Audit unavailable'));await expect(service.retrieveAppointment(9,90)).rejects.toThrow('Audit unavailable');expect(query.mock.calls.some(c=>c[0]==='ROLLBACK')).toBe(true);expect(query.mock.calls.some(c=>c[0]==='COMMIT')).toBe(false);
 });
});
