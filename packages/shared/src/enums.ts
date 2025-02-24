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

export enum UnidadesLongitud {
  cm = "cm",
  m = "m",
  in = "in",
  ft = "ft",
}

export enum UnidadesPeso {
  g = "g",
  kg = "kg",
  oz = "oz",
  lb = "lb",
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
  DHL = "DHL",
  UPS = "UPS",
  FEDEX = "FedEx",
  TNT = "TNT",
  MARITIMO = "Marítimo",
  TERRESTRE = "Terrestre",
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
