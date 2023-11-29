import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command';
import { AuthAgent } from '../../agent/auth.agent';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand> {
  constructor(private readonly authAgent: AuthAgent) {}

  async execute(command: LoginCommand): Promise<{ access_token: string }> {
    const { message, signature, publicKey } = command;

    const bpiSubject = await this.authAgent.getBpiSubjectByPublicKey(publicKey);

    this.authAgent.throwIfLoginNonceMismatch(bpiSubject, message);

    this.authAgent.throwIfSignatureAgainstAddressVerificationFails(
      message,
      signature,
      publicKey,
    );

    return this.authAgent.generateDidJwt(bpiSubject);
  }
}
