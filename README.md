# Bud — Presupuesto personal

App de presupuesto mensual construida sobre la estructura de tu Excel
(`My_Budget.xlsx`): mismas categorías, subcategorías, lógica Fixed/Variable y
seguimiento de deudas — pero en la nube, accesible desde cualquier
dispositivo, con gráficos y sin tener que tocar fórmulas nunca más.

**La app (todo lo que ves en pantalla) está en inglés.** Este README está en
español solo porque así hablamos — es la guía para ti, no parte de la app.

## Qué incluye

- **Resumen anual** (Income, Total Expenses, Balance) arriba de todo.
- **Vista mensual** con navegación ← → entre meses, Planned vs Actual por
  categoría y barra de progreso (verde si vas bien, amarillo cerca del
  límite, rojo si te pasaste).
- **Registro rápido de gastos** (Variable): fecha, monto, categoría,
  subcategoría, cuenta, nota.
- **Registro de ingresos**: fecha, monto, fuente, cuenta.
- **Deudas**: saldo actual por deuda, abonos que reducen el saldo
  automáticamente, y una fecha estimada de cuándo terminas de pagar según tu
  cuota mensual (con interés incluido) — si subes el pago, la fecha se
  actualiza sola.
- **Gráficos**: Planned vs Actual por categoría, y gasto por cuenta (Chase
  Checking, Chase Savings, Chase Credit, Vanguard, Venmo).
- **Administrar categorías**: agrega, edita o elimina categorías,
  subcategorías y cuentas sin tocar código.
- **Un login por persona** (magic link, sin contraseña) — tú y tu novio
  pueden tener cada uno su propio presupuesto separado en la misma app.

Construida con Next.js (React) + Supabase (base de datos y autenticación) +
Vercel (hosting). Ambos servicios tienen un plan gratuito que no requiere
tarjeta de crédito ni te cobra automáticamente — ver "Sobre los planes
gratuitos" más abajo.

---

## Paso 1 — Crear el proyecto en Supabase (base de datos)

1. Ve a **[supabase.com](https://supabase.com)** y crea una cuenta gratis
   (puedes usar tu cuenta de GitHub o Google, o tu correo).
2. Clic en **New Project**.
   - Dale un nombre, por ejemplo `bud`.
   - Elige una contraseña para la base de datos (guárdala, no la necesitarás
     seguido pero es bueno tenerla).
   - Elige la región más cercana a ti.
   - Plan: **Free**.
3. Espera ~2 minutos a que el proyecto termine de crearse.
4. En el menú lateral, ve a **SQL Editor** → **New query**.
5. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este
   repositorio, copia **todo** su contenido, pégalo en el editor y dale
   **Run**. Esto crea todas las tablas, la seguridad (cada quien solo ve sus
   propios datos) y la plantilla inicial de categorías.
6. Ve a **Project Settings** (ícono de engranaje) → **API**. Ahí vas a ver:
   - **Project URL** → algo como `https://xxxxx.supabase.co`
   - **anon public key** → una clave larga
   Guarda ambos valores, los necesitas en el Paso 3.
7. En **Authentication** → **Sign In / Providers**, confirma que **Email**
   esté activado (lo está por defecto). En **Authentication** → **URL
   Configuration**, dejaremos la "Site URL" configurada en el Paso 3 una vez
   tengas tu dominio de Vercel.

## Paso 2 — Probar en tu computadora (opcional, puedes saltar al Paso 3)

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local y pega tu Project URL y anon key del Paso 1
npm run dev
```

Abre `http://localhost:3000`, entra con tu correo, revisa el enlace mágico
que te llega, y haz clic en **"Load starter template"** la primera vez. La
app está en inglés — estas instrucciones están en español solo para
guiarte a ti.

## Paso 3 — Desplegar en Vercel (hosting)

1. Ve a **[vercel.com](https://vercel.com)** y crea una cuenta gratis
   (lo más fácil: **Continue with GitHub**, usando la misma cuenta de
   GitHub donde vive este repositorio).
2. Clic en **Add New** → **Project**, elige este repositorio (`bud`) e
   impórtalo.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL del Paso 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon public key del Paso 1
   - `NEXT_PUBLIC_SITE_URL` = (lo agregas después de desplegar, ver paso 4)
4. Clic en **Deploy**. En 1-2 minutos tendrás una URL como
   `https://bud-tuusuario.vercel.app`.
5. Copia esa URL y:
   - En Vercel → **Settings** → **Environment Variables**, edita
     `NEXT_PUBLIC_SITE_URL` con esa URL exacta (sin `/` al final) y vuelve a
     desplegar (**Deployments** → los tres puntos del último deploy →
     **Redeploy**).
   - En Supabase → **Authentication** → **URL Configuration**, pon esa misma
     URL en **Site URL**, y agrégala también en **Redirect URLs** seguida de
     `/auth/callback` (ej. `https://bud-tuusuario.vercel.app/auth/callback`).

¡Listo! Entra a tu URL de Vercel desde el celular o la computadora, con tu
correo, y ya puedes usar la app desde cualquier lugar.

## Paso 4 — Cargar tu presupuesto

1. La primera vez que entres, verás la pantalla de bienvenida — haz clic en
   **"Load starter template"**. Esto crea las categorías, subcategorías,
   cuentas y la deuda "Hermana" con los montos que ya definiste (rent
   $1,130, car insurance $137.94, etc.).
2. Tu **préstamo del carro (car loan)** no se precarga — necesita el saldo
   real y la tasa de interés, que solo tú tienes. Ve a **Debts** → **"+ New
   debt"** y captúralo con tu saldo actual, tasa anual, y tu pago mensual
   ($700 o el que uses); la app te muestra el saldo restante y una fecha
   estimada de cuándo terminas de pagarlo, que se actualiza si subes o
   bajas la cuota.
3. *(Opcional, solo para tu cuenta, no la de tu novio)* — si quieres que la
   app arranque reflejando tus saldos reales y tu primer pago ya recibido,
   ve a Supabase → **SQL Editor**, abre
   [`supabase/seed_my_real_data.sql`](./supabase/seed_my_real_data.sql),
   cópialo, pégalo y dale **Run**. Esto pone tu Chase Checking en $789.04,
   tu Chase Savings en $625, y registra tu pago del 4 de septiembre de
   $1,139.92.
4. Ve a **Categories** para ajustar cualquier monto o agregar lo que falte
   (por ejemplo, cuando confirmes el monto real de electricidad/wifi/agua).
   Todo lo que agregues o edites aquí — una categoría nueva, una
   subcategoría nueva, un monto — queda guardado para siempre: se aplica
   automáticamente a este mes y a todos los meses futuros, no hay que
   repetirlo cada mes.

## Agregar el perfil de tu novio

Como cada persona tiene su propio login (magic link con su correo), no
necesitas crear nada especial: solo pídele que entre a la misma URL de
Vercel con **su propio correo**. Supabase creará su cuenta automáticamente,
verá la misma pantalla de bienvenida, y al hacer clic en "Load starter
template" obtendrá exactamente la misma estructura de categorías que tú
(basada en la tuya), completamente separada de tus datos — él la ajusta a
sus números reales desde "Categories".

---

## Sobre los planes gratuitos (para que no te lleves sorpresas)

- **Supabase Free**: 500 MB de base de datos y 5 GB de transferencia al
  mes — muchísimo más de lo que dos personas registrando gastos personales
  usarán jamás. No pide tarjeta de crédito y nunca cobra automáticamente;
  solo subirías de plan si tú decides hacerlo manualmente desde el panel.
  Único detalle: si el proyecto pasa **7 días sin actividad**, se pausa
  solo — se reactiva con un clic la próxima vez que entres, sin perder
  datos.
- **Vercel Hobby (gratis)**: gratis indefinidamente para proyectos
  personales, sin tarjeta de crédito, sin cobro automático.

## Estructura del proyecto

- `supabase/schema.sql` — todas las tablas, seguridad por usuario (RLS) y la
  función que carga la plantilla inicial de categorías.
- `supabase/seed_my_real_data.sql` — opcional, solo para tu cuenta: tus
  saldos y primer pago reales.
- `src/app/` — páginas (Next.js App Router).
- `src/lib/budget.ts` — toda la lógica de Planned vs Actual, saldos de
  deuda y resumen anual.
- `src/components/` — tarjetas, formularios, gráficos.

## Desarrollo local

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # build de producción
npm run lint      # ESLint
```
