import { Producto } from "../entity/producto";
import { AppDataSource } from "../data-source";
import { Dimension } from "../entity/dimension";
import { UnidadesLongitud, UnidadesPeso } from "shared/enums";
import { Stock } from "../entity/stock";
import { Almacen } from "../entity/almacen";
import { Categoria } from "../entity/categoria";
import { Subcategoria } from "../entity/subcategoria";
import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import slugify from "slugify";

async function run(): Promise<void> {
  await AppDataSource.initialize();
  const _categorias = await AppDataSource.getRepository(Categoria).find();
  const _subcategorias = await AppDataSource.getRepository(Subcategoria).find();

  const data = await readFile("src/orm/seeds/productos.csv", "utf8");
  let _legacy = parse(data, {
    columns: true,
    skip_empty_lines: true,
  });

  const duplicates = new Map<string, any[]>();
  // find duplicates by sku
  _legacy.forEach((p: any) => {
    if (duplicates.has(p.sku)) {
      duplicates.get(p.sku)!.push(p);
    } else {
      duplicates.set(p.sku, [p]);
    }
  });

  // filter and print only the duplicates (entries with more than 1 item)
  duplicates.forEach((products, sku) => {
    if (products.length > 1) {
      console.log(`Duplicate SKU found: ${sku}`);
      console.log(products);
    }
  });

  // remove duplicates, keeping only the first occurrence of each SKU
  _legacy = _legacy.filter(
    (product: any, index: number, self: any[]) =>
      index === self.findIndex((p: any) => p.sku === product.sku)
  );

  const _productos = [] as Producto[];
  const _dimensiones = [] as Dimension[];
  const _embalajes = [] as Dimension[];
  const _stocks = [] as Stock[];

  // Obtener todos los almacenes
  const _almacenes = await AppDataSource.getRepository(Almacen).find();

  // iterar sobre los productos legacy
  _legacy.forEach((p: any) => {
    const producto = new Producto();
    producto.id = crypto.randomUUID();
    producto.nombre = p.nombre;
    producto.modelo = p.modelo;
    producto.slug = slugify(`${p.nombre} ${p.modelo} ${p.sku}`, {
      lower: true,
      strict: true,
      replacement: "-",
      trim: true,
    }).slice(0, 100);
    producto.sku = p.sku;
    producto.categoria = _categorias.find((c) => c.nombre === p.categoria)!;
    producto.subcategoria = _subcategorias.find(
      (s) => s.nombre === p.subcategoria
    )!;
    producto.costo = p.costo || 0;
    producto.precioGeneral = p.precioGeneral || 0;
    producto.precioInstalador = p.precioInstalador || 0;
    producto.precioMayorista = p.precioMayorista || 0;
    producto.garantia = p.garantia || "Sin Garantía";

    // Agregar a la lista de productos
    _productos.push(producto);

    // Dimensiones
    const dimension = new Dimension();
    dimension.id = crypto.randomUUID();
    dimension.alto = 0;
    dimension.ancho = 0;
    dimension.largo = 0;
    dimension.peso = 0;
    dimension.unidadLongitud = UnidadesLongitud.cm;
    dimension.unidadPeso = UnidadesPeso.kg;
    _dimensiones.push(dimension);

    // Embalaje
    const embalaje = new Dimension();
    embalaje.id = crypto.randomUUID();
    embalaje.alto = 0;
    embalaje.ancho = 0;
    embalaje.largo = 0;
    embalaje.peso = 0;
    embalaje.unidadLongitud = UnidadesLongitud.cm;
    embalaje.unidadPeso = UnidadesPeso.kg;
    _embalajes.push(embalaje);

    // Stock
    _almacenes.forEach((almacen) => {
      const _stock = new Stock();
      _stock.id = crypto.randomUUID();
      _stock.producto = producto;
      _stock.almacen = almacen;
      _stock.actual = 0;
      _stock.reservado = 0;
      _stock.transito = 0;
      _stock.rma = 0;
      _stocks.push(_stock);
    });
  });

  await AppDataSource.getRepository(Producto).save(_productos, { chunk: 500 });

  await AppDataSource.getRepository(Dimension).save(_dimensiones, {
    chunk: 500,
  });
  await AppDataSource.getRepository(Dimension).save(_embalajes, {
    chunk: 500,
  });

  await AppDataSource.getRepository(Stock).save(_stocks, { chunk: 500 });
}

run()
  .then(() => {
    console.log("Productos seeded");
  })
  .catch((error) => {
    console.error(error);
  });
