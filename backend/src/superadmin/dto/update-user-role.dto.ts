
import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['ADMIN', 'STAFF'])
  role!: string;
}
