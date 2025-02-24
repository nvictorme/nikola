"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoReporte = exports.TipoOrden = exports.QRCodeOutput = exports.Transportistas = exports.TipoTransaccion = exports.TipoDocumento = exports.MetodoPago = exports.EstatusPago = exports.EstatusFactura = exports.EstatusArchivo = exports.SocketEstatusMensaje = exports.SocketTipoMensaje = exports.SocketEventos = exports.UnidadesPeso = exports.UnidadesLongitud = exports.TipoDescuento = exports.Acciones = exports.EstatusInvitacion = exports.EstatusOrden = exports.EntidadesProtegidas = exports.RolesBase = exports.NivelResultado = exports.RouteRuleCheck = void 0;
var RouteRuleCheck;
(function (RouteRuleCheck) {
    RouteRuleCheck["isAdmin"] = "isAdmin";
    RouteRuleCheck["canCreateOrders"] = "canCreateOrders";
    RouteRuleCheck["canSeeBalance"] = "canSeeBalance";
})(RouteRuleCheck || (exports.RouteRuleCheck = RouteRuleCheck = {}));
var NivelResultado;
(function (NivelResultado) {
    NivelResultado["default"] = "default";
    NivelResultado["error"] = "error";
    NivelResultado["info"] = "info";
    NivelResultado["success"] = "success";
    NivelResultado["warning"] = "warning";
})(NivelResultado || (exports.NivelResultado = NivelResultado = {}));
var RolesBase;
(function (RolesBase) {
    RolesBase["gerente"] = "Gerente";
    RolesBase["distribuidor"] = "Distribuidor";
    RolesBase["contabilidad"] = "Contabilidad";
    RolesBase["marketing"] = "Marketing";
    RolesBase["compras"] = "Compras";
    RolesBase["ventas"] = "Ventas";
    RolesBase["produccion"] = "Producci\u00F3n";
    RolesBase["calidad"] = "Calidad";
    RolesBase["almacen"] = "Almac\u00E9n";
    RolesBase["logistica"] = "Log\u00EDstica";
    RolesBase["cliente"] = "Cliente";
})(RolesBase || (exports.RolesBase = RolesBase = {}));
var EntidadesProtegidas;
(function (EntidadesProtegidas) {
    EntidadesProtegidas["producto"] = "Producto";
    EntidadesProtegidas["precio"] = "Precio";
    EntidadesProtegidas["stock"] = "Stock";
    EntidadesProtegidas["orden"] = "Orden";
    EntidadesProtegidas["persona"] = "Persona";
    EntidadesProtegidas["direccion"] = "Direccion";
    EntidadesProtegidas["usuario"] = "Usuario";
    EntidadesProtegidas["rol"] = "Rol";
    EntidadesProtegidas["privilegio"] = "Privilegio";
    EntidadesProtegidas["sucursal"] = "Sucursal";
    EntidadesProtegidas["almacen"] = "Almacen";
    EntidadesProtegidas["transaccion"] = "Transaccion";
    EntidadesProtegidas["categoria"] = "Categoria";
    EntidadesProtegidas["subcategoria"] = "Subcategoria";
})(EntidadesProtegidas || (exports.EntidadesProtegidas = EntidadesProtegidas = {}));
var EstatusOrden;
(function (EstatusOrden) {
    EstatusOrden["pendiente"] = "Pendiente";
    EstatusOrden["aprobado"] = "Aprobado";
    EstatusOrden["rechazado"] = "Rechazado";
    EstatusOrden["confirmado"] = "Confirmado";
    EstatusOrden["procesando"] = "Procesando";
    EstatusOrden["enviado"] = "Enviado";
    EstatusOrden["recibido"] = "Recibido";
    EstatusOrden["entregado"] = "Entregado";
    EstatusOrden["cancelado"] = "Cancelado";
    EstatusOrden["cerrado"] = "Cerrado";
})(EstatusOrden || (exports.EstatusOrden = EstatusOrden = {}));
var EstatusInvitacion;
(function (EstatusInvitacion) {
    EstatusInvitacion["pendiente"] = "Pendiente";
    EstatusInvitacion["aceptada"] = "Aceptada";
    EstatusInvitacion["rechazada"] = "Rechazada";
})(EstatusInvitacion || (exports.EstatusInvitacion = EstatusInvitacion = {}));
var Acciones;
(function (Acciones) {
    Acciones["leer"] = "leer";
    Acciones["crear"] = "crear";
    Acciones["actualizar"] = "actualizar";
    Acciones["eliminar"] = "eliminar";
    Acciones["admin"] = "admin";
})(Acciones || (exports.Acciones = Acciones = {}));
var TipoDescuento;
(function (TipoDescuento) {
    TipoDescuento["porcentual"] = "Porcentual";
    TipoDescuento["absoluto"] = "Absoluto";
})(TipoDescuento || (exports.TipoDescuento = TipoDescuento = {}));
var UnidadesLongitud;
(function (UnidadesLongitud) {
    UnidadesLongitud["cm"] = "cm";
    UnidadesLongitud["m"] = "m";
    UnidadesLongitud["in"] = "in";
    UnidadesLongitud["ft"] = "ft";
})(UnidadesLongitud || (exports.UnidadesLongitud = UnidadesLongitud = {}));
var UnidadesPeso;
(function (UnidadesPeso) {
    UnidadesPeso["g"] = "g";
    UnidadesPeso["kg"] = "kg";
    UnidadesPeso["oz"] = "oz";
    UnidadesPeso["lb"] = "lb";
})(UnidadesPeso || (exports.UnidadesPeso = UnidadesPeso = {}));
var SocketEventos;
(function (SocketEventos) {
    SocketEventos["connect"] = "connect";
    SocketEventos["disconnect"] = "disconnect";
    SocketEventos["mensaje"] = "mensaje";
    SocketEventos["typing"] = "typing";
    SocketEventos["stopTyping"] = "stopTyping";
    SocketEventos["messageStatus"] = "messageStatus";
})(SocketEventos || (exports.SocketEventos = SocketEventos = {}));
var SocketTipoMensaje;
(function (SocketTipoMensaje) {
    SocketTipoMensaje["texto"] = "texto";
    SocketTipoMensaje["imagen"] = "imagen";
    SocketTipoMensaje["video"] = "video";
    SocketTipoMensaje["audio"] = "audio";
    SocketTipoMensaje["archivo"] = "archivo";
    SocketTipoMensaje["manager"] = "manager";
})(SocketTipoMensaje || (exports.SocketTipoMensaje = SocketTipoMensaje = {}));
var SocketEstatusMensaje;
(function (SocketEstatusMensaje) {
    SocketEstatusMensaje["enviado"] = "enviado";
    SocketEstatusMensaje["entregado"] = "entregado";
    SocketEstatusMensaje["recibido"] = "recibido";
    SocketEstatusMensaje["visto"] = "visto";
    SocketEstatusMensaje["eliminado"] = "eliminado";
})(SocketEstatusMensaje || (exports.SocketEstatusMensaje = SocketEstatusMensaje = {}));
var EstatusArchivo;
(function (EstatusArchivo) {
    EstatusArchivo["pendiente"] = "pendiente";
    EstatusArchivo["cargando"] = "cargando";
    EstatusArchivo["cargado"] = "cargado";
    EstatusArchivo["error"] = "error";
})(EstatusArchivo || (exports.EstatusArchivo = EstatusArchivo = {}));
var EstatusFactura;
(function (EstatusFactura) {
    EstatusFactura["abierta"] = "Abierta";
    EstatusFactura["pago_pendiente"] = "Pago Pendiente";
    EstatusFactura["pago_parcial"] = "Pago Parcial";
    EstatusFactura["pagada"] = "Pagada";
    EstatusFactura["cancelada"] = "Cancelada";
    EstatusFactura["vencida"] = "Vencida";
    EstatusFactura["anulada"] = "Anulada";
})(EstatusFactura || (exports.EstatusFactura = EstatusFactura = {}));
var EstatusPago;
(function (EstatusPago) {
    EstatusPago["pendiente"] = "Pendiente";
    EstatusPago["confirmado"] = "Confirmado";
    EstatusPago["rechazado"] = "Rechazado";
    EstatusPago["cancelado"] = "Cancelado";
    EstatusPago["fallo"] = "Fallido";
})(EstatusPago || (exports.EstatusPago = EstatusPago = {}));
var MetodoPago;
(function (MetodoPago) {
    MetodoPago["efectivo"] = "Efectivo";
    MetodoPago["tarjeta"] = "Tarjeta";
    MetodoPago["cheque"] = "Cheque";
    MetodoPago["deposito"] = "Dep\u00F3sito";
    MetodoPago["transferencia"] = "Transferencia";
    MetodoPago["pago_movil"] = "Pago M\u00F3vil";
    MetodoPago["zelle"] = "Zelle";
    MetodoPago["paypal"] = "PayPal";
    MetodoPago["stripe"] = "Stripe";
    MetodoPago["remesa"] = "Remesa";
    MetodoPago["cripto"] = "Criptomoneda";
})(MetodoPago || (exports.MetodoPago = MetodoPago = {}));
var TipoDocumento;
(function (TipoDocumento) {
    TipoDocumento["cotizacion"] = "Cotizaci\u00F3n";
    TipoDocumento["factura"] = "Factura";
    TipoDocumento["inventario"] = "Inventario";
    TipoDocumento["certificado_garantia"] = "Certificado de Garant\u00EDa";
})(TipoDocumento || (exports.TipoDocumento = TipoDocumento = {}));
var TipoTransaccion;
(function (TipoTransaccion) {
    TipoTransaccion["factura"] = "Factura";
    TipoTransaccion["debito"] = "D\u00E9bito";
    TipoTransaccion["avance_efectivo"] = "Avance de Efectivo";
    TipoTransaccion["pago"] = "Pago";
    TipoTransaccion["credito"] = "Cr\u00E9dito";
    TipoTransaccion["reembolso"] = "Reembolso";
})(TipoTransaccion || (exports.TipoTransaccion = TipoTransaccion = {}));
var Transportistas;
(function (Transportistas) {
    Transportistas["DHL"] = "DHL";
    Transportistas["UPS"] = "UPS";
    Transportistas["FEDEX"] = "FedEx";
    Transportistas["TNT"] = "TNT";
    Transportistas["MARITIMO"] = "Mar\u00EDtimo";
    Transportistas["TERRESTRE"] = "Terrestre";
    Transportistas["OTRO"] = "Otro";
})(Transportistas || (exports.Transportistas = Transportistas = {}));
var QRCodeOutput;
(function (QRCodeOutput) {
    QRCodeOutput["buffer"] = "buffer";
    QRCodeOutput["canvas"] = "canvas";
    QRCodeOutput["data_url"] = "data_url";
    QRCodeOutput["file"] = "file";
    QRCodeOutput["file_stream"] = "file_stream";
    QRCodeOutput["string"] = "string";
})(QRCodeOutput || (exports.QRCodeOutput = QRCodeOutput = {}));
var TipoOrden;
(function (TipoOrden) {
    TipoOrden["cotizacion"] = "Cotizaci\u00F3n";
    TipoOrden["venta"] = "Venta";
    TipoOrden["credito"] = "Cr\u00E9dito";
    TipoOrden["reposicion"] = "Reposici\u00F3n";
})(TipoOrden || (exports.TipoOrden = TipoOrden = {}));
var TipoReporte;
(function (TipoReporte) {
    TipoReporte["productos"] = "productos";
    TipoReporte["ventas"] = "ventas";
    TipoReporte["inventario"] = "inventario";
    TipoReporte["clientes"] = "clientes";
    TipoReporte["rendimiento"] = "rendimiento";
})(TipoReporte || (exports.TipoReporte = TipoReporte = {}));
