import { Request, Response, Router } from "express";
import Auth from "../middleware/auth.middleware";
import {
  deriveResetToken,
  deriveTokens,
  encryptPassword,
  hashWithMD5,
  ITokens,
  verifyRefreshToken,
  verifyResetToken,
} from "../providers/encryption";
import { Usuario } from "../orm/entity/usuario";
import { redis } from "../providers/redis";
import { emailPasswordResetLink } from "../providers/email";
import { AppDataSource } from "../orm/data-source";
import { Persona } from "../orm/entity/persona";
import { IUsuario } from "shared/interfaces";
import { isValidPassword } from "shared/helpers";

const AuthRouter: Router = Router();

const login = async (user: any, res: Response) => {
  const { accessToken, refreshToken }: ITokens = deriveTokens(user);
  // store refreshToken in redis
  await redis.set(user.id, refreshToken);
  res.status(200).json({ accessToken, refreshToken });
};

const logout = async (user: any, res: Response) => {
  // delete refreshToken from redis
  await redis.del(user.id);
  res.status(204).json({ message: "goodbye!" });
};

AuthRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const data = req.body.usuario as IUsuario;
    // crear nuevo usuario
    const usuario = new Usuario();
    usuario.email = data.email;
    usuario.password = data.password;
    usuario.nombre = data.nombre;
    usuario.apellido = data.apellido;
    usuario.nif = data.nif;
    data.empresa && (usuario.empresa = data.empresa);
    data.telefono && (usuario.telefono = data.telefono);

    const _usuario = await AppDataSource.getRepository(Usuario).save(usuario);

    // login con el nuevo usuario
    await login(_usuario, res);
  } catch (e: any) {
    console.error(e);
    if (e["code"] === "23505") {
      return res.status(500).json({ error: e["detail"] });
    }
    res.status(500).json({ error: e.message });
  }
});

AuthRouter.post(
  "/signin",
  Auth.authenticate("local", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      // si el usuario no está activo, no lo logueamos
      if (!user.activo) {
        return res.status(403).json({ error: "Usuario inactivo." });
      }
      await login(user, res);
    } catch (e: any) {
      console.error(e.message);
      res.status(403).json({ error: e.message });
    }
  }
);

AuthRouter.post("/signout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    // if there's no token, return 401
    if (!refreshToken)
      return res.status(401).json({ message: "missing params" });
    // verify signature
    const verified: any = verifyRefreshToken(refreshToken);
    const { user } = verified;
    // compare user.id && tokens
    const storedRefreshToken = await redis.get(user.id);
    if (refreshToken !== storedRefreshToken)
      return res.status(403).json({ message: "invalid token" });
    // logout user
    await logout(user, res);
  } catch (e: any) {
    console.error(e.message);
    res.status(403).json({ error: e.message });
  }
});

AuthRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    // if there's no token, return 401
    if (!refreshToken)
      return res.status(401).json({ message: "missing params" });
    // verify signature
    const verified: any = verifyRefreshToken(refreshToken);
    const { user } = verified;
    // compare user.id && tokens
    const storedRefreshToken = await redis.get(user.id);
    if (refreshToken !== storedRefreshToken)
      return res.status(403).json({ message: "invalid token" });
    // otherwise, login to refresh both tokens
    await login(user, res);
  } catch (e: any) {
    console.error(e.message);
    res.status(403).json({ error: e.message });
  }
});

AuthRouter.put(
  "/self",
  Auth.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const profile: Persona = req.body;
      const { seudonimo, nombre, apellido, notas, avatar, telefono, nif } =
        profile;
      const newData = {
        seudonimo,
        nombre,
        apellido,
        notas,
        avatar,
        telefono,
        nif,
      };
      const repo = AppDataSource.getRepository(Persona);
      await repo.update(user.id, newData);
      const current = await repo.findOneBy({ id: user.id });
      res.status(200).json({ profile: { ...current, password: null } });
    } catch (e: any) {
      console.error(e.message);
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(500).json({
          error: e.message.split("for")[0] + ", display name is taken.",
        });
      }
      res.status(500).json({ error: e.message });
    }
  }
);

AuthRouter.post("/recover", async (req: Request, res: Response) => {
  try {
    const email = req.body.email as string;
    if (!email) return res.status(400).json({ error: "invalid params" });
    // find a user account
    const user = await AppDataSource.getRepository(Usuario).findOneBy({
      email,
    });
    if (!user) return res.status(404).json({ error: "not found" });
    const resetToken = deriveResetToken({ email });
    const hash = hashWithMD5(email);
    await redis.set(hash, resetToken);
    await emailPasswordResetLink(email, hash, resetToken);
    return res.status(200).json({
      message: `Se ha enviado un enlace a ${email} para recuperar su contraseña.`,
    });
  } catch (e: any) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

AuthRouter.post("/reset", async (req: Request, res: Response) => {
  try {
    const { hash, token, password, confirmation } = req.body;
    const storedToken = await redis.get(hash);
    const verified: any = verifyResetToken(token);
    const { email } = verified;
    const emailHashConfirmation = hashWithMD5(email);
    // compare resetToken to the one stored in redis(hash)
    // also, compare the email hash
    if (token !== storedToken || emailHashConfirmation !== hash)
      return res.status(400).json({
        error: "Hay un impostor entre nosotros!.",
      });
    // check password and confirmation match
    if (password !== confirmation)
      return res.status(400).json({ error: "Passwords no coinciden." });
    // check if password is secure enough
    if (!isValidPassword(password))
      return res.status(400).json({
        error:
          "Password debe tener al menos 8 caracteres, una letra mayúscula, una minúscula, un número y un caracter especial.",
      });
    // find a user with this email
    const repo = AppDataSource.getRepository(Usuario);
    const user = await repo.findOne({ where: { email } });
    // if there's no user, then return 404
    if (!user) return res.status(404).json({ error: "Usuario no existe." });
    // otherwise, update the password
    await repo.update(user.id, { password: encryptPassword(password) });
    // and delete the resetToken from redis
    await redis.del(hash);
    return res.status(200).json({ message: "Password actualizado." });
  } catch (e: any) {
    console.error(e.message);
    await redis.del(req.params.hash);
    res.status(500).json({
      error: "Enlace expirado. Solicite uno nuevo.",
    });
  }
});

export { AuthRouter };
