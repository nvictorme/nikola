import {
  RolesBase,
  TipoDescuento,
  EstatusInvitacion,
  UnidadesLongitud,
  Acciones,
  UnidadesPeso,
  PeriodosGarantia,
  EstatusOrden,
  EstatusArchivo,
  TipoTransaccion,
  EstatusPago,
  MetodoPago,
  Transportistas,
  QbTipoInventario,
  TipoOrden,
  TipoReporte,
  SocketTipoMensaje,
} from "./enums";

export interface IBase {
  id: string;
  activo: boolean;
  fechaCreado: string;
  fechaActualizado: string;
  fechaEliminado: string;
}

export interface IPais extends IBase {
  nombre: string;
  name: string;
  iso2: string;
  iso3: string;
  phoneCode: string;
}

export interface IRol extends IBase {
  nombre: RolesBase | string;
  descripcion?: string;
  privilegios: IPrivilegio[];
  usuarios?: IUsuario[];
}

export interface IPrivilegio extends IBase {
  rol: IRol;
  entidad: string;
  admin: boolean;
  crear: boolean;
  leer: boolean;
  actualizar: boolean;
  eliminar: boolean;
}

export interface IPrivilegioEsperado {
  entidad: string;
  accion: Acciones;
  valor: boolean;
}

export interface IArchivo extends IBase {
  nombre: string;
  tipo: string;
  estatus: EstatusArchivo;
  url?: string;
}

export interface IInvitacion extends IBase {
  email: string;
  nombre: string;
  apellido: string;
  estatus: EstatusInvitacion;
  rol: IRol;
  token: string;
}

export interface IDireccion extends IBase {
  alias: string;
  destinatario: string;
  pais: IPais;
  region: string;
  ciudad: string;
  codigoPostal: string;
  calle: string;
  unidad: string;
  latitude: number;
  longitude: number;
  persona?: IPersona;
  sucursal?: ISucursal;
  almacen?: IAlmacen;
}

export interface IPersona extends IBase {
  email: string;
  nombre: string;
  apellido: string;
  seudonimo?: string;
  empresa?: string;
  nif: string;
  telefono?: string;
  avatar?: string;
  notas?: string;
  pais: IPais;
  direcciones?: IDireccion[];
}

export interface IUsuario extends IPersona {
  password: string;
  super: boolean;
  exw: boolean;
  balance: number;
  rol: IRol | null;
  sucursales: ISucursal[];
  archivos: IArchivo[];
}

export interface ISucursal extends IBase {
  nombre: string;
  pais: IPais;
  impuesto: number;
  impuestoIncluido: boolean;
  simboloMoneda: string;
  codigoMoneda: string;
  direccion: IDireccion;
  almacenes: IAlmacen[];
}

export interface IAlmacen extends IBase {
  nombre: string;
  pais: IPais;
  direccion: IDireccion;
}

// Cada producto tiene un precio diferente por pais
export interface IPrecioProducto extends IBase {
  producto: IProducto;
  precioLista: number;
  precioOferta: number;
  precioExw: number;
  enOferta: boolean;
  /** ISO 8601 date string (e.g. "2024-03-20T15:30:00.000Z") or null */
  inicioOferta: string | null;
  /** ISO 8601 date string (e.g. "2024-03-20T15:30:00.000Z") or null */
  finOferta: string | null;
  descuento: number;
  tipoDescuento: TipoDescuento;
  pais: IPais;
}

export interface IStockProducto extends IBase {
  producto: IProducto;
  almacen: IAlmacen;
  actual: number;
  reservado: number;
  transito: number;
  rma: number;
}

export interface IDimensiones extends IBase {
  largo: number;
  ancho: number;
  alto: number;
  peso: number;
  unidadLongitud: UnidadesLongitud;
  unidadPeso: UnidadesPeso;
}

export interface ICategoria extends IBase {
  nombre: string;
  name: string;
  orden: number;
  subcategorias: ISubcategoria[];
}

export interface ISubcategoria extends IBase {
  nombre: string;
  name: string;
  orden: number;
  categoria: ICategoria;
}

export interface IProducto extends IBase {
  nombre: string;
  descripcion: string;
  modelo: string;
  slug: string;

  sku: string;
  upc?: string;
  ean?: string;
  isbn?: string;

  dimensiones: IDimensiones;
  embalaje: IDimensiones;

  categoria: ICategoria;
  subcategoria?: ISubcategoria;

  costo: number;

  requiereMotor: boolean;
  motores: IMotorProducto[];

  garantia: PeriodosGarantia;

  portada?: IArchivo;
  galeria: IArchivo[];

  // precios por pais
  precios: IPrecioProducto[];
  // stock por almacen
  stock: IStockProducto[];

  // paises para los que está habilitado
  paises: IPais[];

  traduccion: ITraduccionProducto;
}

export interface IMotorProducto extends IBase {
  producto: IProducto;
  motor: IProducto;
  cantidad: number;
}

export interface ITraduccionProducto extends IBase {
  producto: IProducto;
  nombre: string;
  descripcion: string;
  modelo: string;
  slug: string;
}

export interface IItemOrden extends IBase {
  producto: IProducto;
  cantidad: number;
  precio: number;
  precioLista: number;
  total: number;
  notas: string;
  archivos: IArchivo[];
  almacen: IAlmacen | null;
  qbTipoInventario: QbTipoInventario;
  garantia: PeriodosGarantia;
}

export interface IOrden extends IBase {
  serial: number;
  tipo: TipoOrden;
  validez: number; // en días
  estatus: EstatusOrden;
  sucursal: ISucursal;
  vendedor: IUsuario;
  cliente: IPersona | null;

  credito: number;
  descuento: number;
  tipoDescuento?: TipoDescuento;

  impuesto: number;
  impuestoIncluido: boolean;

  subtotal: number;
  total: number;
  totalLista: number;

  items: IItemOrden[];

  notas: string;

  qbInvoiceId: string;
  qbInvoiceDocNumber: string;

  archivos: IArchivo[];
  envios: IEnvio[];
  historial: IOrdenHistorial[];
}

export interface IOrdenHistorial extends IBase {
  orden: IOrden;
  estatus: EstatusOrden;
  usuario: IUsuario;
  envio: IEnvio;
  notas: string;
}

export interface ITransaccion extends IBase {
  usuario: IUsuario;
  referencia: number;
  descripcion: string;
  monto: number;
  balance: number;
  tipo: TipoTransaccion;
  estatusPago: EstatusPago | null;
  metodoPago: MetodoPago | null;
  archivos: IArchivo[];
  qbInvoiceId: string;
  qbInvoiceDocNumber: string;
}

export interface IEnvio extends IBase {
  notas: string;
  transportista: Transportistas;
  tracking: string;
}

export interface ICertificado extends IBase {
  serial: number;
  item: IItemOrden;
  orden: IOrden;
}

export interface IApp extends IBase {
  name: string;
  description: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

/**
 * Configuration for QuickBooks integration.
 */
export interface IQuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string; // for OAuth callback
  environment: "sandbox" | "production";
  realmId?: string; // The "Company ID" from QuickBooks; might be unknown until OAuth callback
}

/**
 * The tokens returned by QuickBooks.
 */
export interface IQuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // (seconds) access token expiry
  refreshTokenExpiresIn: number; // (seconds) refresh token expiry
  expiresAt: number; // timestamp (ms)
  refreshTokenExpiresAt: number; // timestamp (ms)
}

/**
 * Minimal data structure for creating an invoice.
 */
export interface ICreateInvoicePayload {
  CustomerRef: { value: string };
  Line: Array<{
    Amount: number;
    DetailType: "SalesItemLineDetail";
    SalesItemLineDetail: {
      ItemRef: { value: string };
    };
  }>;
}

export interface ReporteParams {
  tipo: TipoReporte;
  formato: "csv" | "pdf";
  fechaInicio?: string;
  fechaFin?: string;
  sucursalId?: string;
  vendedorId?: string;
  categoriaId?: string;
  paisId?: string;
}

export interface ReporteResponse {
  id: string;
  url: string;
  nombre: string;
}

export interface ISocketMessage {
  id: string;
  tipo: SocketTipoMensaje;
  contenido: string;
  url?: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: number;
    type: string;
  };
}

export interface IChatMessage extends ISocketMessage {
  status: "sent" | "delivered" | "read";
  sender: {
    id: string;
    type: "user" | "manager";
  };
  recipient: {
    id: string;
    type: "user" | "manager";
  };
}

export interface IDailySale {
  date: string;
  total: number;
}

export interface ICategorySale {
  category: string;
  quantity: number;
  total: number;
}

export interface ICountrySale {
  country: string;
  quantity: number;
  total: number;
}

export interface IDashboardCharts {
  dailySales: IDailySale[];
  salesByCategory: ICategorySale[];
  salesByCountry: ICountrySale[];
}
