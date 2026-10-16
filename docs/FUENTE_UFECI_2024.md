# Fuente de datos: UFECI, Informe 2024

**Documento:** *UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI*, edición de junio de 2025 (31 páginas).
**Cita visible en el sitio:** «Fuente: UFECI, Informe 2024 - Casos y modalidades reportadas a UFECI, edición de junio de 2025.»
**Datos estructurados:** `src/datos/ufeci2024.js` (fuente única; la API `/api/estadisticas` y todos los gráficos la consumen).

## 1. Qué miden las cifras

Reportes recibidos por UFECI (principalmente por su casilla institucional de correo) entre el 1 de enero y el 31 de diciembre de 2024. **No** son delitos ocurridos, víctimas únicas, denuncias judiciales ni prevalencia. Hay subregistro y sesgo de canal. Los datos son de UFECI; el análisis y los gráficos son de OFCA y no fueron elaborados ni avalados por UFECI ni por el MPF.

## 2. Verificación previa: variables territoriales

Se leyó el texto completo, las tablas y los gráficos (incluida su rasterización página por página) y las imágenes embebidas.

| Pregunta | Resultado |
|---|---|
| ¿Hay cifras por provincia, departamento o localidad? | **No.** |
| ¿Hay mapas o menciones territoriales de los hechos? | **No.** La única mención geográfica es la dirección postal de la institución. |
| Período cubierto | Enero a diciembre de 2024 (serie anual 2021-2024 solo a nivel nacional). |
| Unidad | Reportes recibidos por UFECI. |

**Consecuencia:** no se muestran cifras, porcentajes, tasas, rankings ni mapas de calor por jurisdicción. El mapa solo permite navegar, y toda jurisdicción responde «El informe consultado no publica datos desagregados para esta jurisdicción». Tampoco se calculan tasas por habitante (no hay numerador territorial ni se verificó un denominador).

## 3. Variables incorporadas (todas nacionales)

| Variable | Páginas | Notas |
|---|---|---|
| Total 2024: 34.468 | 12 | |
| Categorías (6): Fraude en línea 21.729 (63,0 %), Usurpación de identidad 4.637 (13,5 %), Acceso ilegítimo 2.877 (8,3 %), Phishing 1.563 (4,5 %), Acoso 1.458 (4,2 %), Otros 2.204 (6,4 %) | 12 | Suman exactamente el total. |
| Serie mensual 2024 (total y por categoría) | 12 | Cada columna suma el total mensual. |
| Serie anual 2021-2024: 22.364; 32.395; 28.456; 34.468 | 9 | Variación 2024/2023 publicada: +21,1 %. |
| Referencias de 12 meses no calendario (abr. 2019-mar. 2020: 2.581; abr. 2020-mar. 2021: 14.583) | 8-9 | Se muestran aparte, no en la serie anual. |
| Comparación mensual 2023-2024 | 11 | Los valores de 2023 se leyeron del gráfico. |
| Modalidades de fraude, plataformas de acceso ilegítimo, medios de phishing, difusión de imágenes íntimas, estafas piramidales, alquileres temporarios | 13-26 | Cada una con su universo propio; los porcentajes se muestran tal como se publican. |
| Extorsión (774 reportes) y ransomware (casos con intervención de UFECI) | 25, 28-29 | Universo y unidad propios: **no se suman** a las categorías. |

Los números de página son los impresos en el informe (coinciden con los del PDF).

## 4. Discrepancias internas del informe (no corregidas)

| Tema | Páginas | Publicado | Calculado |
|---|---|---|---|
| Serie mensual 2023 (gráfico) vs. total anual 2023 | 9 y 11 | 28.456 | 28.795 (+339) |
| Estafas piramidales: texto vs. suma de los 12 meses del gráfico | 16 | 2.204 | 2.473 |
| Compra por internet: 56 % vs. 12.004 sobre 21.729 | 13 | 56 % | 55,2 % |
| Ransomware: «aumento del orden del 20 %» (21 → 26 casos) | 28 | 20 % | 23,8 % |

El tablero las informa en «Notas sobre la fuente» y no destaca las cifras dudosas.

## 5. Controles automáticos

`verificarIntegridad()` (se ejecuta en `npm test`) comprueba, entre otros: suma de categorías = total; cada serie mensual suma su total anual; cada columna mensual suma el total del mes; porcentajes publicados = cantidad/total redondeado a un decimal; variación interanual 21,1 %; mes pico = marzo (4.312); alquileres temporarios = 488 (51 % en el primer trimestre); imágenes íntimas = 340 (23,3 % del acoso); universo de WhatsApp 4.637 + 872 = 5.509; ransomware 67 casos acumulados.

## 6. Método de extracción

Texto extraído con `pdftotext`; los valores ambiguos (series mensuales de alquileres temporarios, difusión de imágenes íntimas y comparación 2023) se resolvieron rasterizando las páginas y leyendo los gráficos. Toda cifra que el informe no publica figura como `null`.

## 7. Geometrías del mapa

Natural Earth, «Admin 1 – States, Provinces» 1:10m (**dominio público**), proyección equirrectangular (paralelo estándar −40°), simplificación Douglas-Peucker de 0,02°. Se generan con `node scripts/generar-geometrias.mjs <geojson> public/data/argentina-jurisdicciones.json`. Códigos ISO 3166-2 (AR-A … AR-Z). **Limitaciones:** no reemplaza la cartografía oficial del Instituto Geográfico Nacional; no incluye las islas del Atlántico Sur ni la Antártida Argentina; CABA se complementa con una lupa porque mide pocos píxeles. El archivo de origen se obtuvo de https://github.com/nvkelso/natural-earth-vector (clonado en modo de solo lectura, fuera de este repositorio).

## 8. Cómo incorporar datos territoriales verificados

Ver `TERRITORIAL` y `validarTerritorial()` en `src/datos/ufeci2024.js`: cada jurisdicción exige fuente (organismo y título), período AAAA-MM, unidad, universo, cobertura y cantidades enteras por categoría. Se rechazan tasas, participaciones nacionales y rankings sin denominador verificado.
