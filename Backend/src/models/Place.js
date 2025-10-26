import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: String, // e.g., "Hanoi, Vietnam"
    description: String,
    image: String,
    placeIdentifier: {
        type: String,
        required: true
    }, // Ánh xạ với TripSchedule.activities.place
    bookingCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);