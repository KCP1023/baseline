import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CCSMAnchorHashAgent } from '../../agents/ccsmAnchorHash.agent';
import { CCSMAnchorHashStorageAgent } from '../../agents/ccsmAnchorHashStorage.agent';
import { CCSMAnchorHashLocalStorageAgent } from '../../agents/ccsmAnchorHashLocalStorage.agent';
import { CreateCCSMAnchorHashCommand } from './createCCSMAnchorHash.command';
import { Document } from '../../models/document';
import { CCSMAnchorHash } from '../../models/ccsmAnchorHash';

@CommandHandler(CreateCCSMAnchorHashCommand)
export class CreateCCSMAnchorHashCommandHandler
  implements ICommandHandler<CreateCCSMAnchorHashCommand>
{
  constructor(
    private readonly agent: CCSMAnchorHashAgent,
    private readonly ccsmStorageAgent: CCSMAnchorHashStorageAgent,
    private readonly localStorageAgent: CCSMAnchorHashLocalStorageAgent,
  ) {}

  async execute(command: CreateCCSMAnchorHashCommand) {
    this.agent.throwErrorIfCCSMAnchorHashInputInvalid(command.document);

    const newDocument = await this.localStorageAgent.createNewDocument(
      command.document,
    );

    const newCCSMAnchorHash = this.agent.createNewCCSMAnchorHash(
      command.ownerAccount.id,
      newDocument,
    );

    const newCCSMAnchorHashModel =
      this.localStorageAgent.createNewCCSMAnchorHash(newCCSMAnchorHash);

    await this.ccsmStorageAgent.storeAnchorHashOnCCSM(newCCSMAnchorHash);

    return newCCSMAnchorHash;
  }
}
