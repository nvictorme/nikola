import { EntidadesProtegidas, RolesBase } from "./enums";

export const passwordValidationPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*[^\w\s]{2,})(?=.*[^\w\s]).{8,}$/;

export const emailValidationPattern =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const roles = Object.values(RolesBase);

export const entidades = Object.values(EntidadesProtegidas);

export const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};
