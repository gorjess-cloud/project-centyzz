import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { InventoryService, inventoryInteger, validateInventoryCreate } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';

const { query, release, connect, end } = vi.hoisted(() => ({ query: vi.fn(),release:vi.fn(),connect:vi.fn(),end:vi.fn() }));
vi.mock('pg', () => ({ Pool:class { query=query; connect=connect; end=end; } }));
const valid={name:'Shampoo',sku:' sh-001 ',category:'Retail (For Sale)',unit:'Bottles',initialQuantity:0,lowStockAlert:0,costPrice:100.25,retailPrice:150};
describe('Admin inventory validation and security',()=>{
 it('honors zero stock and zero threshold and normalizes SKUs',()=>{
   expect(validateInventoryCreate(valid)).toMatchObject({sku:'SH-001',initialQuantity:0,lowStockAlert:0});
 });
 it.each([-1,1.5,'5',null,Infinity,1000001])('rejects invalid quantity %s',value=>expect(()=>inventoryInteger(value,'Quantity')).toThrow());
 it.each([-1,1.001,Infinity,'200'])('rejects invalid price %s',costPrice=>expect(()=>validateInventoryCreate({...valid,costPrice})).toThrow());
 it('requires a name, SKU, category, and bounded metadata',()=>{
   expect(()=>validateInventoryCreate({...valid,name:' '})).toThrow();
   expect(()=>validateInventoryCreate({...valid,sku:'x'.repeat(101)})).toThrow();
   expect(()=>validateInventoryCreate({...valid,note:'x'.repeat(1001)})).toThrow();
 });
 it('guards the entire API and every mutation',()=>{
   expect(Reflect.getMetadata(GUARDS_METADATA,InventoryController)).toEqual([JwtAuthGuard,RolesGuard]);
   for(const name of ['create','order','restock','archive','restore','hide'])
     expect(Reflect.getMetadata(GUARDS_METADATA,InventoryController.prototype[name])).toContain(ManagementActionPinGuard);
 });
});
describe('Inventory atomic writes',()=>{
 let service:InventoryService;let record:ReturnType<typeof vi.fn>;
 const key='b5c690e4-c9f8-4aa6-955e-765b6fb63a04';
 beforeEach(()=>{
   vi.clearAllMocks();connect.mockResolvedValue({query,release});record=vi.fn().mockResolvedValue({});
   service=new InventoryService({record} as any);
   query.mockImplementation(async(sql:string)=>{
     if(sql.includes('INSERT INTO public.inventory_requests'))return {rowCount:1,rows:[]};
     if(sql.includes('SELECT * FROM public.products'))return {rowCount:1,rows:[{id:4,is_active:true,archived_at:null}]};
     if(sql.includes('UPDATE public.inventory SET quantity_on_hand'))return {rowCount:1,rows:[{quantity_on_hand:9}]};
     if(sql.includes('SELECT role,'))return {rowCount:1,rows:[{role:'ADMIN',name:'Test Admin'}]};
     return {rowCount:1,rows:[]};
   });
 });
 it('updates stock, records a movement and logs once in the same transaction',async()=>{
   expect(await service.restock(7,key,4,{quantity:3,note:'Delivery'})).toEqual({success:true,stock:9});
   expect(query.mock.calls.map(c=>c[0])).toContain('COMMIT');
   expect(query.mock.calls.find(c=>c[0].includes('INSERT INTO public.inventory_movements'))?.[1]).toEqual([4,3,'Delivery',7]);
   expect(record).toHaveBeenCalledTimes(1);
   expect(record.mock.calls[0][1]).toMatchObject({query});
   expect(JSON.stringify(record.mock.calls[0][0])).not.toContain('Delivery');
 });
 it('rolls back stock and request receipt if audit recording fails',async()=>{
   record.mockRejectedValue(new Error('Unavailable'));
   await expect(service.restock(7,key,4,{quantity:3})).rejects.toThrow('Unavailable');
   expect(query.mock.calls.map(c=>c[0])).toContain('ROLLBACK');
   expect(query.mock.calls.map(c=>c[0])).not.toContain('COMMIT');
   expect(release).toHaveBeenCalledOnce();
 });
 it('rejects missing retry keys before opening a transaction',async()=>{
   await expect(service.restock(7,'',4,{quantity:3})).rejects.toThrow('Idempotency-Key');
   expect(connect).not.toHaveBeenCalled();
 });
 it('rejects archived restocks without a stock or movement update',async()=>{
   query.mockImplementation(async(sql:string)=>({rowCount:1,rows:sql.includes('SELECT * FROM public.products')?[{archived_at:new Date()}]:[]}));
   await expect(service.restock(7,key,4,{quantity:3})).rejects.toThrow('Restore');
   expect(query.mock.calls.some(c=>c[0].includes('UPDATE public.inventory SET'))).toBe(false);
   expect(record).not.toHaveBeenCalled();
 });
 it('rejects duplicate PO items and invalid order quantities',async()=>{
   await expect(service.createOrder(7,key,{items:[{id:4,quantity:2},{id:4,quantity:3}]})).rejects.toThrow('Duplicate');
   await expect(service.createOrder(7,key,{items:[{id:4,quantity:0}]})).rejects.toThrow();
   expect(connect).not.toHaveBeenCalled();
 });
});
