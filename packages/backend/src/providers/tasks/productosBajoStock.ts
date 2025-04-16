import { AppDataSource } from "../../orm/data-source";
import { Producto } from "../../orm/entity/producto";
import { IProducto } from "shared/interfaces";
import { sendEmail } from "../email";
import { Usuario } from "../../orm/entity/usuario";
import { RolesBase } from "shared/enums";

interface IProductoBajoStock extends IProducto {
  stockTotal: number;
}

export const queryProductosBajoStock = async (): Promise<void> => {
  const productosStockBajo: IProductoBajoStock[] =
    await AppDataSource.getRepository(Producto)
      .createQueryBuilder("producto")
      .leftJoinAndSelect("producto.stock", "stock")
      .select("producto.id", "id")
      .addSelect("producto.nombre", "nombre")
      .addSelect("producto.sku", "sku")
      .addSelect("CAST(producto.stockMinimo AS int)", "stockMinimo")
      .addSelect("CAST(SUM(stock.actual) AS int)", "stockTotal")
      .groupBy("producto.id")
      .having("SUM(stock.actual) <= producto.stockMinimo")
      .getRawMany();

  console.log("Productos con stock bajo:", productosStockBajo.length);

  let html = "";

  productosStockBajo.forEach((producto) => {
    html += `<h4>${producto.nombre}</h4>`;
    html += `<p>SKU: ${producto.sku}</p>`;
    html += `<p>Stock total: ${producto.stockTotal}</p>`;
    html += `<p>Stock mínimo: ${producto.stockMinimo}</p>`;
    html += `<br>`;
  });

  const gerentes = await AppDataSource.getRepository(Usuario).find({
    where: {
      rol: { nombre: RolesBase.gerente },
    },
  });

  await sendEmail(
    process.env.NO_REPLY_EMAIL_ADDRESS,
    gerentes.map((gerente) => gerente.email),
    `Productos con stock bajo en ${process.env.APP_NAME}`,
    html
  );
  console.log(
    `Email enviado a los gerentes con ${productosStockBajo.length} productos bajo stock`
  );
};
