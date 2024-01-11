import { IsNotEmpty } from 'class-validator';
import { PublicKey } from '../../../models/publicKey';

export class UpdateBpiSubjectDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  desc: string;

  @IsNotEmpty()
  publicKey: PublicKey;
}
