import { AppDataSource } from "../data-source";
import { roles } from "shared/constants";
import { RolesBase } from "shared/enums";
import { crearRol } from "../../helpers/privilegios.helpers";
import { Usuario } from "../entity/usuario";
import { Rol } from "../entity/rol";

async function run(): Promise<void> {
  await AppDataSource.initialize();
  for (const rol of roles) {
    await crearRol(rol);
  }

  // Create a super user
  const superUsuario = new Usuario();
  superUsuario.nombre = "Victor";
  superUsuario.apellido = "Noguera";
  superUsuario.email = "nvictor@pm.me";
  superUsuario.password = "Benito2023$";
  superUsuario.super = true;

  await AppDataSource.manager.save(superUsuario);

  // Create a ventas user
  const rolVentas = await AppDataSource.getRepository(Rol).findOneBy({
    nombre: RolesBase.ventas,
  });

  const vendedor = new Usuario();
  vendedor.nombre = "Victor Noguera";
  vendedor.email = "nvictor@tuta.io";
  vendedor.password = "Benito2023$";
  vendedor.rol = rolVentas!;

  await AppDataSource.manager.save(vendedor);
}

run()
  .then(() => {
    console.log("Privilegios sembrados correctamente.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error al sembrar privilegios:", error);
    process.exit(1);
  });
