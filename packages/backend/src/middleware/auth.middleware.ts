import Passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { AppDataSource } from "../orm/data-source";
import { encryptPassword } from "../providers/encryption";
import { Usuario } from "../orm/entity/usuario";

Passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

Passport.deserializeUser(async (id: string, done) => {
  const user = await AppDataSource.getRepository(Usuario).findOne({
    where: { id },
    relations: ["rol", "rol.privilegios", "sucursales", "sucursales.almacenes"],
  });
  done(null, user);
});

// Local Strategy
Passport.use(
  "local",

  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },

    async (username, password, done) => {
      try {
        const user = await AppDataSource.getRepository(Usuario).findOne({
          where: { email: username },
          relations: [
            "rol",
            "rol.privilegios",
            "sucursales",
            "sucursales.almacenes",
          ],
        });
        if (!user)
          return done(null, false, { message: "Parámetros inválidos" });
        const hash = encryptPassword(password);
        console.log(hash, user?.password);
        if (hash !== user?.password)
          return done(null, false, { message: "Parámetros inválidos" });
        // hide password from user dto
        return done(null, { ...user, password: null });
      } catch (e) {
        return done(e);
      }
    }
  )
);

// JWT Strategy - accessToken
Passport.use(
  "jwt",

  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "super_secret",
    },

    async (token, done) => {
      try {
        const user = await AppDataSource.getRepository(Usuario).findOne({
          where: { id: token.user.id },
          relations: [
            "rol",
            "rol.privilegios",
            "sucursales",
            "sucursales.almacenes",
          ],
        });
        if (!user) return done(null, false);
        // hide password from user dto
        return done(null, { ...user, password: null });
      } catch (e) {
        console.error(e);
        return done(e, false);
      }
    }
  )
);

export default Passport;
