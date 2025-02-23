import { AppDataSource } from "../data-source";
import { roles } from "shared/constants";
import { crearRol } from "../../helpers/privilegios.helpers";
import { Usuario } from "../entity/usuario";
import { Pais } from "../entity/pais";
import { Rol } from "../entity/rol";

async function run(): Promise<void> {
  await AppDataSource.initialize();
  for (const rol of roles) {
    await crearRol(rol);
  }

  // find pais by name
  const pais = await AppDataSource.getRepository(Pais).findOneBy({
    nombre: "Estados Unidos",
  });

  // Create a super user
  const superUsuario = new Usuario();
  superUsuario.nombre = "Victor";
  superUsuario.apellido = "Noguera";
  superUsuario.email = "nvictor@pm.me";
  superUsuario.password = "Benito2023$";
  superUsuario.pais = pais!;
  superUsuario.super = true;

  await AppDataSource.manager.save(superUsuario);

  // Create a distribuidor user
  const roleDistribuidor = await AppDataSource.getRepository(Rol).findOneBy({
    nombre: "Distribuidor",
  });

  const distribuidor = new Usuario();
  distribuidor.nombre = "Victor Noguera";
  distribuidor.email = "nvictor@tuta.io";
  distribuidor.password = "Benito2023$";
  distribuidor.pais = pais!;
  distribuidor.rol = roleDistribuidor!;

  await AppDataSource.manager.save(distribuidor);
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
