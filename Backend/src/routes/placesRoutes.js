import express from "express";
import axios from "axios";
const router = express.Router();
const GEOAPIFY_KEY = process.env.GEOAPIFY_KEY;

// Proxy API lấy places
router.get("/search", async (req, res) => {
    const { lat, lng, category } = req.query;
    try {
        const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&apiKey=${GEOAPIFY_KEY}`;
        const resp = await axios.get(url);
        res.json(resp.data);
    } catch (err) {
        res.status(500).json({ error: "API call failed" });
    }
});
export default router;
