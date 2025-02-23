export enum Paises {
  bolivia = "Bolivia",
  chile = "Chile",
  china = "China",
  costa_rica = "Costa Rica",
  ecuador = "Ecuador",
  el_salvador = "El Salvador",
  españa = "España",
  estados_unidos = "Estados Unidos",
  guatemala = "Guatemala",
  honduras = "Honduras",
  panama = "Panamá",
  peru = "Perú",
  republica_dominicana = "República Dominicana",
  venezuela = "Venezuela",
}

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

export enum Categorias {
  diversion = "Diversión",
  playsoft = "PlaySoft",
  inflaplay = "InflaPlay",
  maquinas = "Máquinas",
  publicitarios = "Publicitarios",
  trampolines = "Trampolines",
  motores = "Motores",
  consumibles = "Consumibles",
  materia_prima = "Materia Prima",
  personalizado = "Personalizado",
}

export enum CategoriasTraducidas {
  diversion = "Fun",
  playsoft = "PlaySoft",
  inflaplay = "InflaPlay",
  maquinas = "Machines",
  publicitarios = "Advertising",
  trampolines = "Trampolines",
  motores = "Blowers",
  consumibles = "Consumables",
  materia_prima = "Raw Material",
  personalizado = "Custom",
}

export enum Subcategorias {
  brinca_brinca = "Brinca Brinca",
  brinca_brinca_con_deslizador = "Brinca Brinca con Deslizador",
  deslizador = "Deslizador",
  deportivos = "Deportivos",
  obstaculos = "Obstáculos",
  acuatico = "Acuático",
  accesorios = "Accesorios",
  igloo = "Iglú",
  toldo_plegable = "Toldo Plegable",
  bandera_de_viento = "Bandera de Viento",
  arco = "Arco",
  tunel = "Túnel",
  totem = "Tótem",
  pantalla = "Pantalla",
  sky_dancer = "Sky Dancer",
  replica = "Réplica",
  disfraz = "Disfraz",
  pelota = "Pelota",
  aplaudidor = "Aplaudidor",
  zeppelin = "Zeppelin",
  popcorn = "Popcorn",
  cotton_candy = "Cotton Candy",
  waffle = "Waffle",
  nacho = "Nacho",
  hot_dog = "Hot Dog",
  gourmet_popcorn = "Gourmet Popcorn",
  sno_kones = "Sno kones",
  frozen = "Frozen",
  fryers = "Fryers",
}

export enum SubcategoriasTraducidas {
  brinca_brinca = "Bounce House",
  brinca_brinca_con_deslizador = "Bounce House with Slide",
  deslizador = "Slide",
  deportivos = "Sports",
  obstaculos = "Obstacles",
  acuatico = "Aquatic",
  accesorios = "Accessories",
  igloo = "Igloo",
  toldo_plegable = "Folding Tent",
  bandera_de_viento = "Wind Flag",
  arco = "Arch",
  tunel = "Tunnel",
  totem = "Totem",
  pantalla = "Screen",
  sky_dancer = "Air Dancer",
  replica = "Replica",
  disfraz = "Costume",
  pelota = "Ball",
  aplaudidor = "Thundersticks",
  zeppelin = "Zeppelin",
  popcorn = "Popcorn",
  cotton_candy = "Cotton Candy",
  waffle = "Waffle",
  nacho = "Nacho",
  hot_dog = "Hot Dog",
  gourmet_popcorn = "Gourmet Popcorn",
  sno_kones = "Sno Kones",
  frozen = "Frozen",
  fryers = "Fryers",
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
  pais = "Pais",
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
  tarjeta = "Tarjeta de Crédito o Débito",
  cheque = "Cheque",
  deposito = "Depósito",
  transferencia = "Transferencia",
  zelle = "Zelle",
  paypal = "PayPal",
  stripe = "Stripe",
  remesa = "Remesa",
  cripto = "Criptomoneda",
}

export enum PeriodosGarantia {
  sin_garantia = "Sin Garantía",
  seis_meses = "Seis Meses",
  un_año = "Un Año",
  dos_años = "Dos Años",
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

export enum QbTipoInventario {
  inventory = "Inventory",
  nonInventory = "NonInventory",
  service = "Service",
  bundle = "Bundle",
}

export enum TipoOrden {
  compra = "Compra",
  credito = "Crédito",
  reposicion = "Reposición",
  cotizacion = "Cotización",
}

export enum TipoReporte {
  productos = "productos",
  ventas = "ventas",
  inventario = "inventario",
  clientes = "clientes",
  rendimiento = "rendimiento",
}
