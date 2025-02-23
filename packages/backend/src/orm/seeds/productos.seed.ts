import { Producto } from "../entity/producto";
import { parseProductos } from "../../helpers/legacy/productos.helpers";
import { AppDataSource } from "../data-source";
import { Dimension } from "../entity/dimension";
import {
  UnidadesLongitud,
  UnidadesPeso,
  Categorias,
  PeriodosGarantia,
} from "shared/enums";
import { Precio } from "../entity/precio";
import { Stock } from "../entity/stock";
import { Archivo } from "../entity/archivo";
import { Almacen } from "../entity/almacen";
import { Pais } from "../entity/pais";
import { ProductoMotor } from "../entity/productoMotor";
import { Categoria } from "../entity/categoria";
import { Subcategoria } from "../entity/subcategoria";
import { IMotorProducto } from "shared";

async function run(): Promise<void> {
  await AppDataSource.initialize();
  const _paises = await AppDataSource.getRepository(Pais).find();
  const _categorias = await AppDataSource.getRepository(Categoria).find();
  const _subcategorias = await AppDataSource.getRepository(Subcategoria).find();
  const _legacy = await parseProductos(_paises, _categorias, _subcategorias);
  const _productos = [] as Producto[];
  const _dimensiones = [] as Dimension[];
  const _embalajes = [] as Dimension[];
  const _precios = [] as Precio[];
  const _portadas = [] as Archivo[];
  const _galerias = [] as Archivo[];
  const _stocks = [] as Stock[];

  // Leer almacenes desde la base de datos
  const almacenes = await AppDataSource.getRepository(Almacen).find({
    relations: ["pais"],
  });

  // Producto Personalizado
  const productoPersonalizado = new Producto();
  productoPersonalizado.id = crypto.randomUUID();
  productoPersonalizado.nombre = "Personalizado";
  productoPersonalizado.descripcion = "Producto personalizado";
  productoPersonalizado.modelo = "Personalizado";
  productoPersonalizado.slug = "personalizado";
  productoPersonalizado.sku = "ZZ";
  productoPersonalizado.categoria = _categorias.find(
    (c) => c.nombre === Categorias.personalizado
  )!;
  productoPersonalizado.costo = 0;
  productoPersonalizado.paises = _paises.filter((p) => p.nombre !== "China");
  productoPersonalizado.garantia = PeriodosGarantia.sin_garantia;
  productoPersonalizado.requiereMotor = false;
  productoPersonalizado.dimensiones = new Dimension();
  productoPersonalizado.dimensiones.id = crypto.randomUUID();
  productoPersonalizado.dimensiones.alto = 10;
  productoPersonalizado.dimensiones.ancho = 10;
  productoPersonalizado.dimensiones.largo = 10;
  productoPersonalizado.dimensiones.peso = 1;
  productoPersonalizado.dimensiones.unidadLongitud = UnidadesLongitud.cm;
  productoPersonalizado.dimensiones.unidadPeso = UnidadesPeso.kg;
  // save dimensiones
  await AppDataSource.getRepository(Dimension).save(
    productoPersonalizado.dimensiones
  );
  productoPersonalizado.embalaje = new Dimension();
  productoPersonalizado.embalaje.id = crypto.randomUUID();
  productoPersonalizado.embalaje.alto = 10;
  productoPersonalizado.embalaje.ancho = 10;
  productoPersonalizado.embalaje.largo = 10;
  productoPersonalizado.embalaje.peso = 1;
  productoPersonalizado.embalaje.unidadLongitud = UnidadesLongitud.cm;
  productoPersonalizado.embalaje.unidadPeso = UnidadesPeso.kg;
  // save embalaje
  await AppDataSource.getRepository(Dimension).save(
    productoPersonalizado.embalaje
  );
  productoPersonalizado.galeria = [];
  // Stock de producto personalizado para todos los almacenes
  almacenes.forEach((almacen) => {
    const _stock = new Stock();
    _stock.id = crypto.randomUUID();
    _stock.producto = productoPersonalizado;
    _stock.almacen = almacen;
    _stock.actual = 0;
    _stock.reservado = 0;
    _stock.transito = 0;
    _stock.rma = 0;
    _stocks.push(_stock);
  });
  // Agregar producto personalizado a la lista de productos
  _productos.push(productoPersonalizado);

  // Precios producto personalizado
  _paises.forEach((pais) => {
    const _precio = new Precio();
    _precio.id = crypto.randomUUID();
    _precio.producto = productoPersonalizado;
    _precio.precioLista = 0;
    _precio.precioOferta = 0;
    _precio.enOferta = false;
    _precio.pais = pais;
    _precios.push(_precio);
  });

  // iterar sobre los productos legacy
  _legacy.forEach((p) => {
    const producto = new Producto();
    producto.id = crypto.randomUUID();
    producto.nombre = p.nombre;
    producto.descripcion = p.descripcion;
    producto.modelo = p.modelo;
    producto.slug = p.slug;
    producto.sku = p.sku;
    producto.categoria = p.categoria;
    producto.subcategoria = p.subcategoria!;
    producto.costo = p.costo;
    producto.paises = p.paises;
    producto.garantia = p.garantia;
    producto.requiereMotor = p.requiereMotor;

    // Agregar a la lista de productos
    _productos.push(producto);

    // Dimensiones
    const dimension = new Dimension();
    dimension.id = crypto.randomUUID();
    dimension.alto = p.dimensiones.alto;
    dimension.ancho = p.dimensiones.ancho;
    dimension.largo = p.dimensiones.largo;
    dimension.peso = p.dimensiones.peso;
    dimension.unidadLongitud = UnidadesLongitud.cm;
    dimension.unidadPeso = UnidadesPeso.kg;
    _dimensiones.push(dimension);
    producto.dimensiones = dimension;

    // Embalaje
    const embalaje = new Dimension();
    embalaje.id = crypto.randomUUID();
    embalaje.alto = p.dimensiones.alto;
    embalaje.ancho = p.dimensiones.ancho;
    embalaje.largo = p.dimensiones.largo;
    embalaje.peso = p.dimensiones.peso;
    embalaje.unidadLongitud = UnidadesLongitud.cm;
    embalaje.unidadPeso = UnidadesPeso.kg;
    _embalajes.push(embalaje);
    producto.embalaje = embalaje;

    // Portada
    if (p.portada) {
      const portada = new Archivo();
      portada.id = crypto.randomUUID();
      portada.nombre = p.portada?.nombre || "";
      portada.url = p.portada?.url || "";
      portada.tipo = p.portada?.tipo || "jpg";
      _portadas.push(portada);
      producto.portada = portada;
    }

    // Galería
    if (p.galeria) {
      producto.galeria = [];
      p.galeria.forEach((g) => {
        const galeria = new Archivo();
        galeria.id = crypto.randomUUID();
        galeria.nombre = g.nombre;
        galeria.url = g.url || "";
        galeria.tipo = g.tipo;
        _galerias.push(galeria);
        producto.galeria.push(galeria);
      });
    }

    // Precios
    p.precios.forEach((precio) => {
      const _precio = new Precio();
      _precio.id = crypto.randomUUID();
      _precio.producto = producto;
      _precio.precioLista = precio.precioLista;
      _precio.precioOferta = precio.precioOferta;
      _precio.enOferta = precio.enOferta;
      _precio.inicioOferta = precio.enOferta ? new Date().toISOString() : null;
      _precio.pais = precio.pais;
      _precios.push(_precio);
    });

    // Stock
    p.stock.forEach((stock: any) => {
      const _almacen = almacenes.find((a) => {
        return a.pais.nombre === stock.pais.nombre;
      });

      if (_almacen) {
        const _stock = new Stock();
        _stock.id = crypto.randomUUID();
        _stock.producto = producto;
        _stock.almacen = _almacen;
        _stock.actual = stock.actual;
        _stock.reservado = stock.reservado;
        _stock.transito = stock.transito;
        _stock.rma = stock.rma;
        _stocks.push(_stock);
      }
    });
  });

  console.log("Productos:", _productos.length);
  console.log("Dimensiones:", _dimensiones.length);
  console.log("Precios:", _precios.length);
  console.log("Stocks:", _stocks.length);

  // Before creating or updating a Producto entity with a portada field,
  // make sure the referenced Archivo entity exists in the archivos table.
  await AppDataSource.getRepository(Archivo).save(_portadas, { chunk: 500 });
  await AppDataSource.getRepository(Archivo).save(_galerias, { chunk: 500 });
  await AppDataSource.getRepository(Dimension).save(_dimensiones, {
    chunk: 500,
  });
  await AppDataSource.getRepository(Dimension).save(_embalajes, {
    chunk: 500,
  });
  await AppDataSource.getRepository(Producto).save(_productos, { chunk: 500 });
  await AppDataSource.getRepository(Precio).save(_precios, { chunk: 500 });
  await AppDataSource.getRepository(Stock).save(_stocks, { chunk: 500 });

  // Asignar motores luego de que los productos ya existen
  const mapaMotor = new Map<string, Producto>();
  const _products = await AppDataSource.getRepository(Producto).find({
    where: {
      requiereMotor: true,
    },
  });
  const _motores = await AppDataSource.getRepository(Producto).find({
    where: {
      categoria: {
        nombre: Categorias.motores,
      },
    },
  });
  const _motoresToUpdate = [] as ProductoMotor[];
  // iterar sobre los productos que requieren motor
  _products.forEach((p) => {
    p.motores = [];
    // buscar la referencia al producto legacy
    const legacyProducto: any = _legacy.find((lp) => lp.sku === p.sku);
    if (legacyProducto?.motores?.length) {
      // iterar sobre las referencias de motores en el producto legacy
      legacyProducto.motores.forEach((m: IMotorProducto) => {
        // buscar el motor en el mapa
        let motor = mapaMotor.get(m.id);
        if (!motor) {
          // si no existe, buscarlo en la lista de productos legacy
          const legacyMotor = _legacy.find((lm) => lm.id === m.id);
          if (legacyMotor) {
            // si existe, buscarlo en la lista de productos
            motor = _motores.find((mm) => mm.sku === legacyMotor.sku);
            if (motor) {
              // si existe, agregarlo al mapa
              mapaMotor.set(m.id, motor);
            }
          }
        }
        // finalmente, si se encontró el motor, agregarlo a la lista de motores del producto
        if (motor) {
          const productoMotor = new ProductoMotor();
          productoMotor.id = crypto.randomUUID();
          productoMotor.producto = p;
          productoMotor.motor = motor;
          productoMotor.cantidad = m.cantidad;
          _motoresToUpdate.push(productoMotor);
        }
      });
    }
  });

  await AppDataSource.getRepository(ProductoMotor).save(_motoresToUpdate, {
    chunk: 500,
  });
}

run()
  .then(() => {
    console.log("Productos seeded");
  })
  .catch((error) => {
    console.error(error);
  });
