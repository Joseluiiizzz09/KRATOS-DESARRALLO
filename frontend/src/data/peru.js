/* Departamentos, provincias y distritos más usados en campañas de Lima y Callao.
   No es el listado completo del Perú: alcanza para el formulario de Back Office. */
export const PERU = {
  Lima: {
    Lima: ['Miraflores', 'Surco', 'San Isidro', 'San Borja', 'La Molina', 'San Miguel', 'Barranco', 'Jesús María', 'Lince', 'Magdalena del Mar', 'Pueblo Libre', 'Comas', 'Los Olivos', 'San Juan de Lurigancho', 'Ate', 'Villa El Salvador'],
    Huaral: ['Huaral', 'Chancay'],
    Cañete: ['San Vicente de Cañete', 'Mala'],
  },
  Callao: {
    Callao: ['Callao', 'Bellavista', 'La Perla', 'La Punta', 'Ventanilla'],
  },
  Arequipa: {
    Arequipa: ['Arequipa', 'Cayma', 'Yanahuara', 'Cerro Colorado'],
  },
  'La Libertad': {
    Trujillo: ['Trujillo', 'La Esperanza', 'El Porvenir'],
  },
};

export const DEPARTMENTS = Object.keys(PERU);
export const provincesOf = (department) => Object.keys(PERU[department] || {});
export const districtsOf = (department, province) => PERU[department]?.[province] || [];

/* Listas completas para cuando aún no se eligió departamento o provincia: los tres campos son opcionales e independientes. */
export const ALL_PROVINCES = [...new Set(DEPARTMENTS.flatMap((d) => provincesOf(d)))].sort();
export const ALL_DISTRICTS = [...new Set(DEPARTMENTS.flatMap((d) => provincesOf(d).flatMap((p) => districtsOf(d, p))))].sort();

/** Departamento al que pertenece una provincia, por si se elige la provincia antes que el departamento. */
export const departmentOfProvince = (province) => DEPARTMENTS.find((d) => provincesOf(d).includes(province)) || '';

/** Departamento y provincia de un distrito, por si se elige el distrito primero (los tres campos son independientes). */
export function locationOfDistrict(district) {
  for (const department of DEPARTMENTS) {
    for (const province of provincesOf(department)) {
      if (districtsOf(department, province).includes(district)) return { department, province };
    }
  }
  return { department: '', province: '' };
}
