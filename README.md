# AGENTE-TUTOR-IA

Enlace directo: https://tutor-ia-landivar.vercel.app/

## Descripción del proyecto

**AGENTE-TUTOR-IA** es una aplicación web desarrollada con **Next.js**, **React**, **TypeScript**, **Supabase** y **OpenAI**. Su propósito es ofrecer un tutor académico inteligente orientado al curso de **Pensamiento Computacional**, permitiendo que los usuarios interactúen mediante un chat, reciban apoyo guiado y mantengan un historial de conversaciones.

El sistema incorpora autenticación de usuarios, almacenamiento de perfiles, gestión de sesiones de chat, persistencia de mensajes y una integración con OpenAI para generar respuestas académicas. Además, cuenta con una estructura modular que separa la interfaz, la lógica de negocio, la conexión con la base de datos y los scripts auxiliares del proyecto.

---

## Tecnologías utilizadas

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Supabase**
- **OpenAI**
- **React Markdown**
- **dotenv**
- **CSS Modules**
- **TailwindCSS / PostCSS** (configurados como dependencias del proyecto)

---

## Instalación

### Requisitos previos
Se recomienda tener instalado:

- **Node.js**
- **npm**

### Comandos de instalación

En **Windows** y **Mac**, los comandos utilizados para instalar dependencias son los mismos:

```bash
npm install
npm install dotenv
npm install react-markdown
```

> Si el proyecto ya contiene `package.json` y `package-lock.json`, normalmente `npm install` instala todas las dependencias necesarias.

---

## Validación del dataset

Antes de ejecutar procesos relacionados con fine-tuning, el proyecto incluye scripts para validar que el dataset tenga el formato correcto y que cada línea sea válida.

### ¿Para qué sirve esta validación?

Esta validación permite comprobar que:

- todas las líneas del archivo sigan el formato esperado,
- no existan errores de estructura en el dataset,
- los archivos `.jsonl` sean válidos antes de utilizarlos.

### Comandos para Mac 

Hay que tener en cuenta que se debe estar posicionado en la carpeta de `/scripts`

```bash
node validate-dataset.js
node create-finetune.js
node check-finetune.js
```

### Comandos para Windows

```bash
node .\validate-dataset.js
node .\create-finetune.js
node .\check-finetune.js
```

---

## Ejecución del proyecto

Para iniciar el proyecto en modo desarrollo:

```bash
npm run dev
```

Luego, la aplicación se puede abrir en el navegador desde:

```bash
http://localhost:3000
```

---

## Variables de entorno

El proyecto utiliza un archivo `.env.local` para almacenar variables necesarias para la conexión con servicios externos.

Ejemplo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kzdpakgohntjfymewomh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4.1-mini
FINE_TUNED_MODEL=ft:modelo-personalizado
```

### ¿Para qué sirve cada variable?

- **`NEXT_PUBLIC_SUPABASE_URL`**: indica a la aplicación cuál es el proyecto de Supabase al que debe conectarse.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: permite que el frontend pueda comunicarse con Supabase con permisos públicos controlados.
- **`OPENAI_API_KEY`**: permite conectarse a OpenAI para generar respuestas del tutor.
- **`OPENAI_MODEL`**: define el modelo base que utilizará OpenAI.
- **`FINE_TUNED_MODEL`**: permite usar un modelo ajustado si se cuenta con uno.

---

## Estructura del proyecto

```bash
AGENTE-TUTOR-IA/
├── .next/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
│   │   └── speech/
│   │       └── route.ts
│   ├── data/
│   │   ├── pensamiento_computacional_train.jsonl
│   │   └── pensamiento_computacional_valid.jsonl
│   ├── login/
│   │   ├── Login.module.css
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── Dashboard.module.css
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── layout/
│       ├── Header.module.css
│       ├── Header.tsx
│       ├── MainLayout.module.css
│       ├── MainLayout.tsx
│       ├── Sidebar.module.css
│       └── Sidebar.tsx
├── lib/
│   ├── ai.ts
│   ├── auth.ts
│   └── supabase.ts
├── node_modules/
├── public/
│   ├── blackURLlogo.png
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.png
│   ├── next.svg
│   ├── vercel.svg
│   ├── whiteURLlogo.png
│   └── window.svg
├── scripts/
│   ├── check-finetune.js
│   ├── create-finetune.js
│   └── validate-dataset.js
├── .env.local
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

## Explicación breve de cada carpeta y archivo

### `.next/`
Carpeta generada automáticamente por Next.js. Contiene archivos temporales de compilación y no se edita manualmente.

---

### `app/`
Contiene las páginas principales, las rutas API y estilos globales del proyecto.

#### `app/api/`
Incluye endpoints backend dentro de Next.js.

- **`app/api/chat/route.ts`**: procesa las solicitudes del chat, valida el contexto académico y consulta OpenAI.
- **`app/api/speech/route.ts`**: maneja la lógica relacionada con funciones de voz.

#### `app/data/`
Almacena datasets utilizados para entrenamiento o validación del tutor.

- **`pensamiento_computacional_train.jsonl`**: ejemplos de entrenamiento.
- **`pensamiento_computacional_valid.jsonl`**: ejemplos de validación.

#### `app/login/`
Contiene la pantalla de inicio de sesión.

- **`Login.module.css`**: estilos del login.
- **`page.tsx`**: formulario de inicio de sesión y autenticación con Supabase.

#### `app/register/`
Contiene la pantalla de registro.

- **`page.tsx`**: formulario de creación de cuenta, validación e inserción de perfil en Supabase.

#### Archivos principales dentro de `app/`
- **`Dashboard.module.css`**: estilos principales del panel/chat.
- **`favicon.ico`**: ícono del proyecto.
- **`globals.css`**: estilos globales.
- **`layout.tsx`**: layout raíz de la aplicación.
- **`page.tsx`**: vista principal del sistema, donde se encuentra el chat del tutor.

---

### `components/`
Contiene componentes reutilizables de la interfaz.

#### `components/layout/`
Incluye los componentes estructurales principales.

- **`Header.module.css`**: estilos del encabezado.
- **`Header.tsx`**: encabezado principal con información del usuario y cierre de sesión.
- **`MainLayout.module.css`**: estilos del layout general.
- **`MainLayout.tsx`**: estructura principal que organiza header, sidebar y contenido.
- **`Sidebar.module.css`**: estilos del menú lateral.
- **`Sidebar.tsx`**: barra lateral con historial de chats y creación de nuevas conversaciones.

---

### `lib/`
Contiene lógica reutilizable del sistema.

- **`ai.ts`**: configuración base para la integración con OpenAI.
- **`auth.ts`**: validaciones de correo institucional, carnet y roles.
- **`supabase.ts`**: crea y exporta el cliente de Supabase para toda la aplicación.

---

### `public/`
Contiene archivos públicos estáticos como logos, íconos e imágenes.

- **`blackURLlogo.png`**: logo en negro.
- **`whiteURLlogo.png`**: logo en blanco.
- **`logo.png`**: logo principal utilizado en la interfaz.
- **`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`**: recursos gráficos auxiliares.

---

### `scripts/`
Contiene scripts de apoyo para validar datasets y trabajar con fine-tuning.

- **`check-finetune.js`**: revisa el estado o la configuración relacionada con fine-tuning.
- **`create-finetune.js`**: crea o inicia un proceso de fine-tuning.
- **`validate-dataset.js`**: valida que el dataset tenga el formato correcto y que sus líneas sean válidas.

---

### Archivos raíz

- **`.env.local`**: variables de entorno del proyecto.
- **`.gitignore`**: archivos y carpetas ignorados por Git.
- **`eslint.config.mjs`**: configuración de ESLint.
- **`next-env.d.ts`**: archivo generado por Next.js para TypeScript.
- **`next.config.ts`**: configuración general de Next.js.
- **`package-lock.json`**: versiones exactas de dependencias instaladas.
- **`package.json`**: dependencias, scripts y configuración básica del proyecto.
- **`postcss.config.mjs`**: configuración de PostCSS.
- **`README.md`**: documentación del proyecto.
- **`tsconfig.json`**: configuración de TypeScript.

---

## Conexión con Supabase

La conexión con Supabase se define en:

```ts
lib/supabase.ts
```

Código base:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### ¿Cómo funciona esta conexión?

1. La aplicación lee la URL del proyecto desde `NEXT_PUBLIC_SUPABASE_URL`.
2. Luego lee la llave pública desde `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Con ambos valores se crea un cliente de Supabase mediante `createClient(...)`.
4. Ese cliente se reutiliza en login, register, chat, sidebar y header.

### ¿Dónde se usa?

- **`app/login/page.tsx`**: para iniciar sesión.
- **`app/register/page.tsx`**: para crear usuarios y perfiles.
- **`app/page.tsx`**: para leer y guardar sesiones y mensajes del chat.
- **`components/layout/Sidebar.tsx`**: para listar, crear y ocultar conversaciones.
- **`components/layout/Header.tsx`**: para cerrar sesión.

---

## Configuración realizada en Supabase

Para que el proyecto funcione correctamente, del lado de Supabase se requiere:

### 1. Proyecto creado
Se debe crear un proyecto en Supabase para obtener:
- Project URL
- Publishable key

### 2. Authentication habilitado
Se usa autenticación por correo y contraseña desde:

- **Authentication > Users**
- **Authentication > Sign In / Providers**

### ¿Cómo se manejan las credenciales en el inicio de sesión?

El proyecto no guarda la contraseña directamente dentro del código, ni en tablas propias, ni en `localStorage`.

El proceso funciona de la siguiente manera:

1. En el registro, el usuario ingresa su correo institucional y contraseña.
2. Esos datos se envían a Supabase mediante `supabase.auth.signUp(...)`.
3. En el inicio de sesión, el usuario vuelve a ingresar su correo y contraseña.
4. Esos datos se validan con `supabase.auth.signInWithPassword(...)`.
5. Supabase Auth es el servicio encargado de gestionar internamente la autenticación.

Esto significa que la contraseña no queda almacenada manualmente dentro de la aplicación.

Lo que sí se guarda en `localStorage` es información básica del usuario para mantener la sesión visual dentro de la interfaz, por ejemplo:

- `email`
- `name` o carnet
- `role`

Estos datos permiten mostrar información del usuario en pantalla y facilitar ciertas funciones dentro de la aplicación, pero no incluyen la contraseña.

### 3. Tablas necesarias
El sistema utiliza al menos estas tablas:

#### `profiles`
Guarda información adicional del usuario:
- `id`
- `email`
- `carnet`
- `role`

#### `chat_sessions`
Guarda cada conversación:
- `id`
- `user_email`
- `title`
- `created_at`
- `is_hidden`

#### `chat_messages`
Guarda los mensajes de cada conversación:
- `id`
- `session_id`
- `role`
- `content`
- `created_at`

### 4. Policies / seguridad
Si Supabase tiene activado **Row Level Security (RLS)**, deben configurarse políticas para permitir leer, insertar y actualizar registros necesarios para cada usuario.

---

## Flujo general del sistema

1. El usuario se registra con correo institucional, carnet y contraseña.
2. Supabase crea el usuario en Authentication.
3. El proyecto inserta un perfil en la tabla `profiles`.
4. El usuario inicia sesión.
5. Se carga la información del perfil.
6. Se crea o recupera una sesión de chat.
7. Los mensajes se almacenan en `chat_messages`.
8. La respuesta del tutor se genera mediante OpenAI.
9. El historial de conversaciones se muestra en el sidebar.

---

## Notas importantes

- La **publishable key** de Supabase puede exponerse en el frontend porque sus permisos dependen de las políticas configuradas.
- La **secret key** no debe colocarse en el frontend.
- El historial de chats no se elimina físicamente al ocultarse; únicamente se marca con `is_hidden = true`.

---

## Desarrolladores

- Katherine Mayen - 1129222
- Diego Rivas - 1084522
- Diego Azurdia - 1010821
- Javier Godínez - 1179222
