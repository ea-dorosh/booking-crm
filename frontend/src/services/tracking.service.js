import axios, { handleAxiosError } from '@/services/axios.service';

const getQrScanStats = async (days = 90) => {
  try {
    const response = await axios.get(`/tracking/stats`, {
      params: {
        days,
      },
    });

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const trackingService = {
  getQrScanStats,
};

export default trackingService;