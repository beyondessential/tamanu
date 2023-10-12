declare module '@tamanu/shared/permissions/buildAbility' {
  import type { AbilityOptionsOf, AnyAbility, PureAbility } from '@casl/ability';

  export interface Permission {
    objectId?: string;
    verb: string;
    noun: string;
  }
  export interface User {
    id: string;
    role: string;
  }
  export function buildAbility<T extends AnyAbility = PureAbility>(permissions: Permission[], options?: AbilityOptionsOf<T>): T;
  export function buildAdminAbility<T extends AnyAbility = PureAbility>(): T;
  export function buildAbilityForUser<T extends AnyAbility = PureAbility>(user: User, permissions: Permission[]): T;
  export function buildAbilityForTests<T extends AnyAbility = PureAbility>(permissions: Permission[]): T;
}