import { AutoMap } from '@automapper/classes';
import { PublicKey } from '../../../models/publicKey';
import { BpiSubjectRoleDto } from './bpiSubjectRole.dto';

export class BpiSubjectDto {
  @AutoMap()
  id: string;

  @AutoMap()
  name: string;

  @AutoMap()
  description: string;

  @AutoMap()
  publicKey: {
    ecdsa: string;
    eddsa: string;
  };

  @AutoMap(() => [BpiSubjectRoleDto])
  roles: BpiSubjectRoleDto[];
}
