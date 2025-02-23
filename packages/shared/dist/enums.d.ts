export declare enum Paises {
    bolivia = "Bolivia",
    chile = "Chile",
    china = "China",
    costa_rica = "Costa Rica",
    ecuador = "Ecuador",
    el_salvador = "El Salvador",
    españa = "Espa\u00F1a",
    estados_unidos = "Estados Unidos",
    guatemala = "Guatemala",
    honduras = "Honduras",
    panama = "Panam\u00E1",
    peru = "Per\u00FA",
    republica_dominicana = "Rep\u00FAblica Dominicana",
    venezuela = "Venezuela"
}
export declare enum RouteRuleCheck {
    isAdmin = "isAdmin",
    canCreateOrders = "canCreateOrders",
    canSeeBalance = "canSeeBalance"
}
export declare enum NivelResultado {
    default = "default",
    error = "error",
    info = "info",
    success = "success",
    warning = "warning"
}
export declare enum Categorias {
    diversion = "Diversi\u00F3n",
    playsoft = "PlaySoft",
    inflaplay = "InflaPlay",
    maquinas = "M\u00E1quinas",
    publicitarios = "Publicitarios",
    trampolines = "Trampolines",
    motores = "Motores",
    consumibles = "Consumibles",
    materia_prima = "Materia Prima",
    personalizado = "Personalizado"
}
export declare enum CategoriasTraducidas {
    diversion = "Fun",
    playsoft = "PlaySoft",
    inflaplay = "InflaPlay",
    maquinas = "Machines",
    publicitarios = "Advertising",
    trampolines = "Trampolines",
    motores = "Blowers",
    consumibles = "Consumables",
    materia_prima = "Raw Material",
    personalizado = "Custom"
}
export declare enum Subcategorias {
    brinca_brinca = "Brinca Brinca",
    brinca_brinca_con_deslizador = "Brinca Brinca con Deslizador",
    deslizador = "Deslizador",
    deportivos = "Deportivos",
    obstaculos = "Obst\u00E1culos",
    acuatico = "Acu\u00E1tico",
    accesorios = "Accesorios",
    igloo = "Igl\u00FA",
    toldo_plegable = "Toldo Plegable",
    bandera_de_viento = "Bandera de Viento",
    arco = "Arco",
    tunel = "T\u00FAnel",
    totem = "T\u00F3tem",
    pantalla = "Pantalla",
    sky_dancer = "Sky Dancer",
    replica = "R\u00E9plica",
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
    fryers = "Fryers"
}
export declare enum SubcategoriasTraducidas {
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
    fryers = "Fryers"
}
export declare enum RolesBase {
    gerente = "Gerente",
    distribuidor = "Distribuidor",
    contabilidad = "Contabilidad",
    marketing = "Marketing",
    compras = "Compras",
    ventas = "Ventas",
    produccion = "Producci\u00F3n",
    calidad = "Calidad",
    almacen = "Almac\u00E9n",
    logistica = "Log\u00EDstica",
    cliente = "Cliente"
}
export declare enum EntidadesProtegidas {
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
    subcategoria = "Subcategoria"
}
export declare enum EstatusOrden {
    pendiente = "Pendiente",
    aprobado = "Aprobado",
    rechazado = "Rechazado",
    confirmado = "Confirmado",
    procesando = "Procesando",
    enviado = "Enviado",
    recibido = "Recibido",
    entregado = "Entregado",
    cancelado = "Cancelado",
    cerrado = "Cerrado"
}
export declare enum EstatusInvitacion {
    pendiente = "Pendiente",
    aceptada = "Aceptada",
    rechazada = "Rechazada"
}
export declare enum Acciones {
    leer = "leer",
    crear = "crear",
    actualizar = "actualizar",
    eliminar = "eliminar",
    admin = "admin"
}
export declare enum TipoDescuento {
    porcentual = "Porcentual",
    absoluto = "Absoluto"
}
export declare enum UnidadesLongitud {
    cm = "cm",
    m = "m",
    in = "in",
    ft = "ft"
}
export declare enum UnidadesPeso {
    g = "g",
    kg = "kg",
    oz = "oz",
    lb = "lb"
}
export declare enum SocketEventos {
    connect = "connect",
    disconnect = "disconnect",
    mensaje = "mensaje",
    typing = "typing",
    stopTyping = "stopTyping",
    messageStatus = "messageStatus"
}
export declare enum SocketTipoMensaje {
    texto = "texto",
    imagen = "imagen",
    video = "video",
    audio = "audio",
    archivo = "archivo",
    manager = "manager"
}
export declare enum SocketEstatusMensaje {
    enviado = "enviado",
    entregado = "entregado",
    recibido = "recibido",
    visto = "visto",
    eliminado = "eliminado"
}
export declare enum EstatusArchivo {
    pendiente = "pendiente",
    cargando = "cargando",
    cargado = "cargado",
    error = "error"
}
export declare enum EstatusFactura {
    abierta = "Abierta",
    pago_pendiente = "Pago Pendiente",
    pago_parcial = "Pago Parcial",
    pagada = "Pagada",
    cancelada = "Cancelada",
    vencida = "Vencida",
    anulada = "Anulada"
}
export declare enum EstatusPago {
    pendiente = "Pendiente",
    confirmado = "Confirmado",
    rechazado = "Rechazado",
    cancelado = "Cancelado",
    fallo = "Fallido"
}
export declare enum MetodoPago {
    tarjeta = "Tarjeta de Cr\u00E9dito o D\u00E9bito",
    cheque = "Cheque",
    deposito = "Dep\u00F3sito",
    transferencia = "Transferencia",
    zelle = "Zelle",
    paypal = "PayPal",
    stripe = "Stripe",
    remesa = "Remesa",
    cripto = "Criptomoneda"
}
export declare enum PeriodosGarantia {
    sin_garantia = "Sin Garant\u00EDa",
    seis_meses = "Seis Meses",
    un_año = "Un A\u00F1o",
    dos_años = "Dos A\u00F1os"
}
export declare enum TipoDocumento {
    cotizacion = "Cotizaci\u00F3n",
    factura = "Factura",
    inventario = "Inventario",
    certificado_garantia = "Certificado de Garant\u00EDa"
}
export declare enum TipoTransaccion {
    factura = "Factura",
    debito = "D\u00E9bito",
    avance_efectivo = "Avance de Efectivo",
    pago = "Pago",
    credito = "Cr\u00E9dito",
    reembolso = "Reembolso"
}
export declare enum Transportistas {
    DHL = "DHL",
    UPS = "UPS",
    FEDEX = "FedEx",
    TNT = "TNT",
    MARITIMO = "Mar\u00EDtimo",
    TERRESTRE = "Terrestre",
    OTRO = "Otro"
}
export declare enum QRCodeOutput {
    buffer = "buffer",
    canvas = "canvas",
    data_url = "data_url",
    file = "file",
    file_stream = "file_stream",
    string = "string"
}
export declare enum QbTipoInventario {
    inventory = "Inventory",
    nonInventory = "NonInventory",
    service = "Service",
    bundle = "Bundle"
}
export declare enum TipoOrden {
    compra = "Compra",
    credito = "Cr\u00E9dito",
    reposicion = "Reposici\u00F3n",
    cotizacion = "Cotizaci\u00F3n"
}
export declare enum TipoReporte {
    productos = "productos",
    ventas = "ventas",
    inventario = "inventario",
    clientes = "clientes",
    rendimiento = "rendimiento"
}
