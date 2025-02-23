import { Categorias, EstatusOrden, Subcategorias, TipoDescuento } from "./enums";
import { IEnvio, IStockProducto, IUsuario } from "./interfaces";
/**
 *
 * @param category category to get the subcategories
 * @returns subcategories for the given category
 */
export declare const subCategoryFactory: (category: Categorias) => Subcategorias[];
export declare const traducirCategoria: (categoria: Categorias) => string;
/**
 *
 * @param downloadUrl URL to download the file
 * @param filename Name of the file
 */
export declare const emulateDownload: (downloadUrl: string, filename: string) => void;
/**
 * Generates a complex password
 * @param length Length of the password
 * @param useUppercase Use uppercase characters
 * @param useLowercase Use lowercase characters
 * @param useNumbers Use numbers
 * @param useSpecialCharacters Use special characters
 * @returns A complex password string
 */
export declare function generateComplexPassword({ length, useUppercase, useLowercase, useNumbers, useSpecialCharacters, }: {
    length: number;
    useUppercase: boolean;
    useLowercase: boolean;
    useNumbers: boolean;
    useSpecialCharacters: boolean;
}): string;
export declare const isValidPassword: (password: string) => boolean;
type currencyFormatProps = {
    value: number;
    currency?: string;
    locale?: string;
    fractionDigits?: number;
};
export declare const currencyFormat: ({ value, currency, locale, fractionDigits, }: currencyFormatProps) => string;
export declare const isSuperAdmin: (user: IUsuario | null) => boolean;
export declare const canCreateOrders: (user: IUsuario | null) => boolean;
export declare const canSeeBalance: (user: IUsuario | null) => boolean;
export declare const getInitials: (nombre: string, apellido: string) => string;
/**
 * Replaces the UUID in the provided URL path with a given slug.
 *
 * @param currentPath - The current URL path containing the UUID.
 * @param slug - The new slug to replace the UUID in the URL.
 * @returns The updated path with the UUID replaced by the slug.
 */
export declare const replaceUuidWithSlug: (currentPath: string, slug: string) => string;
export declare const calcularTotalOrden: ({ subtotal, descuento, tipoDescuento, impuesto, credito, }: {
    subtotal: number;
    descuento: number;
    tipoDescuento: TipoDescuento;
    impuesto: number;
    credito: number;
}) => number;
/**
 * Calcula el stock disponible de un producto en un almacen
 * es decir, el stock actual + el stock en transito - el stock reservado
 * @param stock - El stock del producto en el almacen
 * @returns El stock disponible del producto en el almacen
 */
export declare const calcularStockDisponible: (stock: IStockProducto) => number;
export declare const getEstatusColor: (estatus: EstatusOrden) => string;
/**
 * Generates a tracking URL based on the shipping carrier and tracking number.
 * @param envio The shipping information object
 * @returns The tracking URL or the tracking number if no URL mapping exists
 */
export declare const getTrackingUrl: (envio: IEnvio) => string;
export {};
