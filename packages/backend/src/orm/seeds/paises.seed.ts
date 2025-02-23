import { AppDataSource } from "../data-source";
import { Sucursal } from "../entity/sucursal";
import { Almacen } from "../entity/almacen";
import { Pais } from "../entity/pais";
import { countries } from "shared/countries";
import { PAISES } from "shared/constants";

async function run(): Promise<void> {
  const _paises = [] as Pais[];
  const _sucursales = [] as Sucursal[];
  const _almacenes = [] as Almacen[];

  for (const P of PAISES) {
    const _pais = countries.find((p) => p.nombre === P);
    if (!_pais) continue;

    const pais = new Pais();
    pais.id = crypto.randomUUID();
    pais.nombre = _pais.nombre!;
    pais.name = _pais.name!;
    pais.iso2 = _pais.iso2!;
    pais.iso3 = _pais.iso3!;
    pais.phoneCode = _pais.phoneCode!;
    _paises.push(pais);

    const almacen = new Almacen();
    almacen.id = crypto.randomUUID();
    almacen.nombre = pais.nombre;
    almacen.pais = pais;
    _almacenes.push(almacen);

    const sucursal = new Sucursal();
    sucursal.id = crypto.randomUUID();
    sucursal.nombre = pais.nombre;
    sucursal.pais = pais;
    sucursal.almacenes = [almacen];
    _sucursales.push(sucursal);
  }

  await AppDataSource.initialize();
  await AppDataSource.getRepository(Pais).save(_paises);
  await AppDataSource.getRepository(Almacen).save(_almacenes);
  await AppDataSource.getRepository(Sucursal).save(_sucursales);
}

run()
  .then(() => {
    console.log("Seed: Paises ran successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed: Paises failed", error);
    process.exit(1);
  });
