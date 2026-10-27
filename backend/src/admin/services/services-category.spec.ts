import { ServicesService } from './services.service.js';
vi.mock('pg',()=>({default:{Pool:vi.fn(function(){return{query:vi.fn(),end:vi.fn()};})}}));

describe('Admin service categories',()=>{
  let service: ServicesService;
  let query: any;
  const dto={name:'Footspa',categoryId:'2',price:'300',durationHours:'0',durationMins:'30'};
  beforeEach(()=>{service=new ServicesService();query=(service as any).pool.query;});
  it('returns category IDs and actual names without collapsing them to Skin',async()=>{
    query.mockResolvedValue({rows:[{id:3,category_id:2,category_name:'Nail Services',name:'Footspa',duration_minutes:30,price:'300',is_active:true}]});
    expect(await service.getServices()).toEqual([expect.objectContaining({categoryId:2,categoryName:'Nail Services',category:'NAIL SERVICES'})]);
  });
  it('returns all database categories with their availability for dropdowns',async()=>{
    query.mockResolvedValue({rows:[{id:3,name:'Nail Bundle Regular',is_active:true,archived_at:null}]});
    expect(await service.getCategories()).toEqual([{id:3,name:'Nail Bundle Regular',isActive:true,isArchived:false}]);
  });
  it('accepts numeric category IDs when creating a service',async()=>{
    query.mockResolvedValueOnce({rows:[{id:2,is_active:true,archived_at:null}]}).mockResolvedValueOnce({rows:[{id:99,category_id:2}]});
    expect(await service.createService(dto)).toMatchObject({category_id:2});
    expect(query.mock.calls[1][1][0]).toBe(2);
  });
  it('accepts categoryId-only edits and persists the selected category',async()=>{
    query.mockResolvedValueOnce({rows:[{id:99,category_id:1}]}).mockResolvedValueOnce({rows:[{id:2,is_active:true,archived_at:null}]}).mockResolvedValueOnce({rows:[{id:99,category_id:2}]});
    expect(await service.updateService(99,dto)).toMatchObject({category_id:2});
    expect(query.mock.calls[2][1][0]).toBe(2);
  });
  it('supports exact database category names for older API clients',async()=>{
    query.mockResolvedValueOnce({rows:[{id:1,is_active:true,archived_at:null}]}).mockResolvedValueOnce({rows:[{id:99,category_id:1}]});
    await service.createService({...dto,categoryId:undefined,category:'Hair Services'});
    expect(query.mock.calls[0][1]).toEqual(['Hair Services']);
  });
  it.each(['0','-1','1 OR 1=1','missing'])('rejects malformed category ID %s before querying',async categoryId=>{
    await expect(service.createService({...dto,categoryId})).rejects.toThrow('Choose a valid service category.');
    expect(query).not.toHaveBeenCalled();
  });
  it('rejects categories that do not exist',async()=>{
    query.mockResolvedValueOnce({rows:[]});
    await expect(service.createService(dto)).rejects.toThrow('does not exist');
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('rejects newly assigning an unavailable category',async()=>{
    query.mockResolvedValueOnce({rows:[{id:2,is_active:false,archived_at:null}]});
    await expect(service.createService(dto)).rejects.toThrow('active, unarchived');
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('keeps a historical category when editing an already assigned service',async()=>{
    query.mockResolvedValueOnce({rows:[{id:99,category_id:2}]}).mockResolvedValueOnce({rows:[{id:2,is_active:false,archived_at:null}]}).mockResolvedValueOnce({rows:[{id:99,category_id:2}]});
    expect(await service.updateService(99,dto)).toMatchObject({category_id:2});
  });
});
