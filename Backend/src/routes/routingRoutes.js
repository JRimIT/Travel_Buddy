import express from "express";
import axios from "axios";
const router = express.Router();
const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY;

// Proxy API lấy route
router.get("/compare", async (req, res) => {
    const { startLat, startLng, endLat, endLng, mode } = req.query;
    try {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${startLat},${startLng}|${endLat},${endLng}&mode=${mode}&apiKey=${GEOAPIFY_KEY}`;
        const resp = await axios.get(url);
        res.json(resp.data);
    } catch (err) {
        res.status(500).json({ error: "Routing API failed" });
    }
});
export default router;
