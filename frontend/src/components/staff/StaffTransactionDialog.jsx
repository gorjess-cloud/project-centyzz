import {useEffect,useState} from 'react';
import {CheckCircle2,ReceiptText,RefreshCw} from 'lucide-react';
import {staffPosRequest} from '../../api/staff-pos';
import {Modal,btn,btnGhost,peso} from './ui';

export default function StaffTransactionDialog({token,transactionId,confirmed=false,onClose}) {
 const [result,setResult]=useState(null),[refresh,setRefresh]=useState(0);
 const key=token+':'+transactionId+':'+refresh,ready=result?.key===key,data=ready?result.data:null,error=ready?result.error:'';
 useEffect(()=>{let active=true;staffPosRequest(token,'transactions/'+encodeURIComponent(transactionId))
  .then(data=>{if(active)setResult({key,data,error:''});})
  .catch(error=>{if(active)setResult({key,data:null,error:error.message});});return()=>{active=false;};
 },[key,token,transactionId]);
 return <Modal title={confirmed?'Checkout confirmed':'Transaction details'} onClose={onClose} size="max-w-2xl">
  {confirmed&&<div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 size={24} className="shrink-0"/><div><strong>Payment recorded and checkout saved</strong><p className="mt-1 text-xs">Your sale is saved as one transaction. It is included in your cashier summary.</p></div></div>}
  {!ready&&<p role="status" className="py-8 text-center text-sm">Loading saved transaction…</p>}
  {error&&<div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800"><p>{confirmed?'The sale was saved, but its details could not be loaded. ':''}{error}</p><button type="button" className={`${btnGhost} mt-3 flex items-center gap-2`} onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={14}/>Retry loading details</button></div>}
  {data&&<div className="space-y-5">
   <div className="flex flex-wrap justify-between gap-3 border-b border-[#E7DFD4] pb-4"><div><p className="flex items-center gap-2 text-lg font-bold"><ReceiptText size={20}/>{data.txnId}</p><p className="mt-1 text-xs text-[#8A8174]">{data.date} · {data.time} · Philippine time</p></div><span className="h-fit rounded-full bg-[#EBDBC8] px-3 py-1 text-xs font-bold">{data.status}</span></div>
   <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#8A8174]">Staff / cashier</dt><dd className="mt-1 font-semibold">{data.cashier}</dd></div><div><dt className="text-xs text-[#8A8174]">Transaction total</dt><dd className="mt-1 text-lg font-bold">{peso(data.total)}</dd></div></dl>
   {data.legacy?<div className="rounded-xl bg-amber-50 p-4 text-sm"><p className="font-semibold">{data.summary}</p><p className="mt-2">Recorded method: {data.paymentMethod}</p><p className="mt-2 text-xs text-amber-900">{data.note}</p></div>:<>
    <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]"><table className="w-full text-left text-xs"><caption className="p-3 text-left text-sm font-bold">Services / items</caption><thead className="bg-[#F8F5F0]"><tr>{['Service / item','Qty','Unit price','Line total'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{data.items.map(item=><tr key={item.id} className="border-t border-[#E7DFD4]"><td className="p-3 font-semibold">{item.name}{(item.discount>0||item.tax>0)&&<p className="mt-1 text-[10px] font-normal text-[#8A8174]">Item discount: {peso(item.discount)} · Tax: {peso(item.tax)}</p>}</td><td className="p-3">{item.quantity}</td><td className="whitespace-nowrap p-3">{peso(item.unitPrice)}</td><td className="whitespace-nowrap p-3">{peso(item.total)}</td></tr>)}</tbody></table></div>
    <dl className="ml-auto max-w-xs space-y-2 text-sm"><div className="flex justify-between gap-5"><dt>Subtotal</dt><dd>{peso(data.subtotal)}</dd></div><div className="flex justify-between gap-5"><dt>Discount{data.discounts?.length>0&&<span className="block text-[10px] text-[#8A8174]">{data.discounts.map(d=>d.label).join(', ')}</span>}</dt><dd>−{peso(data.discount)}</dd></div><div className="flex justify-between gap-5"><dt>Tax</dt><dd>{peso(data.tax)}</dd></div><div className="flex justify-between gap-5 border-t border-[#E7DFD4] pt-2 font-bold"><dt>Total</dt><dd>{peso(data.total)}</dd></div></dl>
    <section className="rounded-xl bg-[#F8F5F0] p-4"><h3 className="mb-3 text-sm font-bold">Payments</h3><div className="space-y-3">{data.payments.map(payment=><div key={payment.id} className="text-xs"><div className="flex justify-between gap-3 font-semibold"><span>{payment.method} · {payment.status}</span><span>{peso(payment.amount)}</span></div>{payment.cashReceived!==null&&<p className="mt-1 text-[#8A8174]">Cash received: {peso(payment.cashReceived)} · Change: {peso(payment.change??0)}</p>}</div>)}</div></section>
   </>}
  </div>}
  <div className="mt-6 flex justify-end"><button type="button" className={btn} onClick={onClose}>{confirmed?'Done':'Close details'}</button></div>
 </Modal>;
}
