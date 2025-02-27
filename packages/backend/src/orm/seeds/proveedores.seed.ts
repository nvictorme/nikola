import { AppDataSource } from "../data-source";
import { Proveedor } from "../entity/proveedor";

const PROVEEDORES = [
  {
    nombre: "Guangzhou Shenglong Hardware Building Materials Co., Ltd",
    marca: "CHiNT",
  },
  {
    nombre: "Fato Mechanical And Electrical Co.,ltd",
    marca: "FATO",
  },
  {
    nombre: "Zhejiang Tongzheng Electric Co., Ltd",
    marca: "TOMZn",
  },
  {
    nombre: "Foshan Shunde Baifuli Industrial Co., Ltd",
    marca: "GUILI",
  },
  {
    nombre: "Gandian Lightning Protection Electric Co., Ltd",
    marca: "GADA",
  },
  {
    nombre: "Otros-Aliexpress",
    marca: "Otros-Aliexpress",
  },
  {
    nombre: "Wenzhou Ruifan Electrical Co., Ltd",
    marca: "RY-ELE",
  },
  {
    nombre: "Siqi Technology Co., Ltd",
    marca: "CSQ",
  },
  {
    nombre: "Kaer Technology Co.,Ltd",
    marca: "CHAER",
  },
  {
    nombre: "Wenzhou Ginri Power Automation Co., Ltd",
    marca: "Ginri",
  },
  {
    nombre: "Anhui Jinli Electric Tech. Co., Ltd",
    marca: "JPD",
  },
  {
    nombre: "Wenzhou Jesiro Electric Co., Ltd",
    marca: "JESIRO",
  },
  {
    nombre: "Yueqing Yirui Electric Appliance Co., Ltd",
    marca: "YRO",
  },
];

async function run(): Promise<void> {
  const _proveedores = [] as Proveedor[];

  for (const proveedor of PROVEEDORES) {
    const _proveedor = new Proveedor();
    _proveedor.id = crypto.randomUUID();
    _proveedor.nombre = proveedor.nombre;
    _proveedor.marca = proveedor.marca;
    _proveedores.push(_proveedor);
  }

  await AppDataSource.initialize();
  await AppDataSource.getRepository(Proveedor).save(_proveedores);
}

run()
  .then(() => {
    console.log("Seed: Proveedores ran successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed: Proveedores failed", error);
    process.exit(1);
  });
