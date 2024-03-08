const request = require('supertest');
const express = require('express');
const adminRouter = require('./admin');

// Mock the database connection
const mockDb = {
  query: jest.fn(),
};

const app = express();
app.use(express.json());
app.use('/api', adminRouter(mockDb));

describe('GET /api/days', () => {
  it('should return list of days', async () => {
    // Mock the database query result
    const mockResults = [
      { day_id: 1, day_name: 'Monday' },
      { day_id: 2, day_name: 'Tuesday' },
    ];
    mockDb.query.mockImplementationOnce((sql, callback) => {
      callback(null, mockResults);
    });

    // Make request to the endpoint
    const response = await request(app).get('/api/days');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { dayId: 1, dayName: 'Monday' },
      { dayId: 2, dayName: 'Tuesday' },
    ]);
  });

  it('should handle database error', async () => {
    // Mock the database query to simulate an error
    mockDb.query.mockImplementationOnce((sql, callback) => {
      callback(new Error('Database error'));
    });

    // Make request to the endpoint
    const response = await request(app).get('/api/days');

    // Assertions
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error fetching DaysOfWeek' });
  });
});