import { BadRequestException } from '@nestjs/common';

export const STAFF_JOB_ROLES = ['Hair Stylist','Nail Technician','Beauty Therapist','Lash/Brow Technician','Receptionist','Cashier'] as const;
export const BOOKABLE_STAFF_JOB_ROLES = STAFF_JOB_ROLES.filter(role=>role!=='Receptionist'&&role!=='Cashier');
export function staffJobRole(value:unknown,allowUnassigned=false):string {
  const legacy:Record<string,string>={Stylist:'Hair Stylist',Therapist:'Beauty Therapist','Nail Tech':'Nail Technician',Staff:'Unassigned'};
  const role=typeof value==='string'?(legacy[value.trim()]??value.trim()):'';
  if((STAFF_JOB_ROLES as readonly string[]).includes(role)||(allowUnassigned&&role==='Unassigned'))return role;
  throw new BadRequestException('Select a staff job role: Hair Stylist, Nail Technician, Beauty Therapist, Lash/Brow Technician, Receptionist, or Cashier.');
}
