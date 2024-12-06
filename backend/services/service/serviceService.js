const getServices = async (dbPool) => {
  const categoriesSql = `
    SELECT c.id, c.name, c.img
    FROM ServiceCategories c
  `;

  const [categoriesResult] = await dbPool.query(categoriesSql);

  const categoriesData = categoriesResult.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.img ? `${process.env.SERVER_API_URL}images/${row.img}` : null,
  }));

  const servicesQuery = `
    SELECT 
      s.id, 
      s.name, 
      s.category_id, 
      s.duration_time, 
      s.buffer_time,
      s.booking_note,
      sep.employee_id,
      sep.price
    FROM Services s
    LEFT JOIN ServiceEmployeePrice sep ON s.id = sep.service_id
  `;

  const [servicesResults] = await dbPool.query(servicesQuery);

  const servicesMap = new Map();

  servicesResults.forEach(row => {
    const { 
      id, 
      name, 
      category_id, 
      duration_time, 
      buffer_time,
      booking_note,
      employee_id,
      price,
    } = row;

    if (!servicesMap.has(id)) {
      servicesMap.set(id, {
        id,
        name,
        categoryId: category_id,
        categoryName: categoriesData.find(category => category.id === category_id).name,
        durationTime: duration_time,
        bufferTime: buffer_time,
        bookingNote: booking_note,
        employeePrices: [],
      });
    }

    if (employee_id) {
      servicesMap.get(id).employeePrices.push({ employeeId: employee_id, price });
    }
  });

  const services = Array.from(servicesMap.values());

  return services;
}

module.exports = {
  getServices,
};