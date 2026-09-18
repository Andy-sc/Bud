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
- **Un perfil por persona con PIN** — en la pantalla de entrada cada quien
  crea su propio perfil (nombre + PIN, sin correos ni contraseñas) con
  "+ Add profile" la primera vez, y después solo elige su nombre de la
  lista; cada quien tiene su presupuesto 100% separado en la misma app.

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

Abre `http://localhost:3000`, dale clic a **"+ Add profile"**, escribe tu
nombre ("Vale") y el PIN que quieras usar de ahora en adelante, y haz clic
en **"Load starter template"**. La app está en inglés — estas
instrucciones están en español solo para guiarte a ti.

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

1. La primera vez que entres, dale clic a **"+ Add profile"**, escribe tu
   nombre ("Vale") y el PIN que quieras usar de ahora en adelante, y
   verás la pantalla de bienvenida — haz clic en **"Load starter
   template"**. Esto crea las categorías,
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

Cada quien crea su propio nombre y PIN en la pantalla de entrada con
"+ Add profile", así que sus datos quedan 100% separados de los tuyos
automáticamente. Pasos:

1. Pídele a Jose que entre a la misma URL de Vercel, dele clic a **"+ Add
   profile"**, escriba **"Jose"** como nombre, y ponga el PIN que quiera
   usar de ahora en adelante. Va a ver la pantalla de bienvenida ("Load
   starter template") — **que no le dé clic todavía**.
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

Si más adelante quieres agregar a alguien más, no necesitas tocar nada
de código: esa persona solo entra a la misma URL y crea su propio perfil
con "+ Add profile" — queda con su propio presupuesto en blanco,
completamente separado del tuyo y del de Jose.

---

## Notificaciones y transferencias recurrentes (opcional)

Esta sección activa dos cosas a la vez porque comparten la misma
configuración (`SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET`):

**Notificaciones** — cada quien puede prenderlas desde
**Settings → Notifications** y elegir cuáles quiere recibir — todas
llegan como notificación push al navegador, sin apps externas, sin
correo, gratis:

- **Upcoming bills** — el día antes de que venza una factura Fixed (la
  que le pusiste día en el Calendario).
- **Next income** — el día antes de que caiga un ingreso recurrente.
- **Low balance warning** — cuando el balance across accounts se pone
  negativo.
- **Category near its limit** — cuando una categoría llega al 80% de lo
  planeado ese mes.
- **Daily balance** — un resumen diario del balance across accounts.
- **Goal reached** — cuando terminas de llenar una de tus metas.

**Transferencias recurrentes** — en Settings → Accounts, "+ Add transfer
between accounts" con "Repeats automatically" activado (ej. $25 de
Checking a Savings cada lunes). Una vez configurada, un cron diario crea
la transferencia real ese día sola — sin que tengas que volver a
anotarla — y ya sale también en el Calendario, tanto lo ya pasado como
lo esperado hacia adelante.

Sin esta configuración en Vercel, las transferencias recurrentes se
pueden crear pero **no se van a materializar solas** — solo funciona el
registro manual.

También desde **Settings → Profile** cada quien puede cambiar su nombre
(el que aparece en la pantalla de login) y su PIN, sin tocar código.

1. Ve a Supabase → **SQL Editor** y vuelve a correr `supabase/schema.sql`
   completo (crea las tablas nuevas que le faltan: `push_subscriptions`,
   `notification_preferences`, `category_limit_alerts`, `transfers`).
2. Ve a Supabase → **Project Settings** → **API** → copia la
   **service_role key** (la secreta, no la publishable — nunca la
   compartas ni la pongas en el código, solo en Vercel como variable de
   entorno).
3. En Vercel → tu proyecto → **Settings** → **Environment Variables**,
   agrega estas 4:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEUuc_vJxzmWWW3UfNgZ12BZTG3s-vhyWQ833VMMFDxO4jlZHJPDmBB-FpxI-dGle9IiSYM0XSDPQEVpTXQRZyA
   VAPID_PRIVATE_KEY=qE7kcOklA0n3KO8YVyi72dCKhptTHBioYGUX8IO3nlo
   SUPABASE_SERVICE_ROLE_KEY=(la que copiaste en el paso 2)
   CRON_SECRET=de627b2832b12a99fc71b4f13ba60c887d66f95033bff16a
   ```
   Las dos claves VAPID y el CRON_SECRET ya están generadas y listas para
   pegar — son únicas para tu proyecto, no hay que crearlas en ningún
   lado externo.
4. Dale **Redeploy**. Vercel detecta el archivo `vercel.json` del repo
   solo y activa el cron (le manda una revisión diaria a la 1 de la
   tarde UTC — ajústalo en `vercel.json` si quieres otra hora).
5. Ya cada quien puede entrar a **Settings → Notifications**, darle
   **"Turn on notifications"** (el navegador va a pedir permiso), y
   marcar cuáles de la lista quiere recibir.

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
