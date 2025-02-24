"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalTransformer = exports.entidades = exports.roles = exports.emailValidationPattern = exports.passwordValidationPattern = void 0;
const enums_1 = require("./enums");
exports.passwordValidationPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*[^\w\s]{2,})(?=.*[^\w\s]).{8,}$/;
exports.emailValidationPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
exports.roles = Object.values(enums_1.RolesBase);
exports.entidades = Object.values(enums_1.EntidadesProtegidas);
exports.decimalTransformer = {
    to: (value) => value,
    from: (value) => parseFloat(value),
};
