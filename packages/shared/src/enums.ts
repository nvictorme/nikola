export enum RouteRuleCheck {
  isAdmin = "isAdmin",
  canCreateOrders = "canCreateOrders",
  canSeeBalance = "canSeeBalance",
}

export enum NivelResultado {
  default = "default",
  error = "error",
  info = "info",
  success = "success",
  warning = "warning",
}

export enum RolesBase {
  gerente = "Gerente",
  distribuidor = "Distribuidor",
  contabilidad = "Contabilidad",
  marketing = "Marketing",
  compras = "Compras",
  ventas = "Ventas",
  produccion = "Producción",
  calidad = "Calidad",
  almacen = "Almacén",
  logistica = "Logística",
  cliente = "Cliente",
}

export enum EntidadesProtegidas {
  producto = "Producto",
  precio = "Precio",
  stock = "Stock",
  orden = "Orden",
  persona = "Persona",
  direccion = "Direccion",
  usuario = "Usuario",
  rol = "Rol",
  privilegio = "Privilegio",
  sucursal = "Sucursal",
  almacen = "Almacen",
  transaccion = "Transaccion",
  categoria = "Categoria",
  subcategoria = "Subcategoria",
}

export enum EstatusOrden {
  pendiente = "Pendiente",
  aprobado = "Aprobado",
  rechazado = "Rechazado",
  confirmado = "Confirmado",
  procesando = "Procesando",
  enviado = "Enviado",
  recibido = "Recibido",
  entregado = "Entregado",
  cancelado = "Cancelado",
  cerrado = "Cerrado",
}

export enum EstatusMovimiento {
  pendiente = "Pendiente",
  aprobado = "Aprobado",
  transito = "Transito",
  recibido = "Recibido",
  anulado = "Anulado",
}

export enum EstatusInvitacion {
  pendiente = "Pendiente",
  aceptada = "Aceptada",
  rechazada = "Rechazada",
}

export enum Acciones {
  leer = "leer",
  crear = "crear",
  actualizar = "actualizar",
  eliminar = "eliminar",
  admin = "admin",
}

export enum TipoDescuento {
  porcentual = "Porcentual",
  absoluto = "Absoluto",
}

export enum TipoCliente {
  instalador = "Instalador",
  mayorista = "Mayorista",
  general = "General",
}

export enum TipoCambio {
  usd = "USD",
  bcv = "BCV",
}

export enum UnidadesLongitud {
  mm = "mm",
  cm = "cm",
  m = "m",
}

export enum UnidadesPeso {
  g = "g",
  kg = "kg",
}

export enum SocketEventos {
  connect = "connect",
  disconnect = "disconnect",
  mensaje = "mensaje",
  typing = "typing",
  stopTyping = "stopTyping",
  messageStatus = "messageStatus",
}

export enum SocketTipoMensaje {
  texto = "texto",
  imagen = "imagen",
  video = "video",
  audio = "audio",
  archivo = "archivo",
  manager = "manager",
}

export enum SocketEstatusMensaje {
  enviado = "enviado",
  entregado = "entregado",
  recibido = "recibido",
  visto = "visto",
  eliminado = "eliminado",
}

export enum EstatusArchivo {
  pendiente = "pendiente",
  cargando = "cargando",
  cargado = "cargado",
  error = "error",
}

export enum EstatusFactura {
  abierta = "Abierta",
  pago_pendiente = "Pago Pendiente",
  pago_parcial = "Pago Parcial",
  pagada = "Pagada",
  cancelada = "Cancelada",
  vencida = "Vencida",
  anulada = "Anulada",
}

export enum EstatusPago {
  pendiente = "Pendiente",
  confirmado = "Confirmado",
  rechazado = "Rechazado",
  cancelado = "Cancelado",
  fallo = "Fallido",
}

export enum MetodoPago {
  efectivo = "Efectivo",
  tarjeta = "Tarjeta",
  cheque = "Cheque",
  deposito = "Depósito",
  transferencia = "Transferencia",
  pago_movil = "Pago Móvil",
  zelle = "Zelle",
  paypal = "PayPal",
  stripe = "Stripe",
  remesa = "Remesa",
  cripto = "Criptomoneda",
}

export enum TipoDocumento {
  cotizacion = "Cotización",
  factura = "Factura",
  inventario = "Inventario",
  certificado_garantia = "Certificado de Garantía",
}

export enum TipoTransaccion {
  factura = "Factura",
  debito = "Débito",
  avance_efectivo = "Avance de Efectivo",
  pago = "Pago",
  credito = "Crédito",
  reembolso = "Reembolso",
}

export enum Transportistas {
  MRW = "MRW",
  TEALCA = "Tealca",
  ZOOM = "Zoom",
  ASIAVEN = "Asiaven",
  KEXPORT = "KExport",
  MELOTRAECP = "MeLoTraeCP",
  DHL = "DHL",
  UPS = "UPS",
  FEDEX = "FedEx",
  TNT = "TNT",
  OTRO = "Otro",
}

export enum QRCodeOutput {
  buffer = "buffer",
  canvas = "canvas",
  data_url = "data_url",
  file = "file",
  file_stream = "file_stream",
  string = "string",
}

export enum TipoOrden {
  cotizacion = "Cotización",
  venta = "Venta",
  credito = "Crédito",
  reposicion = "Reposición",
}

export enum TipoReporte {
  productos = "productos",
  ventas = "ventas",
  inventario = "inventario",
  clientes = "clientes",
  rendimiento = "rendimiento",
}
