// ORNAPLANT — Fuente única de datos de plantas
// PRODUCTION: replace with fetch() to API endpoint
// TODO: replace with API call → const plantas = await fetch('/api/plantas').then(r => r.json());

const WHATSAPP_NUMBER = '527351024413';

const plantas = [
  {
    id: 'monstera-deliciosa',
    nombre: 'Monstera',
    nombreCientifico: 'Monstera deliciosa',
    categoria: 'interior',
    descripcion: 'La Monstera deliciosa, conocida como "costilla de Adán", es una planta tropical de interior con características hojas perforadas que en la naturaleza le permiten resistir los vientos de la selva. Aporta un toque exótico y arquitectónico a cualquier espacio hogareño u oficina. Crece con facilidad en luz indirecta brillante y requiere riego moderado.',
    luz: 'luz indirecta',
    riego: 'medio',
    imagenes: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1612225330812-01a90c7e831e?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['popular', 'recomendada'],
    variaciones: ['chico', 'mediano', 'grande'],
    disponibilidad: 'disponible',
    cuidado: 'fácil',
    sucursal: 'ambas',
    mascotas: 'tóxica'
  },
  {
    id: 'pothos-dorado',
    nombre: 'Pothos Dorado',
    nombreCientifico: 'Epipremnum aureum',
    categoria: 'interior',
    descripcion: 'El Pothos dorado es una de las plantas de interior más resistentes y versátiles disponibles. Sus hojas verdes con manchas doradas cuelgan graciosamente y se adaptan a una gran variedad de condiciones de luz. Perfecta para principiantes o personas con poco tiempo para el cuidado. Tolera descuidos con el riego mejor que casi cualquier otra planta.',
    luz: 'luz indirecta',
    riego: 'bajo',
    imagenes: [
      'https://images.unsplash.com/photo-1572688484438-313a6e50c333?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['popular', 'bajo mantenimiento'],
    variaciones: ['chico', 'mediano', 'maceta 6 pulgadas'],
    disponibilidad: 'disponible',
    cuidado: 'fácil',
    sucursal: 'ambas',
    mascotas: 'tóxica'
  },
  {
    id: 'cactus-columnar',
    nombre: 'Cactus Columnar',
    nombreCientifico: 'Echinopsis pachanoi',
    categoria: 'suculenta',
    descripcion: 'Cactus columnar originario de los Andes con crecimiento erecto y porte imponente. Puede alcanzar varios metros de altura en condiciones ideales. Extremadamente resistente a la sequía y al calor del clima morelense. Ideal para jardines de bajo riego, patios o espacios exteriores soleados que requieran presencia visual sin mantenimiento constante.',
    luz: 'sol directo',
    riego: 'bajo',
    imagenes: [
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['bajo mantenimiento'],
    variaciones: ['mediano', 'grande'],
    disponibilidad: 'disponible',
    cuidado: 'fácil',
    sucursal: 'embarques',
    mascotas: 'no tóxica'
  },
  {
    id: 'helecho-boston',
    nombre: 'Helecho de Boston',
    nombreCientifico: 'Nephrolepis exaltata',
    categoria: 'interior',
    descripcion: 'Helecho exuberante con frondas arqueadas de color verde intenso que pueden alcanzar hasta 90 cm. Reconocido purificador de aire por la NASA, filtra formaldehído y xileno del ambiente interior. Ideal para colgar en maceteros donde sus hojas caigan libremente, o colocar sobre pedestales en espacios con buena humedad ambiental.',
    luz: 'luz indirecta',
    riego: 'alto',
    imagenes: [
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['recomendada'],
    variaciones: ['chico', 'mediano', 'maceta 6 pulgadas'],
    disponibilidad: 'disponible',
    cuidado: 'intermedia',
    sucursal: 'matriz',
    mascotas: 'no tóxica'
  },
  {
    id: 'bugambilia',
    nombre: 'Bugambilia',
    nombreCientifico: 'Bougainvillea spectabilis',
    categoria: 'exterior',
    descripcion: 'Una de las plantas ornamentales más icónicas de México. Sus coloridas brácteas papelosas dan color casi todo el año bajo pleno sol. Trepadora vigorosa ideal para bardas, pérgolas y cercas. Con mínimo riego produce floraciones abundantes. Especie perfectamente adaptada al clima cálido de Morelos.',
    luz: 'sol directo',
    riego: 'medio',
    imagenes: [
      'https://images.unsplash.com/photo-1518008166820-93bf91e3cf1b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527765301008-3f1a1dba3a83?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596452581015-7d6a1d15a98e?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['popular', 'nueva'],
    variaciones: ['mediano', 'grande'],
    disponibilidad: 'disponible',
    cuidado: 'fácil',
    sucursal: 'ambas',
    mascotas: 'tóxica'
  },
  {
    id: 'nochebuena',
    nombre: 'Nochebuena',
    nombreCientifico: 'Euphorbia pulcherrima',
    categoria: 'ornamental',
    descripcion: 'Símbolo navideño por excelencia en México. Sus brácteas de rojo intenso contrastan con el follaje verde oscuro. Planta de temporada disponible principalmente en noviembre y diciembre. Con luz indirecta brillante y riego moderado puede conservar su color durante toda la temporada festiva.',
    luz: 'luz indirecta',
    riego: 'medio',
    imagenes: [
      'https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1482066258735-29c7e8c2d558?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606225571585-eb0c20c50f66?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['popular'],
    variaciones: ['chico', 'mediano', 'maceta 6 pulgadas'],
    disponibilidad: 'bajo pedido',
    cuidado: 'intermedia',
    sucursal: 'ambas',
    mascotas: 'tóxica'
  },
  {
    id: 'jacaranda',
    nombre: 'Jacaranda',
    nombreCientifico: 'Jacaranda mimosifolia',
    categoria: 'árbol',
    descripcion: 'Árbol ornamental famoso por sus flores lila-moradas que tiñen ciudades mexicanas cada primavera. De gran porte y rápido crecimiento, ideal para jardines amplios, camellones y espacios abiertos. Una vez establecido ofrece sombra considerable y floración espectacular que convierte cualquier jardín en una postal.',
    luz: 'sol directo',
    riego: 'medio',
    imagenes: [
      'https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618047-f4e80b690a04?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601059275849-3cee681aeac5?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['recomendada', 'nueva'],
    variaciones: ['mediano', 'grande'],
    disponibilidad: 'disponible',
    cuidado: 'intermedia',
    sucursal: 'embarques',
    mascotas: 'no tóxica'
  },
  {
    id: 'aloe-vera',
    nombre: 'Aloe Vera',
    nombreCientifico: 'Aloe barbadensis miller',
    categoria: 'suculenta',
    descripcion: 'Planta suculenta con reconocidas propiedades medicinales y cosméticas. El gel de sus hojas carnosas se usa para tratar quemaduras leves, hidratación y cuidado de la piel. Extremadamente resistente a la sequía y el calor. Ideal para balcones, jardines o interiores soleados. Una de las plantas más útiles y fáciles de cuidar.',
    luz: 'sol directo',
    riego: 'bajo',
    imagenes: [
      'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['popular', 'bajo mantenimiento', 'recomendada'],
    variaciones: ['chico', 'mediano', 'maceta 6 pulgadas'],
    disponibilidad: 'disponible',
    cuidado: 'fácil',
    sucursal: 'ambas',
    mascotas: 'tóxica'
  },
  {
    id: 'ficus-lira',
    nombre: 'Ficus Lira',
    nombreCientifico: 'Ficus lyrata',
    categoria: 'interior',
    descripcion: 'El Ficus lyrata es tendencia mundial en decoración de interiores. Sus enormes hojas con forma de violín añaden drama arquitectónico y elegancia contemporánea a cualquier espacio. Requiere cuidados específicos de luz indirecta brillante y humedad, pero recompensa con una presencia imponente que ninguna otra planta puede igualar.',
    luz: 'luz indirecta',
    riego: 'medio',
    imagenes: [
      'https://images.unsplash.com/photo-1505975595817-5de9e9abf385?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1455793965702-7e2ea42a5c8e?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['nueva', 'recomendada'],
    variaciones: ['mediano', 'grande'],
    disponibilidad: 'disponible',
    cuidado: 'difícil',
    sucursal: 'matriz',
    mascotas: 'tóxica'
  },
  {
    id: 'cempasuchil',
    nombre: 'Cempasúchil',
    nombreCientifico: 'Tagetes erecta',
    categoria: 'ornamental',
    descripcion: 'La flor emblema del Día de Muertos en México. Sus flores de naranja y amarillo intenso tienen un aroma inconfundible y son indispensables en ofrendas y altares de noviembre. Planta de temporada de altísima demanda; disponible bajo pedido anticipado desde octubre. También se usa como planta de temporada en jardines durante otoño.',
    luz: 'sol directo',
    riego: 'medio',
    imagenes: [
      'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504542982118-59308b40fe0c?w=600&auto=format&fit=crop'
    ],
    etiquetas: ['popular', 'nueva'],
    variaciones: ['chico', 'mediano'],
    disponibilidad: 'bajo pedido',
    cuidado: 'fácil',
    sucursal: 'ambas',
    mascotas: 'no tóxica'
  }
];
