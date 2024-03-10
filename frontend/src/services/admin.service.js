const getDaysOfWeek = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}api/admin/days`
  );
  
  const data = await response.json();
  return data;
};

const adminService = {
  getDaysOfWeek,
};

export default adminService;
