import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBpiSubjectCommand } from '../capabilities/createBpiSubject/createBpiSubject.command';
import { BpiSubject } from '../models/bpiSubject';
import { CreateBpiSubjectDto } from './dtos/request/createBpiSubject.dto';

import { uuid } from 'uuidv4';

@Controller("subjects")
export class SubjectController {
  constructor(private commandBus: CommandBus) {}

  // TODO: DTO validation
  // TODO: Response DTOs
  // TODO: DTO -> Command mapping
  @Post()
  async CreateBpiSubject(@Body() requestDto: CreateBpiSubjectDto): Promise<BpiSubject> {
    return await this.commandBus.execute(
      new CreateBpiSubjectCommand(
            //TODO: remove this after a decision is made for uuid
            uuid(),
            requestDto.name, 
            requestDto.desc, 
            requestDto.publicKey
        )
      );
  }
}
