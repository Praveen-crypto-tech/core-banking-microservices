import axios from "axios";

const API_BASE = "http://127.0.0.1:8080"; // API Gateway

export const dashboardService = {
  async getOverview() {
    const res = await axios.get(`${API_BASE}/dashboard/overview`);
    return res.data;
  }
};
