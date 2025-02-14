import axios, { handleAxiosError } from '@/services/axios.service';

const changePassword = async (email, currentPassword, newPassword) => {
  try {
    const response = await axios.post(`/user/change-password`, { email, currentPassword, newPassword });

    return response;
  } catch (error) {
    handleAxiosError(error);
  }
};

const getCurrentUser = async () => {
  try {
    const response = await axios.get(`/user`);

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};


const accountService = {
  changePassword,
  getCurrentUser,
};

export default accountService;


