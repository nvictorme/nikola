"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingUrl = exports.getEstatusColor = exports.calcularStockDisponible = exports.calcularTotalOrden = exports.replaceUuidWithSlug = exports.getInitials = exports.canSeeBalance = exports.canCreateOrders = exports.isSuperAdmin = exports.currencyFormat = exports.isValidPassword = exports.emulateDownload = void 0;
exports.generateComplexPassword = generateComplexPassword;
const constants_1 = require("./constants");
const enums_1 = require("./enums");
/**
 *
 * @param downloadUrl URL to download the file
 * @param filename Name of the file
 */
const emulateDownload = (downloadUrl, filename) => {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = function () {
        var a = document.createElement("a");
        a.href = window.URL.createObjectURL(xhr.response);
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
    };
    xhr.open("GET", downloadUrl);
    xhr.send();
};
exports.emulateDownload = emulateDownload;
/**
 * Generates a complex password
 * @param length Length of the password
 * @param useUppercase Use uppercase characters
 * @param useLowercase Use lowercase characters
 * @param useNumbers Use numbers
 * @param useSpecialCharacters Use special characters
 * @returns A complex password string
 */
function generateComplexPassword({ length, useUppercase, useLowercase, useNumbers, useSpecialCharacters, }) {
    let characters = "";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialCharacters = "!@#$%^&*()_-+=<>?/[]{}|";
    if (useUppercase)
        characters += uppercase;
    if (useLowercase)
        characters += lowercase;
    if (useNumbers)
        characters += numbers;
    if (useSpecialCharacters)
        characters += specialCharacters;
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
const isValidPassword = (password) => {
    return constants_1.passwordValidationPattern.test(password);
};
exports.isValidPassword = isValidPassword;
const currencyFormat = ({ value, currency = "USD", locale = "en-US", fractionDigits = 2, }) => {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value);
};
exports.currencyFormat = currencyFormat;
const isSuperAdmin = (user) => {
    var _a;
    if (!user)
        return false;
    return ((_a = user.rol) === null || _a === void 0 ? void 0 : _a.nombre) === enums_1.RolesBase.gerente || user.super;
};
exports.isSuperAdmin = isSuperAdmin;
const canCreateOrders = (user) => {
    var _a, _b;
    if (!user)
        return false;
    if ((0, exports.isSuperAdmin)(user))
        return true;
    return (((_a = user.rol) === null || _a === void 0 ? void 0 : _a.nombre) === enums_1.RolesBase.distribuidor ||
        ((_b = user.rol) === null || _b === void 0 ? void 0 : _b.nombre) === enums_1.RolesBase.ventas);
};
exports.canCreateOrders = canCreateOrders;
const canSeeBalance = (user) => {
    var _a, _b;
    if (!user)
        return false;
    return ((0, exports.isSuperAdmin)(user) ||
        ((_a = user.rol) === null || _a === void 0 ? void 0 : _a.nombre) === enums_1.RolesBase.distribuidor ||
        ((_b = user.rol) === null || _b === void 0 ? void 0 : _b.nombre) === enums_1.RolesBase.contabilidad);
};
exports.canSeeBalance = canSeeBalance;
const getInitials = (nombre, apellido) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
};
exports.getInitials = getInitials;
/**
 * Replaces the UUID in the provided URL path with a given slug.
 *
 * @param currentPath - The current URL path containing the UUID.
 * @param slug - The new slug to replace the UUID in the URL.
 * @returns The updated path with the UUID replaced by the slug.
 */
const replaceUuidWithSlug = (currentPath, slug) => {
    // Regular expression to match a UUID (a string of 36 characters with hexadecimal digits and dashes)
    const uuidRegex = /[0-9a-fA-F-]{36}/;
    // Check if the current path contains a UUID
    if (uuidRegex.test(currentPath)) {
        // Replace the UUID with the provided slug
        const newPath = currentPath.replace(uuidRegex, slug);
        // console.log(`Path updated: ${newPath}`);
        // Return the updated path
        return newPath;
    }
    else {
        // console.warn("No UUID found in the provided path.");
        return currentPath; // Return the original path if no UUID is found
    }
};
exports.replaceUuidWithSlug = replaceUuidWithSlug;
const calcularTotalOrden = ({ subtotal, descuento = 0, tipoDescuento, impuesto, credito = 0, }) => {
    let _descuento = descuento;
    // Calcular el descuento basado en el tipo
    if (tipoDescuento === enums_1.TipoDescuento.absoluto) {
        _descuento = descuento;
    }
    else if (tipoDescuento === enums_1.TipoDescuento.porcentual) {
        _descuento = (subtotal * descuento) / 100;
    }
    // Asegurarse de que el descuento no exceda el subtotal
    if (_descuento > subtotal) {
        _descuento = subtotal;
    }
    // Aplicar el descuento al subtotal
    const subtotalDescontado = subtotal - _descuento;
    // Calcular el impuesto
    const _impuesto = (subtotalDescontado * impuesto) / 100;
    // Calcular el total antes de aplicar el crédito
    let total = subtotalDescontado + _impuesto;
    // Aplicar el crédito
    total -= credito;
    // Asegurarse de que el total no sea negativo
    if (total < 0) {
        total = 0;
    }
    return total;
};
exports.calcularTotalOrden = calcularTotalOrden;
/**
 * Calcula el stock disponible de un producto en un almacen
 * es decir, el stock actual + el stock en transito - el stock reservado
 * @param stock - El stock del producto en el almacen
 * @returns El stock disponible del producto en el almacen
 */
const calcularStockDisponible = (stock) => {
    return stock.actual + stock.transito - stock.reservado;
};
exports.calcularStockDisponible = calcularStockDisponible;
const getEstatusColor = (estatus) => {
    switch (estatus) {
        case enums_1.EstatusOrden.pendiente:
            return "bg-yellow-100 text-yellow-800 border border-yellow-200";
        case enums_1.EstatusOrden.aprobado:
            return "bg-blue-100 text-blue-800 border border-blue-200";
        case enums_1.EstatusOrden.rechazado:
            return "bg-rose-100 text-rose-800 border border-rose-200";
        case enums_1.EstatusOrden.confirmado:
            return "bg-lime-100 text-lime-800 border border-lime-200";
        case enums_1.EstatusOrden.procesando:
            return "bg-orange-100 text-orange-800 border border-orange-200";
        case enums_1.EstatusOrden.enviado:
            return "bg-violet-100 text-violet-800 border border-violet-200";
        case enums_1.EstatusOrden.entregado:
            return "bg-green-100 text-green-800 border border-green-200";
        case enums_1.EstatusOrden.cancelado:
            return "bg-red-100 text-red-800 border border-red-200";
        default:
            return "bg-slate-100 text-slate-800 border border-slate-200";
    }
};
exports.getEstatusColor = getEstatusColor;
/**
 * Generates a tracking URL based on the shipping carrier and tracking number.
 * @param envio The shipping information object
 * @returns The tracking URL or the tracking number if no URL mapping exists
 */
const getTrackingUrl = (envio) => {
    if (!envio.tracking)
        return "";
    switch (envio.transportista) {
        case enums_1.Transportistas.DHL:
            return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${envio.tracking}&submit=1`;
        case enums_1.Transportistas.FEDEX:
            return `https://www.fedex.com/fedextrack/?trknbr=${envio.tracking}`;
        case enums_1.Transportistas.UPS:
            return `https://www.ups.com/track?tracknum=${envio.tracking}`;
        case enums_1.Transportistas.TNT:
            return `https://www.tnt.com/express/en_us/site/tracking.html?searchType=con&cons=${envio.tracking}`;
        default:
            return envio.tracking;
    }
};
exports.getTrackingUrl = getTrackingUrl;
