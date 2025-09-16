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

const getLinkClickStats = async (days = 90, channel) => {
  try {
    const response = await axios.get(`/tracking/link-stats`, {
      params: {
        days,
        ...(channel ? { channel } : {}),
      },
    });

    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
};

const trackingService = {
  getQrScanStats,
  getLinkClickStats,
};

export default trackingService;