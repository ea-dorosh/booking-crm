const getServices = async () => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}api/services`);
  const data = await response.json();
  return data;
};

const createService = async (service) => {
  if (service.bufferTime === "") {
    service.bufferTime = null;
  }

  const response = await fetch(`${process.env.REACT_APP_API_URL}api/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ service }),
  });

  const data = await response.json();
  return data;
};

const deleteService = async (id) => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/services/${id}`,
    {
      method: "DELETE",
    }
  );
  const data = await response.json();
  return data;
};

export default {
  getServices,
  createService,
  deleteService,
};
