# Calculadora de Parámetros Z

Herramienta académica interactiva para caracterizar redes de dos puertos mediante
parámetros Z (impedancia). 100% client-side — sin backend, sin build step. Funciona
en PC y en Android directamente desde el navegador, incluso vía GitHub Pages.

## Qué hace

- **Calculadora**: a partir de la matriz `[Z]` (Z11, Z12, Z21, Z22) y las corrientes
  `I1`, `I2`, calcula `V1`, `V2`, `Zin`, `Zout`, `Av`, `Ai`, potencias (`P1`, `P2`,
  `Pdis`) y eficiencia `η`.
- **Validación en tiempo real** de cada campo, con retroalimentación visual.
- **Presets**: BJT pequeña señal, filtro pasa-bajos, amplificador inversor, más
  guardado de presets/proyectos personalizados en `localStorage`.
- **Matriz [Z] con mapa de calor** y **diagrama esquemático SVG animado** (flujo de
  corriente representado con color, grosor y velocidad de animación).
- **5 gráficos** (Chart.js): barras, histórico de línea, pastel de potencias,
  radar de magnitudes y scatter V1 vs V2 — con zoom/pan y descarga en PNG.
- **Gamificación**: quiz "adivina el parámetro" en 3 dificultades, sistema de
  puntos, 8 medallas/logros y tabla de posiciones local.
- **Exportación**: CSV, JSON, PDF, enlace compartible (parámetros en la URL) y
  código QR del enlace.

## Estructura

```
parametros-z-calc/
├─ index.html
├─ manifest.json
├─ assets/
│  ├─ css/main.css
│  └─ js/
│     ├─ calculator.js      # Lógica de cálculo + presets
│     ├─ storage.js         # Persistencia en localStorage
│     ├─ ui.js               # Renderizado de DOM (resultados, heatmap, SVG…)
│     ├─ charts.js           # Gráficos Chart.js
│     ├─ gamification.js     # Quiz, logros, puntos
│     ├─ exportModule.js     # CSV/JSON/PDF/QR/URL compartible
│     ├─ utils.js
│     └─ main.js             # Orquestador / wiring de eventos
└─ .github/workflows/deploy.yml
```

## Uso local

Al ser un sitio estático puedes abrirlo directamente, pero como usa
`<script type="module">`, algunos navegadores bloquean módulos ES cargados desde
`file://`. Lo más simple es levantar un servidor local:

```bash
# Con Python
python -m http.server 8080

# o con Node
npx serve .
```

Luego abre `http://localhost:8080`.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube esta carpeta (`parametros-z-calc/`) como
   raíz del repo:
   ```bash
   git init
   git add .
   git commit -m "Calculadora de Parámetros Z"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   El workflow en `.github/workflows/deploy.yml` ya está listo — se ejecuta solo
   en cada push a `main` y publica el sitio.
3. Tu calculadora quedará disponible en
   `https://<tu-usuario>.github.io/<tu-repo>/` — funciona igual en PC y en
   Android (Chrome/Firefox) abriendo esa URL desde el navegador. En Android
   puedes además "Agregar a pantalla de inicio" para usarla como app.

## Compartir un cálculo exacto

El botón **Copiar enlace** genera una URL con los parámetros en la query string
(`?Z11=...&Z12=...&I1=...`). Cualquiera que la abra ve el mismo cálculo ya cargado,
también sirve para el código QR.

## Notas

- Todo el estado (proyectos, puntos, logros, tema) se guarda en `localStorage` del
  navegador — es local a cada dispositivo, no se sincroniza entre PC y Android.
- Las librerías (Chart.js, html2pdf.js, qrcode) se cargan desde CDN, por lo que se
  necesita conexión a internet la primera vez; el resto de la app es 100% propia.
