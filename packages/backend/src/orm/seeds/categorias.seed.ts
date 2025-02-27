import { AppDataSource } from "../data-source";
import { Categoria } from "../entity/categoria";
import { Subcategoria } from "../entity/subcategoria";

const CATEGORIAS = {
  "Breaker Termomagnetico": {
    subcategorias: ["AC", "DC"],
  },
  Guardamotor: {
    subcategorias: [],
  },
  "Protector Digital": {
    subcategorias: ["Monofásico", "Trifásico"],
  },
  "Transferencias Manuales": {
    subcategorias: [],
  },
  "Modulos Especiales": {
    subcategorias: [],
  },
  Herramientas: {
    subcategorias: [],
  },
  "Transferencias Automaticas": {
    subcategorias: ["Bobinas", "Motorizadas"],
  },
  Rele: {
    subcategorias: ["8 pines", "Estado Sólido", "Slim", "Slim Estado Sólido"],
  },
  "Tableros de Tapa Abatible": {
    subcategorias: ["Superficial", "Empotrable"],
  },
  Terminales: {
    subcategorias: ["Cuello Largo", "Cuello Corto"],
  },
  Conectores: {
    subcategorias: ["Peine Busbar"],
  },
  Borneras: {
    subcategorias: ["Tierra", "Neutro y Tierra"],
  },
};

async function run(): Promise<void> {
  const _categorias = [] as Categoria[];
  const _subcategorias = [] as Subcategoria[];

  for (const [key, value] of Object.entries(CATEGORIAS)) {
    const _categoria = new Categoria();
    _categoria.id = crypto.randomUUID();
    _categoria.nombre = key;
    _categorias.push(_categoria);

    for (const subcategoria of value.subcategorias) {
      const _subcategoria = new Subcategoria();
      _subcategoria.id = crypto.randomUUID();
      _subcategoria.nombre = subcategoria;
      _subcategoria.categoria = _categoria;
      _subcategorias.push(_subcategoria);
    }
  }

  await AppDataSource.initialize();
  await AppDataSource.getRepository(Categoria).save(_categorias);
  await AppDataSource.getRepository(Subcategoria).save(_subcategorias);
}

run()
  .then(() => {
    console.log("Seed: Categorias ran successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed: Categorias failed", error);
    process.exit(1);
  });
