import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BpiMessageAgent } from '../agents/bpiMessages.agent';
import { CreateBpiMessageCommandHandler } from '../capabilities/createBpiMessage/createBpiMessageCommand.handler';
import { DeleteBpiMessageCommandHandler } from '../capabilities/deleteBpiMessage/deleteBpiMessageCommand.handler';
import { GetBpiMessageByIdQueryHandler } from '../capabilities/getBpiMessageById/getBpiMessageByIdQuery.handler';
import { UpdateBpiMessageCommandHandler } from '../capabilities/updateBpiMessage/updateBpiMessageCommand.handler';
import { BpiMessageStorageAgent } from '../agents/bpiMessagesStorage.agent';
import { MockBpiMessageStorageAgent } from '../agents/mockBpiMessagesStorage.agent';
import { BpiSubjectStorageAgent } from '../../identity/bpiSubjects/agents/bpiSubjectsStorage.agent';
import { MockBpiSubjectStorageAgent } from '../../identity/bpiSubjects/agents/mockBpiSubjectStorage.agent';
import { BpiSubject } from '../../identity/bpiSubjects/models/bpiSubject';
import { BpiSubjectType } from '../../identity/bpiSubjects/models/bpiSubjectType.enum';
import { CreateBpiMessageDto } from './dtos/request/createBpiMessage.dto';
import { UpdateBpiMessageDto } from './dtos/request/updateBpiMessage.dto';
import { NOT_FOUND_ERR_MESSAGE } from './err.messages';
import { NOT_FOUND_ERR_MESSAGE as BPI_SUBJECT_NOT_FOUND_ERR_MESSAGE } from '../../identity/bpiSubjects/api/err.messages';
import { MessageController } from './messages.controller';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { CommunicationProfile } from '../communicaton.profile';
import { SubjectsProfile } from '../../identity/bpiSubjects/subjects.profile';
import { TEST_VALUES } from 'src/bri/shared/constants';

describe('MessageController', () => {
  let mController: MessageController;
  let mockBpiMessageStorageAgent: MockBpiMessageStorageAgent;
  let mockBpiSubjectStorageAgent: MockBpiSubjectStorageAgent;
  let existingBpiSubject1: BpiSubject;
  let existingBpiSubject2: BpiSubject;

  beforeEach(async () => {
    mockBpiMessageStorageAgent = new MockBpiMessageStorageAgent();
    mockBpiSubjectStorageAgent = new MockBpiSubjectStorageAgent();
    existingBpiSubject1 = await mockBpiSubjectStorageAgent.createNewBpiSubject(
      new BpiSubject(
        '',
        TEST_VALUES.name,
        TEST_VALUES.description,
        BpiSubjectType.External,
        TEST_VALUES.publicKey,
      ),
    );
    existingBpiSubject2 = await mockBpiSubjectStorageAgent.createNewBpiSubject(
      new BpiSubject('', 'name2', 'desc2', BpiSubjectType.External, 'xyz2'),
    );

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [MessageController],
      providers: [
        BpiMessageAgent,
        CreateBpiMessageCommandHandler,
        UpdateBpiMessageCommandHandler,
        DeleteBpiMessageCommandHandler,
        GetBpiMessageByIdQueryHandler,
        BpiMessageStorageAgent,
        BpiSubjectStorageAgent,
        SubjectsProfile,
        CommunicationProfile,
      ],
    })
      .overrideProvider(BpiMessageStorageAgent)
      .useValue(mockBpiMessageStorageAgent)
      .overrideProvider(BpiSubjectStorageAgent)
      .useValue(mockBpiSubjectStorageAgent)
      .compile();

    mController = app.get<MessageController>(MessageController);

    await app.init();
  });

  describe('getBpiMessageById', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = TEST_VALUES.id;

      // Act and assert
      expect(async () => {
        await mController.getBpiMessageById(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should return the correct bpi subject if proper id passed ', async () => {
      // Arrange
      const requestDto = {
        id: TEST_VALUES.id,
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: TEST_VALUES.content,
        signature: TEST_VALUES.signature,
        type: 1,
      } as CreateBpiMessageDto;

      const newBpiMessageId = await mController.createBpiMessage(requestDto);

      // Act
      const createdBpiMessage = await mController.getBpiMessageById(
        newBpiMessageId,
      );

      // Assert
      expect(createdBpiMessage.id).toEqual(newBpiMessageId);
      expect(createdBpiMessage.content).toEqual(requestDto.content);
      expect(createdBpiMessage.signature).toEqual(requestDto.signature);
      expect(createdBpiMessage.type).toEqual(requestDto.type);
    });
  });

  describe('createBpiMessage', () => {
    it('should throw BadRequest non existent bpi subject id provided in from field', () => {
      // Arrange
      const requestDto = {
        id: TEST_VALUES.id,
        from: 'nonexistent',
        to: existingBpiSubject2.id,
        content: TEST_VALUES.content,
        signature: TEST_VALUES.signature,
        type: 1,
      } as CreateBpiMessageDto;

      // Act and assert
      expect(async () => {
        await mController.createBpiMessage(requestDto);
      }).rejects.toThrow(
        new BadRequestException(BPI_SUBJECT_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should return new uuid from the created bpi subject when all params provided', async () => {
      // Arrange
      const requestDto = {
        id: TEST_VALUES.id,
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: TEST_VALUES.content,
        signature: TEST_VALUES.signature,
        type: 1,
      } as CreateBpiMessageDto;

      // Act
      const response = await mController.createBpiMessage(requestDto);

      // Assert
      expect(response).toEqual(requestDto.id);
    });
  });

  describe('updateBpiMessage', () => {
    it('should throw NotFound if non existent id passed', async () => {
      // Arrange
      const nonExistentId = TEST_VALUES.id;

      const requestDto = {
        content: TEST_VALUES.content,
        signature: TEST_VALUES.signature,
      } as UpdateBpiMessageDto;

      // Act and assert
      expect(async () => {
        await mController.updateBpiMessage(nonExistentId, requestDto);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the update if existing id passed', async () => {
      // Arrange
      const createRequestDto = {
        id: TEST_VALUES.id,
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: TEST_VALUES.content,
        signature: TEST_VALUES.signature,
        type: 1,
      } as CreateBpiMessageDto;

      const newBpiMessageId = await mController.createBpiMessage(
        createRequestDto,
      );

      const updateRequestDto = {
        content: TEST_VALUES.content2,
        signature: TEST_VALUES.signature2,
      } as UpdateBpiMessageDto;

      // Act
      await mController.updateBpiMessage(newBpiMessageId, updateRequestDto);

      // Assert
      const updatedBpiMessage = await mController.getBpiMessageById(
        newBpiMessageId,
      );

      expect(updatedBpiMessage.id).toEqual(newBpiMessageId);
      expect(updatedBpiMessage.content).toEqual(updateRequestDto.content);
      expect(updatedBpiMessage.signature).toEqual(updateRequestDto.signature);
    });
  });

  describe('deleteBpiMessage', () => {
    it('should throw NotFound if non existent id passed', async () => {
      // Arrange
      const nonExistentId = TEST_VALUES.id;
      // Act and assert
      expect(async () => {
        await mController.deleteBpiMessage(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the delete if existing id passed', async () => {
      // Arrange
      const createRequestDto = {
        id: TEST_VALUES.id,
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: TEST_VALUES.content,
        signature: TEST_VALUES.signature,
        type: 1,
      } as CreateBpiMessageDto;

      const newBpiMessageId = await mController.createBpiMessage(
        createRequestDto,
      );

      // Act
      await mController.deleteBpiMessage(newBpiMessageId);

      // Assert
      expect(async () => {
        await mController.getBpiMessageById(newBpiMessageId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });
  });
});
