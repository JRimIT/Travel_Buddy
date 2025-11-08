import express from 'express';

import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
// Import Google Gemini SDK
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




// C:\Users\LENOVO\AppData\Roaming\Python\Python312\Scripts --py
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { path: filePath, mimetype, originalname } = req.file;
        console.log('Received file at:', filePath);

        const formData = new FormData();
        formData.append('apikey', process.env.OCR_SPACE_API_KEY);
        formData.append('language', 'auto '); // Tiếng Việt
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', '2');
        formData.append('file', fs.createReadStream(filePath), {
            contentType: mimetype,
            filename: originalname
        });

        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: formData.getHeaders(),
        });

        const { ParsedResults } = response.data;

        console.log('OCR API response:', response.data);

        if (!ParsedResults || ParsedResults.length === 0 || !ParsedResults[0].ParsedText) {
            throw new Error('No text found in the image.');
        }

        const extractedText = ParsedResults[0].ParsedText.trim();
        console.log('Extracted text:', extractedText);

        const aiSummary = await summarizeWithGemini(extractedText);

        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        res.json({ text: extractedText, summary: aiSummary });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image.' });
    }
});

router.post('/voice-to-text', upload.single('file'), async (req, res) => {
    try {
        const audioPath = req.file.path;
        const scriptPath = path.join(__dirname, '..', '..', 'transcribe.py'); // tới đúng file transcribe.py
        const cwdPath = path.join(__dirname, '..', '..'); // thư mục Backend

        console.log('Running:', scriptPath, 'with cwd:', cwdPath);

        const { stdout } = await execFileAsync('python', [scriptPath, audioPath], {
            cwd: cwdPath,
            env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8'
            }
        });

        fs.unlink(audioPath, () => { });
        res.json({ text: stdout.trim() });
    } catch (err) {
        console.error('Lỗi Python Whisper:', err);
        res.status(500).json({ error: 'Không chuyển giọng nói được.' });
    }
});


router.post('/hotel-details', async (req, res) => {
    const { hotelName, address, city } = req.body;
    const prompt = `Hãy cung cấp thông tin chi tiết về khách sạn "${hotelName}" tại "${address}, ${city}" bao gồm:

1. **Tên đầy đủ và mô tả**: 
2. **Số sao xếp hạng** (1-5 sao):
3. **Giá phòng trung bình** (VNĐ/đêm):
4. **Website chính thức**:
5. **Tiện ích nổi bật** (wifi, hồ bơi, gym, spa...):
6. **Đánh giá từ khách hàng** (điểm/10):
7. **Vị trí và gần điểm tham quan nào**:
8. **Loại phòng phổ biến**:
9. **Chính sách hủy phòng**:
10. **Ghi chú đặc biệt**:

Vui lòng trả về thông tin chính xác và có cấu trúc rõ ràng.`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    { parts: [{ text: prompt }] }
                ]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        res.json({ details: text });
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({ details: "", error: "API Gemini lỗi" });
    }
});

router.post('/playground-details', async (req, res) => {
    const { name, address, city } = req.body;

    const prompt = `
Hãy cung cấp thông tin chi tiết về điểm vui chơi/du lịch "${name}" tại "${address}, ${city}" bao gồm:

1. **Tên đầy đủ và mô tả ngắn** (có gì hấp dẫn?):
2. **Thời gian/mùa tham quan đẹp nhất**:
3. **Giá vé hoặc chi phí vào cửa** (nếu có, VNĐ/người):
4. **Website chính thức hoặc Fanpage**:
5. **Hoạt động, trải nghiệm nổi bật** (chụp ảnh, tham quan, vui chơi, ăn uống...):
6. **Đánh giá trung bình từ du khách** (theo thang 10):
7. **Có gì nổi tiếng/gần đó (ẩm thực, đặc sản, địa điểm checkin khác...)?**
8. **Phù hợp đối tượng nào** (gia đình, bạn trẻ, trẻ em, cặp đôi, ai nên/không nên đi?):
9. **Các lưu ý đặc biệt khi đi**
10. **Ghi chú khác/Tip nên biết**:

Trả về thông tin rõ ràng từng mục giống cấu trúc liệt kê trên. Không sử dụng markdown, chỉ phân mục rõ ràng. Chú trọng các thông tin cập nhật/chính xác nhất có thể.`.trim();

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    { parts: [{ text: prompt }] }
                ]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const text =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        res.json({ details: text });
    } catch (error) {
        console.error(error?.response?.data || error.message || error);
        res.status(500).json({ details: "", error: "API Gemini lỗi" });
    }
});

router.post("/schedule-optimize", async (req, res) => {
    const { places, numDays, budget, startDate } = req.body;
    const listPOI = (places || [])
        .map((p, idx) => {
            const name =
                p.properties?.name || p.properties?.formatted || p.name || "";
            const price = p.price || 0;
            const address = p.properties?.address_line2 || p.address_line2 || "";
            return `${idx + 1}. ${name} - Địa chỉ: ${address} - Giá vé: ${price} VNĐ`;
        })
        .join("\n");

    const prompt = `
Bạn là hướng dẫn viên du lịch, hãy lên lịch trình tham quan hợp lý cho khách dựa trên:
- Danh sách điểm vui chơi dưới đây
- Số ngày: ${numDays}
- Ngày bắt đầu chuyến đi: ${startDate}
- Tổng ngân sách: ${budget} VNĐ

Yêu cầu:
- Phân bổ hoạt động cho từng ngày (${numDays} ngày); mỗi ngày 1-5 điểm là hợp lý nhất, ưu tiên nhóm các điểm gần nhau, tiết kiệm thời gian di chuyển nhất cho khách.
- Gợi ý giờ đi cho từng hoạt động (09:00, 10:30, 14:00,...)
- Hiển thị chi phí từng hoạt động (giá vé) và tổng chi phí mỗi ngày.
- Không vượt quá tổng ngân sách.
- Đảm bảo không trùng lặp thời gian giữa các hoạt động.
- Trường "date" của mỗi ngày phải là ngày thực tế (ISO, yyyy-mm-dd), tính từ ngày bắt đầu ("${startDate}") cộng dần cho mỗi ngày tiếp theo.
- Trả về hoàn toàn dưới dạng JSON (không markdown, không mô tả ngoài json) với cấu trúc:
[
  {
    "day": 1,
    "date": "yyyy-mm-dd",
    "activities": [
      { "name": "", "time": "09:00", "cost": 0, "address": "", "note": "" }
    ],
    "totalCost": 0
  },
  ...
]
DANH SÁCH ĐIỂM VUI CHƠI:
${listPOI}
  `.trim();

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
            },
            { headers: { "Content-Type": "application/json" } }
        );

        let text =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Xử lý text JSON (nếu AI trả thêm ký tự dư)
        text = text.trim();
        if (text.startsWith("```json")) text = text.replace(/^```json/, "");
        if (text.endsWith("```")) text = text.replace(/```$/, "");
        text = text.trim();

        let schedule;
        try {
            schedule = JSON.parse(text);
        } catch (err) {
            console.error("Lỗi parse JSON từ AI:", err);
            return res.status(500).json({
                error: "AI trả về dữ liệu không hợp lệ",
                raw: text.slice(0, 500),
            });
        }

        res.json({ schedule });
    } catch (error) {
        console.error("Lỗi gọi Gemini:", error.response?.data || error.message);
        res.status(500).json({ error: "Lỗi khi gọi AI", detail: error.message });
    }
});

// router.post('/suggest-transport', async (req, res) => {
//     // Nhận quỹ tiền ngân sách chỉ cho di chuyển
//     // fromLocation: vị trí user hiện tại (city/tỉnh/thành phố hoặc toạ độ) - truyền từ frontend
//     const { budget, fromLocation, destination, hotel, activities, userPreferences } = req.body;

//     const prompt = `
// Tôi có quỹ tiền đi lại là ${budget} VNĐ (chỉ dùng cho di chuyển, không tính ăn ở/tiêu vặt/khác).
// Vị trí xuất phát: ${fromLocation || "không rõ"}.
// Điểm đến: ${destination}. Đã đặt khách sạn ${hotel?.name || ""}.
// Các hoạt động dự kiến: ${activities?.map(a => a.properties?.name || a.name).join(", ") || "Chưa có hoạt động"}.
// Ưu tiên: ${userPreferences?.join(", ") || "không rõ"}.

// Yêu cầu:
// 1. Phân tích các phương tiện di chuyển hợp lý để đi từ vị trí xuất phát đến nơi đến (máy bay/tàu/xe khách/bus/ô tô riêng v.v.), dựa trên ngân sách chỉ dành cho di chuyển.
// 2. Đánh giá chi phí trung bình mỗi loại phương tiện (ghi rõ VNĐ), tìm ra phương tiện tối ưu (ưu tiên tiết kiệm hoặc trải nghiệm hoặc tốc độ, tuỳ ưu tiên user).
// 3. Nếu ngân sách không đủ cho phương tiện nào đó, cảnh báo rõ ràng và đề xuất phương tiện khả thi nhất/tăng quỹ tiền.
// 4. Gợi ý phương tiện đi lại nội thành tại điểm đến (taxi, xe máy, xe bus công cộng, xe điện du lịch, xe đạp, v.v.), theo lộ trình các hoạt động đã chọn.
// 5. Giải thích vì sao nên chọn mỗi loại phương tiện (giá/thời gian/trải nghiệm) cho từng chặng.
// 6. Đề xuất trải nghiệm đặc biệt nếu có thể (xe bus du lịch, thuê xe điện, v.v.).
// 7. Nếu lịch trình hoặc tiền đi lại bất hợp lý, hãy cảnh báo cụ thể đồng thời đề xuất điều chỉnh thông minh (bớt điểm/vọc lại lịch trình/tăng quỹ tiền di chuyển).

// Trả về JSON:
// {
//   "goOptions": [
//     { "name": "...", "avgCost": ..., "possible": true/false, "reason": "..." }
//     // ...các phương tiện xuất phát - đến nơi đến
//   ],
//   "recommendGo": { "name": "...", "reason": "..." },
//   "warningGo": "...nếu có",
//   "innerMoveOptions": [
//     { "name": "...", "possible": true/false, "reason": "..." }
//     // ...các phương tiện nội thành tại nơi đến
//   ],
//   "recommendInner": { "name": "...", "reason": "..." },
//   "warningInner": "...nếu có",
//   "specialTips": [ ... ], // nếu có
//   "summary": "...", // tóm tắt tổng quan gợi ý/cảnh báo
// }
// `.trim();

//     try {
//         const apiKey = process.env.GEMINI_API_KEY; // Đặt API key vào .env hoặc process
//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//             { contents: [{ parts: [{ text: prompt }] }] },
//             { headers: { 'Content-Type': 'application/json' } }
//         );

//         const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//         // Tìm và parse JSON
//         const match = text.match(/\{[\s\S]*\}/);
//         let jsonOut = null;
//         try {
//             jsonOut = match ? JSON.parse(match[0]) : null;
//         } catch {
//             jsonOut = null;
//         }
//         if (!jsonOut) {
//             res.status(420).json({ error: "AI không trả JSON đúng", raw: text });
//             return;
//         }
//         console.log("jsonOut: ", jsonOut);

//         res.json(jsonOut);

//     } catch (error) {
//         res.status(500).json({
//             error: "Gemini API lỗi",
//             detail: error.message,
//             trace: error.response?.data
//         });
//     }
// });


// Nếu muốn, có thể cập nhật luôn route suggest-transport-auto tương tự

router.post('/suggest-transport', async (req, res) => {
    const { budget, destination, hotel, activities, userPreferences } = req.body;
    // console.log("Hotel: ", hotel);

    // console.log("activities: ", activities);

    // Prompt theo đúng ý bạn
    const prompt = `
Tôi có ngân sách chỉ để dùng để di chuyển ${budget} VNĐ, đã chọn khách sạn "${hotel?.name || ""}" tại ${destination}.
Các hoạt động: ${activities?.map(a => a.properties?.name || a.name).join(", ") || "Không có hoạt động nào"}.
Các ưu tiên của tôi: ${userPreferences?.join(", ") || "không rõ"}.

Bạn hãy:
1. Tính tổng khoảng cách, quãng đường và chi phí dự kiến nếu di chuyển qua hết các điểm này, từ khách sạn (hoặc điểm đến đầu tiên).
2. Phân tích xem với quỹ tiền này, nên chọn phương tiện nào cho từng chặng (máy bay/tàu/xe khách/taxi/xe máy/xe đạp/v.v.), ưu tiên tiết kiệm thời gian hoặc chi phí hoặc “trải nghiệm bản địa”, có thể mix combo phương tiện.
3. Nếu lịch trình hoặc ngân sách bất hợp lý (lịch quá dày, tiền không đủ), hãy cảnh báo chi tiết và propose kế hoạch tối ưu hơn (đề xuất bỏ bớt điểm chơi, chia nhỏ hành trình, hoặc tăng ngân sách).
4. Diễn giải vì sao nên chọn phương tiện nào (chi phí/thời gian/cảnh đẹp/etc), phân tích từng quyết định.
5. Đề xuất một số trải nghiệm đặc biệt nếu phù hợp (xe điện, bus du lịch, thuê xe theo giờ, v.v.).
6. Trả về JSON như sau:
{
  "segments": [
    {
      "from": "...", "to": "...",
      "suggestedTransport": "...",
      "cost": ...,
      "reason": "..."
    }
  ],
  "summary": "...",
  "warning": "...",
  "specialTips": [ ... ]
}
`.trim();

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Parse JSON
        const match = text.match(/\{[\s\S]*\}/);
        let jsonSuggestion = match ? JSON.parse(match[0]) : { raw: text, error: "Không parse được JSON" };
        res.json(jsonSuggestion);
    } catch (error) {
        res.status(500).json({ error: "API Gemini lỗi", details: error.message });
    }
});

router.post('/suggest-transport-auto', async (req, res) => {
    const { budget, fromLocation, destination, hotel, activities, userPreferences } = req.body;

    const prompt = `
Tôi có ngân sách chỉ dành cho việc di chuyển là ${budget} VNĐ.
Vị trí hiện tại: ${fromLocation || "không rõ"}, muốn đi đến ${destination}, đã đặt khách sạn ${hotel?.name || ""}.
Phân tích các phương tiện giữa hai địa điểm này (máy bay/tàu/xe khách v.v) và các phương tiện có thể di chuyển nội thành sau khi đến (taxi, xe máy, xe bus, xe điện v.v).

Trả về JSON:
{
  "goOptions": [
    { "name": "Máy bay", "avgCost": ..., "possible": true/false },
    { "name": "Tàu hỏa", "avgCost": ..., "possible": true/false },
    { "name": "Xe khách", "avgCost": ..., "possible": true/false }
  ],
  "recommendGo": { "name": "...", "reason": "..." },
  "warningGo": "...nếu có",
  "innerMoveOptions": [
    { "name": "Taxi", "possible": true/false }, { "name": "Xe máy", "possible": true/false }, ...
  ],
  "recommendInner": { "name": "...", "reason": "..." },
  "warningInner": "...nếu có"
}
  `.trim();

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Parse JSON
        const match = text.match(/\{[\s\S]*\}/);
        let jsonOut = null;
        try { jsonOut = match ? JSON.parse(match[0]) : null; } catch { jsonOut = null; }
        if (!jsonOut) {
            res.status(420).json({ error: "AI không trả về JSON đúng", raw: text });
            return;
        }
        res.json(jsonOut);
    } catch (error) {
        res.status(500).json({
            error: "Gemini API lỗi",
            detail: error.message,
            trace: error.response?.data
        });
    }
});

router.post("/transport-analysis", async (req, res) => {
    const { hotel, playgrounds, mainTransport, innerTransport, fromLocation } = req.body;

    // Build prompt cho AI
    const prompt = `
Tôi muốn đi từ ${fromLocation || "vị trí hiện tại"} đến khách sạn ${hotel?.name || ""} bằng phương tiện chính là: ${mainTransport}.
Sau đó, khi tới nơi, tôi sẽ đi lại giữa các địa điểm sau bằng phương tiện: ${innerTransport}
Danh sách điểm chơi: ${playgrounds?.map((p, i) => `${i + 1}. ${p?.properties?.name || p?.name} (${p?.properties?.address || ""})`).join(", ")}
Bạn hãy:
1. Ghi rõ từng chặng:
  - Chặng chính: từ nơi đi đến khách sạn (hiện thị tên phương tiện, thời gian, chi phí, quãng đường, ghi chú nếu cần).
  - Các chặng nội thành: từ khách sạn đến từng địa điểm, và liên tục giữa các điểm; đều sử dụng innerTransport.
2. Mỗi chặng ghi rõ: from, to, phương tiện, distance (km), duration (phút), cost (VNĐ), note.
3. Tổng kết tổng thời gian di chuyển, tổng chi phí di chuyển và ghi chú ngắn tổng quan.
Trả về JSON:
{
  "mainLeg": { "from":"...", "to":"...", "transport":"...", "distance":"...", "duration":"...", "cost":...,"note":"..." },
  "legs": [
    { "from":"...","to":"...","transport":"...","distance":"...","duration":"...","cost":...,"note":"..." }
  ],
  "totalTime": "...",
  "totalCost": ...,
  "summary": "..."
}
`;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { "Content-Type": "application/json" } }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const match = text.match(/\{[\s\S]*\}/);
        let json = null;
        try { json = match ? JSON.parse(match[0]) : null; } catch { }
        if (!json) return res.status(420).json({ error: "Không parse được JSON", raw: text });
        res.json(json);
    } catch (err) {
        res.status(500).json({ error: "Gemini API lỗi", detail: err.message });
    }
});

// async function summarizeWithGemini(text) {
//     try {
//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//             {
//                 contents: [
//                     { parts: [{ text: `Hãy tổng hợp đoạn văn sau bằng tiếng Việt:\n\n${text}` }] }
//                 ]
//             },
//             {
//                 headers: { 'Content-Type': 'application/json' }
//             }
//         );

//         const summary = response.data.candidates[0].content.parts[0].text;
//         return summary;
//     } catch (error) {
//         console.error('Error calling Gemini API:', error.response?.data || error.message);
//         return 'Tổng hợp thất bại';
//     }
// }

async function summarizeWithGemini(text, retries = 3, delay = 3000) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [
                    { parts: [{ text: `Hãy tổng hợp đoạn văn sau bằng tiếng Việt:\n\n${text}` }] }
                ]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!summary) {
            console.warn("⚠️ Gemini không trả về text");
            return 'Không có kết quả tổng hợp từ Gemini';
        }

        return summary.trim();
    } catch (error) {
        console.error(` Lỗi khi gọi Gemini API (còn ${retries} lần thử):`, error.response?.data || error.message);

        if (error.response?.status === 429 && retries > 0) {
            console.log(`⏳ Đợi ${delay / 1000}s rồi thử lại...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return summarizeWithGemini(text, retries - 1, delay * 2); // tăng delay dần
        }

        return 'Tổng hợp thất bại (Gemini lỗi).';
    }
}



export default router;
