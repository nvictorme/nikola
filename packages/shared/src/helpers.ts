import { passwordValidationPattern } from "./constants";
import {
  EstatusOrden,
  RolesBase,
  TipoDescuento,
  Transportistas,
} from "./enums";
import { IEnvio, IStockProducto, IUsuario } from "./interfaces";

/**
 *
 * @param downloadUrl URL to download the file
 * @param filename Name of the file
 */
export const emulateDownload = (downloadUrl: string, filename: string) => {
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

/**
 * Generates a complex password
 * @param length Length of the password
 * @param useUppercase Use uppercase characters
 * @param useLowercase Use lowercase characters
 * @param useNumbers Use numbers
 * @param useSpecialCharacters Use special characters
 * @returns A complex password string
 */
export function generateComplexPassword({
  length,
  useUppercase,
  useLowercase,
  useNumbers,
  useSpecialCharacters,
}: {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSpecialCharacters: boolean;
}): string {
  let characters = "";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialCharacters = "!@#$%^&*()_-+=<>?/[]{}|";

  if (useUppercase) characters += uppercase;
  if (useLowercase) characters += lowercase;
  if (useNumbers) characters += numbers;
  if (useSpecialCharacters) characters += specialCharacters;

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const isValidPassword = (password: string) => {
  return passwordValidationPattern.test(password);
};

type currencyFormatProps = {
  value: number;
  currency?: string;
  locale?: string;
  fractionDigits?: number;
};
export const currencyFormat = ({
  value,
  currency = "USD",
  locale = "en-US",
  fractionDigits = 2,
}: currencyFormatProps): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

export const isSuperAdmin = (user: IUsuario | null): boolean => {
  if (!user) return false;
  return user.rol?.nombre === RolesBase.gerente || user.super;
};

export const canCreateOrders = (user: IUsuario | null): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return (
    user.rol?.nombre === RolesBase.distribuidor ||
    user.rol?.nombre === RolesBase.ventas
  );
};

export const canSeeBalance = (user: IUsuario | null): boolean => {
  if (!user) return false;
  return (
    isSuperAdmin(user) ||
    user.rol?.nombre === RolesBase.ventas ||
    user.rol?.nombre === RolesBase.distribuidor ||
    user.rol?.nombre === RolesBase.contabilidad
  );
};

export const getInitials = (nombre: string, apellido: string) => {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
};

/**
 * Replaces the UUID in the provided URL path with a given slug.
 *
 * @param currentPath - The current URL path containing the UUID.
 * @param slug - The new slug to replace the UUID in the URL.
 * @returns The updated path with the UUID replaced by the slug.
 */
export const replaceUuidWithSlug = (
  currentPath: string,
  slug: string
): string => {
  // Regular expression to match a UUID (a string of 36 characters with hexadecimal digits and dashes)
  const uuidRegex = /[0-9a-fA-F-]{36}/;

  // Check if the current path contains a UUID
  if (uuidRegex.test(currentPath)) {
    // Replace the UUID with the provided slug
    const newPath = currentPath.replace(uuidRegex, slug);
    // console.log(`Path updated: ${newPath}`);
    // Return the updated path
    return newPath;
  } else {
    // console.warn("No UUID found in the provided path.");
    return currentPath; // Return the original path if no UUID is found
  }
};

export const calcularTotalOrden = ({
  subtotal,
  descuento = 0,
  tipoDescuento,
  impuesto,
  credito = 0,
}: {
  subtotal: number;
  descuento: number;
  tipoDescuento: TipoDescuento;
  impuesto: number;
  credito: number;
}): number => {
  let _descuento = descuento;

  // Calcular el descuento basado en el tipo
  if (tipoDescuento === TipoDescuento.absoluto) {
    _descuento = descuento;
  } else if (tipoDescuento === TipoDescuento.porcentual) {
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

/**
 * Calcula el stock disponible de un producto en un almacen
 * es decir, el stock actual + el stock en transito - el stock reservado
 * @param stock - El stock del producto en el almacen
 * @returns El stock disponible del producto en el almacen
 */
export const calcularStockDisponible = (stock: IStockProducto): number => {
  return stock.actual + stock.transito - stock.reservado;
};

export const getEstatusColor = (estatus: EstatusOrden): string => {
  switch (estatus) {
    case EstatusOrden.pendiente:
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case EstatusOrden.aprobado:
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case EstatusOrden.rechazado:
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case EstatusOrden.confirmado:
      return "bg-lime-100 text-lime-800 border border-lime-200";
    case EstatusOrden.procesando:
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case EstatusOrden.enviado:
      return "bg-violet-100 text-violet-800 border border-violet-200";
    case EstatusOrden.entregado:
      return "bg-green-100 text-green-800 border border-green-200";
    case EstatusOrden.cancelado:
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200";
  }
};

/**
 * Generates a tracking URL based on the shipping carrier and tracking number.
 * @param envio The shipping information object
 * @returns The tracking URL or the tracking number if no URL mapping exists
 */
export const getTrackingUrl = (envio: IEnvio): string => {
  if (!envio.tracking) return "";

  switch (envio.transportista) {
    case Transportistas.DHL:
      return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${envio.tracking}&submit=1`;

    case Transportistas.FEDEX:
      return `https://www.fedex.com/fedextrack/?trknbr=${envio.tracking}`;

    case Transportistas.UPS:
      return `https://www.ups.com/track?tracknum=${envio.tracking}`;

    case Transportistas.TNT:
      return `https://www.tnt.com/express/en_us/site/tracking.html?searchType=con&cons=${envio.tracking}`;

    default:
      return envio.tracking;
  }
};

/**
 * Formatear una fecha a formato dd/mm/yyyy
 * @param {string} fecha La fecha a formatear
 * @returns {string} La fecha formateada
 */
export const formatearFecha = (fecha: string): string => {
  const date = new Date(fecha);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  return date.toLocaleDateString("es-ES", options);
};
