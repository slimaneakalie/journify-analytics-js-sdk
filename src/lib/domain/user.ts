import { v4 as uuid } from "@lukeed/uuid";
import { Traits, USER_TRAITS_PERSISTENCE_KEY } from "./traits";
import { Store } from "../store/store";

const ANONYMOUS_ID_PERSISTENCE_KEY = "journifyio_anonymous_id";
const USER_ID_PERSISTENCE_KEY = "journifyio_user_id";

export interface User {
  identify(userId?: string, traits?: Traits);
  getUserId(): string | null;
  getAnonymousId(): string | null;
  getTraits(): Traits | null;
}

export interface UserFactory {
  newUser(): User;
}

export class UserFactoryImpl implements UserFactory {
  private readonly localStorage: Store;
  private readonly cookiesStore: Store;
  private readonly memoryStore: Store;

  public constructor(
    localStorage: Store,
    cookiesStore: Store,
    memoryStore: Store
  ) {
    this.localStorage = localStorage;
    this.cookiesStore = cookiesStore;
    this.memoryStore = memoryStore;
  }

  public newUser(): User {
    return new UserImpl(this.localStorage, this.cookiesStore, this.memoryStore);
  }
}

class UserImpl implements User {
  private localStorage: Store;
  private cookiesStore: Store;
  private memoryStore: Store;
  private anonymousId: string;
  private userId: string;
  private traits: Traits;

  public constructor(
    localStorage: Store,
    cookiesStore: Store,
    memoryStore: Store
  ) {
    this.localStorage = localStorage;
    this.cookiesStore = cookiesStore;
    this.memoryStore = memoryStore;
    this.initUserId();
    this.initAnonymousId();
    this.initTraits();
  }

  public identify(userId?: string, traits: Traits = {}) {
    if (userId) {
      this.setUserId(userId);
    }

    const newTraits = {
      ...this.getTraits(),
      ...traits,
    };

    this.setTraits(newTraits);
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public getAnonymousId(): string | null {
    return this.anonymousId;
  }

  public getTraits(): Traits | null {
    return this.traits;
  }

  private initUserId() {
    this.userId = this.getFromStores(USER_ID_PERSISTENCE_KEY);
    if (this.userId) {
      this.setOnStores(USER_ID_PERSISTENCE_KEY, this.userId);
    }
  }

  private initAnonymousId() {
    this.anonymousId = this.getFromStores(ANONYMOUS_ID_PERSISTENCE_KEY);
    if (!this.anonymousId) {
      this.anonymousId = uuid();
    }

    this.setOnStores(ANONYMOUS_ID_PERSISTENCE_KEY, this.anonymousId);
  }

  private getFromStores<T>(key: string): T | null {
    return (
      this.localStorage.get(key) ??
      this.cookiesStore.get(key) ??
      this.memoryStore.get(key) ??
      null
    );
  }

  private setOnStores<T>(key: string, value: T) {
    this.localStorage.set(key, value);
    this.cookiesStore.set(key, value);
    this.memoryStore.set(key, value);
  }

  private initTraits() {
    const traits = this.getFromStores(USER_TRAITS_PERSISTENCE_KEY);
    if (traits) {
      this.setTraits(traits as Traits);
    } else {
      this.setTraits({});
    }
  }

  private setTraits(newTraits: Traits) {
    this.traits = newTraits;
    this.setOnStores(USER_TRAITS_PERSISTENCE_KEY, newTraits);
  }

  private setUserId(userId: string) {
    this.userId = userId;
    this.setOnStores(USER_ID_PERSISTENCE_KEY, userId);
  }
}
