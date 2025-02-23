import {
  IArchivo,
  IMotorProducto,
  IPais,
  IPrecioProducto,
  IProducto,
  IStockProducto,
} from "shared/interfaces";
import {
  Categorias,
  Paises,
  PeriodosGarantia,
  Subcategorias,
} from "shared/enums";
import { db } from "./firebase.helpers";
import { Pais } from "../../orm/entity/pais";
import { Categoria } from "../../orm/entity/categoria";
import { Subcategoria } from "../../orm/entity/subcategoria";

export const extractFileAndExtension = (filename: string): string[] | null => {
  const regex = /([^\/\\]+)\.([a-zA-Z0-9]+)$/i;
  const match = regex.exec(filename);
  if (match) {
    return [match[1], match[2]];
  }
  return null;
};

export const getItemImageUrl = (
  itemId: string,
  filename: string | undefined,
  bucket: string,
  fromGallery = true,
  size = 100
): string => {
  let url = `https://via.placeholder.com/${size}`;
  if (!filename) {
    return url;
  }
  const match = extractFileAndExtension(filename);
  if (!match) {
    return url;
  }
  const [name, extension] = match;
  if (name && extension) {
    url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/products${
      fromGallery ? "%2F" + itemId : ""
    }%2Fthumbs%2F${name}_${size}x${size}.${extension}?alt=media`;
  }
  return url;
};

const garantias = Object.keys(PeriodosGarantia);
const parseGarantia = (garantia: string): PeriodosGarantia => {
  if (garantias.includes(garantia)) {
    return PeriodosGarantia[garantia as keyof typeof PeriodosGarantia];
  }
  return PeriodosGarantia.sin_garantia;
};

const parsePais = (nombre: string, _paises: Pais[]): IPais => {
  return _paises.find(
    (p) => p.nombre === Paises[nombre as keyof typeof Paises]
  ) as IPais;
};

const parsePaises = (
  habilitado: { [key: string]: boolean },
  _paises: Pais[]
): IPais[] => {
  const paises = Object.keys(habilitado);
  return paises
    .filter((pais) => habilitado[pais])
    .map((pais) => parsePais(pais, _paises));
};

export const parseProductos = async (
  _paises: Pais[],
  _categorias: Categoria[],
  _subcategorias: Subcategoria[]
): Promise<IProducto[]> => {
  try {
    // query from firestore
    const _productos: any[] = (
      await db
        .collection("productos")
        .where("activo", "==", true)
        .where("eliminado", "==", false)
        .get()
    ).docs.map((doc) => doc.data() as IProducto);

    const _precios: any[] = (
      await db.collection("productos_precio").get()
    ).docs.map((doc) => doc.data() as IPrecioProducto);

    const _stock: any[] = (
      await db.collection("productos_stock").get()
    ).docs.map((doc) => doc.data() as IStockProducto);

    // parse data
    const productos: IProducto[] = _productos.map((data) => {
      const producto = { ...data } as IProducto;
      producto.categoria = _categorias.find(
        (c) =>
          c.nombre === Categorias[data.categoria as keyof typeof Categorias]
      )!;
      data.subCategoria &&
        (producto.subcategoria = _subcategorias.find(
          (s) =>
            s.nombre ===
            Subcategorias[data.subCategoria as keyof typeof Subcategorias]
        )!);
      producto.requiereMotor = data.motor ?? false;
      if (producto.requiereMotor && data.motores.length > 0) {
        producto.motores = data.motores.map((m: string) => ({
          id: m,
          cantidad: 1,
        }));
        // combine multiple motors
        producto.motores = producto.motores.reduce((acc, curr) => {
          const existingMotor = acc.find((m) => m.id === curr.id);
          if (existingMotor) {
            existingMotor.cantidad += curr.cantidad;
          } else {
            acc.push(curr);
          }
          return acc;
        }, [] as IMotorProducto[]);
      }
      producto.garantia = parseGarantia(data.periodoGarantia);
      producto.paises = parsePaises(data.habilitado, _paises);

      // precios & stock
      producto.precios = _precios
        .filter((p) => p.idProducto === producto.id && p.pais !== "china")
        .map((p) => ({ ...p, pais: parsePais(p.pais, _paises) }));
      producto.stock = _stock
        .filter((s) => s.idProducto === producto.id && s.pais !== "china")
        .map((s) => ({ ...s, pais: parsePais(s.pais, _paises) }));

      // portada
      data.portada &&
        (producto.portada = {
          nombre: data.portada,
          tipo: extractFileAndExtension(data.portada)?.[1] ?? "jpg",
          url: getItemImageUrl(
            producto.id,
            data.portada,
            "inflalo.appspot.com",
            false,
            500
          ),
        } as IArchivo);
      // galeria
      data.galeria?.length > 0 &&
        (producto.galeria = data.galeria.map((g: string) => {
          return {
            nombre: g,
            tipo: extractFileAndExtension(g)?.[1] ?? "jpg",
            url: getItemImageUrl(
              producto.id,
              g,
              "inflalo.appspot.com",
              true,
              500
            ),
          } as IArchivo;
        }));

      return producto;
    });
    return productos;
  } catch (error) {
    console.error(error);
    return [];
  }
};
