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
export declare enum TipoCliente {
    instalador = "Instalador",
    mayorista = "Mayorista",
    general = "General"
}
export declare enum TipoCambio {
    usd = "USD",
    bcv = "BCV"
}
export declare enum UnidadesLongitud {
    mm = "mm",
    cm = "cm",
    m = "m"
}
export declare enum UnidadesPeso {
    g = "g",
    kg = "kg"
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
    efectivo = "Efectivo",
    tarjeta = "Tarjeta",
    cheque = "Cheque",
    deposito = "Dep\u00F3sito",
    transferencia = "Transferencia",
    pago_movil = "Pago M\u00F3vil",
    zelle = "Zelle",
    paypal = "PayPal",
    stripe = "Stripe",
    remesa = "Remesa",
    cripto = "Criptomoneda"
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
export declare enum TipoOrden {
    cotizacion = "Cotizaci\u00F3n",
    venta = "Venta",
    credito = "Cr\u00E9dito",
    reposicion = "Reposici\u00F3n"
}
export declare enum TipoReporte {
    productos = "productos",
    ventas = "ventas",
    inventario = "inventario",
    clientes = "clientes",
    rendimiento = "rendimiento"
}
