import { Categorias, CategoriasTraducidas, Subcategorias, SubcategoriasTraducidas } from "shared/enums";
import { AppDataSource } from "../data-source";
import { Categoria } from "../entity/categoria";
import { Subcategoria } from "../entity/subcategoria";
import { subCategoryFactory } from "shared";

async function run(): Promise<void> {
    const _categorias = [] as Categoria[];
    const _subcategorias = [] as Subcategoria[];

    const categorias = Object.entries(Categorias);

    categorias.forEach((categoria) => {
        const [key, value] = categoria;
        const _categoria = new Categoria();
        _categoria.id = crypto.randomUUID();
        _categoria.nombre = value;
        _categoria.name = CategoriasTraducidas[key as keyof typeof CategoriasTraducidas];
        _categorias.push(_categoria);

        const subcategorias = subCategoryFactory(value as Categorias);
        subcategorias.forEach((subcategoria) => {
            const _subcategoria = new Subcategoria();
            _subcategoria.id = crypto.randomUUID();
            _subcategoria.nombre = subcategoria;
            const subKey = Object.keys(Subcategorias).find(skey => Subcategorias[skey as keyof typeof Subcategorias] === subcategoria);
            _subcategoria.name = SubcategoriasTraducidas[subKey as keyof typeof SubcategoriasTraducidas];
            _subcategoria.categoria = _categoria;
            _subcategorias.push(_subcategoria);
        });
    });

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
