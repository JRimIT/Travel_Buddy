import express from "express";
import TripSchedule from "../models/TripSchedule.js";
import TripShare from "../models/TripShare.js";
import Review from "../models/Review.js";
import { verifyUser } from "../config/jwtConfig.js";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/User.js";

const router = express.Router();

// Tạo mới lịch trình
router.post("/create", verifyUser, async (req, res) => {
  try {
    const {
      title,
      description,
      isPublic,
      budget,
      days,
      baseStay,
      hotelDefault,
      flightTicket,
      ticket,
      image,
      mainTransport,
      innerTransport,
      fromLocation,
      province,
      baseStayType,
      startDate,
      endDate,
      bookingStatus,
    } = req.body;

    let scheduleData = {
      user: req.user.userId,
      title,
      description,
      isPublic,
      budget,
      days,
      flightTicket,
      ticket: req.body.ticket,
      image,
      mainTransport,
      innerTransport,
      fromLocation,
      province,
      startDate,
      endDate,
      bookingStatus,
    };

    if (baseStayType === "home" && baseStay) {
      scheduleData.home = baseStay;
    }
    if (baseStayType === "hotel" && hotelDefault) {
      scheduleData.hotelDefault = hotelDefault;
    }

    const trip = await TripSchedule.create(scheduleData);
    res.json({ success: true, tripId: trip._id });
  } catch (err) {
    console.error("[TripSchedule.create]", err);
    res.status(500).json({ error: "Lưu lịch trình thất bại!" });
  }
});

// Lấy tất cả lịch trình của user (riêng tư + công khai)
router.get("/my", verifyUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const schedules = await TripSchedule.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(schedules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lấy tất cả lịch trình công khai (dùng cho explore/du lịch cộng đồng)
router.get("/public", verifyUser, async (req, res) => {
  try {
    const schedules = await TripSchedule.find({ isPublic: true })
      .populate("user", "username email profileImage")
      .sort({ createdAt: -1 });

    // Query reviews trực tiếp cho tất cả trips
    const tripIds = schedules.map(trip => trip._id);
    const allReviews = await Review.find({
      targetId: { $in: tripIds },
      targetType: "TripSchedule",
      status: "visible"
    })
      .populate("user", "username profileImage")
      .sort({ createdAt: -1 });

    // Gắn reviews vào mỗi trip
    const schedulesWithReviews = schedules.map(trip => {
      const tripReviews = allReviews
        .filter(review => review.targetId.toString() === trip._id.toString())
        .slice(0, 10); // Giới hạn 10 reviews mới nhất

      // Tính lại reviewCount và averageRating từ reviews thực tế
      const actualReviewCount = allReviews.filter(
        review => review.targetId.toString() === trip._id.toString()
      ).length;

      const actualAverageRating = actualReviewCount > 0
        ? Math.round((allReviews
          .filter(review => review.targetId.toString() === trip._id.toString())
          .reduce((acc, cur) => acc + cur.rating, 0) / actualReviewCount) * 10) / 10
        : 0;

      return {
        ...trip.toObject(),
        reviews: tripReviews,
        reviewCount: actualReviewCount,
        averageRating: actualAverageRating
      };
    });

    res.json(schedulesWithReviews);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sửa lịch trình
router.put("/:id", verifyUser, async (req, res) => {
  try {
    const id = req.params.id;

    console.log("=== [TripSchedule.update] ===");
    console.log("User yêu cầu:", req.user?.userId);
    console.log("Trip id:", id);

    const existing = await TripSchedule.findById(id);
    if (!existing) {
      console.log("[TripSchedule.update] Không tìm thấy trip với id:", id);
      return res
        .status(404)
        .json({ error: "Không tìm thấy lịch trình" });
    }

    // Chỉ cho phép chủ sở hữu chỉnh sửa
    if (String(existing.user) !== String(req.user.userId)) {
      console.log(
        "[TripSchedule.update] User không phải chủ lịch trình. trip.user =",
        existing.user,
        "req.user.userId =",
        req.user.userId
      );
      return res
        .status(403)
        .json({ error: "Bạn không có quyền chỉnh sửa lịch trình này" });
    }

    const updateFields = {};
    // Các field cho phép update từ form EditTripScreen
    const allowed = [
      "title",
      "description",
      "isPublic",
      "budget",
      "home",
      "hotelDefault",
      "mainTransport",
      "innerTransport",
      "fromLocation",
      "province",
      "startDate",
      "endDate",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });

    console.log("[TripSchedule.update] updateFields =", updateFields);

    const trip = await TripSchedule.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!trip)
      return res.status(404).json({ error: "Không tìm thấy lịch trình" });
    res.json({ success: true, trip });
  } catch (err) {
    console.error("[TripSchedule.update] Lỗi:", err);
    res
      .status(500)
      .json({ error: "Không thể cập nhật", detail: err.message });
  }
});

// Xoá lịch trình của user
router.delete("/:id", verifyUser, async (req, res) => {
  try {
    await TripSchedule.deleteOne({ _id: req.params.id, user: req.user.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/save", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const isSaved = user.savedTripSchedules.includes(tripId);

    if (isSaved) {
      // Nếu đã lưu -> Bỏ lưu
      user.savedTripSchedules.pull(tripId);
      await user.save();
      res.json({ success: true, message: "Trip unsaved" });
    } else {
      // Nếu chưa lưu -> Lưu
      user.savedTripSchedules.push(tripId);
      await user.save();
      res.json({ success: true, message: "Trip saved" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Thêm route để lấy các trip đã lưu
router.get("/saved/my", verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: "savedTripSchedules",
      populate: { path: "user", select: "username profileImage" },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.savedTripSchedules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === ĐÁNH DẤU "ĐÃ ĐI" ===
router.post("/:id/complete", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await TripSchedule.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Lịch trình không tồn tại" });

    // Phải lưu trước mới được đánh dấu
    const user = await User.findById(req.user.userId);
    if (!user.savedTripSchedules.includes(tripId)) {
      return res.status(403).json({ error: "Bạn cần lưu lịch trình trước" });
    }

    const isCompleted = trip.completedBy?.includes(req.user.userId);

    if (isCompleted) {
      trip.completedBy.pull(req.user.userId);
    } else {
      trip.completedBy.addToSet(req.user.userId);
    }

    await trip.save();
    res.json({ completed: !isCompleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// === LẤY DANH SÁCH "ĐÃ ĐI" ===
router.get("/completed/my", verifyUser, async (req, res) => {
  try {
    const trips = await TripSchedule.find({
      completedBy: req.user.userId,
      isPublic: true
    }).select("_id");

    res.json(trips);
  } catch (error) {
    console.error("Error fetching completed trips:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// YÊU CẦU: phải import verifyUser từ middleware xác thực token

router.delete("/save/:tripId", verifyUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;

    // Xoá tripId khỏi mảng savedTripSchedules của user
    await User.findByIdAndUpdate(userId, {
      $pull: { savedTripSchedules: tripId }
    });

    res.json({ success: true, message: "Đã bỏ lưu chuyến đi" });
  } catch (error) {
    res.status(500).json({ error: "Không bỏ lưu được chuyến đi" });
  }
});

// === CHIA SẺ LỊCH TRÌNH ===

// Gửi lời mời chia sẻ trip tới user khác
router.post("/:id/share", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const { toUserId, toUsername, toEmail } = req.body;

    if (!toUserId && !toUsername && !toEmail) {
      return res.status(400).json({ error: "Thiếu thông tin người nhận" });
    }

    const trip = await TripSchedule.findById(tripId);
    if (!trip) return res.status(404).json({ error: "Không tìm thấy lịch trình" });

    if (toUserId && String(toUserId) === String(req.user.userId)) {
      return res.status(400).json({ error: "Không thể tự chia sẻ cho chính mình" });
    }

    let toUser = null;
    if (toUserId) {
      toUser = await User.findById(toUserId);
    } else if (toUsername) {
      toUser = await User.findOne({ username: toUsername });
    } else if (toEmail) {
      toUser = await User.findOne({ email: toEmail });
    }

    if (!toUser) return res.status(404).json({ error: "Người nhận không tồn tại" });

    // Nếu đã có invite pending giống hệt thì không tạo thêm
    const existing = await TripShare.findOne({
      trip: tripId,
      from: req.user.userId,
      to: toUser._id,
      status: "pending",
    });
    if (existing) {
      return res.json({ success: true, share: existing, duplicated: true });
    }

    const share = await TripShare.create({
      trip: tripId,
      from: req.user.userId,
      to: toUser._id,
      status: "pending",
    });

    res.json({ success: true, share });
  } catch (error) {
    console.error("Error sharing trip:", error);
    res.status(500).json({ error: "Không thể chia sẻ lịch trình" });
  }
});

// Lấy danh sách share gửi tới mình
router.get("/shares/incoming", verifyUser, async (req, res) => {
  try {
    const status = req.query.status || "pending";

    const shares = await TripShare.find({
      to: req.user.userId,
      status,
    })
      .populate("trip", "title image mainTransport innerTransport budget fromLocation province startDate endDate")
      .populate("from", "username profileImage");

    res.json(shares);
  } catch (error) {
    console.error("Error fetching incoming shares:", error);
    res.status(500).json({ error: "Không thể lấy danh sách chia sẻ" });
  }
});

// Lấy danh sách share mình đã gửi
router.get("/shares/outgoing", verifyUser, async (req, res) => {
  try {
    const status = req.query.status;

    const filter = { from: req.user.userId };
    if (status) filter.status = status;

    const shares = await TripShare.find(filter)
      .populate("trip", "title image")
      .populate("to", "username profileImage");

    res.json(shares);
  } catch (error) {
    console.error("Error fetching outgoing shares:", error);
    res.status(500).json({ error: "Không thể lấy danh sách chia sẻ đã gửi" });
  }
});

// Người nhận chấp nhận chia sẻ
router.post("/shares/:shareId/accept", verifyUser, async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await TripShare.findOne({
      _id: shareId,
      to: req.user.userId,
      status: "pending",
    }).populate("trip");

    if (!share) {
      return res.status(404).json({ error: "Lời mời chia sẻ không tồn tại hoặc đã xử lý" });
    }

    const original = share.trip;
    if (!original) {
      return res.status(404).json({ error: "Lịch trình gốc không còn tồn tại" });
    }

    // Clone trip cho người nhận
    const plain = original.toObject();
    delete plain._id;
    delete plain.createdAt;
    delete plain.updatedAt;

    const cloned = await TripSchedule.create({
      ...plain,
      user: req.user.userId,
      sharedFrom: original._id,
    });

    share.status = "accepted";
    share.acceptedTrip = cloned._id;
    await share.save();

    res.json({ success: true, trip: cloned });
  } catch (error) {
    console.error("Error accepting share:", error);
    res.status(500).json({ error: "Không thể chấp nhận chia sẻ" });
  }
});

// Người nhận từ chối chia sẻ
router.post("/shares/:shareId/reject", verifyUser, async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await TripShare.findOne({
      _id: shareId,
      to: req.user.userId,
      status: "pending",
    });

    if (!share) {
      return res.status(404).json({ error: "Lời mời chia sẻ không tồn tại hoặc đã xử lý" });
    }

    share.status = "rejected";
    await share.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error rejecting share:", error);
    res.status(500).json({ error: "Không thể từ chối chia sẻ" });
  }
});

// Các trip đã được chia sẻ và mình đã chấp nhận
router.get("/shared/my", verifyUser, async (req, res) => {
  try {
    const trips = await TripSchedule.find({
      user: req.user.userId,
      sharedFrom: { $ne: null },
    }).sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    console.error("Error fetching shared trips:", error);
    res.status(500).json({ error: "Không thể lấy danh sách chuyến đi được chia sẻ" });
  }
});

// CHI TIẾT LỊCH TRÌNH – BẮT BUỘC TRẢ VỀ REVIEWS NHƯ TRANG CHỦ
router.get("/:id", async (req, res) => {
  try {
    const trip = await TripSchedule.findById(req.params.id)
      .populate("user", "username profileImage")
      .populate({
        path: "reviews",
        match: { status: "visible", targetType: "TripSchedule" },
        populate: { path: "user", select: "username profileImage" },
        options: { sort: { createdAt: -1 }, limit: 10 },
      });

    if (!trip) {
      return res.status(404).json({ error: "Không tìm thấy lịch trình" });
    }

    const result = {
      ...trip.toObject(),
      averageRating: trip.averageRating || 0,
      reviewCount: trip.reviewCount || 0,
      reviews: trip.reviews || [],
    };

    res.json(result);
  } catch (e) {
    console.error("Lỗi lấy chi tiết trip:", e);
    res.status(500).json({ error: e.message });
  }
});

// Clone một lịch trình thành bản mới cho user hiện tại, có thể override một số field
router.post("/:id/clone", verifyUser, async (req, res) => {
  try {
    const id = req.params.id;
    const original = await TripSchedule.findById(id);
    if (!original) {
      return res.status(404).json({ error: "Không tìm thấy lịch trình gốc" });
    }

    const overrides = {};
    const allowed = [
      "title",
      "description",
      "isPublic",
      "budget",
      "home",
      "hotelDefault",
      "mainTransport",
      "innerTransport",
      "fromLocation",
      "province",
      "startDate",
      "endDate",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) overrides[field] = req.body[field];
    });

    const plain = original.toObject();
    delete plain._id;
    delete plain.createdAt;
    delete plain.updatedAt;

    const cloned = await TripSchedule.create({
      ...plain,
      ...overrides,
      user: req.user.userId,
      sharedFrom: original._id,
    });

    res.json({ success: true, trip: cloned });
  } catch (error) {
    console.error("Error cloning trip:", error);
    res.status(500).json({ error: "Không thể nhân bản lịch trình" });
  }
});

router.patch("/:id/booking", verifyUser, async (req, res) => {
  try {
    const { bookingStatus } = req.body;

    if (!bookingStatus) {
      return res.status(400).json({ error: "Missing bookingStatus" });
    }

    const schedule = await TripSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ error: "TripSchedule not found" });
    }
    console.log("update booking: ", schedule);

    // Cập nhật trạng thái đặt vé
    schedule.bookingStatus = bookingStatus;
    await schedule.save();


    res.json({
      success: true,
      message: "Booking status updated",
      bookingStatus: schedule.bookingStatus,
    });
  } catch (err) {
    console.error("Booking update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// ⭐ PATCH: Cập nhật activities của một ngày cụ thể hoặc toàn bộ days
router.patch("/:id/activities", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const { days, dayIndex, activityIndex, activity } = req.body;

    console.log("=== [PATCH /activities] ===");
    console.log("tripId:", tripId);
    console.log("userId:", req.user.userId);
    console.log("Request body:", req.body);

    // Tìm trip
    const trip = await TripSchedule.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Lịch trình không tồn tại"
      });
    }

    // Kiểm tra quyền sở hữu
    if (String(trip.user) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền chỉnh sửa lịch trình này"
      });
    }

    // TH1: Cập nhật toàn bộ days (khi thêm/xóa/sửa nhiều hoạt động)
    if (days && Array.isArray(days)) {
      trip.days = days;
      await trip.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật lịch trình thành công",
        trip,
      });
    }

    // TH2: Cập nhật một activity cụ thể (khi toggle completed hoặc edit 1 activity)
    if (
      typeof dayIndex === "number" &&
      typeof activityIndex === "number" &&
      activity
    ) {
      if (!trip.days[dayIndex]) {
        return res.status(400).json({
          success: false,
          error: "Ngày không tồn tại"
        });
      }

      if (!trip.days[dayIndex].activities[activityIndex]) {
        return res.status(400).json({
          success: false,
          error: "Hoạt động không tồn tại"
        });
      }

      // Cập nhật activity
      trip.days[dayIndex].activities[activityIndex] = {
        ...trip.days[dayIndex].activities[activityIndex],
        ...activity,
      };

      await trip.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật hoạt động thành công",
        trip,
      });
    }

    // TH3: Toggle completed cho 1 activity
    if (
      typeof dayIndex === "number" &&
      typeof activityIndex === "number" &&
      req.body.completed !== undefined
    ) {
      if (!trip.days[dayIndex]) {
        return res.status(400).json({
          success: false,
          error: "Ngày không tồn tại"
        });
      }

      if (!trip.days[dayIndex].activities[activityIndex]) {
        return res.status(400).json({
          success: false,
          error: "Hoạt động không tồn tại"
        });
      }

      trip.days[dayIndex].activities[activityIndex].completed = req.body.completed;
      await trip.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái hoàn thành",
        trip,
      });
    }

    // Nếu không khớp trường hợp nào
    return res.status(400).json({
      success: false,
      error: "Dữ liệu không hợp lệ"
    });

  } catch (error) {
    console.error("Error updating activities:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server",
      detail: error.message
    });
  }
});

// ⭐ DELETE: Xóa một activity cụ thể
router.delete("/:id/activities/:dayIndex/:activityIndex", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const dayIndex = parseInt(req.params.dayIndex);
    const activityIndex = parseInt(req.params.activityIndex);

    console.log("=== [DELETE /activities] ===");
    console.log("tripId:", tripId);
    console.log("dayIndex:", dayIndex);
    console.log("activityIndex:", activityIndex);

    const trip = await TripSchedule.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Lịch trình không tồn tại"
      });
    }

    // Kiểm tra quyền sở hữu
    if (String(trip.user) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền chỉnh sửa lịch trình này"
      });
    }

    // Kiểm tra tồn tại
    if (!trip.days[dayIndex]) {
      return res.status(400).json({
        success: false,
        error: "Ngày không tồn tại"
      });
    }

    if (!trip.days[dayIndex].activities[activityIndex]) {
      return res.status(400).json({
        success: false,
        error: "Hoạt động không tồn tại"
      });
    }

    // Xóa activity
    trip.days[dayIndex].activities.splice(activityIndex, 1);
    await trip.save();

    return res.status(200).json({
      success: true,
      message: "Xóa hoạt động thành công",
      trip,
    });

  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server",
      detail: error.message
    });
  }
});

// ⭐ POST: Thêm activity mới vào một ngày
router.post("/:id/activities/:dayIndex", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const dayIndex = parseInt(req.params.dayIndex);
    const { time, name, cost, place } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Tên hoạt động không được để trống"
      });
    }

    const trip = await TripSchedule.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Lịch trình không tồn tại"
      });
    }

    if (String(trip.user) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền chỉnh sửa lịch trình này"
      });
    }

    if (!trip.days[dayIndex]) {
      return res.status(400).json({
        success: false,
        error: "Ngày không tồn tại"
      });
    }

    const newActivity = {
      time: time?.trim() || "",
      name: name.trim(),
      cost: cost ? parseFloat(cost) : 0,
      place: place || null,
      completed: false,
    };

    if (!Array.isArray(trip.days[dayIndex].activities)) {
      trip.days[dayIndex].activities = [];
    }

    trip.days[dayIndex].activities.push(newActivity);

    // ⭐⭐⭐ SẮP XẾP THEO THỜI GIAN ⭐⭐⭐
    trip.days[dayIndex].activities.sort((a, b) => {
      const timeA = a.time || "23:59";
      const timeB = b.time || "23:59";
      return timeA.localeCompare(timeB);
    });

    await trip.save();

    return res.status(201).json({
      success: true,
      message: "Thêm hoạt động thành công",
      trip,
    });

  } catch (error) {
    console.error("Error adding activity:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server",
      detail: error.message
    });
  }
});


// ⭐ PUT: Sửa một activity cụ thể
router.put("/:id/activities/:dayIndex/:activityIndex", verifyUser, async (req, res) => {
  try {
    const tripId = req.params.id;
    const dayIndex = parseInt(req.params.dayIndex);
    const activityIndex = parseInt(req.params.activityIndex);
    const { time, name, cost, place } = req.body;

    console.log("=== [PUT /activities] ===");
    console.log("tripId:", tripId);
    console.log("dayIndex:", dayIndex);
    console.log("activityIndex:", activityIndex);
    console.log("Updated activity:", req.body);

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Tên hoạt động không được để trống"
      });
    }

    const trip = await TripSchedule.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Lịch trình không tồn tại"
      });
    }

    // Kiểm tra quyền sở hữu
    if (String(trip.user) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền chỉnh sửa lịch trình này"
      });
    }

    // Kiểm tra tồn tại
    if (!trip.days[dayIndex]) {
      return res.status(400).json({
        success: false,
        error: "Ngày không tồn tại"
      });
    }

    if (!trip.days[dayIndex].activities[activityIndex]) {
      return res.status(400).json({
        success: false,
        error: "Hoạt động không tồn tại"
      });
    }

    // Cập nhật activity
    const existingActivity = trip.days[dayIndex].activities[activityIndex];
    trip.days[dayIndex].activities[activityIndex] = {
      ...existingActivity,
      time: time?.trim() || existingActivity.time || "",
      name: name.trim(),
      cost: cost !== undefined ? parseFloat(cost) : existingActivity.cost || 0,
      place: place !== undefined ? place : existingActivity.place,
    };

    await trip.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật hoạt động thành công",
      trip,
    });

  } catch (error) {
    console.error("Error updating activity:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi server",
      detail: error.message
    });
  }
});


export default router;
