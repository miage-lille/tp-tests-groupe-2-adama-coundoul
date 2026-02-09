// Tests unitaires

import { testUser } from "src/users/tests/user-seeds";
import { InMemoryWebinarRepository } from "../adapters/webinar-repository.in-memory";
import { Webinar } from "../entities/webinar.entity";
import { ChangeSeats } from "./change-seats";
import { WebinarNotFoundException } from "../exceptions/webinar-not-found";
import { WebinarNotOrganizerException } from "../exceptions/webinar-not-organizer";
import { WebinarReduceSeatsException } from "../exceptions/webinar-reduce-seats";
import { WebinarTooManySeatsException } from "../exceptions/webinar-too-many-seats";
import { User } from "src/users/entities/user.entity";


describe('Feature : Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  function expectWebinarToRemainUnchanged() {
    const current = webinarRepository.findByIdSync('webinar-id');
    expect(current?.props.seats).toEqual(100);
  }

  async function whenUserChangeSeatsWith(payload: {
    user: User;
    webinarId: string;
    seats: number;
  }) {
    await useCase.execute(payload);
  }

  async function thenUpdatedWebinarSeatsShouldBe(seats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(seats);
  }

  // Happy path
  describe('Scenario: happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should change the number of seats for a webinar', async () => {
      await whenUserChangeSeatsWith(payload);
      await thenUpdatedWebinarSeatsShouldBe(200);
    });
  });

  // Webinar does not exist
  describe('Scenario: webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'unknown-webinar-id',
      seats: 200,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotFoundException);
      expectWebinarToRemainUnchanged();
    });
  });

  // Update the webinar of someone else
  describe('Scenario: update the webinar of someone else', () => {
    const payload = {
      user: testUser.bob,
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarNotOrganizerException);
      expectWebinarToRemainUnchanged();
    });
  });

  // Change seat to an inferior number
  describe('Scenario: change seat to an inferior number', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 50,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarReduceSeatsException);
      expectWebinarToRemainUnchanged();
    });
  });

  // Change seat to a number > 1000
  describe('Scenario: change seat to a number > 1000', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1001,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow(WebinarTooManySeatsException);
      expectWebinarToRemainUnchanged();
    });
  });
});