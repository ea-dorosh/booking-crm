const express = require('express');
const router = express.Router();
const { 
  createCustomer,
  updateCustomerData,
} = require('../../services/customer/customerService');

router.get(`/`, async (request, response) => {
  if (!request.dbPool) {
    response.status(500).json({
      errorMessages: `Database connection not initialized`,
      error: error.message,
    });
  }

  const sql = `
    SELECT customer_id, first_name, last_name, salutation, email, phone, added_date
    FROM Customers
  `;

  try {
    const [results] = await request.dbPool.query(sql);

    const customersResponse = results.map((row) => ({
      id: row.customer_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      addedDate: row.added_date,
    }));

    response.json(customersResponse);
  } catch (error) {
    response.status(500).json({
      errorMessages: `Error fetching customers`,
      error: error.message,
    });
  }
});

router.get(`/:id`, async (request, response) => {
  const customerId = request.params.id;

  const sql = `
    SELECT 
      customer_id, 
      salutation, 
      last_name, 
      first_name,
      email,
      phone,
      added_date
    FROM Customers
    WHERE customer_id = ?
  `;

  try {
    const [results] = await request.dbPool.query(sql, [customerId]);

    const customersResponse = results.map((row) => ({
      id: row.customer_id,
      salutation: row.salutation, 
      lastName: row.last_name,
      firstName: row.first_name, 
      email: row.email,
      phone: row.phone,
      addedDate: row.added_date,
    }));

    response.json(customersResponse[0]);
  } catch (error) {
    response.status(500).json({ 
      errorMessage: `Error fetching customer details`,
      message: error.message,
    });
  }
});

router.post(`/create-customer`, async (request, response) => {
  const customer = request.body;

  try {
    const { newCustomerId, validationErrors } = await createCustomer(request.dbPool, customer);
  
    if (validationErrors) {
      response.status(428).json({ 
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (newCustomerId) {
      response.json({
        message: `Customer data inserted successfully`,
        data: newCustomerId,
    });
    }
  } catch (error) {
    if (error.code === `ER_DUP_ENTRY`) {
      response.status(409).json({
        errorMessage: `Customer with this email already exists`,
      });
    }

    response.status(500).json({ 
      errorMessage: `Error while creating customer`,
      message: error.message,
    });
  }
});

router.put(`/edit/:id`, async (request, response) => {
  const customerId = request.params.id;
  const customer = request.body;

  try {
    const { updatedCustomerId, validationErrors } = await updateCustomerData(request.dbPool, customer, customerId);

    if (validationErrors) {
      response.status(428).json({ 
          errorMessage: `Validation failed`,
          validationErrors,
        });
    } else if (updatedCustomerId) {
      response.json({
        message: `Customer with id: ${updatedCustomerId} has been updated successfully`,
        data: updatedCustomerId,
      });
    }
  } catch (error) {
    if (error.code === `ER_DUP_ENTRY`) {
      response.status(409).json({
        errorMessage: `Customer with this email already exists`,
      });
    }

    response.status(500).json({ 
      errorMessage: `Error while creating customer`,
      message: error.message,
    });
  }
});

module.exports = router;
