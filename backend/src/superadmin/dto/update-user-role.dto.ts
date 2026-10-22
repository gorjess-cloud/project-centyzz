
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['SUPERADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'])
  role!: string;
}
