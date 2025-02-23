# Backend - Nikola

Nikola Business Backend System

## Swagger UI

Edita el swagger file `/src/swagger.json`.
API docs en `localhost:3000/api-docs/`.

### Cómo ejecutar?

### Pre-requisitos

- (Recomendado, opcional) Node 18

## Configuracion inicial:

1. Ejecutar `npm install`
2. Verificar que `.env` contiene las variables de entorno.
3. Generar la migracion inicial ejecutando: `npm run migration:generate ./src/orm/migration/NombreDeLaMigracion*`
4. Correr la migracion inicial ejecutando: `npm run migration:run`
5. En este punto, todas las tablas deben haber sido creadas en su DB.

## Sembrar los datos semilla

1. Ejecutar `npm run seed:paises`
2. Ejecutar `npm run seed:categorias`
3. Ejecutar `npm run seed:privilegios`
4. Ejecutar `npm run seed:productos`

## Desarrollo

1. Verificar que `.env` contiene las variables de entorno.
2. En una 1er terminal corre `npm run build:dev`. Esto ejecuta el typescript compiler en `watch mode`.
3. En una 2da terminal corre `npm run start:dev`. Esto ejecuta el app con nodemon y la reinicia cuando se guardan los cambios

## Producción

### Usando PM2 (recomendado)

1. Verificar que `.env` contiene las variables de entorno. Establece `NODE_ENV="production"`.
2. Compilar con `npm run build`;
3. Correr con `pm2 start npm -- start`.

### Usando Docker (opcional)

1. Edit `.env` and set your development environment variables. Remember to set `NODE_ENV="production"`.
2. build docker image with: `docker build -t some-image-name:tag .` (the dot `.` means the root folder of your project)
3. run docker container with: `docker run --name some-container-name -p local_port:3000 -d some-image-name:tag`

### TypeORM Gotcha

Cuando se usa `distinct` en una query, se debe seleccionar la entidad completa.

```typescript
.distinct(true)
.select("orden")
```

Te explico por qué funcionó esta solución analizando los problemas clave y sus soluciones:

1. **El Problema de Registros Duplicados**

```typescript
.distinct(true)
.select("orden")  // Selecciona solo la entidad orden
```

- Cuando haces múltiples LEFT JOINs (especialmente con relaciones uno-a-muchos como `orden.items`), puedes obtener registros duplicados de la entidad principal
- Por ejemplo, si una orden tiene 3 items, el JOIN retornaría 3 filas para esa única orden
- `distinct(true)` asegura que solo obtengamos órdenes únicas
- `select("orden")` enfoca la selección inicial solo en la entidad orden antes de unir datos relacionados

2. **El Problema de la Paginación**

```typescript
// Obtener el conteo total usando una subconsulta para asegurar un conteo preciso con distinct
const total = await query.getCount();

// Obtener resultados paginados
const ordenes = await query
  .orderBy("orden.fechaCreado", "DESC")
  .skip((parseInt(page as string) - 1) * parseInt(limit as string))
  .take(parseInt(limit as string))
  .getMany();
```

- Sin `distinct`, la paginación trabajaría sobre las filas duplicadas
- Por ejemplo, si quisieras 10 órdenes pero cada orden tiene 2 items, podrías obtener solo 5 órdenes únicas porque cada orden aparece dos veces
- El `getCount()` ahora cuenta correctamente las órdenes únicas
- La paginación (`skip`/`take`) ahora funciona sobre órdenes únicas en lugar de filas duplicadas

3. **La Estructura de JOIN**

```typescript
.leftJoinAndSelect("orden.sucursal", "sucursal")
.leftJoinAndSelect("orden.vendedor", "vendedor")
.leftJoinAndSelect("orden.cliente", "cliente")
// ... más joins ...
```

- Se mantienen los LEFT JOINs para obtener todos los datos relacionados
- La combinación de `distinct` y `select("orden")` asegura que obtengamos objetos de orden completos con sus relaciones
- Sin estos, podrías obtener datos parciales u órdenes duplicadas

Piénsalo así:

- Sin la corrección: Si la Orden #1 tiene 3 items, y pides 10 órdenes, podrías obtener menos órdenes porque la Orden #1 cuenta como 3 filas
- Con la corrección: La Orden #1 cuenta como 1 fila (a pesar de tener 3 items), así que obtienes el número correcto de órdenes únicas

Este es un problema común en SQL cuando se trabaja con relaciones uno-a-muchos y paginación. La solución asegura que estés paginando basado en órdenes únicas mientras aún obtienes todos sus datos relacionados.
