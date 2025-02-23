import { Categorias, EntidadesProtegidas, PeriodosGarantia, RolesBase } from "./enums";
export declare const PAISES: string[];
export declare const passwordValidationPattern: RegExp;
export declare const emailValidationPattern: RegExp;
export declare const categorias: Categorias[];
export declare const roles: RolesBase[];
export declare const entidades: EntidadesProtegidas[];
export declare const periodosGarantia: PeriodosGarantia[];
export declare const decimalTransformer: {
    to: (value: number) => number;
    from: (value: string) => number;
};
