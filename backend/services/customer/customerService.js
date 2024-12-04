const { validateCustomerForm } = require('../../validators/customer');
const { formattedName, formattedPhone } = require('../../utils/formatters');

const createCustomer = async (dbPool, customerData) => {
  const errors = validateCustomerForm(customerData);

  if (Object.keys(errors).length > 0) {

    return { 
      newCustomerId: null,
      validationErrors: errors,
    };
  }

  const customerQuery = `
    INSERT INTO Customers (salutation, first_name, last_name, email, phone)
    VALUES (?, ?, ?, ?, ?)
  `;

  const customerValues = [
    customerData.salutation,
    formattedName(customerData.firstName),
    formattedName(customerData.lastName),
    customerData.email,
    formattedPhone(customerData.phone),
  ];

  const [customerResults] = await dbPool.query(customerQuery, customerValues);

  return { 
    newCustomerId: customerResults.insertId,
    validationErrors: null,
  };
}

const updateCustomerData = async (dbPool, customerData, customerId) => {
  const errors = validateCustomerForm(customerData);

  if (Object.keys(errors).length > 0) {

    return {
      updatedCustomerId: null,
      validationErrors: errors,
    };
  }

  const sql = `
    UPDATE Customers
    SET last_name = ?, first_name = ?, email = ?, phone = ?, salutation = ?
    WHERE customer_id = ?;
  `;

  const values = [
    formattedName(customerData.lastName),
    formattedName(customerData.firstName),
    customerData.email,
    formattedPhone(customerData.phone),
    customerData.salutation,
    customerId,
  ];

  await dbPool.query(sql, values);

  return { 
    updatedCustomerId: customerId,
    validationErrors: null,
  };
}

const checkCustomerExists= async (dbPool, email) => {
  const customerCheckQuery = `SELECT customer_id FROM Customers WHERE email = ?`;

  const [customerResults] = await dbPool.query(customerCheckQuery, [email]);
  if (customerResults.length >= 1) {
    return { exists: true, customerId: customerResults[0].customer_id };
  } else {
    return { exists: false };
  }
}

module.exports = {
  createCustomer,
  checkCustomerExists,
  updateCustomerData,
};