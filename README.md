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
- **Un perfil por persona con PIN** — en la pantalla de entrada eliges tu
  nombre (Vale o Jose) y pones tu PIN; cada quien tiene su presupuesto
  100% separado en la misma app, sin usar correos ni contraseñas.

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
7. En **Authentication** → **Providers** → **Email**, confirma que
   **"Confirm email"** esté **desactivado** — la app no usa correos
   reales, así que no hay nada que confirmar. (El "Minimum password
   length" puedes dejarlo en su valor por defecto, 6 — el PIN de la app
   es de 6 dígitos justo por eso.)

## Paso 2 — Probar en tu computadora (opcional, puedes saltar al Paso 3)

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local y pega tu Project URL y anon key del Paso 1
npm run dev
```

Abre `http://localhost:3000`, elige tu perfil ("Vale"), pon el PIN que
quieras usar (la primera vez que lo escribes, ese PIN queda guardado como
el tuyo), y haz clic en **"Load starter template"**. La app está en
inglés — estas instrucciones están en español solo para guiarte a ti.

## Paso 3 — Desplegar en Vercel (hosting)

1. Ve a **[vercel.com](https://vercel.com)** y crea una cuenta gratis
   (lo más fácil: **Continue with GitHub**, usando la misma cuenta de
   GitHub donde vive este repositorio).
2. Clic en **Add New** → **Project**, elige este repositorio (`Bud`) e
   impórtalo. Si el nombre que le pongas al proyecto no puede llevar
   mayúsculas ni espacios, usa algo como `bud` o `bud-presupuesto`.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL del Paso 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu publishable/anon key del Paso 1
4. Clic en **Deploy**. En 1-2 minutos tendrás una URL como
   `https://tu-proyecto.vercel.app`.

¡Listo! Entra a tu URL de Vercel desde el celular o la computadora, elige
tu perfil, y ya puedes usar la app desde cualquier lugar.

## Paso 4 — Cargar tu presupuesto

1. La primera vez que entres, elige tu perfil ("Vale"), pon el PIN que
   quieras usar de ahora en adelante, y verás la pantalla de bienvenida —
   haz clic en **"Load starter template"**. Esto crea las categorías,
   subcategorías, cuentas y la deuda "Hermana" con los montos que ya
   definiste (rent $1,130, car insurance $137.94, etc.).
2. Tu **préstamo del carro (car loan)** no se precarga — necesita el saldo
   real y la tasa de interés, que solo tú tienes. Ve a **Debts** → **"+ New
   debt"** y captúralo con tu saldo actual, tasa anual, y tu pago mensual
   ($700 o el que uses); la app te muestra el saldo restante y una fecha
   estimada de cuándo terminas de pagarlo, que se actualiza si subes o
   bajas la cuota.
3. *(Opcional, solo para tu cuenta, no la de Jose)* — si quieres que la
   app arranque reflejando tus saldos reales y tu primer pago ya recibido,
   ve a Supabase → **SQL Editor**, abre
   [`supabase/seed_my_real_data.sql`](./supabase/seed_my_real_data.sql), y
   dale **Run** tal cual está. Esto pone tu Chase Checking en $789.04, tu
   Chase Savings en $625, y registra tu pago del 4 de septiembre de
   $1,139.92.
4. Ve a **Categories** para ajustar cualquier monto o agregar lo que falte
   (por ejemplo, cuando confirmes el monto real de electricidad/wifi/agua).
   Todo lo que agregues o edites aquí — una categoría nueva, una
   subcategoría nueva, un monto — queda guardado para siempre: se aplica
   automáticamente a este mes y a todos los meses futuros, no hay que
   repetirlo cada mes.

## Agregar el perfil de Jose

Cada quien elige su nombre y su propio PIN en la pantalla de entrada, así
que sus datos quedan 100% separados de los tuyos automáticamente. Pasos:

1. Pídele a Jose que entre a la misma URL de Vercel, elija **"Jose"** en
   la pantalla de entrada, y ponga el PIN que quiera usar de ahora en
   adelante (queda guardado como suyo desde la primera vez que lo escribe).
   Va a ver la pantalla de bienvenida ("Load starter template") — **que no
   le dé clic todavía**.
2. Ve a Supabase → **SQL Editor**, abre
   [`supabase/seed_jose_budget.sql`](./supabase/seed_jose_budget.sql), y
   dale **Run** tal cual está (no hay que editar ningún correo — su perfil
   usa una dirección interna fija, `jose@bud.internal`).
3. Esto le crea la misma estructura de categorías que la tuya (Home,
   Transportation, Daily Living, Personal, Savings/Investing, Travel,
   Debt, Buffer) pero **en ceros**, para que él las llene con sus propios
   montos desde "Categories" — excepto lo que ya nos diste con números
   reales:
   - Sus cuentas: **Arvest** (checking), **Ally** (savings), **2 tarjetas
     Capital One** (con el saldo que debe en cada una — nombres genéricos
     "Capital One Card 1/2" para que él las renombre desde Categories →
     Accounts), **American Express** ($575.73), y **Robinhood**.
   - Su deuda de **Student loans** ($25,950.39, pago mensual $155.19) —
     ya aparece en Debts con su saldo y cuota; puede agregar la tasa de
     interés real y a quién le debe (el servicer) desde "Edit details" en
     esa misma pantalla, ya que no la teníamos.
   - Su último pago (~$1,210 el 31 de agosto, quincenal) — está registrado
     como aproximado; que lo corrija desde Income si no es el monto exacto.
4. Si por accidente ya le dio clic a "Load starter template" antes del
   paso 2, no pasa nada grave, pero verías categorías duplicadas — en ese
   caso avísame y las limpiamos desde el SQL Editor antes de seguir.

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
- `supabase/seed_jose_budget.sql` — opcional, solo para la cuenta de Jose:
  crea su misma estructura de categorías en ceros, más sus cuentas y
  deudas reales.
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
