[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/VefsMSgr)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=22497781&assignment_repo_type=AssignmentRepo)
# TP TESTING : How to test our new feature change number of seats ?

## Table of Contents

- [TP TESTING : How to test our new feature change number of seats ?](#tp-testing--how-to-test-our-new-feature-change-number-of-seats-)
  - [Table of Contents](#table-of-contents)
  - [Présentation du contexte](#présentation-du-contexte)
  - [Spécifications](#spécifications)
  - [How to use ?](#how-to-use-)
  - [Marche à suivre](#marche-à-suivre)
    - [Création de tests unitaires](#création-de-tests-unitaires)
      - [A. Structure d'un test unitaire](#a-structure-dun-test-unitaire)
      - [B. Organisation des tests dans un fichier de tests](#b-organisation-des-tests-dans-un-fichier-de-tests)
      - [C. Ecriture de notre premier test](#c-ecriture-de-notre-premier-test)
      - [D. Conseils sur le testing](#d-conseils-sur-le-testing)
      - [E. Your turn : Webinar does not exist !](#e-your-turn--webinar-does-not-exist-)
      - [F. Refactoring du code et des tests](#f-refactoring-du-code-et-des-tests)
    - [Création d'un test d'intégration](#création-dun-test-dintégration)
      - [A. Création d'un repository avec Prisma](#a-création-dun-repository-avec-prisma)
      - [B. Boilerplate pour utiliser notre database dans les tests](#b-boilerplate-pour-utiliser-notre-database-dans-les-tests)
      - [C. Ecriture de notre premier test d'intégration : create](#c-ecriture-de-notre-premier-test-dintégration--create)
    - [Création d'un test E2E](#création-dun-test-e2e)
      - [A. Rappel sur les tests end-to-end](#a-rappel-sur-les-tests-end-to-end)
      - [B. Fixtures pour les tests E2E](#b-fixtures-pour-les-tests-e2e)
      - [C. Ecriture de notre premier test E2E](#c-ecriture-de-notre-premier-test-e2e)
    - [Bonus](#bonus)
  - [Troubleshoot](#troubleshoot)

## Présentation du contexte

Vous développez une application de gestion de webinaires en suivant les concepts de l'architecture Ports / Adapters.

Deux `use-case` sont déjà implémentés : organiser un webinaire (`organize-webinar`) et changer le nombre de place disponibles dans un webinaire (`change-seat`).

Dans le précédent TP, vous avez peut-être réalisé les tests unitaires pour couvrir la fonctionnalité demandée, `book-seat`.

Cette fois-ci, nous allons implémenter des tests unitaires et E2E sur la fonctionalité `change-seats`, ainsi que des tests d'intégration sur un repository `mongo-webinar-repository`.

Cette approche vous apportera une autre vision de comment s'y prendre pour tester unitairement vos fonctionnalités !

## Spécifications

Pour cette fonctionnalité `change-seat`, voici quelques règles métier :

- seul l'organisateur peut changer le nombre de siège disponible
- nous ne pouvons pas revoir un nombre de siège à la baisse

## How to use ?

- `npm run test:watch` pour lancer vos tests en watch mode
- `npm run test:int` pour lancer les tests d'intégrations (`test:int:watch` en mode watch)

## Marche à suivre

### Création de tests unitaires

#### A. Structure d'un test unitaire

Pour organiser un test unitaire, intéréssons nous d'abord à la structure d'un test.
Nous pouvons le découper en 3 parties, généralement appelé AAA (ou parfois GIVEN / WHEN / THEN)

- ARRANGE : mise en place des données ou des paramètres requis par le test
- ACT : appel de la fonction correspondant au scénario de test
- ASSERT : vérification de la donnée en sortie de l'étape ACT. Cette donnée doit être conforme au comportement attendu afin que le test réussisse.

#### B. Organisation des tests dans un fichier de tests

Nous allons implémenter les tests de la fonctionnalité `change-seat` dans le fichier `change-seat.test.ts`.

Voici une proposition d'organisation :

1. Au premier describe, indiquez la fonctionnalité testée.

```typescript
describe('Feature : Change seats', () => {
  ...
});
```

2. Au second, le scénario au sein de cette fonctionnalité.

```typescript
describe('Feature : Change seats', () => {
  ...// Initialisation de nos tests, boilerplates...
  describe('Scenario: Happy path', () => {
    ...
  });
});
```

3. Puis terminer par la règle métier qui est testée.

```typescript
describe('Feature : Change seats', () => {
  ...// Initialisation de nos tests, boilerplates...
  describe('Scenario: Happy path', () => {
    ...// Code commun à notre scénario : payload...
    it('should change the number of seats for a webinar', async () => {
      ...// Vérification de la règle métier, condition testée...
    });
  });
});
```

#### C. Ecriture de notre premier test

Nous pouvons maintenant écrire notre premier test, en commençant par écrire la payload que nous allons utiliser, soit une demande de l'utilisateur `alice` de changer le nombre de place à `200` pour le webinaire `webinar-id` :

```typescript
   describe('Scenario: happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };
    ...
  });
```

Nous cherchons maintenant à :

- executer notre use-case
- tester que le scénario passe comme attendu

Place à l'écriture :

```typescript
it('should change the number of seats for a webinar', async () => {
  // ACT
  await useCase.execute(payload);
  // ASSERT
  const updatedWebinar = await webinarRepository.findById('webinar-id');
  expect(updatedWebinar?.props.seats).toEqual(200);
});
```

Vous remarquerez sans doute qu'il manque quelques items avant de pouvoir faire passer notre test unitaire, le `useCase` n'est pas défini, ni le `webinarRepository`.

Toutes ces déclarations vont se faire sous le premier `describe`, et ce sont souvent les étapes que vous allez devoir faire peu importe la règle métier testée.

Nous cherchons donc à faire :

- initialiser le use-case
- initialiser un repository
- populer un webinaire dans ce repository, pour que l'on puisse appliquer les règles métier et vérifier
- avant chaque test, repartir d'un état initial, pour garantir l'indépendance entre plusieurs exécutions.

Allons-y :

```typescript
describe('Change seats', () => {
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
  ...
});
```

Le premier scénario devrait passer au vert ! Congrats 🎉

#### D. Conseils sur le testing

Une écriture du test unitaire après le code n'est pas forcément le + adapté car vous partez avec un esprit biaisé.
D'ailleurs, on pourrait ne pas y voir d'intérêt...

Et vous avez raison !

Pour l'écriture des tests unitaires, il est beaucoup + agréable de fonctionner en TDD, développement piloté par les tests, ou en test first, selon la complexité de ce qu'on développe.

De ce fait, on ne développe que le code nécessaire, naturellement couvert par un test, et le design émerge petit à petit avec les refactoring.

Le but du TP n'était pas de vous faire écrire du code business, mais comment on aurait pu s'y prendre ?

Voici quelques recommandations :

- je commence toujours par écrire mon premier scénario de test et le résultat attendu
- je déclare ensuite les différentes variables que je vais devoir utiliser
- je code les implémentations et retourne un premier résultat pour satisfaire mon test et le faire passer au vert
- j'entame une phase de refactoring pour rendre mon test et mon code + élégant.
- je passe au scénario suivant

#### E. Your turn : Webinar does not exist !

Passons au scénario suivant, que ce passe-t-il si le webinaire n'existe pas ?

```typescript
describe('Scenario: webinar does not exist', () => {
    const payload = {
      ...
    };
    it('should fail', async () => {
      ...
    });
});
```

❓ Quelle serait ma payload cette fois-ci, pour que l'on vérifie que le scénario est bien couvert ?

❓ Quel serait le test à écrire pour vérifier que le bon message d'erreur a été lancé ?

> 💡 Un indice : [rejects](https://jestjs.io/docs/expect#rejects)

Il ne faut pas oublier de vérifier que le webinaire initial n'a pas été modifié !

Ajoutons donc le code suivant :

```typescript
const webinar = webinarRepository.findByIdSync('webinar-id');
expect(webinar?.props.seats).toEqual(100);
```

Voici les scénarios qu'il nous reste à vérifier :

- Scenario: update the webinar of someone else
- Scenario: change seat to an inferior number
- Scenario: change seat to a number > 1000

> 💡 Vous trouverez tout ce qu'il vous faut en regardant le use-case.

#### F. Refactoring du code et des tests

Une fois que les différents scénarios sont couverts, il ne faut pas hésiter à faire un refactoring global, du code et des tests !

Si vous êtes arrivé jusque ici, vous avez peut-être remarqué que certaines étapes sont répétées souvent, par exemple :

```typescript
const webinar = webinarRepository.findByIdSync('webinar-id');
expect(webinar?.props.seats).toEqual(100);
```

Pour vérifier que le webinaire reste inchangé... Faisons donc une méthode partagé, sous le premier `describe`, qui soit un peu + parlante !

```typescript
...
  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }
...
```

Il ne faut pas hésiter à rendre nos tests le + parlant possible, ils font alors l'objet d'une documentation vivante que n'importe qui peut comprendre en lisant.

On pourrait remplacer notre `await useCase.execute(payload);` par une méthode `await whenUserChangeSeatsWith(payload)`

Et :

```typescript
const updatedWebinar = await webinarRepository.findById('webinar-id');
expect(updatedWebinar?.props.seats).toEqual(200);
```

Par `thenUpdatedWebinarSeatsShouldBe(200)`

Grâce à ces méthodes, nous construisons petit à petit ce que l'on appelle des **fixtures**.

Ces méthodes pourraient également être exportées du test pour ne laisser que du verbal... Testing is not boring 🤘

### Création d'un test d'intégration

Nous allons maintenant réaliser le premier test d'intégration, sur un nouveau repository.

Jusqu'à présent, nous avons travaillé avec un **repository in-memory**, très utile pour débuter dans la création de nos use-cases et dans nos tests unitaires.

Mais ça n'aurait pas vraiment de sens de faire un test d'intégration sur un in-memory...

#### A. Création d'un repository avec Prisma

Nous allons donc créer un repository qui va s'interfacer avec une vraie base de donnée, en utilisant [l'ORM Prisma](https://prisma.io).

Allons, y : dans `webinars/adapters/webinar-repository.prisma.ts`, copiez cette implémentation d'un repository avec Prisma :

```typescript
import { PrismaClient, Webinar as PrismaWebinar } from '@prisma/client';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

export class PrismaWebinarRepository implements IWebinarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(webinar: Webinar): Promise<void> {
    await this.prisma.webinar.create({
      data: WebinarMapper.toPersistence(webinar),
    });
    return;
  }
  async findById(id: string): Promise<Webinar | null> {
    const maybeWebinar = await this.prisma.webinar.findUnique({
      where: { id },
    });
    if (!maybeWebinar) {
      return null;
    }
    return WebinarMapper.toEntity(maybeWebinar);
  }
  async update(webinar: Webinar): Promise<void> {
    await this.prisma.webinar.update({
      where: { id: webinar.props.id },
      data: WebinarMapper.toPersistence(webinar),
    });
    return;
  }
}

class WebinarMapper {
  static toEntity(webinar: PrismaWebinar): Webinar {
    return new Webinar({
      id: webinar.id,
      organizerId: webinar.organizerId,
      title: webinar.title,
      startDate: webinar.startDate,
      endDate: webinar.endDate,
      seats: webinar.seats,
    });
  }

  static toPersistence(webinar: Webinar): PrismaWebinar {
    return {
      id: webinar.props.id,
      organizerId: webinar.props.organizerId,
      title: webinar.props.title,
      startDate: webinar.props.startDate,
      endDate: webinar.props.endDate,
      seats: webinar.props.seats,
    };
  }
}
```

Dans ce fichier, nous avons implémenté le `PrismaWebinarRepository` et un mapper `WebinarMapper`, afin de passer notre entité du domaine à l'infrastructure sereinement.

En production, l'application pourra maintenant utiliser un repository database (avec Prisma) plutôt qu'in-memory en un minimum d'adaptation grâce à l'**injection de dépendances** : c'est la force d'une architecture propre ! ✨

Naturellement, nous allons avoir un peu plus de travail de mise en place côté testing. Car il faut maintenant démarrer une DB dédidée, gérer les interactions pour que nos tests restent indépendants...

Dans la pratique, on essaiera toujours de séparer l'éxecution de ces tests d'intégration (ou e2e), qui sont plus coûteux que les tests unitaires de par leur nature.

Les tests unitaires sont très bien pour le développement et le feedback instantané, les tests d'intégrations se lanceront plutôt à la fin d'un développement ou dans une chaîne d'intégration.

#### B. Boilerplate pour utiliser notre database dans les tests

> 💡 Pour lancer notre test d'intégration, il faut lancer cette commande : `npm run test:int`.

Passons maintenant à lécriture du test dans le fichier `webinars/adapters/webinar-repository.prisma.int.test.ts`, voici ce que l'on cherche à faire :

- déclarer tout ce dont on va avoir besoin
- démarrer une DB dédiée aux tests
- effectuer les migrations pour que la DB soit synchronisée
- nettoyer cette DB entre chaque tests pour garantir l'indépendance
- stopper la DB proprement après l'execution des tests

Pour ces opérations, nous allons utiliser `testcontainers`. C'est une librairie qui va nous permettre de démarrer n'importe quel service qui tournerait dans un container docker, pour réaliser simplement des tests.

Voici les variables dont nous allons avoir besoin :

```typescript
import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { promisify } from 'util';
const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
  let container: StartedPostgreSqlContainer;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;
  ...
});
```

Nous allons ensuite ajouter une action avant le lancement des tests, démarrer la DB et réaliser les migrations :

```typescript
beforeAll(async () => {
  // Connect to database
  container = await new PostgreSqlContainer()
    .withDatabase('test_db')
    .withUsername('user_test')
    .withPassword('password_test')
    .withExposedPorts(5432)
    .start();

  const dbUrl = container.getConnectionUri();
  prismaClient = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  // Run migrations to populate the database
  await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);

  return prismaClient.$connect();
});
```

Ensuite, avant chaque test, on va s'assurer de ré-initialiser le repository et supprimer les nettoyer la DB :

```typescript
beforeEach(async () => {
  repository = new PrismaWebinarRepository(prismaClient);
  await prismaClient.webinar.deleteMany();
  await prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
});
```

Et pour finir, après le lancement de tous les tests, nous allons arrêter le container :

```typescript
afterAll(async () => {
  await container.stop({ timeout: 1000 });
  return prismaClient.$disconnect();
});
```

Un peu + de boilerplate inhérent à ce mode de tests... C'est aussi pour cette raison que l'on en fait naurellement moins, et pas avec la même approche.

En effet, ici, on adopetera plutôt une logique de "test first" ou "test last" plutôt que de faire du TDD car le feedback est relativement long.

#### C. Ecriture de notre premier test d'intégration : create

Allons y pour la suite, nous allons tester chaque méthode de notre repository :

```typescript
describe('Scenario : repository.create', () => {
  it('should create a webinar', async () => {
    // ARRANGE
    const webinar = new Webinar({
      id: 'webinar-id',
      organizerId: 'organizer-id',
      title: 'Webinar title',
      startDate: new Date('2022-01-01T00:00:00Z'),
      endDate: new Date('2022-01-01T01:00:00Z'),
      seats: 100,
    });

    // ACT
    await repository.create(webinar);

    // ASSERT
    const maybeWebinar = await prismaClient.webinar.findUnique({
      where: { id: 'webinar-id' },
    });
    expect(maybeWebinar).toEqual({
      id: 'webinar-id',
      organizerId: 'organizer-id',
      title: 'Webinar title',
      startDate: new Date('2022-01-01T00:00:00Z'),
      endDate: new Date('2022-01-01T01:00:00Z'),
      seats: 100,
    });
  });
});
```

Si vous avez bien remarqué, on évite d'utiliser notre repository pour la partie ASSERT, on utilise ici directement le `prismaClient` pour isoler le test de la méthode `create`.

À vous de jouer ! Vous allez maintenant suivre la même logique pour tester le `findById` et le `update`.

### Création d'un test E2E

Nous avons vu le test unitaire, qui se focalisait sur le business avec les use-cases.

Nous avons vu le test d'intégration qui venait tester nos adapteurs, aux frontières.

Il nous reste maintenant le test E2E, traversant toute l'application d'un adapteur à l'autre (de gauche à droite).

#### A. Rappel sur les tests end-to-end

Pour ce faire, il va falloir créer un point d'entrée dans notre application, un endpoint HTTP par exemple.

Notre test va alors appeler ce endpoint, comme pour simuler une requête, puis traverser notre application : use-cases, repository...Et nous allons pouvoir tester que :

- le retour HTTP est celui qu'on attend (status code, body...)
- la donnée à bien été traitée (insertion en DB, ignorée...)

Ce que vous avez peut-être remarqué lors de l'écriture du test d'intégration, c'est qu'il y avait beaucoup de boilerplate :

- setup de la DB
- nettoyage des données
- fermeture du client
- ...

Sur un test E2E, nous en avons encore + ! Car il faudra ajouter à tout ça la mise en place d'un serveur. Naturellement les tests seront encore + long à jouer.

C'est pour cette raison que l'on évite d'écrire trop de tests E2E, et on les éxecutes assez loin pour ne pas bloquer le flow de développement.

C'est un filet de sécurité sur des scénarios critique.

Pour notre TP, nous allons en écrire pour les use-cases développés, pour l'exemple... En réalité, essayez toujours d'identifier les scénarios critiques.

#### B. Fixtures pour les tests E2E

Nous allons commencer par apporter un peu de lisibilité grâce aux **Fixtures**.

Dans le contexte de tests, la fixture va être arrangeante et s'occuper également de la mise en place des différents items, comme nous l'avons vu plus haut dans les tests unitaires.

Allons y ! Dans le fichier `src/container.ts`, vous trouverez le code pour l'injection de dépendances et l'initialisation des use-cases & repositories.

_En utilisant des frameworks comme NestJS, cette partie deviendrait optionelle car le mécanisme est souvent intégré._

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { ChangeSeats } from 'src/webinars/use-cases/change-seats';

export class AppContainer {
  private prismaClient!: PrismaClient;
  private webinarRepository!: PrismaWebinarRepository;
  private changeSeatsUseCase!: ChangeSeats;

  init(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
    this.webinarRepository = new PrismaWebinarRepository(this.prismaClient);
    this.changeSeatsUseCase = new ChangeSeats(this.webinarRepository);
  }

  getPrismaClient() {
    return this.prismaClient;
  }

  getChangeSeatsUseCase() {
    return this.changeSeatsUseCase;
  }
}

export const container = new AppContainer();
```

Créons un fichier `src/tests/fixtures.ts` dans lequel nous allons retrouver beaucoup de choses communes à nos tests d'intégration.

_Vous pourrez d'ailleurs vous lancer dans un refactoring pour utiliser la fixture dans nos tests d'intégration, geste qui sera valorisé._

```typescript
import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import Fastify, { FastifyInstance } from 'fastify';
import { AppContainer } from 'src/container';
import { webinarRoutes } from 'src/webinars/routes';
import { promisify } from 'util';

const asyncExec = promisify(exec);

export class TestServerFixture {
  private container!: StartedPostgreSqlContainer;
  private prismaClient!: PrismaClient;
  private serverInstance!: FastifyInstance;
  private appContainer!: AppContainer;

  async init() {
    this.container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .start();

    const dbUrl = this.container.getConnectionUri();

    // Initialiser Prisma et les dépendances
    this.prismaClient = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
    await this.prismaClient.$connect();

    // Initialiser le conteneur avec Prisma
    this.appContainer = new AppContainer();
    this.appContainer.init(this.prismaClient);

    // Initialiser le serveur
    this.serverInstance = Fastify({ logger: false });
    await webinarRoutes(this.serverInstance, this.appContainer);
    await this.serverInstance.ready();
  }

  getPrismaClient() {
    return this.prismaClient;
  }

  getServer() {
    return this.serverInstance.server;
  }

  async stop() {
    if (this.serverInstance) await this.serverInstance.close();
    if (this.prismaClient) await this.prismaClient.$disconnect();
    if (this.container) await this.container.stop();
  }

  async reset() {
    await this.prismaClient.webinar.deleteMany();
    await this.prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
  }
}
```

Vous n'allez pas être perdu, on y retrouve majoritairement les concepts déjà vu + haut, on y ajoute simplement la déclaration du Container.

#### C. Ecriture de notre premier test E2E

Passons maintenant au fichier de test, que l'on peut appeler `src/api.e2e.test.ts`.

On commence par la première étape pour définir le fonctionnement de nos tests... Qui utilisera donc ce qu'on a créé pour la fixture

```typescript
describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });
...
});
```

Tout de suite + clair non ?!

Reste à écrire notre test, le happy path pour commencer :

```typescript
...
it('should update webinar seats', async () => {
    // ARRANGE
    const prisma = fixture.getPrismaClient();
    const server = fixture.getServer();

    const webinar = await prisma.webinar.create({
      data: {
        id: 'test-webinar',
        title: 'Webinar Test',
        seats: 10,
        startDate: new Date(),
        endDate: new Date(),
        organizerId: 'test-user',
      },
    });

    // ACT
    const response = await supertest(server)
      .post(`/webinars/${webinar.id}/seats`)
      .send({ seats: '30' })
      .expect(200);

    // ASSERT
    expect(response.body).toEqual({ message: 'Seats updated' });

    const updatedWebinar = await prisma.webinar.findUnique({
      where: { id: webinar.id },
    });
    expect(updatedWebinar?.seats).toBe(30);
  });
  ...
```

A vous de jouer ! Ajouter les tests qu'il faut pour correspondre aux différents retours HTTP :

- l'erreur `WebinarNotFoundException`
- l'erreur `WebinarNotOrganizerException`

### Bonus

Ajouter d'autres tests sur le use-case `organize-webinar`:

- un test d'intégration
- un test E2E

## Troubleshoot

Problem with testcontainers + devcontainer about docker rights on docker.sock

```bash
ls -al /var/run/docker.sock
```

Output must be `srw-rw-rw- 1 root docker`
We must have rights to make things on host docker.sock from devcontainers.
I fix it using `chmod 666 /var/run/docker.sock`
