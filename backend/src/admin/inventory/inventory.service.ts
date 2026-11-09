import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { OperationalLogsService } from '../operational-logs/operational-logs.service.js';

// Explicit validation also covers callers outside an HTTP ValidationPipe.
export function inventoryInteger(value: unknown, label: string, min = 0) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > 1000000)
    throw new BadRequestException(`${label} must be a whole number from ${min} to 1,000,000.`);
  return value;
}
function text(value: unknown, label: string, max: number, required = false) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()))
    throw new BadRequestException(`${label} ${required ? 'is required and ' : ''}must be at most ${max} characters.`);
  return value.trim();
}
function money(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001)
    throw new BadRequestException(`${label} must be a nonnegative amount with at most two decimal places.`);
  return value;
}
export function validateInventoryCreate(body: any) {
  return {
    name: text(body?.name, 'Item name', 150, true),
    sku: text(body?.sku, 'SKU', 100, true).toUpperCase(),
    category: text(body?.category, 'Category', 100, true),
    unit: text(body?.unit, 'Unit', 40, true),
    supplier: text(body?.supplier ?? '', 'Supplier', 150),
    note: text(body?.note ?? '', 'Note', 1000),
    initialQuantity: inventoryInteger(body?.initialQuantity, 'Opening stock'),
    lowStockAlert: inventoryInteger(body?.lowStockAlert, 'Low stock threshold'),
    costPrice: money(body?.costPrice, 'Cost price'),
    retailPrice: money(body?.retailPrice, 'Retail price'),
  };
}

@Injectable()
export class InventoryService implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000 });
  constructor(private readonly logs: OperationalLogsService) {}
  onModuleDestroy() { return this.pool.end(); }

  private format(row: any) {
    const stock = Number(row.quantity_on_hand ?? 0);
    const threshold = Number(row.reorder_threshold ?? 5);
    return { id: row.id, sku: row.sku, name: row.name, category: row.category ?? 'Uncategorized',
      unit: row.stock_unit, supplier: row.supplier_name ?? '', note: row.description ?? '',
      stock, alertThreshold: threshold, unitCost: Number(row.cost_price), retailPrice: Number(row.selling_price),
      recommendedQty: Math.max(1, threshold * 2 - stock),
      status: stock <= threshold ? 'LOW STOCK' : 'IN STOCK', isArchived: row.archived_at != null };
  }
  async list() {
    const result = await this.pool.query(`SELECT p.*, i.quantity_on_hand, i.reorder_threshold FROM public.products p
      LEFT JOIN public.inventory i ON i.product_id=p.id WHERE p.inventory_hidden_at IS NULL ORDER BY p.created_at DESC,p.id DESC`);
    return result.rows.map(row => this.format(row));
  }
  private async item(c: PoolClient, id: number) {
    const result = await c.query('SELECT * FROM public.products WHERE id=$1 AND inventory_hidden_at IS NULL FOR UPDATE', [id]);
    if (!result.rowCount) throw new NotFoundException('Inventory item not found.');
    return result.rows[0];
  }
  // The request receipt, stock, movement, and audit event commit together.
  // Retrying an uncertain response cannot apply the same stock change twice.
  private async write(actorId: number, key: string, operation: string, payload: unknown, action: (c: PoolClient) => Promise<any>) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key ?? ''))
      throw new BadRequestException('A valid Idempotency-Key is required.');
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      const claim = await c.query(`INSERT INTO public.inventory_requests(request_key,actor_user_id,operation,payload_hash)
        VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING request_key`, [key, actorId, operation, hash]);
      if (!claim.rowCount) {
        const existing = (await c.query('SELECT * FROM public.inventory_requests WHERE request_key=$1', [key])).rows[0];
        if (existing.actor_user_id !== actorId || existing.operation !== operation || existing.payload_hash !== hash)
          throw new ConflictException('This request key was already used for a different action.');
        await c.query('COMMIT');
        return existing.response;
      }
      const response = await action(c);
      await c.query('UPDATE public.inventory_requests SET response=$2::jsonb WHERE request_key=$1', [key, JSON.stringify(response)]);
      await c.query('COMMIT');
      return response;
    } catch (error: any) {
      await c.query('ROLLBACK');
      if (error.code === '23505') throw new ConflictException('This SKU already exists, including archived items.');
      throw error;
    } finally { c.release(); }
  }
  private async audit(c: PoolClient, actorId: number, event: string, details: string) {
    const actor = (await c.query(`SELECT role, concat_ws(' ',"firstName","lastName") AS name FROM public."user" WHERE id=$1`, [actorId])).rows[0];
    await this.logs.record({ module: 'Inventory Management', event, actorUserId: actorId,
      userName: actor.name || `User #${actorId}`, userRole: actor.role, details }, c);
  }
  async create(actorId: number, key: string, body: any) {
    const d = validateInventoryCreate(body);
    return this.write(actorId, key, 'create', d, async c => {
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['inventory-sku:' + d.sku]);
      if ((await c.query('SELECT id FROM public.products WHERE upper(btrim(sku))=$1', [d.sku])).rowCount)
        throw new ConflictException('This SKU already exists, including archived items.');
      const p = (await c.query(`INSERT INTO public.products(sku,name,category,cost_price,selling_price,stock_unit,supplier_name,description)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [d.sku,d.name,d.category,d.costPrice,d.retailPrice,d.unit,d.supplier,d.note])).rows[0];
      await c.query('INSERT INTO public.inventory(product_id,quantity_on_hand,reorder_threshold) VALUES($1,$2,$3)', [p.id,d.initialQuantity,d.lowStockAlert]);
      if (d.initialQuantity > 0) await c.query(`INSERT INTO public.inventory_movements(product_id,movement_type,quantity_change,reason,performed_by)
        VALUES($1,'OPENING',$2,'Opening stock',$3)`, [p.id,d.initialQuantity,actorId]);
      await this.audit(c, actorId, 'Inventory Item Added', `Product #${p.id}; opening quantity ${d.initialQuantity}.`);
      return { id: p.id };
    });
  }
  async restock(actorId: number, key: string, id: number, body: any) {
    const qty = inventoryInteger(body?.quantity, 'Restock quantity', 1);
    const note = text(body?.note ?? '', 'Restock note', 1000);
    return this.write(actorId, key, `restock:${id}`, { qty, note }, async c => {
      const product = await this.item(c, id);
      if (product.archived_at || !product.is_active) throw new BadRequestException('Restore the item before restocking.');
      await c.query(`INSERT INTO public.inventory(product_id) VALUES($1) ON CONFLICT DO NOTHING`, [id]);
      const result = await c.query(`UPDATE public.inventory SET quantity_on_hand=quantity_on_hand+$2,updated_at=now()
        WHERE product_id=$1 AND quantity_on_hand <= 1000000-$2 RETURNING quantity_on_hand`, [id,qty]);
      if (!result.rowCount) throw new BadRequestException('Stock cannot exceed 1,000,000 units.');
      await c.query(`INSERT INTO public.inventory_movements(product_id,movement_type,quantity_change,reason,performed_by)
        VALUES($1,'RESTOCK',$2,$3,$4)`, [id,qty,note || 'Admin restock',actorId]);
      await this.audit(c, actorId, 'Inventory Restocked', `Product #${id}; added ${qty}; balance ${result.rows[0].quantity_on_hand}.`);
      return { success: true, stock: result.rows[0].quantity_on_hand };
    });
  }
  async changeState(actorId: number, key: string, id: number, state: 'archive' | 'restore' | 'hide') {
    return this.write(actorId, key, `${state}:${id}`, {}, async c => {
      const p = await this.item(c, id);
      if (state === 'archive') {
        if (p.archived_at) throw new ConflictException('Item is already archived.');
        await c.query(`UPDATE public.products SET inventory_previous_active=is_active,is_active=false,archived_at=now(),archived_by=$2,updated_at=now() WHERE id=$1`, [id,actorId]);
      } else {
        if (!p.archived_at) throw new BadRequestException('Archive the item first.');
        if (state === 'restore') await c.query(`UPDATE public.products SET is_active=coalesce(inventory_previous_active,true),
          inventory_previous_active=NULL,archived_at=NULL,archived_by=NULL,archive_reason=NULL,updated_at=now() WHERE id=$1`, [id]);
        else await c.query('UPDATE public.products SET inventory_hidden_at=now(),inventory_hidden_by=$2,updated_at=now() WHERE id=$1', [id,actorId]);
      }
      await this.audit(c, actorId, state === 'archive' ? 'Inventory Item Archived' : state === 'restore' ? 'Inventory Item Restored' : 'Inventory Item Removed', `Product #${id}; stock history retained.`);
      return { success: true };
    });
  }
  private order(row: any) {
    return { id: String(row.id), number: `PO-${String(row.id).padStart(6,'0')}`, createdAt: row.created_at,
      requestedBy: row.requested_by_name, items: row.items, total: Number(row.total) };
  }
  async orders() {
    return (await this.pool.query('SELECT * FROM public.inventory_purchase_orders ORDER BY id DESC LIMIT 200')).rows.map(r => this.order(r));
  }
  async createOrder(actorId: number, key: string, body: any) {
    if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 100)
      throw new BadRequestException('Choose 1–100 items for the purchase order.');
    const lines = body.items.map((i: any) => ({ id: inventoryInteger(i.id,'Product ID',1), quantity: inventoryInteger(i.quantity,'Order quantity',1) }));
    if (new Set(lines.map((i: any) => i.id)).size !== lines.length) throw new BadRequestException('Duplicate purchase order items.');
    return this.write(actorId,key,'purchase-order',lines,async c => {
      const snapshots = [];
      let totalCents = 0;
      // Consistent lock order prevents two overlapping orders deadlocking.
      for (const line of [...lines].sort((a,b) => a.id-b.id)) {
        const p = await this.item(c,line.id);
        if (p.archived_at || !p.is_active) throw new BadRequestException('Purchase orders require active items.');
        const cents = Math.round(Number(p.cost_price)*100);
        totalCents += cents*line.quantity;
        if (!Number.isSafeInteger(totalCents)) throw new BadRequestException('Purchase order total is too large.');
        snapshots.push({ id:p.id,sku:p.sku,name:p.name,unit:p.stock_unit,quantity:line.quantity,unitCost:Number(p.cost_price) });
      }
      const actor = (await c.query(`SELECT concat_ws(' ',"firstName","lastName") AS name FROM public."user" WHERE id=$1`,[actorId])).rows[0];
      const row = (await c.query(`INSERT INTO public.inventory_purchase_orders(requested_by,requested_by_name,items,total)
        VALUES($1,$2,$3::jsonb,$4) RETURNING *`,[actorId,actor.name,JSON.stringify(snapshots),(totalCents/100).toFixed(2)])).rows[0];
      await this.audit(c,actorId,'Purchase Order Created',`Purchase order #${row.id}; ${snapshots.length} items. Stock unchanged.`);
      return this.order(row);
    });
  }
}
