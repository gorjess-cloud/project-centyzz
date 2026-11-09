import { STAFF_JOB_ROLES, BOOKABLE_STAFF_JOB_ROLES, staffJobRole } from './staff-job-roles.js';
import { UsersService } from './users.service.js';
import { db } from '../../prisma/db.js';

vi.mock('../../prisma/db.js',()=>({db:{orm:{public:{User:{where:vi.fn()}}}}}));
vi.mock('bcrypt',()=>({hash:vi.fn(async()=> 'test-only-hash')}));

describe('Staff job role catalog',()=>{
  it.each(STAFF_JOB_ROLES)('accepts the approved %s role',role=>expect(staffJobRole(role)).toBe(role));
  it.each([null,undefined,'','ADMIN','SUPERADMIN','Customer','Unassigned'])('rejects unassigned or invalid new-account role %s',role=>expect(()=>staffJobRole(role)).toThrow());
  it('supports legacy labels when editing existing profiles',()=>{
    expect(staffJobRole('Stylist')).toBe('Hair Stylist');expect(staffJobRole('Therapist')).toBe('Beauty Therapist');expect(staffJobRole('Staff',true)).toBe('Unassigned');
  });
  it('keeps office and unassigned profiles out of booking specialists',()=>{
    expect(BOOKABLE_STAFF_JOB_ROLES).toEqual(['Hair Stylist','Nail Technician','Beauty Therapist','Lash/Brow Technician']);
  });
});

describe('Staff account and profile onboarding',()=>{
  const query=vi.fn(),release=vi.fn(),connect=vi.fn(),provision=vi.fn();let service:UsersService;
  const user={firstName:'Test',lastName:'Staff',email:'staff@example.invalid',role:'STAFF',staffJobRole:'Nail Technician'};
  beforeEach(()=>{
    vi.clearAllMocks();vi.stubEnv('MANAGEMENT_DEFAULT_PASSWORD','');
    vi.mocked(db.orm.public.User.where).mockReturnValue({first:async()=>null} as any);
    connect.mockResolvedValue({query,release});provision.mockResolvedValue(undefined);
    query.mockImplementation(async(sql:string)=>({rows:sql.includes('INSERT INTO public."user"')?[{id:91,email:user.email,firstName:user.firstName,lastName:user.lastName}]:[],rowCount:1}));
    service=new UsersService({pool:{connect},provision} as any);
  });
  afterEach(()=>vi.unstubAllEnvs());
  it('creates exactly one linked profile with the selected role before committing the PIN',async()=>{
    const result=await service.createUser(user);
    expect(result).toMatchObject({id:91,role:'STAFF',staffJobRole:'Nail Technician',mustCompleteSetup:true});
    expect(query.mock.calls.find(c=>c[0].includes('INSERT INTO public.staff'))?.[1]).toEqual([91,'CNTZ-USER-91','Nail Technician']);
    expect(provision).toHaveBeenCalledWith(91,expect.stringMatching(/^\d{6}$/),expect.objectContaining({query}));
    expect(query.mock.calls.filter(c=>c[0]==='COMMIT')).toHaveLength(1);expect(release).toHaveBeenCalledOnce();
  });
  it('requires a job role when creating a Staff account',async()=>{
    await expect(service.createUser({...user,staffJobRole:''})).rejects.toThrow('staff job role');expect(connect).not.toHaveBeenCalled();
  });
  it('rolls back account and profile creation if PIN provisioning fails',async()=>{
    provision.mockRejectedValue(new Error('Provisioning failed'));
    await expect(service.createUser(user)).rejects.toThrow('Provisioning failed');
    expect(query.mock.calls.some(c=>c[0]==='ROLLBACK')).toBe(true);expect(query.mock.calls.some(c=>c[0]==='COMMIT')).toBe(false);
    expect(query.mock.calls.some(c=>c[0].includes('DELETE FROM'))).toBe(false);
  });
  it('preserves Admin creation without requiring or creating a staff profile',async()=>{
    expect(await service.createUser({...user,role:'ADMIN',staffJobRole:undefined})).toMatchObject({role:'ADMIN'});
    expect(query.mock.calls.some(c=>c[0].includes('INSERT INTO public.staff'))).toBe(false);expect(provision).toHaveBeenCalledOnce();
  });
  it('preserves duplicate-email validation before creating any records',async()=>{
    vi.mocked(db.orm.public.User.where).mockReturnValue({first:async()=>({id:2})} as any);
    await expect(service.createUser(user)).rejects.toThrow('already exists');expect(connect).not.toHaveBeenCalled();
  });
});
