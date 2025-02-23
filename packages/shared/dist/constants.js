"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalTransformer = exports.periodosGarantia = exports.entidades = exports.roles = exports.categorias = exports.emailValidationPattern = exports.passwordValidationPattern = exports.PAISES = void 0;
const enums_1 = require("./enums");
exports.PAISES = [
    "Bolivia",
    "Chile",
    "China",
    "Costa Rica",
    "Ecuador",
    "El Salvador",
    "España",
    "Estados Unidos",
    "Guatemala",
    "Honduras",
    "Panamá",
    "Perú",
    "República Dominicana",
    "Venezuela"
];
exports.passwordValidationPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*[^\w\s]{2,})(?=.*[^\w\s]).{8,}$/;
exports.emailValidationPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
exports.categorias = Object.values(enums_1.Categorias);
exports.roles = Object.values(enums_1.RolesBase);
exports.entidades = Object.values(enums_1.EntidadesProtegidas);
exports.periodosGarantia = Object.values(enums_1.PeriodosGarantia);
exports.decimalTransformer = {
    to: (value) => value,
    from: (value) => parseFloat(value),
};
