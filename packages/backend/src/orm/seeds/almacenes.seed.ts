import { AppDataSource } from "../data-source";
import { Almacen } from "../entity/almacen";
import { Direccion } from "../entity/direccion";

const ALMACENES = {
  Principal: {
    calle: "Av. Bolívar Norte, Torre Kokuy",
    region: "Carabobo",
    ciudad: "Valencia",
    codigoPostal: "2001",
  },
  Tazajal: {
    calle: "Altos de Monte Alegre",
    region: "Carabobo",
    ciudad: "Naguanagua",
    codigoPostal: "2005",
  },
  "San Joaquin": {
    calle: "Carabali II",
    region: "Carabobo",
    ciudad: "San Joaquin",
    codigoPostal: "2001",
  },
  Guacara: {
    calle: "Guacara",
    region: "Carabobo",
    ciudad: "Guacara",
    codigoPostal: "2001",
  },
  "San Diego": {
    calle: "La Esmeralda",
    region: "Carabobo",
    ciudad: "San Diego",
    codigoPostal: "2001",
  },
};

async function run(): Promise<void> {
  const _almacenes = [] as Almacen[];
  const _direcciones = [] as Direccion[];

  for (const [key, value] of Object.entries(ALMACENES)) {
    const _almacen = new Almacen();
    _almacen.id = crypto.randomUUID();
    _almacen.nombre = key;

    const _direccion = new Direccion();
    _direccion.id = crypto.randomUUID();
    _direccion.region = value.region;
    _direccion.ciudad = value.ciudad;
    _direccion.codigoPostal = value.codigoPostal;
    _direccion.calle = value.calle;
    _direcciones.push(_direccion);

    _almacen.direccion = _direccion;
    _almacenes.push(_almacen);
  }

  await AppDataSource.initialize();
  await AppDataSource.getRepository(Direccion).save(_direcciones);
  await AppDataSource.getRepository(Almacen).save(_almacenes);
}

run()
  .then(() => {
    console.log("Seed: Almacenes ran successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed: Almacenes failed", error);
    process.exit(1);
  });
