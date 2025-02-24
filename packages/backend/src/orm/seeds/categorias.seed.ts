import { AppDataSource } from "../data-source";
import { Categoria } from "../entity/categoria";
import { Subcategoria } from "../entity/subcategoria";

async function run(): Promise<void> {
  const _categorias = [] as Categoria[];
  const _subcategorias = [] as Subcategoria[];

  // TODO: Seed categorias and subcategorias

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
