import {
  RolesBase,
  TipoDescuento,
  EstatusInvitacion,
  UnidadesLongitud,
  Acciones,
  UnidadesPeso,
  EstatusOrden,
  EstatusArchivo,
  TipoTransaccion,
  EstatusPago,
  MetodoPago,
  Transportistas,
  TipoOrden,
  TipoReporte,
  SocketTipoMensaje,
  TipoCliente,
  TipoCambio,
} from "./enums";

export interface IFactores {
  [TipoCliente.instalador]: number;
  [TipoCliente.mayorista]: number;
  [TipoCliente.general]: number;
  [TipoCambio.usd]: number;
  [TipoCambio.bcv]: number;
}

export interface IBase {
  id: string;
  activo: boolean;
  fechaCreado: string;
  fechaActualizado: string;
  fechaEliminado: string;
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
  tipoCliente: TipoCliente;
  creditoHabilitado: boolean;
  creditoLimite: number;
  balance: number;
  nif: string;
  telefono?: string;
  avatar?: string;
  notas?: string;
  direcciones?: IDireccion[];
}

export interface IUsuario extends IPersona {
  password: string;
  super: boolean;
  balance: number;
  rol: IRol | null;
  sucursales: ISucursal[];
  archivos: IArchivo[];
}

export interface ISucursal extends IBase {
  nombre: string;
  impuesto: number;
  impuestoIncluido: boolean;
  simboloMoneda: string;
  codigoMoneda: string;
  direccion: IDireccion;
  almacenes: IAlmacen[];
}

export interface IAlmacen extends IBase {
  nombre: string;
  direccion: IDireccion;
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
  orden: number;
  subcategorias: ISubcategoria[];
}

export interface ISubcategoria extends IBase {
  nombre: string;
  orden: number;
  categoria: ICategoria;
}

export interface IProveedor extends IBase {
  nombre: string;
  marca: string;
  direccion: string;
  telefono: string;
  email: string;
  notas: string;
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

  categoria: ICategoria;
  subcategoria?: ISubcategoria;

  garantia: string;
  costo: number;
  precio: number;

  enOferta: boolean;
  precioOferta: number;
  inicioOferta: string | null;
  finOferta: string | null;

  stock: IStockProducto[];

  dimensiones: IDimensiones;
  embalaje: IDimensiones;

  portada?: IArchivo;
  galeria: IArchivo[];
}

export interface IItemOrden extends IBase {
  producto: IProducto;
  cantidad: number;
  precio: number;
  total: number;
  notas: string;
  almacen: IAlmacen | null;
  garantia: string;
}

export interface IOrden extends IBase {
  serial: number;
  tipo: TipoOrden;
  validez: number; // en días
  estatus: EstatusOrden;
  sucursal: ISucursal;
  vendedor: IUsuario;
  cliente: IPersona | null;
  proveedor: IProveedor | null;

  credito: number;
  descuento: number;
  tipoDescuento?: TipoDescuento;

  impuesto: number;
  impuestoIncluido: boolean;

  tipoCambio: TipoCambio;
  tasaCambio: number;

  subtotal: number;
  total: number;

  items: IItemOrden[];

  notas: string;

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
  persona: IPersona;
  referencia: number;
  descripcion: string;
  monto: number;
  balance: number;
  tipo: TipoTransaccion;
  estatusPago: EstatusPago | null;
  metodoPago: MetodoPago | null;
  archivos: IArchivo[];
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

export interface ISucursalSale {
  sucursal: string;
  quantity: number;
  total: number;
}

export interface IDashboardCharts {
  dailySales: IDailySale[];
  salesByCategory: ICategorySale[];
  salesByBranch: ISucursalSale[];
}
