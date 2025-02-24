import { Producto } from "../entity/producto";
import { AppDataSource } from "../data-source";
import { Dimension } from "../entity/dimension";
import { UnidadesLongitud, UnidadesPeso } from "shared/enums";
import { Stock } from "../entity/stock";
import { Archivo } from "../entity/archivo";
import { Almacen } from "../entity/almacen";
import { Categoria } from "../entity/categoria";
import { Subcategoria } from "../entity/subcategoria";
import { IArchivo, IStockProducto } from "shared";

async function run(): Promise<void> {
  await AppDataSource.initialize();
  const _categorias = await AppDataSource.getRepository(Categoria).find();
  const _subcategorias = await AppDataSource.getRepository(Subcategoria).find();
  const _legacy = [] as any; // TODO: importar del csv // await parseProductos(_categorias, _subcategorias);
  const _productos = [] as Producto[];
  const _dimensiones = [] as Dimension[];
  const _embalajes = [] as Dimension[];
  const _portadas = [] as Archivo[];
  const _galerias = [] as Archivo[];
  const _stocks = [] as Stock[];

  // Obtener el almacen principal
  const almacenPrincipal = await AppDataSource.getRepository(
    Almacen
  ).findOneOrFail({
    where: {
      nombre: "Principal",
    },
  });

  // iterar sobre los productos legacy
  _legacy.forEach((p: any) => {
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
    producto.garantia = p.garantia;

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
      p.galeria.forEach((g: IArchivo) => {
        const galeria = new Archivo();
        galeria.id = crypto.randomUUID();
        galeria.nombre = g.nombre;
        galeria.url = g.url || "";
        galeria.tipo = g.tipo;
        _galerias.push(galeria);
        producto.galeria.push(galeria);
      });
    }

    // Stock
    p.stock.forEach((stock: IStockProducto) => {
      const _stock = new Stock();
      _stock.id = crypto.randomUUID();
      _stock.producto = producto;
      _stock.almacen = almacenPrincipal;
      _stock.actual = stock.actual;
      _stock.reservado = stock.reservado;
      _stock.transito = stock.transito;
      _stock.rma = stock.rma;
      _stocks.push(_stock);
    });
  });

  console.log("Productos:", _productos.length);
  console.log("Dimensiones:", _dimensiones.length);
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
  await AppDataSource.getRepository(Stock).save(_stocks, { chunk: 500 });
}

run()
  .then(() => {
    console.log("Productos seeded");
  })
  .catch((error) => {
    console.error(error);
  });
